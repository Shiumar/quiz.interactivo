# Quiz Interactivo

Pequeña aplicación en Next.js que muestra una pregunta con cuatro opciones, permite seleccionar una respuesta y muestra si es correcta o no.

## ¿Para qué sirve?

- Mostrar una pregunta interactiva (quiz) desde una base de datos PostgreSQL usando Prisma.
- Añadir nuevas preguntas desde un formulario de administración en `/admin`.

## Requisitos

- Node.js (versión recomendada >=16) y `pnpm`.
- PostgreSQL accesible desde la máquina donde se ejecute el proyecto (puede ser local).

## Configuración rápida

1. Copiar el archivo de ejemplo y editar credenciales:

```pwsh
Copy-Item .env.example .env
# editar .env con un editor y configurar DATABASE_URL
notepad .env
```

2. Instalar dependencias (la instalación ejecutará una comprobación y, si todo está bien, ejecutará migraciones y seed automáticamente):

```pwsh
pnpm install
```

3. Iniciar el servidor de desarrollo:

```pwsh
pnpm dev
```

Abrir `http://localhost:3000` en el navegador.

## Scripts importantes

- `pnpm dev`: inicia Next.js en modo desarrollo.
- `pnpm build` / `pnpm start`: construir y ejecutar en producción.
- `pnpm setup`: genera el cliente Prisma, aplica migraciones y ejecuta el seed.
- `pnpm db:seed`: ejecuta el seed (prisma db seed).
- `pnpm migrate:dev`: corre `prisma migrate dev` (usa `.env`).

El `postinstall` en `package.json` ejecuta `scripts/check-env.js` y, si `.env` existe y la base de datos es alcanzable, ejecuta `pnpm setup`. Si la comprobación falla, la instalación no fallará y la configuración automática se omitirá (se muestra un mensaje con pasos a seguir).

## Si la configuración automática falla

Si `pnpm install` muestra que la comprobación falló (por falta de `.env` o DB inaccesible), haz:

1. Crear y editar `.env` desde `.env.example`.
2. Asegurarte de que PostgreSQL está corriendo y accesible.
3. Ejecutar manualmente los pasos:

```pwsh
pnpm generate
pnpm migrate:dev --name "initial setup"
pnpm db:seed
pnpm dev
```

## Administración de preguntas

- La ruta `/admin` contiene un formulario para añadir preguntas; la API es `POST /api/admin/questions`.
- El seed crea un `Quiz` de ejemplo; si necesitas varios quizzes, puedes gestionarlos con Prisma Studio.