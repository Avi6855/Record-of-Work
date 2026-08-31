from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from database import get_db
from models import Project, Worker, Client, ProjectAdvancePayment, project_workers
from schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ClientResponse, WorkerResponse, PageResponse,
    ProjectAdvancePaymentCreate, ProjectAdvancePaymentUpdate, ProjectAdvancePaymentResponse
)
from deps import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


def advance_to_response(a: ProjectAdvancePayment) -> ProjectAdvancePaymentResponse:
    return ProjectAdvancePaymentResponse(
        id=a.id, projectId=a.project_id, organizationId=a.organization_id,
        amount=a.amount or 0, paymentDate=a.payment_date, paymentMethod=a.payment_method,
        description=a.description, notes=a.notes, referenceNumber=a.reference_number,
        isVoided=a.is_voided, voidReason=a.void_reason, createdBy=a.created_by,
        createdAt=a.created_at, updatedAt=a.updated_at,
    )


def project_to_response(p: Project, advance_payments: Optional[list[ProjectAdvancePayment]] = None, db: Optional[Session] = None, org_id: Optional[int] = None) -> ProjectResponse:
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
    # compute advance totals
    if advance_payments is None and db is not None and org_id is not None:
        advance_payments = db.query(ProjectAdvancePayment).filter(
            ProjectAdvancePayment.project_id == p.id,
            ProjectAdvancePayment.organization_id == org_id,
            ProjectAdvancePayment.is_voided == False
        ).all()
    elif advance_payments is None:
        advance_payments = []
    # filter voided if supplied list includes voided? Ensure only non-voided for totals
    non_voided = [a for a in advance_payments if not a.is_voided]
    advance_total = sum((Decimal(str(a.amount)) for a in non_voided), Decimal("0"))
    contract = Decimal(str(p.contract_amount or 0))
    remaining = contract - advance_total
    # build response payments list (only non-voided? Include all but frontend will show voided separately. Requirement says history table with add/edit/void, so include all, but totals use non-voided. We'll include all with isVoided flag, but for ProjectResponse we include all for history
    # For simplicity, include all payments supplied, or if we fetched non-voided only, we need all. If db supplied, fetch all vs non-voided.
    # If we auto-fetched non-voided, we lost voided. So when called with db, also fetch all for list? Let's fetch all if needed for detail.
    # We'll handle: if advance_payments was auto-fetched (db case) and we want full history, we should fetch all as well. For list page we only need totals, so non-voided is fine.
    # For detail endpoint we will fetch all separately.
    payments_resp = [advance_to_response(a) for a in advance_payments]

    return ProjectResponse(
        id=p.id, name=p.name, marathiName=p.marathi_name,
        clientId=p.client_id, clientPhone=p.client_phone,
        siteAddress=p.site_address, startDate=p.start_date,
        endDate=p.end_date, contractAmount=contract,
        description=p.description, status=p.status, notes=p.notes,
        organizationId=p.organization_id,
        advanceTotal=advance_total,
        remainingAmount=remaining,
        advancePayments=payments_resp,
        client=client_resp,
        workers=workers_resp, createdAt=p.created_at, updatedAt=p.updated_at,
    )


