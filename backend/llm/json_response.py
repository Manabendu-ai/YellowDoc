from typing import Annotated

from pydantic import BaseModel, BeforeValidator


def normalize_cell(value: object) -> str:
    return "" if value is None else str(value)


CellValue = Annotated[str, BeforeValidator(normalize_cell)]


class Worksheet(BaseModel):
    worksheet_name: str
    columns: list[str]
    rows: list[list[CellValue]]


class Workbook(BaseModel):
    worksheets: list[Worksheet]


class JsonFormatResponse(BaseModel):
    document_type: str
    workbook: Workbook