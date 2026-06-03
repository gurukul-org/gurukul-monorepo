# pgAudit Audit Lab POC

## Objective

Build and verify a local PostgreSQL audit logging proof of concept using pgAudit without affecting the main Gurukul development environment.

The goal is to:

- Verify pgAudit installation and configuration.
- Verify audit log generation.
- Understand the structure of pgAudit logs.
- Prepare for future OpenSearch integration.
- Keep the production/development database untouched.

---

# Why a Separate Docker Container?

Instead of modifying the existing PostgreSQL container:

```txt
gurukul_postgres
```

we created a dedicated audit lab:

```txt
audit_lab_postgres
```

---

## Pros

### Isolation

No risk to:

```txt
Prisma Migrations
NestJS API
Current Development Database
Existing Data
```

---

### Faster Experimentation

Can freely:

```txt
Destroy Containers
Destroy Volumes
Change Configurations
Rebuild Images
```

without affecting Gurukul.

---

### Easier Learning

Allows focused exploration of:

```txt
PostgreSQL
pgAudit
OpenSearch
Fluent Bit
```

without production concerns.

---

### Easy Cleanup

```bash
docker compose down -v
```

removes the entire lab.

---

## Cons

### Duplicate PostgreSQL Instance

Consumes additional:

```txt
CPU
RAM
Storage
```

---

### Configuration Duplication

The audit lab must be maintained separately.

---

### Not Production Identical

Eventually pgAudit will need to be enabled in the real database.

The lab only validates the approach.

---

# Directory Structure

```txt
gurukul-monorepo
│
├── docker-compose.yml
│
├── .env
│
└── infrastructure
    └── audit-lab
        ├── docker-compose.yml
        │
        └── postgres
            └── Dockerfile
```

---

# Final Dockerfile

File:

```txt
infrastructure/audit-lab/postgres/Dockerfile
```

```dockerfile
FROM postgres:16

RUN apt-get update && \
    apt-get install -y \
    postgresql-16-pgaudit && \
    rm -rf /var/lib/apt/lists/*
```

---

# Final Docker Compose

File:

```txt
infrastructure/audit-lab/docker-compose.yml
```

```yaml
services:
  postgres:
    build:
      context: .
      dockerfile: postgres/Dockerfile

    container_name: audit_lab_postgres

    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: audit_lab

    ports:
      - '5433:5432'

    volumes:
      - audit_lab_postgres_data:/var/lib/postgresql/data

    command:
      - postgres
      - -c
      - shared_preload_libraries=pgaudit
      - -c
      - pgaudit.log=write,ddl

volumes:
  audit_lab_postgres_data:
```

---

# Why PostgreSQL 16 Instead Of postgres:16-alpine?

Original production image:

```txt
postgres:16-alpine
```

Problem:

```sql
SELECT name
FROM pg_available_extensions
WHERE name='pgaudit';
```

returned:

```txt
(0 rows)
```

and:

```bash
apk search pgaudit
```

returned nothing.

Therefore pgAudit was unavailable.

---

Debian PostgreSQL image:

```txt
postgres:16
```

supports:

```txt
postgresql-16-pgaudit
```

through apt.

This made installation straightforward.

---

# Verification Journey

## Verify PostgreSQL

Connect:

```bash
docker exec -it audit_lab_postgres \
psql -U postgres -d audit_lab
```

Verify:

```sql
SELECT version();
```

---

## Verify pgAudit Exists

```sql
SELECT name, default_version
FROM pg_available_extensions
WHERE name='pgaudit';
```

Expected:

```txt
pgaudit | 16.1
```

---

## Initial Failure

Attempt:

```sql
CREATE EXTENSION pgaudit;
```

Error:

```txt
pgaudit must be loaded via shared_preload_libraries
```

This proved:

```txt
pgAudit installed
pgAudit visible
pgAudit not loaded
```

---

## Load pgAudit

Added:

