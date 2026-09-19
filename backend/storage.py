import os
import json
import uuid
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "metadata.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

def _load_db() -> Dict[str, Any]:
    if not os.path.exists(DB_FILE):
        initial_data = {
            "files": {},
            "activities": [],
            "stats": {
                "total_uploads": 0,
                "total_processed": 0,
                "tool_usage": {}
            }
        }
        _save_db(initial_data)
        return initial_data
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"files": {}, "activities": [], "stats": {"total_uploads": 0, "total_processed": 0, "tool_usage": {}}}

def _save_db(data: Dict[str, Any]):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def add_file_record(
    filename: str,
    original_name: str,
    file_path: str,
    size_bytes: int,
    file_type: str = "pdf",
    is_processed: bool = False,
    tool_used: Optional[str] = None,
    parent_id: Optional[str] = None,
    client_ip: str = "127.0.0.1",
    extra_metadata: Optional[Dict] = None
) -> str:
    db = _load_db()
    file_id = str(uuid.uuid4())
    now_iso = datetime.now().isoformat()
    
    record = {
        "id": file_id,
        "filename": filename,
        "original_name": original_name,
        "file_path": file_path,
        "size_bytes": size_bytes,
        "file_type": file_type,
        "is_processed": is_processed,
        "tool_used": tool_used,
        "parent_id": parent_id,
        "created_at": now_iso,
        "client_ip": client_ip,
        "metadata": extra_metadata or {}
    }
    
    db["files"][file_id] = record
    
    if is_processed:
        db["stats"]["total_processed"] += 1
        if tool_used:
            db["stats"]["tool_usage"][tool_used] = db["stats"]["tool_usage"].get(tool_used, 0) + 1
    else:
        db["stats"]["total_uploads"] += 1
        
    db["activities"].insert(0, {
        "id": str(uuid.uuid4()),
        "timestamp": now_iso,
        "file_id": file_id,
        "filename": original_name,
        "action": f"processed_{tool_used}" if is_processed else "upload",
        "tool": tool_used,
        "size_bytes": size_bytes,
        "client_ip": client_ip
    })
    
    if len(db["activities"]) > 200:
        db["activities"] = db["activities"][:200]
        
    _save_db(db)
    return file_id

def get_file_record(file_id: str) -> Optional[Dict[str, Any]]:
    db = _load_db()
    return db["files"].get(file_id)

def get_all_records() -> List[Dict[str, Any]]:
    db = _load_db()
    records = list(db["files"].values())
    records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return records

def delete_file_record(file_id: str) -> bool:
    db = _load_db()
    if file_id in db["files"]:
        record = db["files"][file_id]
        file_path = record.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        del db["files"][file_id]
        _save_db(db)
        return True
    return False

def get_admin_dashboard_stats() -> Dict[str, Any]:
    db = _load_db()
    records = list(db["files"].values())
    
    total_upload_bytes = 0
    total_processed_bytes = 0
    uploads_count = 0
    processed_count = 0
    
    for r in records:
        size = r.get("size_bytes", 0)
        if r.get("is_processed"):
            processed_count += 1
            total_processed_bytes += size
        else:
            uploads_count += 1
            total_upload_bytes += size
            
    def get_dir_size(path):
        total = 0
        if os.path.exists(path):
            for entry in os.scandir(path):
                if entry.is_file():
                    total += entry.stat().st_size
        return total

    uploads_dir_size = get_dir_size(UPLOADS_DIR)
    processed_dir_size = get_dir_size(PROCESSED_DIR)
    total_storage_used = uploads_dir_size + processed_dir_size

    return {
        "total_files": len(records),
        "total_uploads": uploads_count,
        "total_processed": processed_count,
        "total_storage_bytes": total_storage_used,
        "uploads_storage_bytes": uploads_dir_size,
        "processed_storage_bytes": processed_dir_size,
        "tool_usage": db.get("stats", {}).get("tool_usage", {}),
        "recent_activities": db.get("activities", [])[:50]
    }

def cleanup_files(max_age_hours: Optional[int] = None) -> int:
    db = _load_db()
    deleted_count = 0
    current_time = time.time()
    
    ids_to_delete = []
    for file_id, record in db["files"].items():
        if max_age_hours is not None:
            created_at = record.get("created_at")
            if created_at:
                try:
                    dt = datetime.fromisoformat(created_at)
                    age_seconds = current_time - dt.timestamp()
                    if age_seconds > (max_age_hours * 3600):
                        ids_to_delete.append(file_id)
                except Exception:
                    pass
        else:
            ids_to_delete.append(file_id)
            
    for file_id in ids_to_delete:
        if delete_file_record(file_id):
            deleted_count += 1
            
    return deleted_count
