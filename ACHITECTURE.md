# 🛠️ Guía del Desarrollador & Arquitectura Interna

Este documento está diseñado por el programador/mantenedor del proyecto. Explica las decisiones técnicas, la estructura profunda y el "porqué" de las tecnologías elegidas.

---

## 1. Stack Tecnológico: ¿Qué y Por Qué?

### ⚡ Frontend: Next.js 15 (App Router) + React 19
* **¿Por qué?** Next.js 15 con **App Router** nos permite usar **React Server Components (RSC)**.
* **Beneficio:** Las páginas iniciales (`page.jsx`) renderizan en el servidor, obteniendo datos de la DB directamente sin exponer credenciales al cliente. Solo los componentes interactivos (`QuizPlayer`, `ThemeSwitcher`) usan `"use client"`.
* **React 19:** Aprovechamos los nuevos hooks y la optimización de renderizado.

### 🎨 Estilos: Tailwind CSS v4 + Variables CSS
* **¿Por qué?** Velocidad de desarrollo y consistencia.
* **Estrategia de Temas:** En lugar de usar el "Dark Mode" nativo de Tailwind (`dark:`), implementamos una estrategia de **Variables CSS Semánticas** en `globals.css`.
    * Definimos variables como `--bg-card`, `--text-main`, `--primary`.
    * Cambiamos los valores de estas variables según el atributo `data-theme` en el `<body>`.
    * **Ventaja:** Permite tener N temas (Normal, Cálido, Oscuro, etc.) sin ensuciar el código JSX con condicionales infinitos.

### 🐘 Base de Datos: PostgreSQL 15 + Prisma 7 (Early Access)
* **¿Por qué Postgres?** Es el estándar de oro para bases de datos relacionales. Necesitábamos integridad referencial (Foreign Keys) para asegurar que las respuestas de los jugadores siempre apunten a preguntas existentes.
* **¿Por qué Prisma 7?**
    * Ofrece un tipado estricto en TypeScript (autocompletado).
    * **Serverless-ready:** Aunque usamos Docker, Prisma 7 optimiza las conexiones.
    * **Seed Inteligente:** Nos permite lógica compleja en `seed.ts` (como escanear archivos) que SQL puro no permite fácilmente.

### 🐳 Infraestructura: Docker Compose
* **Filosofía:** "Self-Healing & Plug-and-Play".
* **El Truco:** Usamos un `entrypoint.sh` personalizado que actúa como orquestador.
    * No asumimos que la DB existe.
    * Ejecutamos `db push` (crear esquema) y `db seed` (llenar datos) **cada vez** que arranca el contenedor.
    * Esto garantiza que si borras el contenedor, al volver a levantarlo, todo se reconstruye solo.

---

## 2. Mapa de la Arquitectura de Directorios

### `/src/app` (Rutas & Vistas)
Aquí vive la estructura de URLs. Usamos el sistema de carpetas de Next.js.
* `page.jsx`: **Home**. Carga los quizzes desde el servidor (SSR) y se los pasa al cliente.
* `/admin/page.jsx`: **Crear**. Panel para insertar nuevas preguntas/quizzes.
* `/admin/manage/page.jsx`: **Gestión**. Panel para editar/borrar/reordenar.
* `/leaderboard/page.jsx`: **Ranking**. Tabla de puntajes conectada a la API.
* `/api/...`: **Backend**. Endpoints REST que conectan el Frontend con la DB.

### `/src/components` (Piezas de Lego)
* `/ui`: Componentes visuales puros y reutilizables (`Button`, `Header`, `Option`). Son "tontos" (no tienen lógica de negocio, solo reciben props).
* `/quiz`: La lógica compleja del juego.
    * `QuizLoader`: El "Router" interno. Maneja la carga de archivos JSON y la selección de modo.
    * `QuizPlayer`: El "Motor de Juego". Maneja el estado (index, respuestas), el Timer y el "Modo Estricto" (sin localStorage).
    * `Results`: La pantalla final. Se encarga de enviar los datos a la API.
* `/admin`: Componentes complejos del panel de administración (`AdminManageClient`).

### `/prisma` (Cerebro de Datos)
* `schema.prisma`: El plano de la base de datos. Define las relaciones (1 Quiz -> N Preguntas -> N Opciones). **Clave:** Usamos `onDelete: Cascade` para que al borrar una pregunta, no queden opciones huérfanas.
* `seed.ts`: Script de TypeScript ejecutado por `tsx`.
    1.  Crea el Quiz "Hardcoded".
    2.  Lee el disco (`fs`) buscando JSONs en `/public`.
    3.  Inserta todo en la DB de forma transaccional.

---

## 3. Flujos de Datos Críticos

