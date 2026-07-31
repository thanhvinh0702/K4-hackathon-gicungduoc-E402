from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    top_k: int | None = Field(default=None, ge=1, le=12)


class ChatSource(BaseModel):
    lessonId: str
    page: int
    pageEnd: int
    label: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    model: str


class GroundedAnswer(BaseModel):
    """Câu trả lời RAG có danh sách nguồn do model lựa chọn."""

    answer: str = Field(
        description="Câu trả lời tiếng Việt ngắn gọn cho UI chat; có thể dùng chữ đậm và danh sách Markdown."
    )
    source_ids: list[int] = Field(
        default_factory=list,
        description="Danh sách ID nguồn dạng số, ví dụ [1, 3]. Chỉ dùng ID có trong ngữ cảnh.",
    )


class AgentAnswer(BaseModel):
    """Kết quả cuối của agentic RAG."""

    answer: str = Field(
        description="Câu trả lời tiếng Việt ngắn gọn cho UI chat; có thể dùng chữ đậm và danh sách Markdown."
    )
    source_refs: list[str] = Field(
        default_factory=list,
        description="Các ref nguồn chính xác được retrieval tools trả về; không tự tạo ref mới.",
    )
