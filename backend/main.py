import os
import uuid
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import storage
import pdf_engine

app = FastAPI(
    title="ILovePDF Aymen API",
    description="Professional PDF processing and Admin Management Suite",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to get client IP
def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ILovePDF Aymen API"}

# ----------------- FILE UPLOADS -----------------

@app.post("/api/upload")
async def upload_files(request: Request, files: List[UploadFile] = File(...)):
    client_ip = get_client_ip(request)
    results = []
    
    for file in files:
        file_ext = os.path.splitext(file.filename)[1].lower()
        unique_name = f"{uuid.uuid4().hex}_{file.filename}"
        dest_path = os.path.join(storage.UPLOADS_DIR, unique_name)
        
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(dest_path)
        is_pdf = file_ext == ".pdf"
        file_type = "pdf" if is_pdf else "image"
        
        extra_meta = {}
        if is_pdf:
            try:
                info = pdf_engine.get_pdf_info_and_preview(dest_path, max_preview=6)
                extra_meta = info
            except Exception as e:
                extra_meta = {"error": f"Preview failed: {str(e)}"}
                
        file_id = storage.add_file_record(
            filename=unique_name,
            original_name=file.filename,
            file_path=dest_path,
            size_bytes=file_size,
            file_type=file_type,
            is_processed=False,
            client_ip=client_ip,
            extra_metadata=extra_meta
        )
        
        results.append({
            "id": file_id,
            "filename": file.filename,
            "size": file_size,
            "file_type": file_type,
            "preview": extra_meta.get("previews", []),
            "page_count": extra_meta.get("page_count", 0)
        })
        
    return {"success": True, "files": results}

# ----------------- PDF TOOLS -----------------

class MergeRequest(BaseModel):
    file_ids: List[str]
    output_filename: Optional[str] = "fusionne.pdf"

@app.post("/api/tools/merge")
async def handle_merge(request: Request, body: MergeRequest):
    client_ip = get_client_ip(request)
    file_paths = []
    for fid in body.file_ids:
        rec = storage.get_file_record(fid)
        if rec and os.path.exists(rec["file_path"]):
            file_paths.append(rec["file_path"])
            
    if len(file_paths) < 2:
        raise HTTPException(status_code=400, detail="Au moins deux fichiers sont requis pour la fusion.")
        
    out_filename = f"merged_{uuid.uuid4().hex[:8]}.pdf"
    out_path = os.path.join(storage.PROCESSED_DIR, out_filename)
    
    result = pdf_engine.merge_pdfs(file_paths, out_path)
    
    proc_id = storage.add_file_record(
        filename=out_filename,
        original_name=body.output_filename or "document_fusionne.pdf",
        file_path=out_path,
        size_bytes=result["output_size"],
        file_type="pdf",
        is_processed=True,
        tool_used="merge",
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": body.output_filename or "document_fusionne.pdf",
        "size": result["output_size"],
        "pages": result["total_pages"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class SplitRequest(BaseModel):
    file_id: str
    mode: str = "all"  # "all" or "ranges"
    ranges: Optional[str] = ""
    output_filename: Optional[str] = None

@app.post("/api/tools/split")
async def handle_split(request: Request, body: SplitRequest):
    client_ip = get_client_ip(request)
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier source introuvable.")
        
    out_dir = os.path.join(storage.PROCESSED_DIR, f"split_{uuid.uuid4().hex[:8]}")
    result = pdf_engine.split_pdf(rec["file_path"], out_dir, split_mode=body.mode, ranges_str=body.ranges or "")
    
    proc_id = storage.add_file_record(
        filename=os.path.basename(result["result_file"]),
        original_name=result["filename"],
        file_path=result["result_file"],
        size_bytes=result["size_bytes"],
        file_type=result["file_type"],
        is_processed=True,
        tool_used="split",
        parent_id=body.file_id,
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": result["filename"],
        "file_type": result["file_type"],
        "size": result["size_bytes"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class CompressRequest(BaseModel):
    file_id: str
    level: str = "medium"  # "low", "medium", "high"

@app.post("/api/tools/compress")
async def handle_compress(request: Request, body: CompressRequest):
    client_ip = get_client_ip(request)
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier source introuvable.")
        
    out_filename = f"compressed_{uuid.uuid4().hex[:8]}.pdf"
    out_path = os.path.join(storage.PROCESSED_DIR, out_filename)
    
    result = pdf_engine.compress_pdf(rec["file_path"], out_path, level=body.level)
    
    orig_base = os.path.splitext(rec["original_name"])[0]
    out_orig_name = f"{orig_base}_compresse.pdf"
    
    proc_id = storage.add_file_record(
        filename=out_filename,
        original_name=out_orig_name,
        file_path=out_path,
        size_bytes=result["final_size"],
        file_type="pdf",
        is_processed=True,
        tool_used="compress",
        parent_id=body.file_id,
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": out_orig_name,
        "initial_size": result["initial_size"],
        "final_size": result["final_size"],
        "saved_bytes": result["saved_bytes"],
        "saved_percent": result["saved_percent"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class PdfToImagesRequest(BaseModel):
    file_id: str
    format: str = "png"
    dpi: int = 150

@app.post("/api/tools/pdf-to-images")
async def handle_pdf_to_images(request: Request, body: PdfToImagesRequest):
    client_ip = get_client_ip(request)
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier introuvable.")
        
    out_dir = os.path.join(storage.PROCESSED_DIR, f"images_{uuid.uuid4().hex[:8]}")
    result = pdf_engine.pdf_to_images(rec["file_path"], out_dir, img_format=body.format, dpi=body.dpi)
    
    orig_base = os.path.splitext(rec["original_name"])[0]
    zip_name = f"{orig_base}_images.zip"
    
    proc_id = storage.add_file_record(
        filename=os.path.basename(result["zip_path"]),
        original_name=zip_name,
        file_path=result["zip_path"],
        size_bytes=result["size_bytes"],
        file_type="zip",
        is_processed=True,
        tool_used="pdf_to_images",
        parent_id=body.file_id,
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": zip_name,
        "images_count": result["images_count"],
        "size": result["size_bytes"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class ImagesToPdfRequest(BaseModel):
    file_ids: List[str]
    orientation: str = "portrait"
    margin: int = 10
    output_filename: Optional[str] = "images_combine.pdf"

@app.post("/api/tools/images-to-pdf")
async def handle_images_to_pdf(request: Request, body: ImagesToPdfRequest):
    client_ip = get_client_ip(request)
    image_paths = []
    for fid in body.file_ids:
        rec = storage.get_file_record(fid)
        if rec and os.path.exists(rec["file_path"]):
            image_paths.append(rec["file_path"])
            
    if not image_paths:
        raise HTTPException(status_code=400, detail="Aucune image trouvée.")
        
    out_filename = f"images_doc_{uuid.uuid4().hex[:8]}.pdf"
    out_path = os.path.join(storage.PROCESSED_DIR, out_filename)
    
    result = pdf_engine.images_to_pdf(image_paths, out_path, orientation=body.orientation, margin=body.margin)
    
    proc_id = storage.add_file_record(
        filename=out_filename,
        original_name=body.output_filename or "images_converties.pdf",
        file_path=out_path,
        size_bytes=result["output_size"],
        file_type="pdf",
        is_processed=True,
        tool_used="images_to_pdf",
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": body.output_filename or "images_converties.pdf",
        "size": result["output_size"],
        "pages": result["pages_count"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class OrganizeRequest(BaseModel):
    file_id: str
    page_actions: List[dict]  # [{"page_index": 0, "rotation": 90, "keep": True}]

@app.post("/api/tools/organize")
async def handle_organize(request: Request, body: OrganizeRequest):
    client_ip = get_client_ip(request)
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier source introuvable.")
        
    out_filename = f"organized_{uuid.uuid4().hex[:8]}.pdf"
    out_path = os.path.join(storage.PROCESSED_DIR, out_filename)
    
    result = pdf_engine.organize_pdf(rec["file_path"], out_path, body.page_actions)
    
    orig_base = os.path.splitext(rec["original_name"])[0]
    out_name = f"{orig_base}_reorganise.pdf"
    
    proc_id = storage.add_file_record(
        filename=out_filename,
        original_name=out_name,
        file_path=out_path,
        size_bytes=result["output_size"],
        file_type="pdf",
        is_processed=True,
        tool_used="organize",
        parent_id=body.file_id,
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": out_name,
        "size": result["output_size"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class ProtectRequest(BaseModel):
    file_id: str
    password: str

@app.post("/api/tools/protect")
async def handle_protect(request: Request, body: ProtectRequest):
    client_ip = get_client_ip(request)
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier source introuvable.")
        
    out_filename = f"protected_{uuid.uuid4().hex[:8]}.pdf"
    out_path = os.path.join(storage.PROCESSED_DIR, out_filename)
    
    result = pdf_engine.protect_pdf(rec["file_path"], out_path, body.password)
    
    orig_base = os.path.splitext(rec["original_name"])[0]
    out_name = f"{orig_base}_protege.pdf"
    
    proc_id = storage.add_file_record(
        filename=out_filename,
        original_name=out_name,
        file_path=out_path,
        size_bytes=result["output_size"],
        file_type="pdf",
        is_processed=True,
        tool_used="protect",
        parent_id=body.file_id,
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": out_name,
        "size": result["output_size"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class WatermarkRequest(BaseModel):
    file_id: str
    watermark_text: Optional[str] = ""
    add_page_numbers: bool = True
    opacity: float = 0.25
    font_size: int = 36

@app.post("/api/tools/watermark")
async def handle_watermark(request: Request, body: WatermarkRequest):
    client_ip = get_client_ip(request)
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier source introuvable.")
        
    out_filename = f"watermarked_{uuid.uuid4().hex[:8]}.pdf"
    out_path = os.path.join(storage.PROCESSED_DIR, out_filename)
    
    result = pdf_engine.watermark_and_number_pdf(
        rec["file_path"],
        out_path,
        watermark_text=body.watermark_text or "",
        add_page_numbers=body.add_page_numbers,
        opacity=body.opacity,
        font_size=body.font_size
    )
    
    orig_base = os.path.splitext(rec["original_name"])[0]
    out_name = f"{orig_base}_filigrane.pdf"
    
    proc_id = storage.add_file_record(
        filename=out_filename,
        original_name=out_name,
        file_path=out_path,
        size_bytes=result["output_size"],
        file_type="pdf",
        is_processed=True,
        tool_used="watermark",
        parent_id=body.file_id,
        client_ip=client_ip,
        extra_metadata=result
    )
    
    return {
        "success": True,
        "processed_id": proc_id,
        "filename": out_name,
        "size": result["output_size"],
        "download_url": f"/api/files/download/{proc_id}"
    }

class ExtractTextRequest(BaseModel):
    file_id: str

@app.post("/api/tools/extract-text")
async def handle_extract_text(request: Request, body: ExtractTextRequest):
    rec = storage.get_file_record(body.file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier source introuvable.")
        
    result = pdf_engine.extract_text_pdf(rec["file_path"])
    return {"success": True, **result}

# ----------------- FILE DOWNLOAD & PREVIEW -----------------

@app.get("/api/files/download/{file_id}")
async def download_file(file_id: str):
    rec = storage.get_file_record(file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier introuvable sur le serveur.")
        
    return FileResponse(
        path=rec["file_path"],
        filename=rec["original_name"],
        media_type="application/octet-stream"
    )

@app.get("/api/files/preview/{file_id}")
async def preview_file(file_id: str):
    rec = storage.get_file_record(file_id)
    if not rec or not os.path.exists(rec["file_path"]):
        raise HTTPException(status_code=404, detail="Fichier introuvable.")
        
    media = "application/pdf" if rec.get("file_type") == "pdf" else "image/png"
    return FileResponse(path=rec["file_path"], media_type=media)

# ----------------- ADMIN DASHBOARD & STORAGE -----------------

@app.get("/api/admin/stats")
async def get_admin_stats():
    stats = storage.get_admin_dashboard_stats()
    return {"success": True, "data": stats}

@app.get("/api/admin/files")
async def get_admin_files(
    search: Optional[str] = None,
    filter_type: Optional[str] = None, # 'all', 'uploads', 'processed'
    limit: int = 100
):
    records = storage.get_all_records()
    
    if search:
        s = search.lower()
        records = [r for r in records if s in r.get("original_name", "").lower() or s in r.get("client_ip", "")]
        
    if filter_type == "uploads":
        records = [r for r in records if not r.get("is_processed")]
    elif filter_type == "processed":
        records = [r for r in records if r.get("is_processed")]
        
    return {"success": True, "files": records[:limit], "total_count": len(records)}

@app.delete("/api/admin/files/{file_id}")
async def delete_file_admin(file_id: str):
    deleted = storage.delete_file_record(file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Fichier non trouvé.")
    return {"success": True, "message": "Fichier supprimé avec succès."}

class CleanupRequest(BaseModel):
    max_age_hours: Optional[int] = 24

@app.post("/api/admin/cleanup")
async def cleanup_storage_admin(body: CleanupRequest):
    count = storage.cleanup_files(max_age_hours=body.max_age_hours)
    return {"success": True, "deleted_count": count, "message": f"{count} fichiers nettoyés avec succès."}

# ----------------- STATIC FRONTEND MOUNT -----------------

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

