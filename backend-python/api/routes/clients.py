from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Client
from schemas import ClientCreate, ClientUpdate, ClientResponse
from deps import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


def client_to_response(c: Client) -> ClientResponse:
    return ClientResponse(
        id=c.id, name=c.name, phone=c.phone, email=c.email,
        address=c.address, companyName=c.company_name,
        notes=c.notes, isActive=c.is_active,
        organizationId=c.organization_id,
        createdAt=c.created_at, updatedAt=c.updated_at,
    )


@router.get("", response_model=list[ClientResponse])
def list_clients(
    search: Optional[str] = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Client).filter(Client.is_deleted == False, Client.organization_id == user.organization_id)
    if search:
        q = q.filter(Client.name.ilike(f"%{search}%"))
    clients = q.order_by(Client.name).offset(page * size).limit(size).all()
    return [client_to_response(c) for c in clients]


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_to_response(c)


@router.post("", response_model=ClientResponse, status_code=201)
def create_client(data: ClientCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    client = Client(
        organization_id=user.organization_id,
        name=data.name, phone=data.phone, email=data.email,
        address=data.address, company_name=data.companyName,
        notes=data.notes,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client_to_response(client)


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        snake = "".join(["_" + c.lower() if c.isupper() else c for c in field]).lstrip("_")
        setattr(c, snake, value)
    db.commit()
    db.refresh(c)
    return client_to_response(c)


@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == client_id, Client.is_deleted == False).first()
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    c.is_deleted = True
    db.commit()
    return {"message": "Client deleted"}
