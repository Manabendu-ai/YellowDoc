"""Retrieval endpoints.

``rag_search`` was ``async def`` but called straight into synchronous retrieval —
an embedding pass plus a Groq round trip — so every question blocked the event
loop for its full duration. All three handlers now run their work in a thread.

``/query/documents`` and ``/query/reindex`` are new: the front end needs to know
what is searchable before it can let the user scope a question to one file.
"""

from __future__ import annotations

from typing import Optional

from anyio import to_thread
from fastapi import APIRouter, HTTPException

from ..services.rag_service import RagService

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
async def rag_search(query: str, source: Optional[str] = None, top_k: int = 5):
    """Answer ``query``.

    ``source`` is a filename from /query/documents. When given, retrieval is
    restricted to that document — the fix for answers about one invoice being
    assembled from another. Omit it to search everything.
    """
    if not query or not query.strip():
        raise HTTPException(status_code=422, detail="A question is required.")

    service = RagService(query.strip(), top_k=max(1, min(top_k, 20)), source=source)
    try:
        return await to_thread.run_sync(service.get_response)
    except RuntimeError as e:
        # Missing GROQ_API_KEY, unreadable index — a configuration problem, not a
        # bad request.
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Retrieval failed: {e}")


@router.get("/documents")
async def list_documents():
    """Everything currently searchable, newest first."""
    try:
        documents = await to_thread.run_sync(RagService.documents)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Could not read the index: {e}")
    return {"documents": documents, "count": len(documents)}


@router.post("/reindex")
async def reindex():
    """Rebuild the index from md_files/ — the manual escape hatch."""
    try:
        result = await to_thread.run_sync(RagService.reindex)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Rebuild failed: {e}")
    return result
