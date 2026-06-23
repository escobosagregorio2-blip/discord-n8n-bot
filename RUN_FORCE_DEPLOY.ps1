# FORCE DEPLOY Script - Trading Miami Bot Discord
# Ejecuta: powershell -ExecutionPolicy Bypass -File "RUN_FORCE_DEPLOY.ps1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FORCE DEPLOY - Trading Miami Bot" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
$currentPath = Get-Location
Write-Host "Carpeta actual: $currentPath" -ForegroundColor Yellow

# PASO 1: Configurar git
Write-Host "[PASO 1] Configurando git..." -ForegroundColor Yellow
git config user.email "escobosagregorio2@gmail.com"
git config user.name "Trading Miami Bot"
Write-Host "Git configurado" -ForegroundColor Green
Write-Host ""

# PASO 2: Ver status
Write-Host "[PASO 2] Estado actual:" -ForegroundColor Yellow
git status
Write-Host ""

# PASO 3: Agregar cambios
Write-Host "[PASO 3] Agregando cambios..." -ForegroundColor Yellow
git add -A
Write-Host "Cambios agregados" -ForegroundColor Green
Write-Host ""

# PASO 4: Crear commit
Write-Host "[PASO 4] Creando commit..." -ForegroundColor Yellow
git commit -m "fix: escalation system - force sync with bot.js"
Write-Host "Commit creado" -ForegroundColor Green
Write-Host ""

# PASO 5: Force push
Write-Host "[PASO 5] Force push a GitHub (origin main)..." -ForegroundColor Yellow
Write-Host "Nota: Se pedira autenticacion si es necesario" -ForegroundColor Cyan
git push -f origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "PUSH COMPLETADO!" -ForegroundColor Green
Write-Host "Próximos pasos:" -ForegroundColor Green
Write-Host "1. Ir a https://ud046x.easypanel.host" -ForegroundColor Green
Write-Host "2. Buscar el proyecto 'discord-bot1'" -ForegroundColor Green
Write-Host "3. Hacer clic en 'Force Rebuild' o 'Redeploy'" -ForegroundColor Green
Write-Host "4. Esperar logs: 'Bot conectado como: TradingMiamiSchool...'" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para terminar..."
[void][System.Console]::ReadKey($true)