@router.get("", response_model=PageResponse)
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
    total = q.count()
    projects = q.options(
        selectinload(Project.client),
        selectinload(Project.workers),
    ).order_by(Project.created_at.desc()).offset(page * size).limit(size).all()
    items = []
    for p in projects:
        # compute advance totals efficiently per project (could be batched but fine for 50)
        advances = db.query(ProjectAdvancePayment).filter(
            ProjectAdvancePayment.project_id == p.id,
            ProjectAdvancePayment.organization_id == user.organization_id,
            ProjectAdvancePayment.is_voided == False
        ).all()
        items.append(project_to_response(p, advance_payments=advances))
    total_pages = (total + size - 1) // size if total > 0 else 0
    return PageResponse(
        content=items, totalElements=total, totalPages=total_pages,
        size=size, number=page, first=page == 0, last=page >= total_pages - 1,
        empty=len(items) == 0,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).options(
        selectinload(Project.client),
        selectinload(Project.workers),
    ).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    # fetch all advance payments including voided for history
    advances_all = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).order_by(ProjectAdvancePayment.payment_date.desc(), ProjectAdvancePayment.created_at.desc()).all()
    return project_to_response(p, advance_payments=advances_all)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # validate contractAmount >=0 already via pydantic, but double check
    contract = data.contractAmount if data.contractAmount is not None else Decimal("0")
    if Decimal(str(contract)) < 0:
        raise HTTPException(status_code=422, detail="contractAmount must be >= 0")
    if data.endDate and data.startDate and data.endDate < data.startDate:
        raise HTTPException(status_code=422, detail="endDate must be >= startDate")
    # allow empty name fallback
    name = data.name.strip() if data.name and data.name.strip() else None
    if not name:
        # fallback to Untitled Project - date
        name = f"Untitled Project - {data.startDate.isoformat()}"
    project = Project(
        organization_id=user.organization_id,
        name=name, marathi_name=data.marathiName.strip() if data.marathiName and data.marathiName.strip() else None,
        client_id=data.clientId, client_phone=data.clientPhone,
        site_address=data.siteAddress, start_date=data.startDate,
        end_date=data.endDate, contract_amount=contract,
        description=data.description, status=data.status, notes=data.notes,
    )
    if data.workerIds:
        workers = db.query(Worker).filter(Worker.id.in_(data.workerIds), Worker.organization_id == user.organization_id).all()
        project.workers = workers
    db.add(project)
    db.commit()
    db.refresh(project)
    # reload with relationships
    p = db.query(Project).options(selectinload(Project.client), selectinload(Project.workers)).filter(Project.id == project.id).first()
    return project_to_response(p, advance_payments=[], db=db, org_id=user.organization_id)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).options(selectinload(Project.client), selectinload(Project.workers)).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    upd = data.model_dump(exclude_unset=True)
    # validation: contractAmount >=0
    if "contractAmount" in upd and upd["contractAmount"] is not None and Decimal(str(upd["contractAmount"])) < 0:
        raise HTTPException(status_code=422, detail="contractAmount must be >= 0")
    # validation for dates: if updating startDate or endDate, ensure end >= start
    new_start = upd.get("startDate", p.start_date)
    new_end = upd.get("endDate", p.end_date)
    # note: upd may have None; but we need to handle exclude_unset: if not in upd, keep old
    if "startDate" not in upd:
        new_start = p.start_date
    if "endDate" not in upd:
        new_end = p.end_date
    if new_start and new_end and new_end < new_start:
        raise HTTPException(status_code=422, detail="endDate must be >= startDate")
    # handle name allow empty -> if explicitly provided empty, keep existing? But spec says allow empty name, fallback. We'll fallback if empty string provided.
    if "name" in upd:
        val = upd["name"]
        if val is not None and isinstance(val, str) and val.strip() == "":
            # fallback: keep fallback name or generate? We'll set to Untitled with current start
            sd = new_start or p.start_date
            val = f"Untitled Project - {sd.isoformat()}" if sd else "Untitled Project"
            upd["name"] = val
        elif val is not None and isinstance(val, str):
            upd["name"] = val.strip()
    for field, value in upd.items():
        if field == "workerIds":
            continue
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        # handle empty strings to None for optional fields
        if isinstance(value, str) and value.strip() == "" and snake in ("marathi_name", "client_phone", "site_address", "description", "notes"):
            value = None
        setattr(p, snake, value)
    if data.workerIds is not None:
        workers = db.query(Worker).filter(Worker.id.in_(data.workerIds), Worker.organization_id == user.organization_id).all()
        p.workers = workers
    db.commit()
    db.refresh(p)
    advances_all = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).order_by(ProjectAdvancePayment.payment_date.desc()).all()
    return project_to_response(p, advance_payments=advances_all)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    p.is_deleted = True
    db.commit()
    return {"message": "Project deleted"}


