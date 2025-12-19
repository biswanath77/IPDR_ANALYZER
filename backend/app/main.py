from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import os
import io
import time
import json
from typing import List, Optional
from .model import ModelWrapper
from pydantic import BaseModel
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "backend_users.json")


def _load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_users(users):
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f)
    except Exception:
        pass


app = FastAPI(title="ML Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post('/auth/register')
def register(req: RegisterRequest):
    users = _load_users()
    if req.email in users:
        raise HTTPException(status_code=400, detail='User already exists')
    users[req.email] = {"name": req.name, "password": req.password}
    _save_users(users)
    return {"status": "ok", "email": req.email}


@app.post('/auth/login')
def login(req: LoginRequest):
    users = _load_users()
    user = users.get(req.email)
    if not user or user.get('password') != req.password:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    # Return a dummy token for frontend usage
    return {"token": f"token-{req.email}", "name": user.get('name', req.email)}

# Detect if running in Docker or locally
# In Docker, files are at /app/outputs/
# Locally, they're at ../outputs/ relative to backend dir
output_base = os.getenv("OUTPUT_PATH")
if not output_base:
    # Try local path first
    local_path = os.path.join(os.path.dirname(__file__), "..", "..", "outputs")
    if os.path.exists(local_path):
        output_base = local_path
    else:
        # Fallback to Docker path
        output_base = "/app/outputs"

# Initialize model wrapper. It expects the model artifacts to be available in the `outputs/` folder.
wrapper = ModelWrapper(
    model_path=os.path.join(output_base, "ipdr_model.pkl"),
    scaler_path=os.path.join(output_base, "ipdr_scaler.pkl"),
    numeric_cols_path=os.path.join(output_base, "ipdr_features.pkl"),
    le_path=os.path.join(output_base, "ipdr_label_encoder.pkl"),
)


@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    """Accept a CSV file, run the ML model, and return predictions."""
    try:
        # Pandas can read from the uploaded file-like object
        df = pd.read_csv(file.file)
    except Exception as exc:
        return {"error": f"Failed to read CSV: {exc}"}

    try:
        preds = wrapper.predict(df)

        # Save uploaded file and predictions for later viewing
        uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        ts = int(time.time())
        filename = f"upload_{ts}.csv"
        filepath = os.path.join(uploads_dir, filename)

        # Save raw uploaded bytes to file
        file.file.seek(0)
        with open(filepath, "wb") as f:
            f.write(file.file.read())

        # Create detailed predictions by connecting predictions to CSV key fields
        detailed = []
        # Attempt to compute confidence if model supports predict_proba
        confidences = None
        try:
            if hasattr(wrapper.model, 'predict_proba'):
                # Try to compute probabilities on numeric input; be tolerant of errors
                try:
                    # reuse wrapper preprocessing path by providing full df
                    probs = None
                    try:
                        probs = wrapper.model.predict_proba(wrapper.scaler.transform(df[wrapper.numeric_cols]) if wrapper.scaler is not None and wrapper.numeric_cols is not None else df[wrapper.numeric_cols] if wrapper.numeric_cols is not None else df.select_dtypes(include=[float, int]))
                    except Exception:
                        try:
                            probs = wrapper.model.predict_proba(df.select_dtypes(include=[float, int]))
                        except Exception:
                            probs = None
                    if probs is not None:
                        # take max probability per row
                        confidences = [float(p.max()) for p in probs]
                except Exception:
                    confidences = None
        except Exception:
            confidences = None

        # heuristics to pick key columns from uploaded dataframe
        def pick_column(dfcols, candidates):
            lower = {c.lower(): c for c in dfcols}
            for cand in candidates:
                if cand.lower() in lower:
                    return lower[cand.lower()]
            # try partial matching
            for k, v in lower.items():
                for cand in candidates:
                    if cand.lower() in k:
                        return v
            return None

        ip_col = pick_column(df.columns.tolist(), ["ip", "ip_address", "source_ip", "destination_ip", "src_ip", "dst_ip", "ipaddress", "ip address"])
        msisdn_col = pick_column(df.columns.tolist(), ["msisdn", "msisdn_number", "msisdn_no", "msisdnid"])
        ts_col = pick_column(df.columns.tolist(), ["timestamp", "time", "date", "ts", "datetime"]) 
        volume_col = pick_column(df.columns.tolist(), ["data_volume", "volume", "bytes", "data_bytes", "data_volume_bytes"])

        # build detailed entries
        for i, row in df.reset_index(drop=True).iterrows():
            entry = {
                "row": int(i),
                "prediction": preds[i] if i < len(preds) else None,
                "ip": row.get(ip_col) if ip_col else None,
                "msisdn": row.get(msisdn_col) if msisdn_col else None,
                "timestamp": str(row.get(ts_col)) if ts_col and not pd.isna(row.get(ts_col)) else None,
                "volume": row.get(volume_col) if volume_col else None,
                "confidence": confidences[i] if confidences is not None and i < len(confidences) else None,
            }
            detailed.append(entry)

        # Save predictions (both simple list and detailed)
        preds_path = os.path.join(uploads_dir, f"predictions_{ts}.json")
        with open(preds_path, "w", encoding="utf-8") as pf:
            json.dump({"file": filename, "predictions": preds, "n": len(preds), "detailed": detailed}, pf)

        return JSONResponse({"predictions": preds, "n": len(preds), "file": filename, "detailed": detailed})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")



@app.get("/data/list")
def list_uploads() -> List[str]:
    """List uploaded CSVs saved by the backend."""
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    if not os.path.exists(uploads_dir):
        return []
    files = [f for f in os.listdir(uploads_dir) if f.endswith('.csv')]
    return files


@app.get("/data/view")
def view_file(file: str, page: int = 0, page_size: int = 20):
    """Return a page of rows from an uploaded CSV as JSON.
    Supports pagination via `page` (0-indexed) and `page_size`.
    """
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    filepath = os.path.join(uploads_dir, file)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        # Use chunked reading so large files don't get fully loaded
        it = pd.read_csv(filepath, chunksize=page_size)
        df_page = None
        for i, chunk in enumerate(it):
            if i == page:
                df_page = chunk
                break
        if df_page is None:
            return {"columns": [], "rows": [], "page": page, "page_size": page_size}

        # Compute total rows (fast-ish)
        total = 0
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                total = sum(1 for _ in f) - 1
        except Exception:
            total = None

        return {"columns": df_page.columns.tolist(), "rows": df_page.to_dict(orient='records'), "page": page, "page_size": page_size, "total_rows": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/data/delete")
def delete_file(file: str):
    """Delete an uploaded CSV file and its associated predictions."""
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    filepath = os.path.join(uploads_dir, file)
    
    # Security check: ensure file is in uploads directory
    if not os.path.abspath(filepath).startswith(os.path.abspath(uploads_dir)):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Delete the CSV file
        os.remove(filepath)
        
        # Delete associated predictions
        preds_files = [p for p in os.listdir(uploads_dir) if p.startswith('predictions_') and p.endswith('.json')]
        for pf in preds_files:
            ppath = os.path.join(uploads_dir, pf)
            try:
                with open(ppath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('file') == file:
                        os.remove(ppath)
            except Exception:
                continue
        
        return {"status": "ok", "message": f"File {file} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@app.get("/ml/results")
def results_for_file(file: str, page: int = 0, page_size: int = 50):
    """Return stored predictions for a given uploaded file, with pagination over detailed predictions."""
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    preds_files = [p for p in os.listdir(uploads_dir) if p.startswith('predictions_') and p.endswith('.json')]
    for pf in preds_files:
        ppath = os.path.join(uploads_dir, pf)
        try:
            with open(ppath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('file') == file:
                    detailed = data.get('detailed', [])
                    start = page * page_size
                    end = start + page_size
                    page_items = detailed[start:end]
                    return {"file": file, "predictions": data.get('predictions', []), "n": data.get('n', len(data.get('predictions', []))), "detailed": page_items, "page": page, "page_size": page_size, "total": len(detailed)}
        except Exception:
            continue
    raise HTTPException(status_code=404, detail='Predictions not found for file')


@app.get('/search')
def search(file: Optional[str] = None, ip: Optional[str] = None, msisdn: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None, min_volume: Optional[float] = None, page: int = 0, page_size: int = 50):
    """Simple search API across an uploaded file (or across all uploads if file omitted).
    Supports basic filters and pagination.
    """
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    files_to_search = []
    if file:
        files_to_search = [os.path.join(uploads_dir, file)] if os.path.exists(os.path.join(uploads_dir, file)) else []
    else:
        files_to_search = [os.path.join(uploads_dir, f) for f in os.listdir(uploads_dir) if f.endswith('.csv')]

    results = []
    for fp in files_to_search:
        try:
            for chunk in pd.read_csv(fp, chunksize=10000):
                # apply filters conservatively
                df = chunk
                if ip:
                    cols = [c for c in df.columns if 'ip' in c.lower()]
                    if cols:
                        df = df[df[cols[0]].astype(str).str.contains(ip, na=False)]
                if msisdn:
                    cols = [c for c in df.columns if 'msisdn' in c.lower() or 'msisdn' in c.lower()]
                    if cols:
                        df = df[df[cols[0]].astype(str).str.contains(msisdn, na=False)]
                if min_volume is not None:
                    vol_cols = [c for c in df.columns if 'volume' in c.lower() or 'bytes' in c.lower()]
                    if vol_cols:
                        try:
                            df = df[pd.to_numeric(df[vol_cols[0]], errors='coerce') >= float(min_volume)]
                        except Exception:
                            pass

                # push rows into results until page_size * (page+1) to avoid unbounded memory
                for _, r in df.iterrows():
                    results.append(r.to_dict())
                    if len(results) >= (page + 1) * page_size:
                        break
                if len(results) >= (page + 1) * page_size:
                    break
        except Exception:
            continue

    start = page * page_size
    end = start + page_size
    page_rows = results[start:end]
    return {"rows": page_rows, "page": page, "page_size": page_size, "total_found": len(results)}


@app.get('/reports/export')
def export_predictions(format: str = 'csv'):
    """Export aggregated predictions across uploads. Currently supports CSV.
    Returns a streaming CSV response.
    """
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    preds_files = [p for p in os.listdir(uploads_dir) if p.startswith('predictions_') and p.endswith('.json')]
    rows = []
    for pf in preds_files:
        try:
            with open(os.path.join(uploads_dir, pf), 'r', encoding='utf-8') as f:
                data = json.load(f)
                for d in data.get('detailed', []):
                    rows.append(d)
        except Exception:
            continue

    if format.lower() != 'csv':
        raise HTTPException(status_code=400, detail='Only csv format supported')

    # stream CSV
    import csv
    def iter_csv():
        fieldnames = ['row','prediction','ip','msisdn','timestamp','volume','confidence']
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        for r in rows:
            writer.writerow({k: r.get(k, '') for k in fieldnames})
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(iter_csv(), media_type='text/csv', headers={"Content-Disposition": "attachment; filename=predictions_export.csv"})


@app.get('/reports/export_pdf')
def export_pdf():
    """Generate a PDF report aggregating predictions and simple analysis (charts + summary).
    Streams back a generated PDF file.
    """
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    preds_files = [p for p in os.listdir(uploads_dir) if p.startswith('predictions_') and p.endswith('.json')]
    rows = []
    for pf in preds_files:
        try:
            with open(os.path.join(uploads_dir, pf), 'r', encoding='utf-8') as f:
                data = json.load(f)
                for d in data.get('detailed', []):
                    rows.append(d)
        except Exception:
            continue

    # Build DataFrame
    if len(rows) == 0:
        # return a simple PDF stating no data
        bio = io.BytesIO()
        c = canvas.Canvas(bio, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(72, 720, "IPDR Analysis Report")
        c.setFont("Helvetica", 12)
        c.drawString(72, 690, "No prediction data available to generate a report.")
        c.showPage()
        c.save()
        bio.seek(0)
        return StreamingResponse(io.BytesIO(bio.read()), media_type='application/pdf', headers={"Content-Disposition": "attachment; filename=ipdr_report.pdf"})

    df = pd.DataFrame(rows)

    # Basic summaries
    total = len(df)
    by_label = df['prediction'].value_counts().to_dict() if 'prediction' in df.columns else {}
    by_ip = df['ip'].value_counts().head(10).to_dict() if 'ip' in df.columns else {}

    # Create charts as PNGs in memory
    images = []
    try:
        # Label distribution pie
        plt.figure(figsize=(6, 4))
        if len(by_label) == 0:
            plt.text(0.5, 0.5, 'No labels', ha='center')
        else:
            labels = list(by_label.keys())
            sizes = list(by_label.values())
            plt.pie(sizes, labels=labels, autopct='%1.1f%%')
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png')
        plt.close()
        buf.seek(0)
        images.append(buf)

        # Top IPs bar
        if len(by_ip) > 0:
            plt.figure(figsize=(8, 4))
            sns.barplot(x=list(by_ip.values()), y=list(by_ip.keys()), palette='viridis')
            plt.title('Top IPs by prediction count')
            plt.xlabel('Count')
            plt.ylabel('IP')
            buf2 = io.BytesIO()
            plt.tight_layout()
            plt.savefig(buf2, format='png')
            plt.close()
            buf2.seek(0)
            images.append(buf2)

        # Confidence histogram if present
        if 'confidence' in df.columns:
            try:
                plt.figure(figsize=(6, 4))
                df['confidence'] = pd.to_numeric(df['confidence'], errors='coerce')
                df['confidence'].dropna().plot(kind='hist', bins=20)
                plt.title('Prediction Confidence Distribution')
                plt.xlabel('Confidence')
                buf3 = io.BytesIO()
                plt.tight_layout()
                plt.savefig(buf3, format='png')
                plt.close()
                buf3.seek(0)
                images.append(buf3)
            except Exception:
                pass
    except Exception:
        images = []

    # Compose PDF
    pdf_buf = io.BytesIO()
    c = canvas.Canvas(pdf_buf, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 20)
    c.drawString(72, height - 72, "IPDR Analysis Report")
    c.setFont("Helvetica", 10)
    c.drawString(72, height - 96, f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Summary box
    c.setFont("Helvetica-Bold", 12)
    c.drawString(72, height - 128, "Summary")
    c.setFont("Helvetica", 10)
    c.drawString(72, height - 144, f"Total records analyzed: {total}")
    y = height - 162
    for k, v in by_label.items():
        c.drawString(88, y, f"{k}: {v}")
        y -= 14

    # Insert charts
    y_image = y - 12
    for img_buf in images:
        try:
            img = ImageReader(img_buf)
            # Draw image with max width 460, height scaled
            iw, ih = img.getSize()
            max_w = 460
            scale = min(max_w / iw, 300 / ih, 1)
            draw_w = iw * scale
            draw_h = ih * scale
            if y_image - draw_h < 72:
                c.showPage()
                y_image = height - 72
            c.drawImage(img, 72, y_image - draw_h, width=draw_w, height=draw_h)
            y_image = y_image - draw_h - 18
        except Exception:
            continue

    # Add a sample table of top 5 rows
    try:
        c.showPage()
        c.setFont("Helvetica-Bold", 12)
        c.drawString(72, height - 72, "Sample Predictions (first 10)")
        c.setFont("Helvetica", 9)
        sample = df.head(10)
        cols = [c for c in ['row', 'ip', 'timestamp', 'prediction', 'confidence'] if c in sample.columns]
        x = 72
        y = height - 96
        # header
        for col in cols:
            c.drawString(x, y, col.upper())
            x += 120
        y -= 14
        for _, r in sample.iterrows():
            x = 72
            for col in cols:
                txt = str(r.get(col, ''))[:30]
                c.drawString(x, y, txt)
                x += 120
            y -= 12
            if y < 72:
                c.showPage()
                y = height - 72
    except Exception:
        pass

    c.save()
    pdf_buf.seek(0)

    return StreamingResponse(io.BytesIO(pdf_buf.read()), media_type='application/pdf', headers={"Content-Disposition": "attachment; filename=ipdr_report.pdf"})


@app.get("/reports/summary")
def reports_summary():
    """Return a simple summary of predictions across all uploads."""
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    if not os.path.exists(uploads_dir):
        return {"total_uploads": 0, "by_label": {}}
    
    # Get list of existing CSV files
    csv_files = set([f for f in os.listdir(uploads_dir) if f.endswith('.csv')])
    
    # Only count predictions for files that still exist
    preds_files = [p for p in os.listdir(uploads_dir) if p.startswith('predictions_') and p.endswith('.json')]
    counts = {}
    total = 0
    for pf in preds_files:
        try:
            with open(os.path.join(uploads_dir, pf), 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Only count if the original CSV file still exists
                if data.get('file') in csv_files:
                    preds = data.get('predictions', [])
                    total += len(preds)
                    for p in preds:
                        counts[p] = counts.get(p, 0) + 1
        except Exception:
            continue
    return {"total_predictions": total, "by_label": counts}


@app.get('/auth/users')
def list_users_api():
    users = _load_users()
    out = []
    for email, info in users.items():
        out.append({"email": email, "name": info.get('name'), "status": info.get('status', 'active')})
    return out


@app.get('/system/status')
def system_status():
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    total_uploads = 0
    total_predictions = 0
    if os.path.exists(uploads_dir):
        total_uploads = len([f for f in os.listdir(uploads_dir) if f.endswith('.csv')])
        preds_files = [p for p in os.listdir(uploads_dir) if p.startswith('predictions_') and p.endswith('.json')]
        for pf in preds_files:
            try:
                with open(os.path.join(uploads_dir, pf), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    total_predictions += data.get('n', 0)
            except Exception:
                continue

    users = _load_users()
    return {"total_uploads": total_uploads, "total_predictions": total_predictions, "user_count": len(users)}
