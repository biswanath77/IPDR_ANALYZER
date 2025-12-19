# 🚀 Frontend + Backend ML Integration - SETUP COMPLETE

Your frontend and backend are now linked and ready to use! Here's everything you need to know.

## Current Status ✅

Both servers are running:
- **Frontend**: http://localhost:8080 (Vite React app)
- **Backend**: http://localhost:8000 (FastAPI with your ML model)
- **Model**: Loaded from `outputs/model.pkl` + supporting files

## How to Use

### 1. Upload CSV and Get Predictions

1. Open http://localhost:8080 in your browser
2. Navigate to the **Upload** page
3. Upload a CSV file with network traffic data
4. Click **"Upload & Analyze"**
5. Your predictions will appear as a toast notification showing:
   - Number of rows processed
   - Sample prediction result (e.g., "Benign" or "Malicious")

### 2. CSV Format Requirements

Your CSV must include numeric columns. The model expects 53 network traffic features:
- Examples: `Destination_Port`, `Flow Duration`, `Total Length of Fwd Packets`, etc.

**Note**: If your CSV doesn't have all 53 columns, missing ones are automatically filled with 0.0.

### 3. Viewing Predictions in Browser Console

When you upload a file, the browser console (F12 → Console tab) will show:
```
🚀 Uploading to: http://localhost:8000/predict-file
📡 Response status: 200 OK
📦 Response data: { predictions: ["Benign", "Benign", ...], n: 3 }
```

## How to Keep Servers Running

### Option A: Use Command Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```powershell
cd "c:\Users\Hopna Tudu\Desktop\Biswa\cursor_lovable"
python start_backend.py
```

**Terminal 2 - Frontend:**
```powershell
cd "c:\Users\Hopna Tudu\Desktop\Biswa\cursor_lovable"
npm run dev
```

### Option B: Batch Script (Windows)

Create a file `start_all.bat`:
```batch
@echo off
cd /d "c:\Users\Hopna Tudu\Desktop\Biswa\cursor_lovable"
start "Backend" python start_backend.py
start "Frontend" npm run dev
echo Both servers started! Access the app at http://localhost:8080
pause
```

Then double-click `start_all.bat` to run both servers.

## Backend API Reference

### POST /predict-file

Upload a CSV file and get ML predictions.

**Request:**
```
POST http://localhost:8000/predict-file
Content-Type: multipart/form-data

file: <CSV file>
```

**Response (Success - 200):**
```json
{
  "predictions": ["Benign", "Benign", "Malicious"],
  "n": 3
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Description of what went wrong"
}
```

**Example with curl:**
```bash
curl -X POST -F "file=@your_file.csv" http://localhost:8000/predict-file
```

### GET /docs

Interactive Swagger UI documentation:
```
http://localhost:8000/docs
```

## File Structure Added

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app & /predict-file endpoint
│   └── model.py         # ModelWrapper class for predictions
├── requirements.txt      # Python dependencies
└── Dockerfile          # For Docker deployment

.env.local              # Environment variables (VITE_API_URL=http://localhost:8000)
start_backend.py        # Helper script to run backend
test_backend.py         # Test script for the API
test_model_direct.py    # Direct model test without server
docker-compose.yml      # Docker Compose for full-stack deployment
Dockerfile.frontend     # Frontend container definition
```

## How the Integration Works

1. **Frontend (React/Vite)**:
   - User uploads CSV in `src/pages/Upload.tsx`
   - JavaScript sends POST request to `http://localhost:8000/predict-file`
   - Backend processes and returns predictions
   - Toast notification shows results

2. **Backend (FastAPI)**:
   - Accepts CSV file upload
   - Loads model + scaler + numeric columns list
   - Pads missing columns with zeros
   - Runs sklearn RandomForest model
   - Returns JSON with predictions + row count

3. **Model**:
   - Expects 53 network traffic features
   - Trained on IPDR (IP Detailed Record) data
   - Outputs classifications (e.g., "Benign", "Malicious")

## Troubleshooting

### Issue: "Network error while calling API"

**Cause**: Backend is not running

**Fix**:
```powershell
cd "c:\Users\Hopna Tudu\Desktop\Biswa\cursor_lovable"
python start_backend.py
```

### Issue: CSV Upload shows "Prediction failed"

**Cause**: CSV format doesn't match expected columns

**Fix**: Check your CSV has numeric columns. See example in `test_backend.py`

### Issue: Backend crashes immediately

**Cause**: Model files not found

**Fix**: Verify `outputs/` folder exists and contains:
- `model.pkl`
- `scaler.pkl`
- `numeric_cols.pkl`
- `le.pkl`

## Deployment for Production

### Using Docker (Recommended)

```powershell
# Build and run both services
docker compose up --build
```

Frontend will be at: http://localhost:3000
Backend will be at: http://localhost:8000

### Deploy to Cloud

I can help deploy to:
- **Render.com** (free tier available)
- **Railway.app** (fast deployment)
- **Fly.io** (global infrastructure)
- **DigitalOcean** (affordable VPS)

Just let me know which platform you prefer!

## Next Steps

1. ✅ Test uploading a CSV file from the frontend
2. ✅ Check browser console (F12) for detailed logs
3. ✅ Try the Swagger UI at http://localhost:8000/docs
4. Choose a deployment platform and let me know

## Questions or Issues?

If something doesn't work:
1. Check the browser console (F12 → Console)
2. Check the backend terminal for error messages
3. Verify both servers are running on ports 8080 and 8000
4. Let me know the error message!

---

**Summary**: Your full-stack ML application is ready to use locally. Just keep both servers running and upload CSV files to get predictions! 🎉
