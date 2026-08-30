from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import DailyClosing
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


@router.get("", response_model=list[DailyClosingResponse])
def list_daily_closings(
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
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
    if not dc:
        raise HTTPException(status_code=404, detail="Daily closing not found")
    return dc_to_response(dc)


@router.post("", response_model=DailyClosingResponse, status_code=201)
def create_daily_closing(data: DailyClosingCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(DailyClosing).filter(
        DailyClosing.organization_id == user.organization_id,
        DailyClosing.closing_date == data.closingDate,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Daily closing already exists for this date")
    dc = DailyClosing(
        organization_id=user.organization_id,
        closing_date=data.closingDate,
        total_workers=data.totalWorkers,
        present_count=data.presentCount,
        absent_count=data.absentCount,
        half_day_count=data.halfDayCount,
        overtime_count=data.overtimeCount,
        total_wages=data.totalWages,
        total_advances=data.totalAdvances,
        total_payments=data.totalPayments,
        total_expenses=data.totalExpenses,
        total_income=data.totalIncome,
        opening_cash=data.openingCash,
        closing_cash=data.closingCash,
        notes=data.notes,
    )
    db.add(dc)
    db.commit()
    db.refresh(dc)
    return dc_to_response(dc)


@router.post("/{closing_date}/close", response_model=DailyClosingResponse)
def close_day(closing_date: date, db: Session = Depends(get_db), user=Depends(get_current_user)):
    dc = db.query(DailyClosing).filter(
        DailyClosing.organization_id == user.organization_id,
        DailyClosing.closing_date == closing_date,
    ).first()
    if not dc:
        raise HTTPException(status_code=404, detail="Daily closing not found")
    dc.is_closed = True
    dc.closed_by = user.id
    dc.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dc)
    return dc_to_response(dc)
