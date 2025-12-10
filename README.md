# Quiz Interactivo (Full Stack Dockerized)

Una aplicación web completa para realizar quizzes interactivos, con panel de administración, temas visuales (Claro/Oscuro/Cálido) y gestión de base de datos. Todo empaquetado en Docker para un despliegue inmediato tipo "Plug & Play".

## 🚀 Características Principales

* **Frontend:** Next.js 16 (App Router) + Tailwind CSS.
* **Backend:** API Routes integradas para lógica de juego y administración.
* **Base de Datos:** PostgreSQL 15.
* **ORM:** Prisma 7 (Early Access) con cliente optimizado para Docker y Linux Alpine.
* **Temas:** Sistema de diseño con variables CSS (Modo Normal, Cálido, Oscuro).
* **Admin:** Panel completo para crear, importar y gestionar contenido.
* **Automatización:** Entorno "Self-Healing" que se autoconfigura al iniciar.

## 🛠️ Requisitos

* **Docker Desktop** (instalado y corriendo).
* *No es necesario tener Node.js, PostgreSQL ni pnpm instalados en tu máquina local.*

---

## ⚡ Cómo Iniciar la Aplicación

El proyecto incluye scripts de ayuda que manejan todo el ciclo de vida de los contenedores. Elige la opción según tu sistema operativo.

### Opción A: Usando el Script de Ayuda (Recomendado)

**En Windows (PowerShell):**
```powershell
.\docker-helper.ps1 up
```

**En Linux / Mac (Bash):**
*(Asegúrate de dar permisos de ejecución primero)*
```bash
chmod +x docker-helper.sh
./docker-helper.sh up
```

### Opción B: Usando Docker Compose Manualmente
Si prefieres usar los comandos nativos de Docker o no puedes ejecutar los scripts, simplemente ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up -d --build
```

---

## 🧠 Arquitectura y Funcionamiento Interno

Este proyecto utiliza una arquitectura **"Self-Healing"** (Auto-reparable) diseñada para evitar errores de configuración manual.

### Ciclo de Vida al Iniciar (`entrypoint.sh`)
Gracias al script `entrypoint.sh` configurado en el Dockerfile, cada vez que el contenedor inicia, realiza estos pasos automáticamente:

1.  **Generación de Cliente:** Ejecuta `prisma generate` para compilar los binarios del cliente compatibles con Linux Alpine.
2.  **Sincronización de BD (`db push`):** Compara tu archivo `schema.prisma` con la base de datos real. Si las tablas no existen o cambiaron, las crea/actualiza al instante.
3.  **Semilla Inteligente (`db seed`):** Ejecuta `prisma/seed.ts`, que realiza dos tareas críticas:
    * Crea el Quiz por defecto ("Millonario") si no existe.
    * **Escanea la carpeta `/public`**: Si encuentra archivos `.json` nuevos, los importa automáticamente a la base de datos como nuevos Quizzes.

### Configuración de Entorno (.env)
Se incluye un archivo `.env` pre-configurado explícitamente en el repositorio ("Plug & Play"). Esto permite que los contenedores se comuniquen entre sí (ej: `db:5432`) sin necesidad de que el usuario configure variables manualmente.

---

## 🛡️ Panel de Administración

El sistema cuenta con dos áreas separadas para mantener el orden y la seguridad de los datos:

### 1. Panel de Creación (`/admin`)
Ubicado en `http://localhost:3000/admin`. Aquí puedes:
* **Crear Nuevo Quiz:** Definir el título de un nuevo cuestionario desde cero.
* **Agregar Preguntas:** Añade preguntas una por una a cualquier quiz existente.
* **Importar JSON:** Subir archivos `.json` masivos para crear quizzes completos en segundos.

### 2. Panel de Gestión (`/admin/manage`)
Ubicado en `http://localhost:3000/admin/manage`. Aquí puedes:
* **Edición:** Modificar el texto de las preguntas o corregir las opciones de respuesta.
* **Reordenamiento:** Si borras preguntas y quedan huecos en los IDs (ej: 1, 3, 5), puedes usar la herramienta **"Recompactar IDs"** para dejarlos secuenciales (1, 2, 3...).
* **Eliminación:** Borrar preguntas obsoletas (el sistema maneja el borrado en cascada de sus opciones automáticamente).

---

## 🌐 Accesos Directos

Una vez desplegado (espera a ver el mensaje de éxito en la consola), utiliza estas URLs:

| Servicio | Ruta | Descripción |
| :--- | :--- | :--- |
| **Quiz App (Juego)** | http://localhost:3000 | Página principal para jugar. |
| **Crear Contenido** | http://localhost:3000/admin | Crear quizzes e importar archivos. |
| **Gestionar Contenido** | http://localhost:3000/admin/manage | Editar, borrar y reordenar preguntas. |
| **Ranking** | http://localhost:3000/leaderboard | Tabla de posiciones global. |
| **pgAdmin 4** | http://localhost:8080 | **User:** `admin@admin.com` <br> **Pass:** `root` |

> **Nota para pgAdmin:** Para conectar al servidor desde la interfaz web, usa el host `db` (nombre del contenedor) en lugar de `localhost`.

---

## 🧹 Limpieza Total

Si deseas borrar la base de datos y empezar de cero (útil si quieres reiniciar los IDs o borrar datos de prueba):

**Con Script (Windows):**
```powershell
.\docker-helper.ps1 reset
```

**Con Script (Linux/Mac):**
```bash
./docker-helper.sh reset
```

**Manualmente:**
```bash
docker-compose down -v
```