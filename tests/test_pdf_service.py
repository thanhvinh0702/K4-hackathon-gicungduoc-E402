from pathlib import Path

import pytest

from backend.services.pdf_service import extract_pdf_pages


def test_extract_existing_pdf_by_page():
    pdfs = sorted(Path("uploads").glob("*.pdf"))
    if not pdfs:
        pytest.skip("Không có PDF mẫu trong uploads")
    document = extract_pdf_pages(pdfs[0], "test-lesson")
    assert document["pageCount"] > 0
    assert len(document["pages"]) == document["pageCount"]
    assert document["pages"][0]["page"] == 1
