"""Validate the bundled source documents and rebuild their searchable index."""

from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "source_manifest.json"
OUTPUT = ROOT / "source_pack_index.json"
WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    indexed = []
    errors = []
    for item in manifest.get("documents", []):
        source = (ROOT / item["file_path"]).resolve()
        if not source.is_relative_to(ROOT) or not source.is_file():
            errors.append(f"Missing or unsafe source file: {item['file_path']}")
            continue
        try:
            with zipfile.ZipFile(source) as archive:
                document = ElementTree.fromstring(archive.read("word/document.xml"))
            paragraphs = [
                "".join(node.text or "" for node in paragraph.findall(".//w:t", WORD_NS)).strip()
                for paragraph in document.findall(".//w:body/w:p", WORD_NS)
            ]
            paragraphs = [paragraph for paragraph in paragraphs if paragraph]
            missing = [
                anchor
                for anchor in item.get("section_anchors", [])
                if not any(anchor in paragraph for paragraph in paragraphs)
            ]
            if missing:
                errors.append(f"{item['document_id']} missing section anchors: {missing}")
                continue
            indexed_item = {
                **item,
                "content": "\n".join(paragraphs),
                "paragraphs": paragraphs,
                "source_sha256": sha256(source),
            }
            if item.get("pdf_path"):
                pdf = (ROOT / item["pdf_path"]).resolve()
                if not pdf.is_relative_to(ROOT) or not pdf.is_file() or not pdf.read_bytes().startswith(b"%PDF-"):
                    errors.append(f"Missing, unsafe or invalid PDF: {item['pdf_path']}")
                    continue
                indexed_item["pdf_sha256"] = sha256(pdf)
            indexed.append(indexed_item)
            print(f"Checked {item['document_id']}: {len(paragraphs)} paragraphs")
        except (KeyError, OSError, zipfile.BadZipFile, ElementTree.ParseError) as error:
            errors.append(f"{item.get('document_id', 'unknown')}: {error}")

    expected = len(manifest.get("documents", []))
    if errors or len(indexed) != expected:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(f"Index validation failed: {len(indexed)}/{expected} documents passed.")

    index = {
        "package": manifest.get("package"),
        "generated_on": manifest.get("generated_on"),
        "synthetic_data": manifest.get("synthetic_data", True),
        "documents": indexed,
    }
    OUTPUT.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Verified {expected} documents; wrote {OUTPUT.name}.")


if __name__ == "__main__":
    main()
