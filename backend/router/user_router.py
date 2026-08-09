from ..dto.user_dto import UserRequest, UserResponse
from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..repo.user_repo import create_user
from ..auth.oauth2 import get_current_user


router = APIRouter(
    prefix="/user",
    tags=["users"]
)

@router.post('/create', response_model=UserResponse)
def post_user(userReq: UserRequest, db : Session = Depends(get_db), get_current:UserRequest = Depends(get_current_user)):
    return create_user(userReq, db)