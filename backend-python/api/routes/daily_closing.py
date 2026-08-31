from datetime import date, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from models import DailyClosing, Worker, Attendance, Advance, Payment, Expense, ClientPayment
from schemas import DailyClosingCreate, DailyClosingResponse
from deps import get_current_user

router = APIRouter(prefix="/daily-closing", tags=["daily-closing"])


def dc_to_response(dc: DailyClosing) -> DailyClosingResponse:
    return DailyClosingResponse(
        id=dc.id, closingDate=dc.closing_date,
        totalWorkers=dc.total_workers or 0,
        presentCount=dc.present_count or 0,
        absentCount=dc.absent_count or 0,
        halfDayCount=dc.half_day_count or 0,
        overtimeCount=dc.overtime_count or 0,
        totalWages=dc.total_wages or 0,
        totalAdvances=dc.total_advances or 0,
        totalPayments=dc.total_payments or 0,
        totalExpenses=dc.total_expenses or 0,
        totalIncome=dc.total_income or 0,
        openingCash=dc.opening_cash or 0,
        closingCash=dc.closing_cash or 0,
        notes=dc.notes, isClosed=dc.is_closed,
        closedBy=dc.closed_by, closedAt=dc.closed_at,
        organizationId=dc.organization_id,
        createdAt=dc.created_at, updatedAt=dc.updated_at,
    )


def _compute_totals(db: Session, organization_id: int, closing_date: date) -> dict:
    total_workers = db.query(func.count(Worker.id)).filter(
        Worker.organization_id == organization_id, Worker.is_deleted == False
    ).scalar() or 0

    rows = db.query(Attendance, Worker).join(
        Worker, Attendance.worker_id == Worker.id
    ).filter(
        Attendance.organization_id == organization_id,
        Attendance.attendance_date == closing_date,
    ).all()

    present = half = absent = overtime = 0
    total_wages = Decimal("0")
    for att, w in rows:
        dw = w.daily_wage or Decimal("0")
        ot_rate = w.overtime_rate or dw
        ot_h = att.overtime_hours or Decimal("0")
        if att.status in ("PRESENT", "OVERTIME"):
            present += 1
            total_wages += dw
            if att.status == "OVERTIME":
                overtime += 1
                total_wages += ot_rate * ot_h
            elif ot_h and ot_h != 0:
                total_wages += ot_rate * ot_h
        elif att.status == "HALF_DAY":
            half += 1
            total_wages += dw / Decimal("2")
            if ot_h and ot_h != 0:
                total_wages += ot_rate * ot_h
        elif att.status == "ABSENT":
            absent += 1

    total_advances = db.query(func.coalesce(func.sum(Advance.amount), 0)).filter(
        Advance.organization_id == organization_id,
        Advance.advance_date == closing_date,
        Advance.is_voided == False,
    ).scalar() or Decimal("0")

    total_payments = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.organization_id == organization_id,
        Payment.payment_date == closing_date,
        Payment.is_voided == False,
    ).scalar() or Decimal("0")

    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.organization_id == organization_id,
        Expense.expense_date == closing_date,
        Expense.is_voided == False,
    ).scalar() or Decimal("0")

    total_income = db.query(func.coalesce(func.sum(ClientPayment.amount), 0)).filter(
        ClientPayment.organization_id == organization_id,
        ClientPayment.payment_date == closing_date,
        ClientPayment.is_voided == False,
    ).scalar() or Decimal("0")

    previous = db.query(DailyClosing).filter(
        DailyClosing.organization_id == organization_id,
        DailyClosing.closing_date < closing_date,
    ).order_by(DailyClosing.closing_date.desc()).first()
    opening_cash = previous.closing_cash if previous else Decimal("0")

    closing_cash = opening_cash + Decimal(str(total_income)) - Decimal(str(total_expenses)) - Decimal(str(total_payments)) - Decimal(str(total_advances))

    return {
        "total_workers": int(total_workers),
        "present_count": int(present),
        "absent_count": int(absent),
        "half_day_count": int(half),
        "overtime_count": int(overtime),
        "total_wages": total_wages,
        "total_advances": Decimal(str(total_advances)),
        "total_payments": Decimal(str(total_payments)),
        "total_expenses": Decimal(str(total_expenses)),
        "total_income": Decimal(str(total_income)),
        "opening_cash": Decimal(str(opening_cash)),
        "closing_cash": Decimal(str(closing_cash)),
    }


