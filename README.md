# Gurukul Monorepo

Welcome to the Gurukul Monorepo! This project is built using [Turborepo](https://turbo.build/repo/docs) to efficiently manage our Next.js frontend and NestJS backend in a single repository.

---

## 🏗️ Project Structure

This monorepo contains the following applications and packages:

### Apps

- **`apps/web`**: The main frontend application built with [Next.js](https://nextjs.org/) (App Router).
- **`apps/api`**: The backend application built with [NestJS](https://nestjs.com/).

### Packages

- **`packages/eslint-config`**: Shared `eslint` configurations used across the monorepo.
- **`packages/typescript-config`**: Shared `tsconfig.json` bases used throughout the monorepo.

All apps and packages are 100% [TypeScript](https://www.typescriptlang.org/).

---

## 🚀 Developer Onboarding Flow

If you are a new developer setting up the project for the first time, follow these exact steps:

### 1. Prerequisites

- **Node.js**: v20 or higher (Required for NestJS v11+)
- **Yarn**: `yarn@1.22.x`
- **Docker**: (Optional, for running production containers locally)

### 2. Installation

Install all dependencies across the entire monorepo. **Do not run `npm install` inside individual folders.** Always use yarn from the root:

```sh
yarn install
```

### 3. Environment Setup

The backend API needs to know what port to run on. Create a `.env` file in the `apps/api/` directory:

```sh
echo "PORT=8000" > apps/api/.env
```

### 4. Start Development Servers

Start both the frontend and backend simultaneously in watch mode:

```sh
yarn dev
```

- **Frontend (Web):** http://localhost:3000
- **Backend (API):** http://localhost:8000

_Turborepo uses an interactive Terminal UI (TUI). You can navigate between the `web` and `api` logs using your Up/Down arrow keys and pressing `Enter`._

### 5. Branching & Development Workflow

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
