from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from decimal import Decimal
from typing import Optional
from database import get_db
from models import Attendance, Payment, Advance, Expense, Worker, Project, ClientPayment
from schemas import MonthlySettlementResponse, WorkerResponse
from deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly-settlement")
def get_monthly_settlement(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    workerId: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    from datetime import date as d
    start_date = d(year, month, 1)
    if month == 12:
        end_date = d(year + 1, 1, 1)
    else:
        end_date = d(year, month + 1, 1)

    q = db.query(Worker).filter(Worker.organization_id == user.organization_id, Worker.is_deleted == False, Worker.is_active == True)
    if workerId:
        q = q.filter(Worker.id == workerId)
    workers = q.order_by(Worker.name).all()
    if not workers:
        return {"month": month, "year": year, "settlements": []}
    worker_ids = [w.id for w in workers]

    # Bulk aggregates - 3 queries total instead of 5*N
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
    ).group_by(Attendance.worker_id).all()
    att_map = {r.worker_id: r for r in att_rows}

    adv_rows = db.query(
        Advance.worker_id, func.coalesce(func.sum(Advance.amount), 0).label("total_advance")
    ).filter(
        Advance.organization_id == user.organization_id,
        Advance.worker_id.in_(worker_ids),
        Advance.is_voided == False,
        Advance.advance_date >= start_date, Advance.advance_date < end_date,
    ).group_by(Advance.worker_id).all()
    adv_map = {r.worker_id: r.total_advance for r in adv_rows}

    pay_rows = db.query(
        Payment.worker_id, func.coalesce(func.sum(Payment.amount), 0).label("total_payment")
    ).filter(
        Payment.organization_id == user.organization_id,
        Payment.worker_id.in_(worker_ids),
        Payment.is_voided == False,
        Payment.payment_date >= start_date, Payment.payment_date < end_date,
    ).group_by(Payment.worker_id).all()
    pay_map = {r.worker_id: r.total_payment for r in pay_rows}

    results = []
    for w in workers:
        att = att_map.get(w.id)
        present = int(att.present) if att and att.present is not None else 0
        half = int(att.half) if att and att.half is not None else 0
        absent = int(att.absent) if att and att.absent is not None else 0
        overtime_hrs = att.ot_hours if att else 0
        total_advance = adv_map.get(w.id, 0) or 0
        total_payment = pay_map.get(w.id, 0) or 0
        daily_wage = w.daily_wage or Decimal("0")
        gross_wage = daily_wage * present + (daily_wage / 2) * half + (w.overtime_rate or Decimal("0")) * overtime_hrs
        remaining = gross_wage - total_advance - total_payment
        results.append({
            "workerId": w.id,
            "workerName": w.name,
            "marathiName": w.marathi_name,
            "dailyWage": float(daily_wage),
            "presentDays": present,
            "halfDays": half,
            "absentDays": absent,
            "overtimeHours": float(overtime_hrs),
            "grossWage": float(gross_wage),
            "totalAdvance": float(total_advance),
            "totalPayment": float(total_payment),
            "remainingBalance": float(remaining),
        })

    return {"month": month, "year": year, "settlements": results}


