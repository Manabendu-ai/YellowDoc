from ..db.database import get_db
from ..db.models import User
from ..db.hashing import hash_password
from ..dto.user_dto import UserRequest
from fastapi.params import Depends
from sqlalchemy.orm import Session

def create_user(userReq : UserRequest, db: Session = Depends(get_db)):
    user = User(
        email = userReq.email,
        name = userReq.name,
        password = hash_password(userReq.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
