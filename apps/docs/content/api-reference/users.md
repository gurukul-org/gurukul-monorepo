---
title: Users
description: Manage users within your tenant.
order: 2
---

The Users API allows you to manage user accounts, permissions, and profile information within the context of a tenant.

## Base URL

All user routes are prefixed with `/users`.

## Routes

### List Users

`GET /users` (Planned)

Returns a list of users for the current tenant.

**Query Parameters**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `page` | `number` | Page number for pagination. |
| `limit` | `number` | Number of items per page. |

### Create User

`POST /users` (Planned)

Creates a new user account.

### Update Profile

`PATCH /users/profile` (Planned)

Updates the current user's profile information.

## Security

Most routes require an active session (Access Token) and the `Tenant-ID` header to be present.

```bash
curl -X GET https://api.gurukul.com/users \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: <tenant-id>"
```

## Data Models

### User

| Field   | Type     | Description                    |
| :------ | :------- | :----------------------------- |
| `id`    | `string` | Unique identifier.             |
| `email` | `string` | User's email.                  |
| `name`  | `string` | User's full name.              |
| `role`  | `string` | User's role within the tenant. |
