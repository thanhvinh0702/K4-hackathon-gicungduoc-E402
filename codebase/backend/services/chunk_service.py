import hashlib


def content_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _find_split_point(text: str, start: int, desired_end: int) -> int:
    if desired_end >= len(text):
        return len(text)
    lower_bound = max(start + int((desired_end - start) * 0.65), start + 1)
    for separator in ("\n\n", "\n", ". ", "; ", ", ", " "):
        index = text.rfind(separator, lower_bound, desired_end)
        if index >= lower_bound:
            return index + len(separator)
    return desired_end


def chunk_page(page: dict, max_chars: int = 1800, overlap_chars: int = 250) -> list[dict]:
    text = str(page.get("text", "")).strip()
    if not text:
        return []
    overlap_chars = min(overlap_chars, max_chars // 3)
    chunks: list[dict] = []
    start = 0
    sequence = 1
    while start < len(text):
        end = _find_split_point(text, start, start + max_chars)
        chunk_text = text[start:end].strip()
        if chunk_text:
            hash_input = f"{page['page']}\n{page['title']}\n{chunk_text}"
            chunks.append(
                {
                    "chunkId": f"page-{page['page']}-chunk-{sequence}",
                    "pageStart": page["page"],
                    "pageEnd": page["page"],
                    "title": page["title"],
                    "text": chunk_text,
                    "contentHash": content_hash(hash_input),
                }
            )
            sequence += 1
        if end >= len(text):
            break
        start = max(start + 1, end - overlap_chars)
    return chunks


def build_chunks(document: dict, max_chars: int = 1800, overlap_chars: int = 250) -> list[dict]:
    return [
        chunk
        for page in document.get("pages", [])
        for chunk in chunk_page(page, max_chars=max_chars, overlap_chars=overlap_chars)
    ]
