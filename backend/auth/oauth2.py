from fastapi import HTTPException, status
from fastapi.params import Depends
from fastapi.security import OAuth2PasswordBearer
from .token import verifyToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token : str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    return verifyToken(token, credentials_exception)