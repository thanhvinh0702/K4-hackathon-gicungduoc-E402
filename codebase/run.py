import uvicorn

from backend.config import settings


if __name__ == "__main__":
    uvicorn.run("backend.app:app", host="0.0.0.0", port=settings.port, reload=False)
