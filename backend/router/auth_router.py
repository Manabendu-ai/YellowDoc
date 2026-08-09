from fastapi import APIRouter, HTTPException, status
from fastapi.params import Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..db.models import User
from ..db.database import get_db
from ..db.hashing import verify_password
from ..auth.token import create_access_token

router = APIRouter()

@router.post('/login', tags=["Authentication"])
def login(request: OAuth2PasswordRequestForm= Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid Credentials!"
        )

    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incorrect Password!"
        )

    access_token = create_access_token(data={"sub" : user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }