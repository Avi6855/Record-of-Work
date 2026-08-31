from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from decimal import Decimal
from database import get_db
from models import Worker, Organization, Attendance, Advance, Payment
from schemas import WorkerCreate, WorkerUpdate, WorkerResponse, PageResponse
from deps import get_current_user

router = APIRouter(prefix="/workers", tags=["workers"])


def worker_to_response(w: Worker) -> WorkerResponse:
    return WorkerResponse(
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


@router.get("", response_model=PageResponse)
def list_workers(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    isActive: Optional[bool] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Worker).filter(Worker.is_deleted == False, Worker.organization_id == user.organization_id)
    if search:
        q = q.filter(Worker.name.ilike(f"%{search}%"))
    if isActive is not None:
        q = q.filter(Worker.is_active == isActive)
    total = q.count()
    workers = q.order_by(Worker.name).offset(page * size).limit(size).all()
    items = [worker_to_response(w) for w in workers]
    total_pages = (total + size - 1) // size if total > 0 else 0
    return PageResponse(
        content=items, totalElements=total, totalPages=total_pages,
        size=size, number=page, first=page == 0, last=page >= total_pages - 1,
        empty=len(items) == 0,
    )


@router.get("/count")
def count_workers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    total = db.query(func.count(Worker.id)).filter(Worker.is_deleted == False, Worker.organization_id == user.organization_id).scalar()
    active = db.query(func.count(Worker.id)).filter(Worker.is_deleted == False, Worker.is_active == True, Worker.organization_id == user.organization_id).scalar()
    return {"total": total, "active": active}


@router.get("/{worker_id}/wage")
def get_worker_wage(worker_id: int, year: int = Query(...), month: int = Query(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False, Worker.organization_id == user.organization_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    daily_wage = float(w.daily_wage or 0)
    records = db.query(Attendance).filter(
        Attendance.worker_id == worker_id,
        Attendance.organization_id == user.organization_id,
        extract("year", Attendance.attendance_date) == year,
        extract("month", Attendance.attendance_date) == month,
    ).all()
    present = sum(1 for r in records if r.status in ("PRESENT", "OVERTIME"))
    half = sum(1 for r in records if r.status == "HALF_DAY")
    absent = sum(1 for r in records if r.status == "ABSENT")
    ot_hours = sum(float(r.overtime_hours or 0) for r in records)
    gross_wage = (present + half * 0.5) * daily_wage + ot_hours * daily_wage
    total_advance = float(db.query(func.coalesce(func.sum(Advance.amount), 0)).filter(
        Advance.worker_id == worker_id,
        Advance.organization_id == user.organization_id,
        Advance.is_voided == False,
        extract("year", Advance.advance_date) == year,
        extract("month", Advance.advance_date) == month,
    ).scalar() or 0)
    total_payment = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.worker_id == worker_id,
        Payment.organization_id == user.organization_id,
        Payment.is_voided == False,
        extract("year", Payment.payment_date) == year,
        extract("month", Payment.payment_date) == month,
    ).scalar() or 0)
    return {
        "workerId": worker_id, "workerName": w.name,
        "presentDays": present, "halfDays": half, "absentDays": absent,
        "overtimeHours": ot_hours, "grossWage": gross_wage,
        "totalAdvance": total_advance, "totalPayment": total_payment,
        "remainingBalance": gross_wage - total_advance - total_payment,
    }


@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False, Worker.organization_id == user.organization_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker_to_response(w)


@router.post("", response_model=WorkerResponse, status_code=201)
def create_worker(data: WorkerCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    wt = data.workType.strip() if data.workType else None
    if wt == "":
        wt = None
    worker = Worker(
        organization_id=user.organization_id,
        name=data.name.strip(), marathi_name=data.marathiName.strip() if data.marathiName else None,
        phone=data.phone, address=data.address, village=data.village,
        work_type=wt, skill=data.skill,
        daily_wage=data.dailyWage, overtime_rate=data.overtimeRate,
        joining_date=data.joiningDate, photo_url=data.photoUrl,
        emergency_contact_name=data.emergencyContactName,
        emergency_contact_phone=data.emergencyContactPhone,
        notes=data.notes, user_id=data.userId,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker_to_response(worker)


@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(worker_id: int, data: WorkerUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False, Worker.organization_id == user.organization_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        if snake == "work_type" and isinstance(value, str):
            value = value.strip()
            if value == "":
                value = None
        if snake == "name" and isinstance(value, str):
            value = value.strip()
        if snake == "marathi_name" and isinstance(value, str):
            value = value.strip() or None
        setattr(w, snake, value)
    db.commit()
    db.refresh(w)
    return worker_to_response(w)


@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False, Worker.organization_id == user.organization_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    w.is_deleted = True
    db.commit()
    return {"message": "Worker deleted"}