```yaml
command:
  - postgres
  - -c
  - shared_preload_libraries=pgaudit
  - -c
  - pgaudit.log=write,ddl
```

to Docker Compose.

---

## Enable Extension

Reconnect:

```sql
CREATE EXTENSION pgaudit;
```

Expected:

```txt
CREATE EXTENSION
```

Success.

---

# Testing Plan

Create test table:

```sql
CREATE TABLE audit_test (
    id SERIAL PRIMARY KEY,
    name TEXT
);
```

---

Insert:

```sql
INSERT INTO audit_test (name)
VALUES ('Ravi');
```

---

Update:

```sql
UPDATE audit_test
SET name='Patel'
WHERE id=1;
```

---

Delete:

```sql
DELETE FROM audit_test
WHERE id=1;
```

---

Exit:

```sql
\q
```

---

# View Logs

```bash
docker logs audit_lab_postgres
```

---

# Expected Audit Events

DDL:

```txt
CREATE TABLE
CREATE INDEX
ALTER SEQUENCE
```

---

Write Events:

```txt
INSERT
UPDATE
DELETE
```

---

Observed Output

```txt
AUDIT: SESSION,3,1,WRITE,INSERT,...
AUDIT: SESSION,4,1,WRITE,UPDATE,...
AUDIT: SESSION,5,1,WRITE,DELETE,...
```

This confirmed pgAudit is functioning correctly.

---

# Meaning Of <not logged>

Example:

```txt
AUDIT: SESSION,3,1,WRITE,INSERT,...
<not logged>
```

This field refers to statement parameters.

Meaning:

```txt
Parameter values were not captured.
```

This is intentional and helps prevent sensitive information from being written into audit logs.

---

# Current Capabilities

pgAudit currently logs:

```txt
Timestamp
Audit Class
Command
Object Type
Object Name
SQL Statement
Database User
```

Examples:

```txt
DDL
CREATE TABLE

WRITE
INSERT

WRITE
UPDATE

WRITE
DELETE
```

---

# Current Limitations

pgAudit does NOT know:

```txt
Application User
Tenant
Request ID
Membership ID
JWT Identity
```

because those exist at the NestJS layer.

---

# Recommended Future Audit Context

When a request arrives:

```txt
JWT
```

Extract:

```txt
user_id
tenant_id
membership_id
```

Generate:

```txt
request_id
```

Set PostgreSQL session metadata:

```sql
SET application_name =
'user=123 tenant=456 membership=789 request=abc';
```

Future OpenSearch parsers can extract:

```json
{
  "userId": "123",
  "tenantId": "456",
  "membershipId": "789",
  "requestId": "abc"
}
```

without storing personal information.

---

# OpenSearch Preparation

Current state:

```txt
PostgreSQL
    ↓
pgAudit
    ↓
Raw Audit Logs
```

Future state:

```txt
PostgreSQL
    ↓
pgAudit
    ↓
Fluent Bit
    ↓
OpenSearch
    ↓
OpenSearch Dashboards
```

---

# Useful Future Dashboards

## Audit Timeline

```txt
CREATE TABLE
INSERT
UPDATE
DELETE
```

over time.

---

## DDL Activity

```txt
CREATE TABLE
ALTER TABLE
DROP TABLE
```

---

## Write Activity

```txt
INSERT
UPDATE
DELETE
```

grouped by table.

---

## Tenant Activity

```txt
Tenant A

INSERT
UPDATE
DELETE
```

---

## User Activity

```txt
User 123

UPDATE student_profiles
INSERT enrolments
DELETE membership_roles
```

---

# Success Criteria Achieved

```txt
✓ PostgreSQL container created

✓ pgAudit package installed

✓ pgAudit extension detected

✓ shared_preload_libraries configured

✓ CREATE EXTENSION pgaudit succeeded

✓ CREATE TABLE logged

✓ INSERT logged

✓ UPDATE logged

✓ DELETE logged

✓ Raw audit logs verified

✓ Foundation ready for OpenSearch exploration
```
