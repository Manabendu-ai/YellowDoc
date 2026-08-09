from ..dto.user_dto import UserRequest
from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.orm import Session
from ..db.database import get_db


router = APIRouter(
    prefix="/user",
    tags=["users"]
)