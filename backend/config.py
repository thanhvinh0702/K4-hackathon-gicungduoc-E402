import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    project_root: Path = PROJECT_ROOT
    uploads_dir: Path = PROJECT_ROOT / "uploads"
    public_dir: Path = PROJECT_ROOT / "public"
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "").strip()
    chat_model: str = os.getenv("CHAT_MODEL", "gpt-5.6-terra")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    embedding_batch_size: int = max(1, int(os.getenv("EMBEDDING_BATCH_SIZE", "64")))
    retrieval_top_k: int = max(1, int(os.getenv("RETRIEVAL_TOP_K", "5")))
    retrieval_min_score: float = float(os.getenv("RETRIEVAL_MIN_SCORE", "0.15"))
    agent_recursion_limit: int = max(12, int(os.getenv("AGENT_RECURSION_LIMIT", "25")))
    max_chunk_chars: int = max(500, int(os.getenv("MAX_CHUNK_CHARS", "1800")))
    chunk_overlap_chars: int = max(0, int(os.getenv("CHUNK_OVERLAP_CHARS", "250")))
    max_upload_bytes: int = 50 * 1024 * 1024
    port: int = int(os.getenv("PORT", "3000"))


settings = Settings()
