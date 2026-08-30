from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from database import get_db
from models import Worker, Project, Attendance, Payment, Advance, Expense
from schemas import DashboardResponse, AttendanceResponse, PaymentResponse, ExpenseResponse, WorkerResponse
from deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    org_id = user.organization_id
    today = date.today()
    month_start = today.replace(day=1)

    total_workers = db.query(func.count(Worker.id)).filter(
        Worker.organization_id == org_id, Worker.is_deleted == False
    ).scalar() or 0

    active_workers = db.query(func.count(Worker.id)).filter(
        Worker.organization_id == org_id, Worker.is_deleted == False, Worker.is_active == True
    ).scalar() or 0

    total_projects = db.query(func.count(Project.id)).filter(
        Project.organization_id == org_id, Project.is_deleted == False
    ).scalar() or 0

    active_projects = db.query(func.count(Project.id)).filter(
        Project.organization_id == org_id, Project.is_deleted == False, Project.status == "ACTIVE"
    ).scalar() or 0

    today_present = db.query(func.count(Attendance.id)).filter(
        Attendance.organization_id == org_id, Attendance.attendance_date == today,
        Attendance.status.in_(["PRESENT", "OVERTIME", "HALF_DAY"])
    ).scalar() or 0

    today_absent = db.query(func.count(Attendance.id)).filter(
        Attendance.organization_id == org_id, Attendance.attendance_date == today,
        Attendance.status == "ABSENT"
    ).scalar() or 0

    today_wages = Decimal("0")
    today_advances = db.query(func.coalesce(func.sum(Advance.amount), 0)).filter(
        Advance.organization_id == org_id, Advance.advance_date == today, Advance.is_voided == False
    ).scalar() or 0

    today_payments = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.organization_id == org_id, Payment.payment_date == today, Payment.is_voided == False
    ).scalar() or 0

    today_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.organization_id == org_id, Expense.expense_date == today, Expense.is_voided == False
    ).scalar() or 0

    total_expenses_month = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.organization_id == org_id, Expense.expense_date >= month_start, Expense.is_voided == False
    ).scalar() or 0

    total_payments_month = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.organization_id == org_id, Payment.payment_date >= month_start, Payment.is_voided == False
    ).scalar() or 0

    return DashboardResponse(
        totalWorkers=total_workers,
        activeWorkers=active_workers,
        totalProjects=total_projects,
        activeProjects=active_projects,
        todayPresent=today_present,
        todayAbsent=today_absent,
        todayWages=today_wages,
        todayAdvances=today_advances,
        todayPayments=today_payments,
        todayExpenses=today_expenses,
        totalExpensesThisMonth=total_expenses_month,
        totalPaymentsThisMonth=total_payments_month,
        amountDueToWorkers=Decimal("0"),
    )
