import re
import subprocess
from pathlib import Path


def clean_page_text(value: str) -> str:
    value = value.replace("\r", "")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    value = re.sub(r"[ \t]{2,}", " ", value)
    return value.strip()


def infer_page_title(text: str, page_number: int) -> str:
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    return re.sub(r"\s+", " ", first_line)[:160] if first_line else f"Trang {page_number}"


def get_pdf_page_count(pdf_path: Path) -> int:
    result = subprocess.run(
        ["pdfinfo", str(pdf_path)],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    match = re.search(r"^Pages:\s+(\d+)$", result.stdout, re.MULTILINE)
    if not match:
        raise RuntimeError("Không đọc được số trang PDF bằng pdfinfo.")
    return int(match.group(1))


def extract_pdf_pages(pdf_path: Path, lesson_id: str) -> dict:
    page_count = get_pdf_page_count(pdf_path)
    result = subprocess.run(
        ["pdftotext", "-layout", "-enc", "UTF-8", str(pdf_path), "-"],
        check=True,
        capture_output=True,
        text=True,
        timeout=120,
    )
    raw_pages = result.stdout.split("\f")
    pages = []
    for index in range(page_count):
        page_number = index + 1
        text = clean_page_text(raw_pages[index] if index < len(raw_pages) else "")
        pages.append(
            {
                "page": page_number,
                "title": infer_page_title(text, page_number),
                "text": text,
            }
        )
    return {
        "version": 1,
        "lessonId": lesson_id,
        "pageCount": page_count,
        "pages": pages,
    }
