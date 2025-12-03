#!/bin/bash
# Script helper para dockerización
# Uso: ./docker-helper.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function show_access_info() {
    echo ""
    echo -e "${GREEN}🚀 ¡DESPLIEGUE FINALIZADO CON ÉXITO!${NC}"
    echo "--------------------------------------------------------"
    echo -e "${CYAN}🏠 APLICACIÓN WEB (Frontend):${NC}"
    echo "   URL:  http://localhost:3000"
    echo ""
    echo -e "${CYAN}🐘 ADMINISTRACIÓN BD (pgAdmin):${NC}"
    echo "   URL:  http://localhost:8080"
    echo "   User: admin@admin.com"
    echo "   Pass: root"
    echo ""
    echo -e "${YELLOW}🛠️  COMANDOS ÚTILES:${NC}"
    echo "   Logs App: ./docker-helper.sh logs-app"
    echo "   Apagar:   ./docker-helper.sh down"
    echo "--------------------------------------------------------"
    echo ""
}

function build() {
    echo -e "${YELLOW}ℹ Construyendo imágenes Docker...${NC}"
    docker-compose build
    echo -e "${GREEN}✓ Imágenes construidas exitosamente${NC}"
}

function up() {
    echo -e "${YELLOW}ℹ Iniciando servicios...${NC}"
    docker-compose up -d --build
    
    echo -e "${GREEN}✓ Contenedores iniciados${NC}"
    echo -e "${YELLOW}ℹ Esperando estabilización...${NC}"
    sleep 3
    show_access_info
}

function down() {
    echo -e "${YELLOW}ℹ Deteniendo servicios...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Servicios detenidos${NC}"
}

function logs() {
    echo -e "${YELLOW}ℹ Mostrando logs...${NC}"
    docker-compose logs -f
}

function logs_app() {
    echo -e "${YELLOW}ℹ Logs de la aplicación...${NC}"
    docker-compose logs -f app
}

function logs_db() {
    echo -e "${YELLOW}ℹ Logs de la base de datos...${NC}"
    docker-compose logs -f db
}

function shell_app() {
    echo -e "${YELLOW}ℹ Accediendo a shell de la aplicación...${NC}"
    docker-compose exec app sh
}

function shell_db() {
    echo -e "${YELLOW}ℹ Accediendo a psql...${NC}"
    docker-compose exec db psql -U "postgres" -d "quiz_db"
}

function reset() {
    echo -e "${YELLOW}ℹ Reseteando todo (¡DESTRUCTIVO!)...${NC}"
    docker-compose down -v
    echo -e "${GREEN}✓ Contenedores y volúmenes eliminados${NC}"
}

function health() {
    echo -e "${YELLOW}ℹ Estado de los servicios...${NC}"
    docker-compose ps
}

function help() {
    echo "Docker Helper para Quiz App"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  up          - Iniciar servicios"
    echo "  down        - Detener servicios"
    echo "  logs-app    - Ver logs de la aplicación"
    echo "  shell-app   - Acceder a shell de la aplicación"
    echo "  reset       - Eliminar todo (¡CUIDADO!)"
    echo "  help        - Mostrar esta ayuda"
    echo ""
}

# Procesar comando
case "${1:-help}" in
    build) build ;;
    up) up ;;
    down) down ;;
    logs) logs ;;
    logs-app) logs_app ;;
    logs-db) logs_db ;;
    shell-app) shell_app ;;
    shell-db) shell_db ;;
    reset) reset ;;
    health) health ;;
    help) help ;;
    *)
        echo -e "${RED}✗ Comando desconocido: $1${NC}"
        help
        exit 1
        ;;
esac