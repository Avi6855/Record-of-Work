from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from auth import decode_token
from models import User, Role, Permission

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.username == username, User.is_deleted == False).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def get_user_permissions(user: User) -> set[str]:
    perms = set()
    for role in user.roles:
        for perm in role.permissions:
            perms.add(perm.name)
    return perms


def require_permission(permission: str):
    def dependency(user: User = Depends(get_current_user)):
        user_perms = get_user_permissions(user)
        if permission not in user_perms:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission denied: {permission}")
        return user
    return Depends(dependency)


def require_role(*role_names: str):
    def dependency(user: User = Depends(get_current_user)):
        user_roles = {r.name for r in user.roles}
        if not user_roles.intersection(set(role_names)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return Depends(dependency)
