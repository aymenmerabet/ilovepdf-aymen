import os
import io
import math
import base64
import zipfile
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF
from PIL import Image

def get_pdf_info_and_preview(pdf_path: str, max_preview: int = 8) -> Dict[str, Any]:
    """Extracts metadata, page count, dimensions, and base64 thumbnails."""
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    metadata = doc.metadata or {}
    
    previews = []
    for i in range(min(page_count, max_preview)):
        page = doc[i]
        pix = page.get_pixmap(dpi=72)
        img_bytes = pix.tobytes("jpeg")
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        previews.append({
            "page_number": i + 1,
            "width": page.rect.width,
            "height": page.rect.height,
            "thumbnail": f"data:image/jpeg;base64,{b64}"
        })
        
    doc.close()
    return {
        "page_count": page_count,
        "metadata": {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "creator": metadata.get("creator", ""),
            "producer": metadata.get("producer", ""),
            "format": metadata.get("format", "")
        },
        "previews": previews
    }

def merge_pdfs(file_paths: List[str], output_path: str) -> Dict[str, Any]:
    """Merges multiple PDF documents in specified order."""
    merged_doc = fitz.open()
    total_pages = 0
    
    for path in file_paths:
        if os.path.exists(path):
            doc = fitz.open(path)
            merged_doc.insert_pdf(doc)
            total_pages += len(doc)
            doc.close()
            
    merged_doc.save(output_path, garbage=4, deflate=True)
    merged_doc.close()
    
    output_size = os.path.getsize(output_path)
    return {
        "output_path": output_path,
        "total_pages": total_pages,
        "output_size": output_size
    }

def parse_page_ranges(range_str: str, max_pages: int) -> List[int]:
    """Parses range strings like '1-3, 5, 7-9' into 0-indexed page numbers."""
    pages = set()
    parts = range_str.split(",")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            sub = part.split("-")
            try:
                start = max(1, int(sub[0]))
                end = min(max_pages, int(sub[1]))
                for p in range(start, end + 1):
                    pages.add(p - 1)
            except ValueError:
                pass
        else:
            try:
                p = int(part)
                if 1 <= p <= max_pages:
                    pages.add(p - 1)
            except ValueError:
                pass
    return sorted(list(pages))

