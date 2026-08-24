import os

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from ..services.file_service import FileService
from ..services.excel_service import ExcelService
from ..auth.oauth2 import get_current_user
from ..dto.user_dto import UserRequest
from fastapi.params import Depends

router = APIRouter(
    prefix="/excel",
    tags=["PDF 2 EXCEL"]
)

EXCEL_DIR = "excel_files"
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.post("/generate")
async def excel_generator(file : UploadFile, excel_filename: str):

    file_path = await FileService().save(file)
    if not file_path:
        raise HTTPException(
            status_code=500,
            detail="Could not save the uploaded file on the server."
        )

    try:
        excel_file_path = await ExcelService(file_path, excel_filename).convert()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"The conversion pipeline failed: {e}"
        )

    return {
       "status" : "Excel File Generated Successfully",
       "file" : excel_filename, 
       "saved_at" : excel_file_path,
       "download_url": f"/excel/download/{excel_filename}"
    }


@router.get("/download/{filename}", tags=["PDF 2 EXCEL"])
def download_excel(filename: str):
    """Serve a previously generated workbook so mobile clients can save it."""
    safe_name = os.path.basename(filename)
    file_path = os.path.join(EXCEL_DIR, f"{safe_name}.xlsx")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"No generated excel found for '{safe_name}'"
        )

    return FileResponse(
        path=file_path,
        media_type=XLSX_MIME,
        filename=f"{safe_name}.xlsx"
    )
