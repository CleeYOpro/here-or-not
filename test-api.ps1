# Test API Script
Write-Host "Testing API endpoints..." -ForegroundColor Cyan

# Test 1: Check if server is running
Write-Host "`n1. Testing if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "✓ Server is running!" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is NOT running. Start it with: npm run dev" -ForegroundColor Red
    exit
}

# Test 2: Get all teachers
Write-Host "`n2. Testing GET /api/teachers..." -ForegroundColor Yellow
try {
    $teachers = Invoke-RestMethod -Uri "http://localhost:3000/api/teachers" -Method GET
    Write-Host "✓ GET /api/teachers works!" -ForegroundColor Green
    Write-Host "Found $($teachers.Count) teachers" -ForegroundColor Cyan
    $teachers | ForEach-Object { Write-Host "  - $($_.name) ($($_.username))" }
} catch {
    Write-Host "✗ GET /api/teachers failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 3: Add a teacher
Write-Host "`n3. Testing POST /api/teachers..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Test Teacher $(Get-Random -Maximum 1000)"
        username = "testteacher$(Get-Random -Maximum 1000)"
        password = "1234567890"
    } | ConvertTo-Json

    $newTeacher = Invoke-RestMethod -Uri "http://localhost:3000/api/teachers" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ POST /api/teachers works!" -ForegroundColor Green
    Write-Host "Created teacher: $($newTeacher.name) (ID: $($newTeacher.id))" -ForegroundColor Cyan
} catch {
    Write-Host "✗ POST /api/teachers failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Try to get more details
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

# Test 4: Get all students
Write-Host "`n4. Testing GET /api/students..." -ForegroundColor Yellow
try {
    $students = Invoke-RestMethod -Uri "http://localhost:3000/api/students" -Method GET
    Write-Host "✓ GET /api/students works!" -ForegroundColor Green
    Write-Host "Found $($students.Count) students" -ForegroundColor Cyan
} catch {
    Write-Host "✗ GET /api/students failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
