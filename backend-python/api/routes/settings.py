from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import SystemSetting
from schemas import SystemSettingResponse
from deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=list[SystemSettingResponse])
def list_settings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    settings = db.query(SystemSetting).filter(
        SystemSetting.organization_id == user.organization_id
    ).all()
    return [
        SystemSettingResponse(
            id=s.id, settingKey=s.setting_key, settingValue=s.setting_value,
            description=s.description, settingType=s.setting_type,
            isSystem=s.is_system, organizationId=s.organization_id,
        )
        for s in settings
    ]


@router.put("/{setting_key}")
def update_setting(setting_key: str, setting_value: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(SystemSetting).filter(
        SystemSetting.organization_id == user.organization_id,
        SystemSetting.setting_key == setting_key,
    ).first()
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Setting not found")
    s.setting_value = setting_value
    db.commit()
    return {"message": "Setting updated"}
