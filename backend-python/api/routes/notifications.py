from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Notification
from schemas import NotificationResponse
from deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


def notif_to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id, type=n.type, title=n.title,
        message=n.message, referenceType=n.reference_type,
        referenceId=n.reference_id, isRead=n.is_read,
        readAt=n.read_at, userId=n.user_id,
        organizationId=n.organization_id,
        createdAt=n.created_at,
    )


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    isRead: bool = None,
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(Notification).filter(Notification.user_id == user.id)
    if isRead is not None:
        q = q.filter(Notification.is_read == isRead)
    notifications = q.order_by(Notification.created_at.desc()).offset(page * size).limit(size).all()
    return [notif_to_response(n) for n in notifications]


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from sqlalchemy import func
    count = db.query(func.count(Notification.id)).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).scalar()
    return {"count": count}


@router.post("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from datetime import datetime, timezone
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if not n:
        return {"message": "Notification not found"}
    n.is_read = True
    n.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Marked as read"}


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from datetime import datetime, timezone
    db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).update({"is_read": True, "read_at": datetime.now(timezone.utc)})
    db.commit()
    return {"message": "All notifications marked as read"}
