# Gurukul Monorepo

Welcome to the Gurukul Monorepo! This project is built using [Turborepo](https://turbo.build/repo/docs) to efficiently manage our Next.js frontend and NestJS backend in a single repository.

---

## 🏗️ Project Structure

This monorepo contains the following applications and packages:

### Apps

- **`apps/web`**: The main frontend application built with [Next.js](https://nextjs.org/) (App Router).
- **`apps/api`**: The backend application built with [NestJS](https://nestjs.com/).
- **`apps/docs`**: Documentation application built with [Next.js](https://nextjs.org/) and [Tailwind v4](https://tailwindcss.com/).

### Packages

- **`packages/eslint-config`**: Shared `eslint` configurations used across the monorepo.
- **`packages/typescript-config`**: Shared `tsconfig.json` bases used throughout the monorepo.

All apps and packages are 100% [TypeScript](https://www.typescriptlang.org/).

---

## 🚀 Developer Onboarding Flow

If you are a new developer setting up the project for the first time, follow these exact steps:

### 1. Prerequisites

- **Node.js**: v20 or higher (Required for NestJS v11+)
- **Yarn**: `yarn@4.x` (Corepack enabled)
- **Docker**: (Optional, for running production containers locally)

### 2. Installation

Install all dependencies across the entire monorepo. **Do not run `npm install` inside individual folders.** Always use yarn from the root:

```sh
yarn install
```

### 3. Environment Setup

We use environment variables to keep credentials secure and prevent committing them to Git.

1. **Root `.env` (for Docker Compose):**
   Copy the root template to create your local environment file:

   ```sh
   cp .env.example .env
   ```

   _(This loads the database credentials into the Docker containers, keeping passwords out of `docker-compose.yml`)_

2. **API `.env` (for local development server):**
   Create a `.env` file in the `apps/api/` directory with the following contents:
   ```env
   PORT=8000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gurukul_dev
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=gurukul_dev
   ```

### 4. Database Setup (Docker Compose)

For local development, we run the database and database browser (Adminer) inside Docker, while running the application code directly on the host machine.

Before running the dev servers, spin up the database and database browser services in the background:

```sh
docker compose up -d postgres adminer
```

- **PostgreSQL database port:** `localhost:5432`
- **Adminer Web Client (Database Browser):** http://localhost:8080
  - _To log in to Adminer, select System: `PostgreSQL`, Server: `postgres`, Username: `postgres`, Password: `postgres`, Database: `gurukul_dev`_

### 5. Start Development Servers

Start both the frontend and backend applications simultaneously in watch mode:

```sh
yarn dev
```

- **Frontend (Web):** http://localhost:3000
- **Backend (API):** http://localhost:8000
- **Interactive API Docs (Swagger):** http://localhost:8000/api
- **Documentation (Guides):** http://localhost:3001

_Turborepo uses an interactive Terminal UI (TUI). You can navigate between the `web` and `api` logs using your Up/Down arrow keys and pressing `Enter`._

### 6. Branching & Development Workflow

When starting a new feature or fixing a bug, always create a new branch from the latest `main` branch.

**Branch Naming Convention:**
Your branch name **must** contain the JIRA project key (e.g., `DT-123-feature-name`).

Alternatively, you can use the "Create branch" button directly inside the JIRA issue, which will provide you with the exact Git command to run.

**Pull Requests:**
When you are ready to merge your code, ensure your Pull Request (PR) title includes the JIRA project key (e.g., `[DT-123] Add new login feature`). This ensures our PRs are properly linked to our issue tracking system.

---

## 🛡️ Git Hooks & Automated Checks

We use **Husky** and **lint-staged** to ensure our `main` branch stays pristine. You don't need to do anything manually, but here is what happens automatically:

1. **Pre-commit**: Every time you type `git commit`, Husky intercepts it and automatically runs Prettier on the files you changed. This ensures consistent formatting and automatically sorts your imports.
2. **Pre-push**: Every time you type `git push`, Husky runs `yarn check-types` and `yarn build`. If your code has TypeScript errors or fails to build, your push will be blocked.

---

## 🛠️ Troubleshooting & Fixing Errors

If your build is failing, or your editor is throwing red lines everywhere, here is how you fix it instantly from the root folder:

### 1. Formatting & Import Errors (Prettier)

If your files look messy, or imports are scattered, run:

```sh
yarn format
```

This forces Prettier to format every file in the monorepo and perfectly sorts all imports using our standardized rules defined in `.prettierrc.json`.

### 2. Linting Errors (ESLint)

If you have unused variables, floating promises, or other ESLint warnings, run:

```sh
yarn lint:fix
```

This is a powerful "magic bullet" script. It goes into both the frontend and backend, auto-fixes all solvable ESLint errors (like removing unused imports), and then automatically runs `yarn format` right after.

### 3. TypeScript Errors

If your `git push` is failing because of `check-types`, you can verify what is broken locally by running:

```sh
yarn check-types
```

This will quickly scan the entire monorepo for TypeScript errors without actually building the apps.

### 4. Build Fails on Git Push

Our `yarn build` command strictly enforces formatting. If `git push` fails on the build step, run `yarn lint:fix` to ensure all formatting is correct, then run `yarn build` locally to spot the exact error before pushing again.

---

## 🐳 Docker Deployment

The project is fully prepared for containerized production deployment using Docker. We use `turbo prune` to ensure our Docker images are incredibly lightweight and only contain the exact dependencies needed for each specific app.

To build and run the entire stack locally in a production-like environment, simply use the root `docker-compose.yml`:

```sh
docker-compose up --build
```

This spins up two optimized containers (`gurukul_web` on port 3000, and `gurukul_api` on port 8000) mapped together on a shared virtual network.
