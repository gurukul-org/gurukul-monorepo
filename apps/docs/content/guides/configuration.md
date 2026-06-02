---
title: Configuration
description: Managing environment variables and global settings.
order: 1
---

# Configuration

Gurukul uses a centralized configuration strategy using environment variables to ensure portability and security across different environments.

## Root Configuration

The `.env` file at the root of the monorepo is primarily used for **Docker Compose** services.

```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=gurukul_dev
```

## Backend Configuration (API)

The API requires specific environment variables to connect to the database and manage authentication. These should be placed in `apps/api/.env`.

```env
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gurukul_dev
JWT_SECRET=your_secret_key
```

## Frontend Configuration (Web)

The Web application uses Next.js environment variables. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting Config

If you change environment variables, remember to:

1. Restart your development servers (`yarn dev`).
2. If using Docker, rebuild or restart containers using `docker compose restart`.
