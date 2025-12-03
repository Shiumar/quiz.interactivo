# Quiz Interactivo (Dockerized)

Aplicación Next.js full-stack para realizar quizzes interactivos, gestionada con Prisma ORM y PostgreSQL. Todo el entorno está dockerizado para un despliegue "Plug & Play".

## Características

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS.
- **Backend:** Next.js API Routes.
- **Base de Datos:** PostgreSQL 15.
- **ORM:** Prisma 7 (Early Access) con arquitectura de cliente separado.
- **Admin:** Incluye pgAdmin 4 pre-configurado.
- **Docker:** Entorno completo con configuración automática.

## Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.
- No necesitas tener Node.js ni PostgreSQL instalados en tu máquina local.

## Instalación y Uso (¡Muy Fácil!)

Este proyecto incluye scripts de ayuda (`docker-helper`) que manejan todo el ciclo de vida.

### 1. Clonar y Preparar
Descarga el repositorio y entra en la carpeta.

### 2. Iniciar el Entorno
Ejecuta el script de ayuda según tu sistema operativo:

**En Windows (PowerShell):**
```powershell
.\docker-helper.ps1 up