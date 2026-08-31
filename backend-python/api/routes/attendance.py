from datetime import date, datetime
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


@router.get("/daily", response_model=list[AttendanceResponse])
def daily_attendance(
    projectId: int = Query(...),
    date: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Attendance).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.project_id == projectId,
        Attendance.attendance_date == date,
    )
    records = q.options(
        selectinload(Attendance.worker),
        selectinload(Attendance.project),
    ).all()
    return [att_to_response(a) for a in records]


@router.post("/all-present")
def mark_all_present(
    projectId: int = Query(...),
    date: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    workers = db.query(Worker).filter(
        Worker.is_deleted == False, Worker.is_active == True,
        Worker.organization_id == user.organization_id,
    ).all()
    created = 0
    for w in workers:
        existing = db.query(Attendance).filter(
            Attendance.worker_id == w.id,
            Attendance.project_id == projectId,
            Attendance.attendance_date == date,
        ).first()
        if existing:
            existing.status = "PRESENT"
        else:
            att = Attendance(
                organization_id=user.organization_id,
                worker_id=w.id, project_id=projectId,
                attendance_date=date, status="PRESENT",
                entry_source="BULK", marked_by=user.id,
            )
            db.add(att)
            created += 1
    db.commit()
    return {"message": "All present", "created": created}


STATUS_TO_SYMBOL = {
    "PRESENT": "✓",
    "ABSENT": "X",
    "HALF_DAY": "½",
    "OVERTIME": "OT",
    "LEAVE": "L",
    "HOLIDAY": "H",
}

@router.get("/notebook")
def attendance_notebook(
    projectId: int = Query(...),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Monthly notebook derived directly from same Attendance table (single source of truth).
    Returns { "YYYY-MM-DD": { workerId: "✓|X|½|OT|L|H", ... }, ... }
    Frontend monthly view uses this; daily edits automatically reflect here.
    """
    import calendar
    _, last_day = calendar.monthrange(year, month)
    start = date(year, month, 1)
    end = date(year, month, last_day)
    records = db.query(Attendance).filter(
        Attendance.organization_id == user.organization_id,
        Attendance.project_id == projectId,
        Attendance.attendance_date >= start,
        Attendance.attendance_date <= end,
    ).all()
    result: dict[str, dict[str, str]] = {}
    for r in records:
        d = r.attendance_date.isoformat()
        if d not in result:
            result[d] = {}
        symbol = STATUS_TO_SYMBOL.get(r.status, r.status)
        result[d][str(r.worker_id)] = symbol
    return result


@router.get("/monthly")
def attendance_monthly(
    projectId: int = Query(...),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Alias for notebook - same derivation, alternate name for compatibility."""
    return attendance_notebook(projectId=projectId, year=year, month=month, db=db, user=user)


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
        Attendance.organization_id == user.organization_id,
    ).first()
    if existing:
        # Upsert: update existing record - single source of truth, enables optimistic PUT via POST
        existing.status = data.status
        if data.overtimeHours is not None:
            existing.overtime_hours = data.overtimeHours
        if data.notes is not None:
            existing.notes = data.notes
        existing.entry_source = data.entrySource
        existing.marked_by = user.id
        db.commit()
        db.refresh(existing)
        return att_to_response(existing)
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
    updated = 0
    for data in records:
        existing = db.query(Attendance).filter(
            Attendance.worker_id == data.workerId,
            Attendance.project_id == data.projectId,
            Attendance.attendance_date == data.attendanceDate,
            Attendance.organization_id == user.organization_id,
        ).first()
        if existing:
            existing.status = data.status
            if data.overtimeHours is not None:
                existing.overtime_hours = data.overtimeHours
            if data.notes is not None:
                existing.notes = data.notes
            existing.entry_source = data.entrySource
            existing.marked_by = user.id
            updated += 1
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
    return {"created": created, "updated": updated}


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
