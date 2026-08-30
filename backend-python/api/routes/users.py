from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import User, Role
from schemas import UserResponse, RoleResponse, PermissionResponse
from deps import get_current_user, require_role
from auth import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


def user_to_response(u: User) -> UserResponse:
    roles = []
    for r in u.roles:
        perms = [PermissionResponse(id=p.id, name=p.name, displayName=p.display_name, module=p.module) for p in r.permissions]
        roles.append(RoleResponse(id=r.id, name=r.name, displayName=r.display_name, permissions=perms))
    org = None
    if u.organization:
        from schemas import OrganizationResponse
        org = OrganizationResponse(
            id=u.organization.id, name=u.organization.name,
            marathiName=u.organization.marathi_name,
            contactPerson=u.organization.contact_person,
            contactEmail=u.organization.contact_email,
            contactPhone=u.organization.contact_phone,
            address=u.organization.address,
            logoUrl=u.organization.logo_url,
            currency=u.organization.currency,
            timezone=u.organization.timezone,
            isActive=u.organization.is_active,
        )
    return UserResponse(
        id=u.id, username=u.username,
        firstName=u.first_name, lastName=u.last_name,
        email=u.email, phone=u.phone,
        isActive=u.is_active, roles=roles, organization=org,
    )


@router.get("", response_model=list[UserResponse])
def list_users(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    users = db.query(User).filter(User.is_deleted == False).offset(page * size).limit(size).all()
    return [user_to_response(u) for u in users]


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user)):
    return user_to_response(user)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    u = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(u)


@router.get("/roles/all")
def list_roles(db: Session = Depends(get_db), user=Depends(get_current_user)):
    roles = db.query(Role).all()
    return [
        {
            "id": r.id, "name": r.name,
            "displayName": r.display_name,
            "permissions": [{"id": p.id, "name": p.name} for p in r.permissions],
        }
        for r in roles
    ]
