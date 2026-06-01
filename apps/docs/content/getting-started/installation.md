---
title: Installation
description: Step-by-step guide to setting up the Gurukul development environment.
order: 2
---

# Installation

Setting up Gurukul is straightforward thanks to our integrated monorepo workspace.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: version 20 or higher.
- **Yarn**: version 1.22.x (highly recommended for workspaces).
- **Docker**: For running the database and other services locally.

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/gurukul-monorepo.git
cd gurukul-monorepo
```

### 2. Install Dependencies

Always run the installation command from the **root** of the monorepo.

```bash
yarn install
```

### 3. Environment Configuration

Gurukul uses environment variables for secure configuration.

1. **Root .env**: Copy `.env.example` to `.env` in the root folder for Docker services.
2. **API .env**: Create a `.env` file in `apps/api/` with your database credentials (see [Configuration](/docs/guides/configuration) for details).

### 4. Database Setup

Spin up the PostgreSQL database and Adminer web client using Docker Compose:

```bash
docker compose up -d postgres adminer
```

### 5. Launch Development Servers

Start both the API and Web apps simultaneously:

```bash
yarn dev
```

The services will be available at:

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:8000](http://localhost:8000)
- **Docs**: [http://localhost:3002](http://localhost:3002)

## Common Commands

| Command            | Action                                           |
| :----------------- | :----------------------------------------------- |
| `yarn lint:fix`    | Automatically fix linting and formatting issues. |
| `yarn check-types` | Run TypeScript type checking across the repo.    |
| `yarn build`       | Build all applications for production.           |
