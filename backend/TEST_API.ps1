
# Script de Pruebas del Backend API
# BJFF Book Locator - Test Suite
# Ejecutar desde: bjff-book-locator/backend/

Write-Host "`n=== BJFF Book Locator - API Test Suite ===" -ForegroundColor Cyan
Write-Host "Base URL: http://localhost:3000`n" -ForegroundColor Gray

$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    if ($response.success -eq $true -and $response.status -eq "ok") {
        Write-Host "  PASSED - Server is healthy" -ForegroundColor Green
        Write-Host "     Status: $($response.status)" -ForegroundColor Gray
        Write-Host "     Timestamp: $($response.timestamp)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  FAILED - Unexpected response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAILED - Cannot connect to server" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Get Statistics
Write-Host "`nTest 2: Get Library Statistics" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/books/stats" -Method Get
    if ($response.success -eq $true) {
        Write-Host "  PASSED - Statistics retrieved" -ForegroundColor Green
        Write-Host "     Total Modules: $($response.data.total_modules)" -ForegroundColor Gray
        Write-Host "     Total Shelves: $($response.data.total_shelves)" -ForegroundColor Gray
        Write-Host "     Shelves with Images: $($response.data.shelves_with_images)" -ForegroundColor Gray

        if ($response.data.shelves_with_images -eq 160) {
            Write-Host "     All 160 shelves have images!" -ForegroundColor Green
        } else {
            Write-Host "     Warning: Not all shelves have images" -ForegroundColor Yellow
        }
        $testsPassed++
    } else {
        Write-Host "  FAILED - Unexpected response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Search Book - Dewey Decimal (Found)
Write-Host "`nTest 3: Search Book - Dewey Decimal (510.5 A500a)" -ForegroundColor Yellow
try {
    $body = @{ code = "510.5 A500a" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/books/search" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    if ($response.success -eq $true) {
        Write-Host "  PASSED - Book found!" -ForegroundColor Green
        Write-Host "     Code: $($response.code)" -ForegroundColor Gray
        Write-Host "     Comparable Key: $($response.comparable_key)" -ForegroundColor Gray
        Write-Host "     Location: $($response.location.location_text)" -ForegroundColor Gray
        Write-Host "     Module: $($response.location.module_name)" -ForegroundColor Gray
        Write-Host "     Shelf Number: $($response.location.shelf_number)" -ForegroundColor Gray
        Write-Host "     Image Path: $($response.location.shelf_image_path)" -ForegroundColor Gray

        if ($response.location.shelf_image_path) {
            Write-Host "     Image path is present" -ForegroundColor Green
        } else {
            Write-Host "     Warning: Image path is null" -ForegroundColor Yellow
        }
        $testsPassed++
    } else {
        Write-Host "  FAILED - Book should be found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Search Book - Physics (535.8 M500c)
Write-Host "`nTest 4: Search Book - Physics (535.8 M500c)" -ForegroundColor Yellow
try {
    $body = @{ code = "535.8 M500c" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/books/search" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    if ($response.success -eq $true) {
        Write-Host "  PASSED - Book found!" -ForegroundColor Green
        Write-Host "     Location: $($response.location.location_text)" -ForegroundColor Gray
        Write-Host "     Module: $($response.location.module_name)" -ForegroundColor Gray
        Write-Host "     Image: $($response.location.shelf_image_path)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  FAILED - Book should be found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Search Book - Not Found (Out of Range)
Write-Host "`nTest 5: Search Book - Not Found (999.999 Z999z)" -ForegroundColor Yellow
try {
    $body = @{ code = "999.999 Z999z" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/books/search" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.success -eq $false) {
        Write-Host "  PASSED - Correctly returned 404" -ForegroundColor Green
        Write-Host "     Message: $($errorResponse.message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  FAILED - Should return 404" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 6: Search Book - Missing Code (Bad Request)
Write-Host "`nTest 6: Search Book - Missing Code (Validation)" -ForegroundColor Yellow
try {
    $body = @{ code = "" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/books/search" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    Write-Host "  FAILED - Should return 400 Bad Request" -ForegroundColor Red
    $testsFailed++
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.success -eq $false -and $errorResponse.error.code -eq "MISSING_CODE") {
        Write-Host "  PASSED - Correctly validated input" -ForegroundColor Green
        Write-Host "     Error: $($errorResponse.error.message)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  FAILED - Unexpected error response" -ForegroundColor Red
        $testsFailed++
    }
}

# Test 7: Search Book - GET Method
Write-Host "`nTest 7: Search Book - GET Method (Query String)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/books/search?code=515.5%20M500c" -Method Get

    if ($response.success -eq $true) {
        Write-Host "  PASSED - GET method works" -ForegroundColor Green
        Write-Host "     Location: $($response.location.location_text)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  FAILED - Book should be found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 8: Image Serving
Write-Host "`nTest 8: Image Serving" -ForegroundColor Yellow
try {
    $imageUrl = "$baseUrl/images/module1/front/s1_r1.jpg"
    $response = Invoke-WebRequest -Uri $imageUrl -Method Get

    if ($response.StatusCode -eq 200) {
        Write-Host "  PASSED - Image served correctly" -ForegroundColor Green
        Write-Host "     URL: $imageUrl" -ForegroundColor Gray
        Write-Host "     Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  FAILED - Unexpected status code" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  FAILED - Cannot serve image" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total Tests: $($testsPassed + $testsFailed)" -ForegroundColor White
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`nAll tests passed! Backend is working" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Please check the errors above." -ForegroundColor Yellow
    exit 1
}