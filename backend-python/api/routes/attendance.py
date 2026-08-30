from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import Optional
from database import get_db
from models import Attendance, Worker, Project
from schemas import AttendanceCreate, AttendanceUpdate, AttendanceResponse, WorkerResponse, ProjectResponse
from deps import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


def att_to_response(a: Attendance) -> AttendanceResponse:
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
    project_resp = None
    if a.project:
        p = a.project
        project_resp = ProjectResponse(
            id=p.id, name=p.name, marathiName=p.marathi_name,
            clientId=p.client_id, clientPhone=p.client_phone,
            siteAddress=p.site_address, startDate=p.start_date,
            endDate=p.end_date, contractAmount=p.contract_amount or 0,
            description=p.description, status=p.status, notes=p.notes,
            organizationId=p.organization_id,
            createdAt=p.created_at, updatedAt=p.updated_at,
        )
    return AttendanceResponse(
        id=a.id, workerId=a.worker_id, projectId=a.project_id,
        attendanceDate=a.attendance_date, status=a.status,
        overtimeHours=a.overtime_hours or 0, notes=a.notes,
        entrySource=a.entry_source, isCorrected=a.is_corrected,
        organizationId=a.organization_id,
        worker=worker_resp, project=project_resp,
        createdAt=a.created_at, updatedAt=a.updated_at,
    )


@router.get("", response_model=list[AttendanceResponse])
def list_attendance(
    projectId: Optional[int] = None,
    workerId: Optional[int] = None,
    startDate: Optional[date] = None,
    endDate: Optional[date] = None,
    page: int = Query(0, ge=0),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Attendance).filter(Attendance.organization_id == user.organization_id)
    if projectId:
        q = q.filter(Attendance.project_id == projectId)
    if workerId:
        q = q.filter(Attendance.worker_id == workerId)
    if startDate:
        q = q.filter(Attendance.attendance_date >= startDate)
    if endDate:
        q = q.filter(Attendance.attendance_date <= endDate)
    records = q.options(
        selectinload(Attendance.worker),
        selectinload(Attendance.project),
    ).order_by(Attendance.attendance_date.desc()).offset(page * size).limit(size).all()
    return [att_to_response(a) for a in records]


@router.get("/{att_id}", response_model=AttendanceResponse)
def get_attendance(att_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Attendance).options(
        selectinload(Attendance.worker),
        selectinload(Attendance.project),
    ).filter(Attendance.id == att_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Attendance not found")
    return att_to_response(a)


@router.post("", response_model=AttendanceResponse, status_code=201)
def create_attendance(data: AttendanceCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(Attendance).filter(
        Attendance.worker_id == data.workerId,
        Attendance.project_id == data.projectId,
        Attendance.attendance_date == data.attendanceDate,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this worker on this date")
    att = Attendance(
        organization_id=user.organization_id,
        worker_id=data.workerId, project_id=data.projectId,
        attendance_date=data.attendanceDate, status=data.status,
        overtime_hours=data.overtimeHours, notes=data.notes,
        entry_source=data.entrySource, marked_by=user.id,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att_to_response(att)


@router.post("/bulk", status_code=201)
def bulk_create_attendance(records: list[AttendanceCreate], db: Session = Depends(get_db), user=Depends(get_current_user)):
    created = 0
    skipped = 0
    for data in records:
        existing = db.query(Attendance).filter(
            Attendance.worker_id == data.workerId,
            Attendance.project_id == data.projectId,
            Attendance.attendance_date == data.attendanceDate,
        ).first()
        if existing:
            skipped += 1
            continue
        att = Attendance(
            organization_id=user.organization_id,
            worker_id=data.workerId, project_id=data.projectId,
            attendance_date=data.attendanceDate, status=data.status,
            overtime_hours=data.overtimeHours, notes=data.notes,
            entry_source=data.entrySource, marked_by=user.id,
        )
        db.add(att)
        created += 1
    db.commit()
    return {"created": created, "skipped": skipped}


@router.put("/{att_id}", response_model=AttendanceResponse)
def update_attendance(att_id: int, data: AttendanceUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Attendance not found")
    if data.status:
        a.status = data.status
    if data.overtimeHours is not None:
        a.overtime_hours = data.overtimeHours
    if data.notes is not None:
        a.notes = data.notes
    if data.correctionReason:
        a.is_corrected = True
        a.corrected_by = user.id
        a.correction_reason = data.correctionReason
    db.commit()
    db.refresh(a)
    return att_to_response(a)


@router.delete("/{att_id}")
def delete_attendance(att_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Attendance not found")
    db.delete(a)
    db.commit()
    return {"message": "Attendance deleted"}
