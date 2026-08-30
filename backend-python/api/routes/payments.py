from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import Optional
from database import get_db
from models import Payment, Worker, Project
from schemas import PaymentCreate, PaymentUpdate, PaymentResponse, WorkerResponse
from deps import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


def pay_to_response(p: Payment) -> PaymentResponse:
    worker_resp = None
    if p.worker:
        w = p.worker
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
    project_resp = None
    if p.project:
        pr = p.project
        project_resp = WorkerResponse(
            id=pr.id, name=pr.name,
            organizationId=pr.organization_id,
            createdAt=pr.created_at, updatedAt=pr.updated_at,
        ) if False else None
    return PaymentResponse(
        id=p.id, workerId=p.worker_id, projectId=p.project_id,
        amount=p.amount, paymentDate=p.payment_date,
        paymentMethod=p.payment_method, paymentType=p.payment_type,
        description=p.description, notes=p.notes,
        referenceNumber=p.reference_number, isVoided=p.is_voided,
        createdBy=p.created_by, organizationId=p.organization_id,
        worker=worker_resp,
        createdAt=p.created_at, updatedAt=p.updated_at,
    )


@router.get("", response_model=list[PaymentResponse])
def list_payments(
    workerId: Optional[int] = None,
    projectId: Optional[int] = None,
    paymentType: Optional[str] = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Payment).filter(Payment.organization_id == user.organization_id, Payment.is_voided == False)
    if workerId:
        q = q.filter(Payment.worker_id == workerId)
    if projectId:
        q = q.filter(Payment.project_id == projectId)
    if paymentType:
        q = q.filter(Payment.payment_type == paymentType)
    payments = q.options(
        selectinload(Payment.worker),
    ).order_by(Payment.payment_date.desc()).offset(page * size).limit(size).all()
    return [pay_to_response(p) for p in payments]


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Payment).options(selectinload(Payment.worker)).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return pay_to_response(p)


@router.post("", response_model=PaymentResponse, status_code=201)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    pay = Payment(
        organization_id=user.organization_id,
        worker_id=data.workerId, project_id=data.projectId,
        amount=data.amount, payment_date=data.paymentDate,
        payment_method=data.paymentMethod, payment_type=data.paymentType,
        description=data.description, notes=data.notes,
        reference_number=data.referenceNumber, created_by=user.id,
    )
    db.add(pay)
    db.commit()
    db.refresh(pay)
    return pay_to_response(pay)


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: int, data: PaymentUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        setattr(p, snake, value)
    db.commit()
    db.refresh(p)
    return pay_to_response(p)


@router.post("/{payment_id}/void")
def void_payment(payment_id: int, reason: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    p.is_voided = True
    p.voided_by = user.id
    p.void_reason = reason
    from datetime import datetime, timezone
    p.voided_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Payment voided"}