@router.get("", response_model=list[DailyClosingResponse])
def list_daily_closings(
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    date: Optional[date] = Query(None, alias="date"),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if date is not None:
        dc = db.query(DailyClosing).filter(
            DailyClosing.organization_id == user.organization_id,
            DailyClosing.closing_date == date,
        ).first()
        if not dc:
            return []
        return [dc_to_response(dc)]
    q = db.query(DailyClosing).filter(DailyClosing.organization_id == user.organization_id)
    if startDate:
        q = q.filter(DailyClosing.closing_date >= startDate)
    if endDate:
        q = q.filter(DailyClosing.closing_date <= endDate)
    closings = q.order_by(DailyClosing.closing_date.desc()).offset(page * size).limit(size).all()
    return [dc_to_response(dc) for dc in closings]


@router.get("/{closing_date}", response_model=DailyClosingResponse)
def get_daily_closing(closing_date: date, db: Session = Depends(get_db), user=Depends(get_current_user)):
    dc = db.query(DailyClosing).filter(
        DailyClosing.organization_id == user.organization_id,
        DailyClosing.closing_date == closing_date,
    ).first()
    if dc:
        return dc_to_response(dc)
    totals = _compute_totals(db, user.organization_id, closing_date)
    now = datetime.now(timezone.utc)
    preview = DailyClosing(
        id=0,
        organization_id=user.organization_id,
        closing_date=closing_date,
        total_workers=totals["total_workers"],
        present_count=totals["present_count"],
        absent_count=totals["absent_count"],
        half_day_count=totals["half_day_count"],
        overtime_count=totals["overtime_count"],
        total_wages=totals["total_wages"],
        total_advances=totals["total_advances"],
        total_payments=totals["total_payments"],
        total_expenses=totals["total_expenses"],
        total_income=totals["total_income"],
        opening_cash=totals["opening_cash"],
        closing_cash=totals["closing_cash"],
        notes=None,
        is_closed=False,
        closed_by=None,
        closed_at=None,
        created_at=now,
        updated_at=now,
    )
    return dc_to_response(preview)


@router.post("", response_model=DailyClosingResponse, status_code=201)
def create_daily_closing(data: DailyClosingCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if data.closingDate > date.today():
        raise HTTPException(status_code=400, detail="भविष्यातील तारीख बंद करता येणार नाही / Future date not allowed")
    existing = db.query(DailyClosing).filter(
        DailyClosing.organization_id == user.organization_id,
        DailyClosing.closing_date == data.closingDate,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="या तारखेचा हिशोब आधीच आहे / Daily closing already exists for this date")
    totals = _compute_totals(db, user.organization_id, data.closingDate)
    dc = DailyClosing(
        organization_id=user.organization_id,
        closing_date=data.closingDate,
        total_workers=totals["total_workers"],
        present_count=totals["present_count"],
        absent_count=totals["absent_count"],
        half_day_count=totals["half_day_count"],
        overtime_count=totals["overtime_count"],
        total_wages=totals["total_wages"],
        total_advances=totals["total_advances"],
        total_payments=totals["total_payments"],
        total_expenses=totals["total_expenses"],
        total_income=totals["total_income"],
        opening_cash=totals["opening_cash"],
        closing_cash=totals["closing_cash"],
        notes=data.notes,
    )
    db.add(dc)
    db.commit()
    db.refresh(dc)
    return dc_to_response(dc)


@router.post("/close", response_model=DailyClosingResponse)
def close_day_by_query(date: date = Query(..., alias="date"), db: Session = Depends(get_db), user=Depends(get_current_user)):
    return _close_day_impl(date, db, user)


@router.post("/{closing_date}/close", response_model=DailyClosingResponse)
def close_day(closing_date: date, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return _close_day_impl(closing_date, db, user)


def _close_day_impl(closing_date: date, db: Session, user):
    if closing_date > date.today():
        raise HTTPException(status_code=400, detail="भविष्यातील तारीख बंद करता येणार नाही")
    dc = db.query(DailyClosing).filter(
        DailyClosing.organization_id == user.organization_id,
        DailyClosing.closing_date == closing_date,
    ).first()
    if dc and dc.is_closed:
        raise HTTPException(status_code=400, detail="हा दिवस आधीच बंद आहे / Day already closed")
    totals = _compute_totals(db, user.organization_id, closing_date)
    if dc:
        dc.total_workers = totals["total_workers"]
        dc.present_count = totals["present_count"]
        dc.absent_count = totals["absent_count"]
        dc.half_day_count = totals["half_day_count"]
        dc.overtime_count = totals["overtime_count"]
        dc.total_wages = totals["total_wages"]
        dc.total_advances = totals["total_advances"]
        dc.total_payments = totals["total_payments"]
        dc.total_expenses = totals["total_expenses"]
        dc.total_income = totals["total_income"]
        dc.opening_cash = totals["opening_cash"]
        dc.closing_cash = totals["closing_cash"]
        dc.is_closed = True
        dc.closed_by = user.id
        dc.closed_at = datetime.now(timezone.utc)
    else:
        dc = DailyClosing(
            organization_id=user.organization_id,
            closing_date=closing_date,
            total_workers=totals["total_workers"],
            present_count=totals["present_count"],
            absent_count=totals["absent_count"],
            half_day_count=totals["half_day_count"],
            overtime_count=totals["overtime_count"],
            total_wages=totals["total_wages"],
            total_advances=totals["total_advances"],
            total_payments=totals["total_payments"],
            total_expenses=totals["total_expenses"],
            total_income=totals["total_income"],
            opening_cash=totals["opening_cash"],
            closing_cash=totals["closing_cash"],
            is_closed=True,
            closed_by=user.id,
            closed_at=datetime.now(timezone.utc),
        )
        db.add(dc)
    db.commit()
    db.refresh(dc)
    return dc_to_response(dc)
