from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import Optional
from database import get_db
from models import Attendance, Payment, Advance, Expense, Worker, Project
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
    workers = q.all()

    results = []
    for w in workers:
        present = db.query(func.count(Attendance.id)).filter(
            Attendance.worker_id == w.id, Attendance.organization_id == user.organization_id,
            Attendance.attendance_date >= start_date, Attendance.attendance_date < end_date,
            Attendance.status.in_(["PRESENT", "OVERTIME"]),
        ).scalar() or 0

        half = db.query(func.count(Attendance.id)).filter(
            Attendance.worker_id == w.id, Attendance.organization_id == user.organization_id,
            Attendance.attendance_date >= start_date, Attendance.attendance_date < end_date,
            Attendance.status == "HALF_DAY",
        ).scalar() or 0

        overtime_hrs = db.query(func.coalesce(func.sum(Attendance.overtime_hours), 0)).filter(
            Attendance.worker_id == w.id, Attendance.organization_id == user.organization_id,
            Attendance.attendance_date >= start_date, Attendance.attendance_date < end_date,
        ).scalar() or 0

        total_advance = db.query(func.coalesce(func.sum(Advance.amount), 0)).filter(
            Advance.worker_id == w.id, Advance.organization_id == user.organization_id,
            Advance.advance_date >= start_date, Advance.advance_date < end_date,
            Advance.is_voided == False,
        ).scalar() or 0

        total_payment = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.worker_id == w.id, Payment.organization_id == user.organization_id,
            Payment.payment_date >= start_date, Payment.payment_date < end_date,
            Payment.is_voided == False,
        ).scalar() or 0

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
            "overtimeHours": float(overtime_hrs),
            "grossWage": float(gross_wage),
            "totalAdvance": float(total_advance),
            "totalPayment": float(total_payment),
            "remainingBalance": float(remaining),
        })

    return {"month": month, "year": year, "settlements": results}


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

    total_wages = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.organization_id == user.organization_id,
        Payment.payment_type == "WAGE_PAYMENT",
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

    return {
        "startDate": startDate.isoformat(),
        "endDate": endDate.isoformat(),
        "totalWages": float(total_wages),
        "totalAdvances": float(total_advances),
        "totalExpenses": float(total_expenses),
    }
