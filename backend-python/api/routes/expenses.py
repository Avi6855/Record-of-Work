from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import Optional
from database import get_db
from models import Expense
from schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from deps import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


def exp_to_response(e: Expense) -> ExpenseResponse:
    return ExpenseResponse(
        id=e.id, projectId=e.project_id, category=e.category,
        amount=e.amount, expenseDate=e.expense_date,
        description=e.description, vendor=e.vendor,
        vendorPhone=e.vendor_phone, paymentMethod=e.payment_method,
        receiptUrl=e.receipt_url, notes=e.notes,
        isVoided=e.is_voided, createdBy=e.created_by,
        organizationId=e.organization_id,
        createdAt=e.created_at, updatedAt=e.updated_at,
    )


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    projectId: Optional[int] = None,
    category: Optional[str] = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Expense).filter(Expense.organization_id == user.organization_id, Expense.is_voided == False)
    if projectId:
        q = q.filter(Expense.project_id == projectId)
    if category:
        q = q.filter(Expense.category == category)
    expenses = q.order_by(Expense.expense_date.desc()).offset(page * size).limit(size).all()
    return [exp_to_response(e) for e in expenses]


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    return exp_to_response(e)


@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    exp = Expense(
        organization_id=user.organization_id,
        project_id=data.projectId, category=data.category,
        amount=data.amount, expense_date=data.expenseDate,
        description=data.description, vendor=data.vendor,
        vendor_phone=data.vendorPhone, payment_method=data.paymentMethod,
        receipt_url=data.receiptUrl, notes=data.notes,
        created_by=user.id,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp_to_response(exp)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        setattr(e, snake, value)
    db.commit()
    db.refresh(e)
    return exp_to_response(e)


@router.post("/{expense_id}/void")
def void_expense(expense_id: int, reason: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    e.is_voided = True
    e.voided_by = user.id
    e.void_reason = reason
    from datetime import datetime, timezone
    e.voided_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Expense voided"}
