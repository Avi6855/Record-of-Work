from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import ClientPayment
from schemas import ClientPaymentCreate, ClientPaymentResponse, PageResponse
from deps import get_current_user

router = APIRouter(prefix="/client-payments", tags=["client-payments"])


def cp_to_response(cp: ClientPayment) -> ClientPaymentResponse:
    return ClientPaymentResponse(
        id=cp.id, clientId=cp.client_id, projectId=cp.project_id,
        amount=cp.amount, paymentDate=cp.payment_date,
        paymentMethod=cp.payment_method,
        referenceNumber=cp.reference_number,
        description=cp.description, notes=cp.notes,
        isVoided=cp.is_voided, createdBy=cp.created_by,
        organizationId=cp.organization_id,
        createdAt=cp.created_at, updatedAt=cp.updated_at,
    )


@router.get("", response_model=PageResponse)
def list_client_payments(
    clientId: Optional[int] = None,
    projectId: Optional[int] = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(ClientPayment).filter(ClientPayment.organization_id == user.organization_id, ClientPayment.is_voided == False)
    if clientId:
        q = q.filter(ClientPayment.client_id == clientId)
    if projectId:
        q = q.filter(ClientPayment.project_id == projectId)
    total = q.count()
    payments = q.order_by(ClientPayment.payment_date.desc()).offset(page * size).limit(size).all()
    items = [cp_to_response(p) for p in payments]
    total_pages = (total + size - 1) // size if total > 0 else 0
    return PageResponse(
        content=items, totalElements=total, totalPages=total_pages,
        size=size, number=page, first=page == 0, last=page >= total_pages - 1,
        empty=len(items) == 0,
    )


@router.post("", response_model=ClientPaymentResponse, status_code=201)
def create_client_payment(data: ClientPaymentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cp = ClientPayment(
        organization_id=user.organization_id,
        client_id=data.clientId, project_id=data.projectId,
        amount=data.amount, payment_date=data.paymentDate,
        payment_method=data.paymentMethod,
        reference_number=data.referenceNumber,
        description=data.description, notes=data.notes,
        created_by=user.id,
    )
    db.add(cp)
    db.commit()
    db.refresh(cp)
    return cp_to_response(cp)


@router.post("/{cp_id}/void")
def void_client_payment(cp_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cp = db.query(ClientPayment).filter(ClientPayment.id == cp_id).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Client payment not found")
    cp.is_voided = True
    db.commit()
    return {"message": "Client payment voided"}