### A. Flujo de Juego (Modo Estricto)
1.  **Inicio:** `QuizLoader` carga las preguntas (de DB o JSON).
2.  **Juego:** `QuizPlayer` recibe el array.
    * El estado vive en `useState`.
    * Se bloquea el cierre de pestaña (`beforeunload`).
    * **NO se guarda nada en disco** durante el juego. Si recargas, pierdes.
3.  **Final:** Al terminar, se monta `Results`.
    * Si es `mode === 'play'` (Competitivo) Y hay usuario -> `useEffect` dispara `POST /api/game/finish`.
    * El backend calcula el puntaje, verifica si superaste tu récord y devuelve un mensaje.

### B. Flujo de Importación JSON
1.  **Usuario:** Sube archivo en `QuizLoader`.
2.  **Frontend:** Lee el archivo con `FileReader`.
3.  **Decisión:**
    * *Jugar Ahora:* Pasa el objeto JSON directo a `QuizPlayer` (RAM). ID del quiz = `'local'`.
    * *Guardar:* Envía el objeto a `POST /api/quiz/import`.
4.  **Backend:**
    * Valida estructura.
    * Crea Quiz -> Crea Preguntas -> Crea Opciones (todo en una transacción de Prisma).
    * Devuelve éxito.
5.  **Frontend:** Ejecuta `router.refresh()` para que el nuevo quiz aparezca en el selector sin recargar la página completa.

---

## 4. Notas de Mantenimiento

### Cambiar la Base de Datos
Si modificas `schema.prisma` (ej: agregar un campo "Avatar" al jugador):
1.  Edita el archivo.
2.  Reinicia el contenedor: `docker-compose up -d --build`.
3.  El `entrypoint.sh` detectará el cambio y ejecutará `prisma db push` automáticamente.

### Agregar un nuevo Tema Visual
1.  Ve a `src/app/globals.css`.
2.  Duplica un bloque `[data-theme='...']`.
3.  Cambia los colores de las variables.
4.  Agrega el botón correspondiente en `src/components/ui/ThemeSwitcher.jsx`.

### Debugging
Si algo falla en producción (Docker):
* **Ver logs de la app:** `docker logs app -f`
* **Ver logs de la DB:** `docker logs db`
* **Entrar a la DB:** Usa pgAdmin en `localhost:8080` o conecta una terminal:
    `docker exec -it db psql -U postgres -d quiz_db`

---

## 5. Decisiones de Diseño & Trade-offs (El "Por qué")

En este proyecto, hemos tomado decisiones que priorizan la **Experiencia de Despliegue (DX)** y la **Integridad del Juego** sobre ciertas convenciones estándar.

### A. La Estrategia ".env en el Repositorio" (Zero-Config)
* **La Norma:** Tradicionalmente, los archivos `.env` nunca se suben al repositorio (se agregan al `.gitignore`) para proteger secretos.
* **Decisión:** Incluir explícitamente el archivo `.env` con credenciales de desarrollo en el control de versiones.
* **Justificación:**
    1.  **Portabilidad "Plug & Play":** El objetivo es que cualquier persona clone el repositorio y ejecute `docker-compose up -d` **sin configuración manual** ni creación de archivos.
    2.  **Entorno Aislado:** Las credenciales (`postgres`/`postgres`) son internas de la red privada de Docker (`app-network`) y no exponen acceso a servidores externos reales.
    3.  **Reducción de Error:** Elimina la causa más común de fallo en despliegues locales: configurar mal la URL de conexión (`localhost` vs `db`).

### B. Modo Estricto vs. Persistencia (LocalStorage)
* **La Opción Descartada:** Guardar progreso en `localStorage` para retomar la partida.
* **Nuestra Decisión:** El estado vive exclusivamente en la memoria RAM. Si se recarga, se pierde.
* **Justificación:**
    1.  **Integridad Competitiva:** Evitamos trampas (abrir otra pestaña, buscar respuesta, recargar).
    2.  **Simplicidad:** Evitamos problemas de sincronización con caché vieja.
    * **Veredicto:** Priorizamos la integridad del Quiz sobre la comodidad.

### C. Sistema de Temas (Variables CSS) vs. Clases `dark:`
* **La Opción Descartada:** Usar las clases nativas `dark:` de Tailwind.
* **Nuestra Decisión:** Variables CSS semánticas (`bg-[var(--bg-card)]`).
* **Justificación:**
    * Permite tener **"N" temas** (Normal, Cálido, Oscuro, Alto Contraste) simplemente agregando variables en CSS, sin tocar el código React.

### D. Node 24 (Alpine) vs. Node 25 (Latest)
* **La Norma:** Usar siempre la última versión.
* **Nuestra Decisión:** Downgrade a Node 24 LTS.
* **Justificación:** Prisma 7 requiere binarios estables. La versión 25 en Alpine presentaba inestabilidad con los motores de Prisma. Priorizamos la estabilidad del despliegue.