from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import Optional, List
from pydantic import BaseModel
import random
import uuid
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cab import Cab
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/cabs", tags=["Cabs"])


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────
class DriverIn(BaseModel):
    name: str
    phone: str = "XXXXXXXXXX"
    rating: float = 4.5
    trips: int = 0


class CabCreate(BaseModel):
    name: str
    type: str                       # Sedan | SUV
    cab_number: Optional[str] = None
    image_url: Optional[str] = ""
    driver: DriverIn
    eta_minutes: int = 5
    fare: float
    capacity: int = 4
    amenities: List[str] = []


class CabUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    cab_number: Optional[str] = None
    image_url: Optional[str] = None
    driver: Optional[DriverIn] = None
    eta_minutes: Optional[int] = None
    fare: Optional[float] = None
    capacity: Optional[int] = None
    amenities: Optional[List[str]] = None
    is_active: Optional[bool] = None


# ── Helper to serialize Cab ORM to JSON dict ──────────────────────────────────
def serialize_cab(cab: Cab) -> dict:
    return {
        "id": cab.id,
        "name": cab.name,
        "type": cab.type,
        "cab_number": cab.cab_number,
        "image_url": cab.image_url,
        "driver": {
            "name": cab.driver_name,
            "phone": cab.driver_phone,
            "rating": cab.driver_rating,
            "trips": cab.driver_trips,
        },
        "rating": cab.rating,
        "total_reviews": cab.total_reviews,
        "eta_minutes": cab.eta_minutes,
        "fare": cab.fare,
        "capacity": cab.capacity,
        "amenities": cab.amenities,
        "is_active": cab.is_active,
    }


# ── Public: list active cabs ──────────────────────────────────────────────────
@router.get("")
def get_cabs(
    from_city: str = Query(..., alias="from"),
    to_city: str = Query(..., alias="to"),
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    db_cabs = db.query(Cab).filter(Cab.is_active == True).all()
    cabs = []
    for cab in db_cabs:
        c = serialize_cab(cab)
        c["eta_minutes"] = cab.eta_minutes + random.randint(-1, 2)
        c["from_city"] = from_city
        c["to_city"] = to_city
        cabs.append(c)
    return cabs


# ── Admin: list all cabs (including inactive) ─────────────────────────────────
@router.get("/admin/all")
def admin_list_cabs(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin)
):
    db_cabs = db.query(Cab).order_by(Cab.created_at.desc()).all()
    return [serialize_cab(cab) for cab in db_cabs]


# ── Admin: create cab ─────────────────────────────────────────────────────────
@router.post("/admin", status_code=status.HTTP_201_CREATED)
def admin_create_cab(
    body: CabCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin)
):
    cab = Cab(
        id="cab-" + str(uuid.uuid4())[:8],
        name=body.name,
        type=body.type,
        cab_number=body.cab_number,
        image_url=body.image_url or "",
        driver_name=body.driver.name,
        driver_phone=body.driver.phone,
        driver_rating=body.driver.rating,
        driver_trips=body.driver.trips,
        rating=body.driver.rating,
        total_reviews=0,
        eta_minutes=body.eta_minutes,
        fare=body.fare,
        capacity=body.capacity,
        is_active=True,
    )
    cab.amenities = body.amenities
    db.add(cab)
    db.commit()
    db.refresh(cab)
    return serialize_cab(cab)


# ── Admin: update cab ─────────────────────────────────────────────────────────
@router.put("/admin/{cab_id}")
def admin_update_cab(
    cab_id: str,
    body: CabUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin)
):
    cab = db.query(Cab).filter(Cab.id == cab_id).first()
    if not cab:
        raise HTTPException(status_code=404, detail="Cab not found")
        
    if body.name is not None:       cab.name = body.name
    if body.type is not None:       cab.type = body.type
    if body.cab_number is not None: cab.cab_number = body.cab_number
    if body.image_url is not None:  cab.image_url = body.image_url
    if body.driver is not None:
        cab.driver_name = body.driver.name
        cab.driver_phone = body.driver.phone
        cab.driver_rating = body.driver.rating
        cab.driver_trips = body.driver.trips
    if body.eta_minutes is not None: cab.eta_minutes = body.eta_minutes
    if body.fare is not None:       cab.fare = body.fare
    if body.capacity is not None:   cab.capacity = body.capacity
    if body.amenities is not None:  cab.amenities = body.amenities
    if body.is_active is not None:  cab.is_active = body.is_active

    db.commit()
    db.refresh(cab)
    return serialize_cab(cab)


# ── Admin: delete (deactivate) cab ────────────────────────────────────────────
@router.delete("/admin/{cab_id}")
def admin_delete_cab(
    cab_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin)
):
    cab = db.query(Cab).filter(Cab.id == cab_id).first()
    if not cab:
        raise HTTPException(status_code=404, detail="Cab not found")
    cab.is_active = False
    db.commit()
    return {"message": "Cab deactivated", "id": cab_id}
