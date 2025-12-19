#!/usr/bin/env python3
import os
import sys
import zipfile
from pathlib import Path

def outputs_nonempty(dest):
    p = Path(dest)
    return p.exists() and any(p.iterdir())

def download_and_extract(file_id, dest_dir):
    try:
        import gdown
    except Exception as e:
        print("gdown is not available:", e, file=sys.stderr)
        return False
    tmp = "/tmp/outputs.zip"
    url = f"https://drive.google.com/uc?id={file_id}"
    print("Downloading model from Google Drive...")
    try:
        gdown.download(url, tmp, quiet=False)
    except Exception as e:
        print("Download failed:", e, file=sys.stderr)
        return False
    if not os.path.exists(tmp):
        print("Download did not produce file", file=sys.stderr)
        return False
    Path(dest_dir).mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(tmp, 'r') as zf:
            zf.extractall(dest_dir)
    except zipfile.BadZipFile:
        print("Downloaded file is not a valid zip archive", file=sys.stderr)
        return False
    try:
        os.remove(tmp)
    except Exception:
        pass
    return True

def main():
    dest = "/app/outputs"
    file_id = os.environ.get("MODEL_DRIVE_FILE_ID")
    if outputs_nonempty(dest):
        print("Outputs directory already present and non-empty, skipping download.")
    elif file_id:
        ok = download_and_extract(file_id, dest)
        if not ok:
            print("Failed to download/extract model artifacts", file=sys.stderr)
            sys.exit(1)
    else:
        print("No MODEL_DRIVE_FILE_ID provided and outputs/ missing; continuing without models.")
    port = os.environ.get("PORT", "8000")
    os.execvp("uvicorn", ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port])

if __name__ == '__main__':
    main()
