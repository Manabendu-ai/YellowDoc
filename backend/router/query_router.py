from fastapi import APIRouter
from ..services.rag_service import RagService
from ..auth.oauth2 import get_current_user
from ..dto.user_dto import UserRequest
from fastapi.params import Depends

router = APIRouter(
    prefix="/query",
    tags=['query']
)

@router.post("")
async def rag_search(query: str):
    response = RagService(query).get_response()
    return response