from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from database import get_db
from models import LedgerEntry
from schemas import LedgerEntryResponse
from deps import get_current_user

router = APIRouter(prefix="/ledger", tags=["ledger"])


def ledger_to_response(e: LedgerEntry) -> LedgerEntryResponse:
    return LedgerEntryResponse(
        id=e.id, workerId=e.worker_id, projectId=e.project_id,
        entryType=e.entry_type, referenceType=e.reference_type,
        referenceId=e.reference_id, amount=e.amount,
        debit=e.debit or 0, credit=e.credit or 0,
        balance=e.balance or 0, entryDate=e.entry_date,
        description=e.description, notes=e.notes,
        isVoided=e.is_voided, organizationId=e.organization_id,
        createdAt=e.created_at,
    )


@router.get("", response_model=list[LedgerEntryResponse])
def list_ledger(
    workerId: Optional[int] = None,
    projectId: Optional[int] = None,
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    entryType: Optional[str] = None,
    page: int = Query(0, ge=0),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(LedgerEntry).filter(LedgerEntry.organization_id == user.organization_id, LedgerEntry.is_voided == False)
    if workerId:
        q = q.filter(LedgerEntry.worker_id == workerId)
    if projectId:
        q = q.filter(LedgerEntry.project_id == projectId)
    if startDate:
        q = q.filter(LedgerEntry.entry_date >= startDate)
    if endDate:
        q = q.filter(LedgerEntry.entry_date <= endDate)
    if entryType:
        q = q.filter(LedgerEntry.entry_type == entryType)
    entries = q.order_by(LedgerEntry.entry_date.desc(), LedgerEntry.id.desc()).offset(page * size).limit(size).all()
    return [ledger_to_response(e) for e in entries]


@router.get("/worker/{worker_id}")
def get_worker_ledger(worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.worker_id == worker_id,
        LedgerEntry.organization_id == user.organization_id,
        LedgerEntry.is_voided == False,
    ).order_by(LedgerEntry.entry_date.desc(), LedgerEntry.id.desc()).limit(200).all()
    items = [ledger_to_response(e) for e in entries]
    total_debit = sum(float(e.debit or 0) for e in entries)
    total_credit = sum(float(e.credit or 0) for e in entries)
    current_balance = float(entries[0].balance or 0) if entries else 0
    return {
        "entries": items,
        "totalDebit": total_debit,
        "totalCredit": total_credit,
        "currentBalance": current_balance,
    }
