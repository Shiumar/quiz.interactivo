# Script helper para dockerización (PowerShell)
# Uso: .\docker-helper.ps1 [comando]

param(
    [string]$Command = "help"
)

# --- Funciones de Estilo ---
function Print-Success { param([string]$Message); Write-Host "✓ $Message" -ForegroundColor Green }
function Print-Error   { param([string]$Message); Write-Host "✗ $Message" -ForegroundColor Red }
function Print-Info    { param([string]$Message); Write-Host "ℹ $Message" -ForegroundColor Yellow }

function Show-Access-Info {
    Write-Host ""
    Write-Host "🚀 ¡DESPLIEGUE FINALIZADO CON ÉXITO!" -ForegroundColor Green -BackgroundColor Black
    Write-Host "--------------------------------------------------------" -ForegroundColor Gray
    
    Write-Host "🏠 APLICACIÓN WEB (Frontend):" -ForegroundColor Cyan
    Write-Host "   URL:  http://localhost:3000"
    Write-Host ""
    
    Write-Host "🐘 ADMINISTRACIÓN BD (pgAdmin):" -ForegroundColor Cyan
    Write-Host "   URL:  http://localhost:8080"
    Write-Host "   User: admin@admin.com" -ForegroundColor DarkGray
    Write-Host "   Pass: root" -ForegroundColor DarkGray
    Write-Host ""
    
    Write-Host "🛠️  COMANDOS ÚTILES:" -ForegroundColor Yellow
    Write-Host "   Logs App: .\docker-helper.ps1 logs-app"
    Write-Host "   Shell App: .\docker-helper.ps1 shell-app"
    Write-Host "   Apagar:   .\docker-helper.ps1 down"
    Write-Host "--------------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
}

# --- Funciones Principales ---
function Build {
    Print-Info "Construyendo imágenes Docker..."
    docker-compose build
    if ($?) { Print-Success "Imágenes construidas." }
}

function Up {
    Print-Info "Iniciando servicios..."
    # Usamos --build para asegurar que cambios recientes en código se reflejen
    docker-compose up -d --build
    
    if ($?) {
        Print-Success "Contenedores iniciados."
        Print-Info "Esperando a que los servicios estabilicen..."
        Start-Sleep -Seconds 3
        Show-Access-Info
    }
}

function Down {
    Print-Info "Deteniendo servicios..."
    docker-compose down
    Print-Success "Servicios detenidos."
}

function Logs { 
    Print-Info "Mostrando logs generales..."
    docker-compose logs -f 
}

function LogsApp { 
    Print-Info "Mostrando logs de la Aplicación..."
    docker-compose logs -f app 
}

function LogsDb { 
    Print-Info "Mostrando logs de la Base de Datos..."
    docker-compose logs -f db 
}

function ShellApp { 
    Print-Info "Entrando a la terminal del contenedor App..."
    docker-compose exec app sh 
}

function ShellDb { 
    Print-Info "Entrando a la consola SQL (psql)..."
    # Usamos las credenciales estándar definidas en .env
    docker-compose exec db psql -U "postgres" -d "quiz_db" 
}

function Reset {
    Print-Info "⚠️  RESETEANDO TODO (Eliminando volúmenes y datos)..."
    docker-compose down -v
    Print-Success "Entorno eliminado completamente (BD vacía)."
}

function Health {
    Print-Info "Estado de los servicios..."
    docker-compose ps
}

function Help {
    Write-Host "Docker Helper - Quiz App" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\docker-helper.ps1 [comando]"
    Write-Host ""
    Write-Host "Comandos:"
    Write-Host "  up          - Levantar todo (Build + Start + Info)"
    Write-Host "  down        - Detener servicios"
    Write-Host "  logs-app    - Ver logs de Next.js"
    Write-Host "  shell-app   - Entrar a la consola del contenedor"
    Write-Host "  reset       - Borrar todo y empezar de cero"
}

# --- Router de Comandos ---
switch ($Command.ToLower()) {
    "build"     { Build }
    "up"        { Up }
    "down"      { Down }
    "logs"      { Logs }
    "logs-app"  { LogsApp }
    "logs-db"   { LogsDb }
    "shell-app" { ShellApp }
    "shell-db"  { ShellDb }
    "reset"     { Reset }
    "health"    { Health }
    "help"      { Help }
    default     { Help }
}