def split_pdf(pdf_path: str, output_dir: str, split_mode: str = "all", ranges_str: str = "") -> Dict[str, Any]:
    """Splits PDF into individual pages or specified ranges and returns a zip or single file."""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    os.makedirs(output_dir, exist_ok=True)
    
    created_files = []
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    if split_mode == "all":
        for i in range(total_pages):
            out_doc = fitz.open()
            out_doc.insert_pdf(doc, from_page=i, to_page=i)
            out_file = os.path.join(output_dir, f"{base_name}_page_{i+1}.pdf")
            out_doc.save(out_file, garbage=4, deflate=True)
            out_doc.close()
            created_files.append(out_file)
            
        zip_path = os.path.join(output_dir, f"{base_name}_split_pages.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in created_files:
                zf.write(f, arcname=os.path.basename(f))
        doc.close()
        return {
            "result_file": zip_path,
            "filename": f"{base_name}_split_pages.zip",
            "file_type": "zip",
            "size_bytes": os.path.getsize(zip_path),
            "created_files_count": len(created_files)
        }
        
    elif split_mode == "ranges":
        selected_pages = parse_page_ranges(ranges_str, total_pages)
        if not selected_pages:
            selected_pages = list(range(total_pages))
            
        out_doc = fitz.open()
        for p in selected_pages:
            out_doc.insert_pdf(doc, from_page=p, to_page=p)
            
        out_file = os.path.join(output_dir, f"{base_name}_extracted.pdf")
        out_doc.save(out_file, garbage=4, deflate=True)
        out_doc.close()
        doc.close()
        
        return {
            "result_file": out_file,
            "filename": f"{base_name}_extracted.pdf",
            "file_type": "pdf",
            "size_bytes": os.path.getsize(out_file),
            "pages_count": len(selected_pages)
        }

def compress_pdf(pdf_path: str, output_path: str, level: str = "medium") -> Dict[str, Any]:
    """
    Compresses PDF using PyMuPDF stream deflation, garbage collection, and image re-compression.
    Levels:
    - 'low': Fast, lossless structural cleanup & deflation
    - 'medium': Standard compression with balanced image optimization
    - 'high': Maximum compression with image downsampling and quality reduction
    """
    initial_size = os.path.getsize(pdf_path)
    doc = fitz.open(pdf_path)
    
    if level in ["medium", "high"]:
        # Re-compress embedded images
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            image_list = page.get_images(full=True)
            
            for img_info in image_list:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    img_ext = base_image["ext"]
                    
                    pil_img = Image.open(io.BytesIO(image_bytes))
                    
                    # Convert RGBA/P to RGB for JPEG compression
                    if pil_img.mode in ("RGBA", "P"):
                        pil_img = pil_img.convert("RGB")
                    
                    target_quality = 45 if level == "high" else 70
                    max_dim = 1200 if level == "high" else 1800
                    
                    # Resize if too large
                    w, h = pil_img.size
                    if max(w, h) > max_dim:
                        scale = max_dim / max(w, h)
                        pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
                        
                    out_buffer = io.BytesIO()
                    pil_img.save(out_buffer, format="JPEG", quality=target_quality, optimize=True)
                    new_img_bytes = out_buffer.getvalue()
                    
                    # Only replace if smaller
                    if len(new_img_bytes) < len(image_bytes):
                        doc.update_stream(xref, new_img_bytes)
                except Exception:
                    continue

    doc.save(
        output_path,
        garbage=4,
        deflate=True,
        clean=True,
        deflate_images=True,
        deflate_fonts=True
    )
    doc.close()
    
    final_size = os.path.getsize(output_path)
    # If compression ended up slightly larger (rare), copy original
    if final_size > initial_size:
        import shutil
        shutil.copyfile(pdf_path, output_path)
        final_size = initial_size
        
    saved_bytes = max(0, initial_size - final_size)
    saved_percent = round((saved_bytes / initial_size) * 100, 1) if initial_size > 0 else 0
    
    return {
        "initial_size": initial_size,
        "final_size": final_size,
        "saved_bytes": saved_bytes,
        "saved_percent": saved_percent
    }

def pdf_to_images(pdf_path: str, output_dir: str, img_format: str = "png", dpi: int = 150) -> Dict[str, Any]:
    """Renders all PDF pages as images and returns a zip archive."""
    doc = fitz.open(pdf_path)
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    created_images = []
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=dpi)
        img_filename = f"{base_name}_page_{i+1}.{img_format}"
        img_path = os.path.join(output_dir, img_filename)
        pix.save(img_path)
        created_images.append(img_path)
        
    doc.close()
    
    zip_path = os.path.join(output_dir, f"{base_name}_images.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for img in created_images:
            zf.write(img, arcname=os.path.basename(img))
            
    return {
        "zip_path": zip_path,
        "filename": f"{base_name}_images.zip",
        "images_count": len(created_images),
        "size_bytes": os.path.getsize(zip_path)
    }

def images_to_pdf(image_paths: List[str], output_path: str, orientation: str = "portrait", margin: int = 10) -> Dict[str, Any]:
    """Converts a list of images into a single formatted PDF document."""
    doc = fitz.open()
    
    # A4 standard points: 595 x 842
    if orientation == "landscape":
        page_rect = fitz.Rect(0, 0, 842, 595)
    else:
        page_rect = fitz.Rect(0, 0, 595, 842)
        
    for img_path in image_paths:
        if not os.path.exists(img_path):
            continue
        try:
            with Image.open(img_path) as pil_img:
                img_w, img_h = pil_img.size
                
            page = doc.new_page(width=page_rect.width, height=page_rect.height)
            
            # Calculate aspect ratio fit within margins
            avail_w = page_rect.width - (margin * 2)
            avail_h = page_rect.height - (margin * 2)
            
            scale = min(avail_w / img_w, avail_h / img_h)
            draw_w = img_w * scale
            draw_h = img_h * scale
            
            # Center on page
            x0 = (page_rect.width - draw_w) / 2
            y0 = (page_rect.height - draw_h) / 2
            insert_rect = fitz.Rect(x0, y0, x0 + draw_w, y0 + draw_h)
            
            page.insert_image(insert_rect, filename=img_path)
        except Exception as e:
            print(f"Error processing image {img_path}: {e}")
            continue
            
    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    
    return {
        "output_path": output_path,
        "pages_count": len(image_paths),
        "output_size": os.path.getsize(output_path)
    }

def organize_pdf(pdf_path: str, output_path: str, page_actions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Reorders, rotates, and deletes pages based on page_actions list:
    [{ "page_index": 0, "rotation": 90, "keep": True }, ...]
    """
    src_doc = fitz.open(pdf_path)
    out_doc = fitz.open()
    
    for action in page_actions:
        if not action.get("keep", True):
            continue
        page_idx = action.get("page_index", 0)
        rotation = action.get("rotation", 0) % 360
        
        if 0 <= page_idx < len(src_doc):
            out_doc.insert_pdf(src_doc, from_page=page_idx, to_page=page_idx)
            new_page = out_doc[-1]
            if rotation != 0:
                new_page.set_rotation((new_page.rotation + rotation) % 360)
                
    out_doc.save(output_path, garbage=4, deflate=True)
    out_doc.close()
    src_doc.close()
    
    return {
        "output_path": output_path,
        "final_pages_count": len(page_actions),
        "output_size": os.path.getsize(output_path)
    }

def protect_pdf(pdf_path: str, output_path: str, password: str) -> Dict[str, Any]:
    """Encrypts a PDF with a user password."""
    doc = fitz.open(pdf_path)
    # PyMuPDF encryption: permissions & encryption method
    perm = int(
        fitz.PDF_PERM_PRINT
        | fitz.PDF_PERM_COPY
        | fitz.PDF_PERM_ANNOTATE
    )
    doc.save(
        output_path,
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw=password,
        owner_pw=password + "_admin",
        permissions=perm
    )
    doc.close()
    return {
        "output_path": output_path,
        "is_protected": True,
        "output_size": os.path.getsize(output_path)
    }

def unlock_pdf(pdf_path: str, output_path: str, password: str) -> Dict[str, Any]:
    """Decrypts a password-protected PDF."""
    doc = fitz.open(pdf_path)
    if doc.is_encrypted:
        success = doc.authenticate(password)
        if not success:
            doc.close()
            raise ValueError("Mot de passe incorrect")
            
    doc.save(output_path, encryption=fitz.PDF_ENCRYPT_NONE)
    doc.close()
    return {
        "output_path": output_path,
        "is_unlocked": True,
        "output_size": os.path.getsize(output_path)
    }

def watermark_and_number_pdf(
    pdf_path: str,
    output_path: str,
    watermark_text: str = "",
    add_page_numbers: bool = True,
    opacity: float = 0.25,
    font_size: int = 36,
    color: tuple = (0.5, 0.5, 0.5)
) -> Dict[str, Any]:
    """Adds a diagonal semi-transparent watermark and/or footer page numbers."""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    for i, page in enumerate(doc):
        rect = page.rect
        
        # 1. Add Watermark if provided
        if watermark_text.strip():
            center_x = rect.width / 2
            center_y = rect.height / 2
            # PyMuPDF insert_text with rotation and opacity
            page.insert_text(
                fitz.Point(center_x - (len(watermark_text) * font_size * 0.25), center_y),
                watermark_text,
                fontsize=font_size,
                fontname="helv",
                color=color,
                rotate=45,
                fill_opacity=opacity
            )
            
        # 2. Add Page Number if requested ("Page X / Y")
        if add_page_numbers:
            footer_text = f"Page {i + 1} / {total_pages}"
            footer_y = rect.height - 20
            page.insert_text(
                fitz.Point(rect.width / 2 - 30, footer_y),
                footer_text,
                fontsize=10,
                fontname="helv",
                color=(0.3, 0.3, 0.3)
            )
            
    doc.save(output_path, garbage=4, deflate=True)
    doc.close()
    
    return {
        "output_path": output_path,
        "pages_count": total_pages,
        "output_size": os.path.getsize(output_path)
    }

def extract_text_pdf(pdf_path: str) -> Dict[str, Any]:
    """Extracts text content and structured info from all pages."""
    doc = fitz.open(pdf_path)
    pages_text = []
    total_words = 0
    
    for i, page in enumerate(doc):
        text = page.get_text("text")
        words = len(text.split())
        total_words += words
        pages_text.append({
            "page_number": i + 1,
            "text": text,
            "word_count": words
        })
        
    doc.close()
    return {
        "pages": pages_text,
        "total_pages": len(pages_text),
        "total_words": total_words
    }
