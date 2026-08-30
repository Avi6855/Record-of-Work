from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import Optional
from database import get_db
from models import Advance, Worker
from schemas import AdvanceCreate, AdvanceUpdate, AdvanceResponse, WorkerResponse, PageResponse
from deps import get_current_user

router = APIRouter(prefix="/advances", tags=["advances"])


def adv_to_response(a: Advance) -> AdvanceResponse:
    worker_resp = None
    if a.worker:
        w = a.worker
        worker_resp = WorkerResponse(
            id=w.id, name=w.name, marathiName=w.marathi_name,
            phone=w.phone, address=w.address, village=w.village,
            workType=w.work_type, skill=w.skill,
            dailyWage=w.daily_wage or 0, overtimeRate=w.overtime_rate or 0,
            joiningDate=w.joining_date, photoUrl=w.photo_url,
            emergencyContactName=w.emergency_contact_name,
            emergencyContactPhone=w.emergency_contact_phone,
            notes=w.notes, isActive=w.is_active,
            organizationId=w.organization_id,
            createdAt=w.created_at, updatedAt=w.updated_at,
        )
    return AdvanceResponse(
        id=a.id, workerId=a.worker_id, projectId=a.project_id,
        amount=a.amount, advanceDate=a.advance_date,
        paymentMethod=a.payment_method, reason=a.reason,
        notes=a.notes, isSettled=a.is_settled,
        settledAmount=a.settled_amount or 0, isVoided=a.is_voided,
        createdBy=a.created_by, organizationId=a.organization_id,
        worker=worker_resp,
        createdAt=a.created_at, updatedAt=a.updated_at,
    )


@router.get("", response_model=PageResponse)
def list_advances(
    workerId: Optional[int] = None,
    projectId: Optional[int] = None,
    isSettled: Optional[bool] = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Advance).filter(Advance.organization_id == user.organization_id, Advance.is_voided == False)
    if workerId:
        q = q.filter(Advance.worker_id == workerId)
    if projectId:
        q = q.filter(Advance.project_id == projectId)
    if isSettled is not None:
        q = q.filter(Advance.is_settled == isSettled)
    total = q.count()
    advances = q.options(selectinload(Advance.worker)).order_by(Advance.advance_date.desc()).offset(page * size).limit(size).all()
    items = [adv_to_response(a) for a in advances]
    total_pages = (total + size - 1) // size if total > 0 else 0
    return PageResponse(
        content=items, totalElements=total, totalPages=total_pages,
        size=size, number=page, first=page == 0, last=page >= total_pages - 1,
        empty=len(items) == 0,
    )


@router.get("/{advance_id}", response_model=AdvanceResponse)
def get_advance(advance_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Advance).options(selectinload(Advance.worker)).filter(Advance.id == advance_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Advance not found")
    return adv_to_response(a)


@router.post("", response_model=AdvanceResponse, status_code=201)
def create_advance(data: AdvanceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    adv = Advance(
        organization_id=user.organization_id,
        worker_id=data.workerId, project_id=data.projectId,
        amount=data.amount, advance_date=data.advanceDate,
        payment_method=data.paymentMethod, reason=data.reason,
        notes=data.notes, created_by=user.id,
    )
    db.add(adv)
    db.commit()
    db.refresh(adv)
    return adv_to_response(adv)


@router.put("/{advance_id}", response_model=AdvanceResponse)
def update_advance(advance_id: int, data: AdvanceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Advance).filter(Advance.id == advance_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Advance not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        setattr(a, snake, value)
    db.commit()
    db.refresh(a)
    return adv_to_response(a)


@router.post("/{advance_id}/void")
def void_advance(advance_id: int, reason: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Advance).filter(Advance.id == advance_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Advance not found")
    a.is_voided = True
    a.voided_by = user.id
    a.void_reason = reason
    from datetime import datetime, timezone
    a.voided_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Advance voided"}
