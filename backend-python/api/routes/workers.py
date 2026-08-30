from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from models import Worker, Organization
from schemas import WorkerCreate, WorkerUpdate, WorkerResponse
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


@router.get("", response_model=list[WorkerResponse])
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
    workers = q.order_by(Worker.name).offset(page * size).limit(size).all()
    return [worker_to_response(w) for w in workers]


@router.get("/count")
def count_workers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    total = db.query(func.count(Worker.id)).filter(Worker.is_deleted == False, Worker.organization_id == user.organization_id).scalar()
    active = db.query(func.count(Worker.id)).filter(Worker.is_deleted == False, Worker.is_active == True, Worker.organization_id == user.organization_id).scalar()
    return {"total": total, "active": active}


@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker_to_response(w)


@router.post("", response_model=WorkerResponse, status_code=201)
def create_worker(data: WorkerCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    worker = Worker(
        organization_id=user.organization_id,
        name=data.name, marathi_name=data.marathiName,
        phone=data.phone, address=data.address, village=data.village,
        work_type=data.workType, skill=data.skill,
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
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        setattr(w, snake, value)
    db.commit()
    db.refresh(w)
    return worker_to_response(w)


@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    w.is_deleted = True
    db.commit()
    return {"message": "Worker deleted"}
