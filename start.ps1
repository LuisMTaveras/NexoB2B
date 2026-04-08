# NexoB2B — Startup Script 🚀
# Arranca todos los servicios del proyecto: API, Frontend y Prisma Studio

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        NEXOB2B — PORTAL CORPORATIVO               " -ForegroundColor White -BackgroundColor Blue
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ── Instalar dependencias si es necesario ──────────────────
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencias no encontradas. Ejecutando npm install..." -ForegroundColor Magenta
    npm install
}

# ── Arrancar Prisma Studio en ventana separada ─────────────
Write-Host "Abriendo Prisma Studio en nueva ventana..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Prisma Studio' -ForegroundColor Cyan; npm run db:studio"

Start-Sleep -Milliseconds 800

# ── Arrancar API + Frontend en paralelo ───────────────────
Write-Host ""
Write-Host "Servicios que se iniciarán:" -ForegroundColor Green
Write-Host "   ➜  API         : http://localhost:3000" -ForegroundColor Gray
Write-Host "   ➜  Frontend    : http://localhost:5173" -ForegroundColor Gray
Write-Host "   ➜  Prisma Studio: http://localhost:5555" -ForegroundColor Gray
Write-Host "   ➜  Worker      : integrado en el servidor API" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor." -ForegroundColor DarkGray
Write-Host "----------------------------------------------------"

npm run dev
