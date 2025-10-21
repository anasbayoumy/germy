# Get authentication token for testing
$authUrl = "http://localhost:3001/api/auth/login"
$body = @{
    email = "admin@platform.com"
    password = "AdminPass123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $authUrl -Method POST -ContentType "application/json" -Body $body
    if ($response.success -and $response.data.token) {
        Write-Host "✅ Authentication successful!"
        Write-Host "Token: $($response.data.token)"
        Write-Host "User ID: $($response.data.user.id)"
        Write-Host "Company ID: $($response.data.user.companyId)"
        Write-Host "Role: $($response.data.user.role)"
        
        # Save token to file for other scripts
        $response.data.token | Out-File -FilePath "token.txt" -Encoding UTF8
        Write-Host "Token saved to token.txt"
    } else {
        Write-Host "❌ Authentication failed: $($response.message)"
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
