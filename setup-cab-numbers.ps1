# Setup Script for Cab Number Feature
# Run this from the project root directory

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Cab Number Feature Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend
Set-Location backend

Write-Host "[1/4] Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "[2/4] Installing/updating dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt

Write-Host "[3/4] Seeding database with cab data..." -ForegroundColor Yellow
python seed.py

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "[4/4] Testing cab data..." -ForegroundColor Yellow
    python test_cabs.py
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your backend server:" -ForegroundColor White
    Write-Host "   uvicorn app.main:app --reload --port 8001" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test the API:" -ForegroundColor White
    Write-Host "   curl 'http://localhost:8001/api/v1/cabs?from=Kharagpur&to=Kolkata+Airport'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Open the app and verify cab numbers are displayed" -ForegroundColor White
    Write-Host ""
    Write-Host "See CAB_NUMBER_GUIDE.md for detailed verification steps" -ForegroundColor Cyan
} else {
    Write-Host "❌ Setup failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  • Virtual environment exists (.\venv\)" -ForegroundColor White
    Write-Host "  • Database connection is configured in .env" -ForegroundColor White
    Write-Host "  • PostgreSQL is running (if using Docker: docker-compose up -d db)" -ForegroundColor White
}

Write-Host ""
