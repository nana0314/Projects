# PowerShell script to test Cloud Functions locally

Write-Host "Testing Cloud Functions locally..." -ForegroundColor Cyan

# Test 1: Send test notification to specific user
Write-Host "`n1. Testing sendTestNotification..." -ForegroundColor Yellow
$testUserId = Read-Host "Enter user ID to test (e.g., #1234)"
$body = @{
    userId = $testUserId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/attendance-37566/us-central1/sendTestNotification" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 2: Trigger inactivity check
Write-Host "`n2. Testing sendTestInactivityNotification..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/attendance-37566/us-central1/sendTestInactivityNotification" `
        -Method Post
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n✅ Testing complete!" -ForegroundColor Cyan
Write-Host "Check Emulator UI at http://localhost:4000 for logs" -ForegroundColor Yellow
