from backend.services.chunk_service import build_chunks, chunk_page


def test_empty_page_has_no_chunks():
    assert chunk_page({"page": 1, "title": "Empty", "text": "   "}) == []


def test_long_page_is_split_with_stable_metadata():
    page = {"page": 3, "title": "Token", "text": "Đây là một câu. " * 200}
    chunks = chunk_page(page, max_chars=500, overlap_chars=60)
    assert len(chunks) > 1
    assert all(chunk["pageStart"] == 3 and chunk["pageEnd"] == 3 for chunk in chunks)
    assert all(chunk["title"] == "Token" for chunk in chunks)
    assert len({chunk["chunkId"] for chunk in chunks}) == len(chunks)
    assert all(len(chunk["contentHash"]) == 64 for chunk in chunks)


def test_build_chunks_skips_blank_pages():
    document = {
        "pages": [
            {"page": 1, "title": "One", "text": "Nội dung trang một"},
            {"page": 2, "title": "Two", "text": ""},
        ]
    }
    chunks = build_chunks(document)
    assert [chunk["pageStart"] for chunk in chunks] == [1]
