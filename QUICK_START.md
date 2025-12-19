# ⚡ QUICK START - 30 Seconds Setup

## Right Now - Both Servers ARE Running ✅

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:8000

## 🎯 Test It Now

1. Open http://localhost:8080 in your browser
2. Click on **Upload** in the sidebar menu
3. Upload any CSV file (preferably with numeric columns)
4. Click **"Upload & Analyze"**
5. Wait for the result toast notification

## 📝 Example CSV (Copy & Paste)

Save this as `test.csv` and upload it:

```csv
Destination_Port,Flow Duration,Total Length of Fwd Packets,Fwd Packet Length Max,Fwd Packet Length Min
80,1000,5000,1000,100
443,2000,10000,1500,200
8080,1500,7500,1200,150
```

Expected result: Predictions like ["Benign", "Benign", "Benign"]

## 🛑 If Servers Stopped

**Backend:**
```powershell
cd "c:\Users\Hopna Tudu\Desktop\Biswa\cursor_lovable"
python start_backend.py
```

**Frontend:**
```powershell
cd "c:\Users\Hopna Tudu\Desktop\Biswa\cursor_lovable"
npm run dev
```

## 📚 Full Documentation

See `SETUP_GUIDE.md` for complete information on:
- API reference
- CSV format requirements
- Deployment options
- Troubleshooting

---

**That's it! Your ML app is ready.** 🚀

Upload a CSV → Get predictions → Done!
