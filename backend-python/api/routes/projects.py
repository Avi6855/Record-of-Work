from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import Optional
from database import get_db
from models import Project, Worker, Client, project_workers
from schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ClientResponse, WorkerResponse
from deps import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


def project_to_response(p: Project) -> ProjectResponse:
    client_resp = None
    if p.client:
        client_resp = ClientResponse(
            id=p.client.id, name=p.client.name, phone=p.client.phone,
            email=p.client.email, address=p.client.address,
            companyName=p.client.company_name, notes=p.client.notes,
            isActive=p.client.is_active, organizationId=p.client.organization_id,
            createdAt=p.client.created_at, updatedAt=p.client.updated_at,
        )
    workers_resp = []
    for w in p.workers:
        workers_resp.append(WorkerResponse(
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
        ))
    return ProjectResponse(
        id=p.id, name=p.name, marathiName=p.marathi_name,
        clientId=p.client_id, clientPhone=p.client_phone,
        siteAddress=p.site_address, startDate=p.start_date,
        endDate=p.end_date, contractAmount=p.contract_amount or 0,
        description=p.description, status=p.status, notes=p.notes,
        organizationId=p.organization_id, client=client_resp,
        workers=workers_resp, createdAt=p.created_at, updatedAt=p.updated_at,
    )


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Project).filter(Project.is_deleted == False, Project.organization_id == user.organization_id)
    if search:
        q = q.filter(Project.name.ilike(f"%{search}%"))
    if status_filter:
        q = q.filter(Project.status == status_filter)
    projects = q.options(
        selectinload(Project.client),
        selectinload(Project.workers),
    ).order_by(Project.created_at.desc()).offset(page * size).limit(size).all()
    return [project_to_response(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).options(
        selectinload(Project.client),
        selectinload(Project.workers),
    ).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_to_response(p)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = Project(
        organization_id=user.organization_id,
        name=data.name, marathi_name=data.marathiName,
        client_id=data.clientId, client_phone=data.clientPhone,
        site_address=data.siteAddress, start_date=data.startDate,
        end_date=data.endDate, contract_amount=data.contractAmount,
        description=data.description, status=data.status, notes=data.notes,
    )
    if data.workerIds:
        workers = db.query(Worker).filter(Worker.id.in_(data.workerIds)).all()
        project.workers = workers
    db.add(project)
    db.commit()
    db.refresh(project)
    return project_to_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "workerIds":
            continue
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        setattr(p, snake, value)
    if data.workerIds is not None:
        workers = db.query(Worker).filter(Worker.id.in_(data.workerIds)).all()
        p.workers = workers
    db.commit()
    db.refresh(p)
    return project_to_response(p)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p.is_deleted = True
    db.commit()
    return {"message": "Project deleted"}
