from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import Optional, List
from pydantic import BaseModel
import random
import uuid

from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/cabs", tags=["Cabs"])


# ── In-memory cab store (persists for server lifetime) ────────────────────────
_CAB_STORE: List[dict] = [
    {
        "id": "cab-001",
        "name": "Swift Dzire",
        "type": "Sedan",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-2.jpeg",
        "driver": {"name": "Rajesh Kumar", "phone": "98765XXXXX", "rating": 4.8, "trips": 1240},
        "rating": 4.8,
        "total_reviews": 312,
        "eta_minutes": 4,
        "fare": 850,
        "capacity": 4,
        "amenities": ["AC", "Music"],
        "is_active": True,
    },
    {
        "id": "cab-002",
        "name": "Toyota Innova",
        "type": "SUV",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/innova-crysta-exterior-right-front-three-quarter-3.jpeg",
        "driver": {"name": "Suresh Patel", "phone": "91234XXXXX", "rating": 4.9, "trips": 2100},
        "rating": 4.9,
        "total_reviews": 540,
        "eta_minutes": 7,
        "fare": 1400,
        "capacity": 7,
        "amenities": ["AC", "Music", "WiFi"],
        "is_active": True,
    },
    {
        "id": "cab-003",
        "name": "Maruti Ertiga",
        "type": "SUV",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/40087/ertiga-exterior-right-front-three-quarter-4.jpeg",
        "driver": {"name": "Amit Singh", "phone": "87654XXXXX", "rating": 4.6, "trips": 890},
        "rating": 4.6,
        "total_reviews": 198,
        "eta_minutes": 10,
        "fare": 1100,
        "capacity": 6,
        "amenities": ["AC"],
        "is_active": True,
    },
    {
        "id": "cab-004",
        "name": "Honda City",
        "type": "Sedan",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/134287/city-exterior-right-front-three-quarter-2.jpeg",
        "driver": {"name": "Vikram Rao", "phone": "76543XXXXX", "rating": 4.7, "trips": 670},
        "rating": 4.7,
        "total_reviews": 145,
        "eta_minutes": 6,
        "fare": 950,
        "capacity": 4,
        "amenities": ["AC", "Music"],
        "is_active": True,
    },
    {
        "id": "cab-005",
        "name": "Mahindra XUV700",
        "type": "SUV",
        "image_url": "https://imgd.aeplcdn.com/664x374/n/cw/ec/42355/xuv700-exterior-right-front-three-quarter.jpeg",
        "driver": {"name": "Deepak Sharma", "phone": "65432XXXXX", "rating": 4.9, "trips": 430},
        "rating": 4.9,
        "total_reviews": 89,
        "eta_minutes": 12,
        "fare": 1650,
        "capacity": 7,
        "amenities": ["AC", "Music", "WiFi", "Charger"],
        "is_active": True,
    },
]


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
    image_url: Optional[str] = ""
    driver: DriverIn
    eta_minutes: int = 5
    fare: float
    capacity: int = 4
    amenities: List[str] = []


class CabUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    driver: Optional[DriverIn] = None
    eta_minutes: Optional[int] = None
    fare: Optional[float] = None
    capacity: Optional[int] = None
    amenities: Optional[List[str]] = None
    is_active: Optional[bool] = None


# ── Public: list active cabs ──────────────────────────────────────────────────
@router.get("")
def get_cabs(
    from_city: str = Query(..., alias="from"),
    to_city: str = Query(..., alias="to"),
    date: Optional[str] = Query(None),
):
    cabs = []
    for cab in _CAB_STORE:
        if not cab.get("is_active", True):
            continue
        c = dict(cab)
        c["eta_minutes"] = cab["eta_minutes"] + random.randint(-1, 2)
        c["from_city"] = from_city
        c["to_city"] = to_city
        cabs.append(c)
    return cabs


# ── Admin: list all cabs (including inactive) ─────────────────────────────────
@router.get("/admin/all")
def admin_list_cabs(_admin: User = Depends(_require_admin)):
    return _CAB_STORE


# ── Admin: create cab ─────────────────────────────────────────────────────────
@router.post("/admin", status_code=status.HTTP_201_CREATED)
def admin_create_cab(body: CabCreate, _admin: User = Depends(_require_admin)):
    cab = {
        "id": "cab-" + str(uuid.uuid4())[:8],
        "name": body.name,
        "type": body.type,
        "image_url": body.image_url or "",
        "driver": body.driver.model_dump(),
        "rating": body.driver.rating,
        "total_reviews": 0,
        "eta_minutes": body.eta_minutes,
        "fare": body.fare,
        "capacity": body.capacity,
        "amenities": body.amenities,
        "is_active": True,
    }
    _CAB_STORE.append(cab)
    return cab


# ── Admin: update cab ─────────────────────────────────────────────────────────
@router.put("/admin/{cab_id}")
def admin_update_cab(cab_id: str, body: CabUpdate, _admin: User = Depends(_require_admin)):
    for i, cab in enumerate(_CAB_STORE):
        if cab["id"] == cab_id:
            updated = dict(cab)
            if body.name is not None:       updated["name"] = body.name
            if body.type is not None:       updated["type"] = body.type
            if body.image_url is not None:  updated["image_url"] = body.image_url
            if body.driver is not None:     updated["driver"] = body.driver.model_dump()
            if body.eta_minutes is not None: updated["eta_minutes"] = body.eta_minutes
            if body.fare is not None:       updated["fare"] = body.fare
            if body.capacity is not None:   updated["capacity"] = body.capacity
            if body.amenities is not None:  updated["amenities"] = body.amenities
            if body.is_active is not None:  updated["is_active"] = body.is_active
            _CAB_STORE[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Cab not found")


# ── Admin: delete (deactivate) cab ────────────────────────────────────────────
@router.delete("/admin/{cab_id}")
def admin_delete_cab(cab_id: str, _admin: User = Depends(_require_admin)):
    for i, cab in enumerate(_CAB_STORE):
        if cab["id"] == cab_id:
            _CAB_STORE[i] = {**cab, "is_active": False}
            return {"message": "Cab deactivated", "id": cab_id}
    raise HTTPException(status_code=404, detail="Cab not found")
