# SCRIPT: Force Deploy bot.js con escalación a GitHub
# Ejecutar en PowerShell como Administrador

Write-Host "=== STEP 1: Verificando bot.js ===" -ForegroundColor Cyan
if (Test-Path ".\bot.js") {
    Write-Host "✓ bot.js encontrado" -ForegroundColor Green
    $hasEscalation = Select-String -Path ".\bot.js" -Pattern "function detectEscalationIntent" -Quiet
    if ($hasEscalation) {
        Write-Host "✓ Función detectEscalationIntent EXISTE" -ForegroundColor Green
    } else {
        Write-Host "✗ ERROR: Función detectEscalationIntent NO encontrada" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ ERROR: bot.js no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 2: Limpiando repositorio Git ===" -ForegroundColor Cyan
try {
    Remove-Item -Force -Recurse -Path ".\.git" -ErrorAction Stop
    Write-Host "✓ Repositorio Git limpio" -ForegroundColor Green
} catch {
    Write-Host "⚠ Advertencia: No se pudo limpiar .git anterior: $_" -ForegroundColor Yellow
}

Write-Host "`n=== STEP 3: Inicializando Git ===" -ForegroundColor Cyan
git init
git config user.email "escobosagregorio2@gmail.com"
git config user.name "Trading Miami Bot"

Write-Host "`n=== STEP 4: Agregando archivos ===" -ForegroundColor Cyan
git add -A
git status

Write-Host "`n=== STEP 5: Commit inicial ===" -ForegroundColor Cyan
git commit -m "fix: force push bot.js con escalacion detectada"

Write-Host "`n=== STEP 6: Configurando remote GitHub ===" -ForegroundColor Cyan
# REEMPLAZA con tu URL real de GitHub
$gitHubUrl = Read-Host "Ingresa la URL de tu repositorio GitHub (ej: https://github.com/usuario/repo.git)"
git remote add origin $gitHubUrl

Write-Host "`n=== STEP 7: Force Push a GitHub ===" -ForegroundColor Cyan
Write-Host "Esto sobrescribira la rama main/master en GitHub" -ForegroundColor Yellow
$confirm = Read-Host "¿Continuar? (s/n)"
if ($confirm -eq 's' -or $confirm -eq 'S') {
    git branch -M main
    git push -f origin main
    Write-Host "`n✓ Force push completado" -ForegroundColor Green
} else {
    Write-Host "Cancelado por el usuario" -ForegroundColor Yellow
}

Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Ahora debes:"
Write-Host "1. Navegar a https://ud046x.easypanel.host"
Write-Host "2. Buscar el proyecto del bot"
Write-Host "3. Hacer clic en 'Force Rebuild' o 'Redeploy'"
Write-Host "4. Esperar a que los logs muestren 'Bot conectado como...'"
Write-Host "`nEscalacion detectada: ✓" -ForegroundColor Green
