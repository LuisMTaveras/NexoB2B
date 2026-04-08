# NexoB2B — Startup Script 🚀

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        NEXOB2B — PORTAL CORPORATIVO               " -ForegroundColor White -BackgroundColor Blue
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando entorno de desarrollo..." -ForegroundColor Yellow

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencias no encontradas. Ejecutando npm install..." -ForegroundColor Magenta
    npm install
}

Write-Host "Lanzando servidores (API + Frontend)..." -ForegroundColor Green
Write-Host "   ➜ API: http://localhost:3000" -ForegroundColor Gray
Write-Host "   ➜ Front: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Presiona Ctrl+C para detener." -ForegroundColor DarkGray
Write-Host "----------------------------------------------------"

npm run dev