def _build_summary(db: Session, user, startDate: date, endDate: date):
    total_wages = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.organization_id == user.organization_id,
        Payment.payment_type == "WAGE_PAYMENT",
        Payment.payment_date >= startDate, Payment.payment_date <= endDate,
        Payment.is_voided == False,
    ).scalar() or 0

    total_payments = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.organization_id == user.organization_id,
        Payment.payment_date >= startDate, Payment.payment_date <= endDate,
        Payment.is_voided == False,
    ).scalar() or 0

    total_advances = db.query(func.coalesce(func.sum(Advance.amount), 0)).filter(
        Advance.organization_id == user.organization_id,
        Advance.advance_date >= startDate, Advance.advance_date <= endDate,
        Advance.is_voided == False,
    ).scalar() or 0

    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.organization_id == user.organization_id,
        Expense.expense_date >= startDate, Expense.expense_date <= endDate,
        Expense.is_voided == False,
    ).scalar() or 0

    total_income = db.query(func.coalesce(func.sum(ClientPayment.amount), 0)).filter(
        ClientPayment.organization_id == user.organization_id,
        ClientPayment.payment_date >= startDate, ClientPayment.payment_date <= endDate,
        ClientPayment.is_voided == False,
    ).scalar() or 0

    adv_count = db.query(func.count(Advance.id)).filter(
        Advance.organization_id == user.organization_id,
        Advance.advance_date >= startDate, Advance.advance_date <= endDate,
        Advance.is_voided == False,
    ).scalar() or 0

    pay_count = db.query(func.count(Payment.id)).filter(
        Payment.organization_id == user.organization_id,
        Payment.payment_date >= startDate, Payment.payment_date <= endDate,
        Payment.is_voided == False,
    ).scalar() or 0

    exp_count = db.query(func.count(Expense.id)).filter(
        Expense.organization_id == user.organization_id,
        Expense.expense_date >= startDate, Expense.expense_date <= endDate,
        Expense.is_voided == False,
    ).scalar() or 0

    att_present = db.query(func.count(Attendance.id)).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.attendance_date >= startDate, Attendance.attendance_date <= endDate,
        Attendance.status.in_(["PRESENT", "OVERTIME"]),
    ).scalar() or 0
    att_half = db.query(func.count(Attendance.id)).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.attendance_date >= startDate, Attendance.attendance_date <= endDate,
        Attendance.status == "HALF_DAY",
    ).scalar() or 0
    att_absent = db.query(func.count(Attendance.id)).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.attendance_date >= startDate, Attendance.attendance_date <= endDate,
        Attendance.status == "ABSENT",
    ).scalar() or 0

    workers_with_data = db.query(func.count(func.distinct(Attendance.worker_id))).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.attendance_date >= startDate, Attendance.attendance_date <= endDate,
    ).scalar() or 0

    return {
        "startDate": startDate.isoformat(),
        "endDate": endDate.isoformat(),
        "totalWages": float(total_wages),
        "totalPayments": float(total_payments),
        "totalAdvances": float(total_advances),
        "totalExpenses": float(total_expenses),
        "totalIncome": float(total_income),
        "advanceCount": int(adv_count),
        "paymentCount": int(pay_count),
        "expenseCount": int(exp_count),
        "presentCount": int(att_present),
        "halfDayCount": int(att_half),
        "absentCount": int(att_absent),
        "workersWithAttendance": int(workers_with_data),
        "netCash": float(Decimal(str(total_income)) - Decimal(str(total_expenses)) - Decimal(str(total_payments)) - Decimal(str(total_advances))),
        "summary": {
            "totalWages": float(total_wages),
            "totalPayments": float(total_payments),
            "totalAdvances": float(total_advances),
            "totalExpenses": float(total_expenses),
            "totalIncome": float(total_income),
            "advanceCount": int(adv_count),
            "paymentCount": int(pay_count),
            "expenseCount": int(exp_count),
            "presentCount": int(att_present),
            "halfDayCount": int(att_half),
            "absentCount": int(att_absent),
        },
    }


@router.get("/summary")
def get_summary(
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    from datetime import date as d
    if not startDate:
        startDate = d.today().replace(day=1)
    if not endDate:
        endDate = d.today()
    if startDate > endDate:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="startDate endDate पेक्षा मोठी असू शकत नाही")
    return _build_summary(db, user, startDate, endDate)


@router.get("/financial")
def get_financial(
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    from datetime import date as d
    if not startDate:
        startDate = d.today().replace(day=1)
    if not endDate:
        endDate = d.today()
    if startDate > endDate:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="startDate endDate पेक्षा मोठी असू शकत नाही")
    return _build_summary(db, user, startDate, endDate)
