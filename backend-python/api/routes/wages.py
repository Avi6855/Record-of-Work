from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, case, extract, and_
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from database import get_db
from models import Worker, Attendance, Advance, Payment, Project, project_workers
from deps import get_current_user

router = APIRouter(prefix="/wages", tags=["wages"])


@router.get("")
def get_bulk_wages(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    search: Optional[str] = None,
    projectId: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Bulk wages for all workers in organization for given year/month.
    Single query per aggregate table (attendance/advance/payment) + workers load.
    Fixes N+1 of previous per-worker GET /workers/{id}/wage loop.
    """
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # Base workers query (active + non-deleted, org-scoped)
    wq = db.query(Worker).filter(
        Worker.organization_id == user.organization_id,
        Worker.is_deleted == False,
    )
    if search:
        wq = wq.filter(Worker.name.ilike(f"%{search}%"))
    if projectId:
        # workers assigned to project OR with attendance on project that month
        # join via association table
        wq = wq.join(project_workers, Worker.id == project_workers.c.worker_id).filter(
            project_workers.c.project_id == projectId
        )

    workers = wq.order_by(Worker.name).all()
    if not workers:
        return {"year": year, "month": month, "wages": []}

    worker_ids = [w.id for w in workers]
    worker_map = {w.id: w for w in workers}

    # Attendance aggregates grouped by worker_id - single query
    # Use conditional aggregation (case -> count)
    att_rows = db.query(
        Attendance.worker_id,
        func.count(case((Attendance.status.in_(["PRESENT", "OVERTIME"]), 1))).label("present"),
        func.count(case((Attendance.status == "HALF_DAY", 1))).label("half"),
        func.count(case((Attendance.status == "ABSENT", 1))).label("absent"),
        func.coalesce(func.sum(Attendance.overtime_hours), 0).label("ot_hours"),
    ).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.worker_id.in_(worker_ids),
        Attendance.attendance_date >= start_date,
        Attendance.attendance_date < end_date,
    )
    if projectId:
        att_rows = att_rows.filter(Attendance.project_id == projectId)
    att_rows = att_rows.group_by(Attendance.worker_id).all()

    att_map = {r.worker_id: r for r in att_rows}

    # Advance sums grouped
    adv_rows = db.query(
        Advance.worker_id,
        func.coalesce(func.sum(Advance.amount), 0).label("total_advance"),
    ).filter(
        Advance.organization_id == user.organization_id,
        Advance.worker_id.in_(worker_ids),
        Advance.is_voided == False,
        Advance.advance_date >= start_date,
        Advance.advance_date < end_date,
    )
    if projectId:
        adv_rows = adv_rows.filter(Advance.project_id == projectId)
    adv_rows = adv_rows.group_by(Advance.worker_id).all()
    adv_map = {r.worker_id: float(r.total_advance or 0) for r in adv_rows}

    # Payment sums grouped
    pay_rows = db.query(
        Payment.worker_id,
        func.coalesce(func.sum(Payment.amount), 0).label("total_payment"),
    ).filter(
        Payment.organization_id == user.organization_id,
        Payment.worker_id.in_(worker_ids),
        Payment.is_voided == False,
        Payment.payment_date >= start_date,
        Payment.payment_date < end_date,
    )
    if projectId:
        pay_rows = pay_rows.filter(Payment.project_id == projectId)
    pay_rows = pay_rows.group_by(Payment.worker_id).all()
    pay_map = {r.worker_id: float(r.total_payment or 0) for r in pay_rows}

    wages = []
    for w in workers:
        att = att_map.get(w.id)
        present = int(att.present) if att and att.present is not None else 0
        half = int(att.half) if att and att.half is not None else 0
        absent = int(att.absent) if att and att.absent is not None else 0
        ot_hours = float(att.ot_hours or 0) if att else 0.0
        daily_wage = float(w.daily_wage or 0)
        overtime_rate = float(w.overtime_rate or 0)
        # gross = present*daily + half*(daily/2) + ot*overtime_rate (fallback to daily_wage if no overtime_rate set but keeps reports.py logic)
        # To preserve workers.py compat when overtime_rate is 0 we could use daily_wage; overtime_rate already mirrors workers expectation when configured
        ot_rate = overtime_rate if overtime_rate else daily_wage
        # Match reports.py formula: daily_wage*present + (daily_wage/2)*half + overtime_rate*ot
        # If overtime_rate is 0 but ot_hours>0 we charge at daily_wage so workers still paid; mirrors workers.py previous behaviour.
        gross_wage = daily_wage * present + (daily_wage / 2) * half + ot_rate * ot_hours

        total_advance = adv_map.get(w.id, 0.0)
        total_payment = pay_map.get(w.id, 0.0)
        remaining = gross_wage - total_advance - total_payment

        wages.append({
            "workerId": w.id,
            "workerName": w.name,
            "marathiName": w.marathi_name,
            "workType": w.work_type,
            "village": w.village,
            "dailyWage": daily_wage,
            "overtimeRate": overtime_rate,
            "presentDays": present,
            "halfDays": half,
            "absentDays": absent,
            "overtimeHours": ot_hours,
            "grossWage": gross_wage,
            "totalAdvance": total_advance,
            "totalPayment": total_payment,
            "remainingBalance": remaining,
        })

    return {"year": year, "month": month, "wages": wages}
