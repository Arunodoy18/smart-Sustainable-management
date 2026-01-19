# Start backend with proper environment on port 8080
Write-Host "🚀 Starting Smart Waste Management Backend on port 8080..." -ForegroundColor Green
cd C:\dev\Smart-waste-ai\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8080 --host 0.0.0.0

