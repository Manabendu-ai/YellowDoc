from pydantic import BaseModel


class UserRequest(BaseModel):
    name : str
    email : str
    password : str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    name : str
    email : str