# ---- Project Advance Payment endpoints ----

@router.get("/{project_id}/advance-payments", response_model=list[ProjectAdvancePaymentResponse])
def list_advance_payments(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    proj = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    payments = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).order_by(ProjectAdvancePayment.payment_date.desc(), ProjectAdvancePayment.created_at.desc()).all()
    return [advance_to_response(a) for a in payments]


@router.post("/{project_id}/advance-payments", response_model=ProjectAdvancePaymentResponse, status_code=201)
def create_advance_payment(project_id: int, data: ProjectAdvancePaymentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    proj = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if Decimal(str(data.amount)) <= 0:
        raise HTTPException(status_code=422, detail="amount must be > 0")
    payment = ProjectAdvancePayment(
        organization_id=user.organization_id,
        project_id=project_id,
        amount=data.amount,
        payment_date=data.paymentDate,
        payment_method=data.paymentMethod,
        description=data.description.strip() if data.description and data.description.strip() else None,
        notes=data.notes.strip() if data.notes and data.notes.strip() else None,
        reference_number=data.referenceNumber.strip() if data.referenceNumber and data.referenceNumber.strip() else None,
        created_by=user.id,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return advance_to_response(payment)


@router.put("/{project_id}/advance-payments/{payment_id}", response_model=ProjectAdvancePaymentResponse)
def update_advance_payment(project_id: int, payment_id: int, data: ProjectAdvancePaymentUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    proj = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    pay = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.id == payment_id,
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Advance payment not found")
    if pay.is_voided:
        raise HTTPException(status_code=400, detail="Cannot edit voided payment")
    upd = data.model_dump(exclude_unset=True)
    if "amount" in upd and upd["amount"] is not None and Decimal(str(upd["amount"])) <= 0:
        raise HTTPException(status_code=422, detail="amount must be > 0")
    for field, value in upd.items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        if isinstance(value, str) and value is not None:
            value = value.strip() or None
        setattr(pay, snake, value)
    db.commit()
    db.refresh(pay)
    return advance_to_response(pay)


@router.delete("/{project_id}/advance-payments/{payment_id}")
def void_advance_payment(project_id: int, payment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    proj = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    pay = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.id == payment_id,
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Advance payment not found")
    if pay.is_voided:
        raise HTTPException(status_code=400, detail="Already voided")
    pay.is_voided = True
    pay.voided_by = user.id
    pay.voided_at = datetime.utcnow()
    db.commit()
    return {"message": "Advance payment voided", "id": pay.id}


# ---- Workers assignment instant endpoints ----

@router.post("/{project_id}/workers/{worker_id}", response_model=ProjectResponse)
def assign_worker(project_id: int, worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).options(selectinload(Project.workers), selectinload(Project.client)).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.organization_id == user.organization_id, Worker.is_deleted == False).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    if w not in p.workers:
        p.workers.append(w)
        db.commit()
        db.refresh(p)
    advances_all = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).order_by(ProjectAdvancePayment.payment_date.desc()).all()
    return project_to_response(p, advance_payments=advances_all)


@router.delete("/{project_id}/workers/{worker_id}", response_model=ProjectResponse)
def unassign_worker(project_id: int, worker_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Project).options(selectinload(Project.workers), selectinload(Project.client)).filter(Project.id == project_id, Project.is_deleted == False, Project.organization_id == user.organization_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    w = db.query(Worker).filter(Worker.id == worker_id, Worker.organization_id == user.organization_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Worker not found")
    if w in p.workers:
        p.workers.remove(w)
        db.commit()
        db.refresh(p)
    advances_all = db.query(ProjectAdvancePayment).filter(
        ProjectAdvancePayment.project_id == project_id,
        ProjectAdvancePayment.organization_id == user.organization_id
    ).order_by(ProjectAdvancePayment.payment_date.desc()).all()
    return project_to_response(p, advance_payments=advances_all)

