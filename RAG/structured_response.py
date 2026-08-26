from typing import Optional

from pydantic import BaseModel, Field


class RAGResponse(BaseModel):
    """What the LLM is asked to produce.

    Deliberately does *not* include the sources. Which chunks were retrieved is
    a fact the retriever already knows for certain, so asking the model to
    report it only creates an opportunity to get it wrong.
    """

    query: str
    answer: str
    summary: str
    confidence: str
    key_points: list[str]
    examples: list[str]


class RetrievedChunk(BaseModel):
    """One passage that was actually fed to the model, and where it came from."""

    document: str
    source: str
    chunk: int
    score: float
    excerpt: str


class RAGAnswer(RAGResponse):
    """The full payload the API returns: the model's answer plus provenance."""

    scope: Optional[str] = Field(
        default=None,
        description="Source file the search was restricted to, or null for all documents.",
    )
    sources: list[RetrievedChunk] = Field(default_factory=list)

    @classmethod
    def empty(cls, query: str, message: str, scope: Optional[str] = None) -> "RAGAnswer":
        return cls(
            query=query,
            answer=message,
            summary="",
            confidence="none",
            key_points=[],
            examples=[],
            scope=scope,
            sources=[],
        )
