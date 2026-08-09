from fastapi import APIRouter, UploadFile
from ..services.file_service import FileService
from ..services.excel_service import ExcelService
from ..auth.oauth2 import get_current_user
from ..dto.user_dto import UserRequest
from fastapi.params import Depends

router = APIRouter(
    prefix="/excel",
    tags=["PDF 2 EXCEL"]
)


@router.post("/generate")
async def excel_generator(file : UploadFile, excel_filename: str, get_current:UserRequest = Depends(get_current_user)):

    file_path = await FileService().save(file)
    excel_file_path = await ExcelService(file_path, excel_filename).convert()

    return {
       "status" : "Excel File Generated Successfully",
       "file" : excel_filename, 
       "saved_at" : excel_file_path
    }
