from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User, AuditLog, LoginHistory
from schemas import (
    LoginRequest, LoginResponse, RefreshTokenRequest,
    ChangePasswordRequest, UserResponse, RoleResponse, PermissionResponse,
    OrganizationResponse,
)
from auth import (
    verify_password, create_access_token, create_refresh_token, decode_token,
    get_password_hash,
)
from deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    roles = []
    for r in user.roles:
        perms = [PermissionResponse(id=p.id, name=p.name, displayName=p.display_name, module=p.module) for p in r.permissions]
        roles.append(RoleResponse(id=r.id, name=r.name, displayName=r.display_name, permissions=perms))
    org = None
    if user.organization:
        org = OrganizationResponse(
            id=user.organization.id, name=user.organization.name,
            marathiName=user.organization.marathi_name,
            contactPerson=user.organization.contact_person,
            contactEmail=user.organization.contact_email,
            contactPhone=user.organization.contact_phone,
            address=user.organization.address,
            logoUrl=user.organization.logo_url,
            currency=user.organization.currency,
            timezone=user.organization.timezone,
            isActive=user.organization.is_active,
        )
    return UserResponse(
        id=user.id, username=user.username,
        firstName=user.first_name, lastName=user.last_name,
        email=user.email, phone=user.phone,
        isActive=user.is_active, roles=roles, organization=org,
    )


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db), req: Request = None):
    user = db.query(User).filter(User.username == request.username, User.is_deleted == False).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(user.username)
    refresh_token = create_refresh_token(user.username)

    audit = AuditLog(
        organization_id=user.organization_id, user_id=user.id,
        username=user.username, action="LOGIN", entity_type="USER",
        entity_id=user.id, status="SUCCESS",
        ip_address=req.client.host if req else None,
    )
    db.add(audit)
    db.commit()

    return LoginResponse(
        accessToken=access_token, refreshToken=refresh_token,
        expiresIn=3600000, user=user_to_response(user),
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refreshToken)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username, User.is_deleted == False).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(user.username)
    refresh_token = create_refresh_token(user.username)

    return LoginResponse(
        accessToken=access_token, refreshToken=refresh_token,
        expiresIn=3600000, user=user_to_response(user),
    )


@router.post("/change-password")
def change_password(request: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(request.oldPassword, user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid old password")
    user.password = get_password_hash(request.newPassword)
    user.password_changed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password changed successfully"}
