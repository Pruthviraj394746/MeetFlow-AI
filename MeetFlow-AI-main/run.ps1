Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; npm run start`""

Wait-Event -Timeout 2

Write-Host "Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Both services started. Check the new windows." -ForegroundColor Yellow
