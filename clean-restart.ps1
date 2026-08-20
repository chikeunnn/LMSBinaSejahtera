# PowerShell script untuk clean restart
# Jalankan di terminal: .\clean-restart.ps1

Write-Host "🗑️  Menghapus cache .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Cache .next berhasil dihapus" -ForegroundColor Green
}

Write-Host "🚀 Menjalankan npm run dev..." -ForegroundColor Cyan
npm run dev
