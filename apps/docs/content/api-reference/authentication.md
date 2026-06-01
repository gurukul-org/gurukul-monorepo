---
title: Authentication
description: Learn how to authenticate with the Gurukul API.
order: 1
---

Authentication in Gurukul is handled via JWT tokens (Access and Refresh tokens). Access tokens are short-lived and should be sent in the `Authorization` header of each request. Refresh tokens are long-lived and stored securely in a HttpOnly cookie.

## Base URL

All authentication routes are prefixed with `/users`.

## Routes

### Login

`POST /users/login`

Authenticates a user and returns an access token.

**Request Body**
| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The user's email address. |
| `password` | `string` | The user's password. |

**Response** (200 OK)

```json
{
  "accessToken": "ey..."
}
```

_Note: A `refresh_token` will be set in a secure cookie._

### Sign Out

`POST /users/signout`

Invalidates the current session and clears the refresh token cookie.

**Headers**

- `Authorization: Bearer <access_token>`

**Response** (200 OK)

```json
true
```

### Refresh Tokens

`POST /users/refresh`

Generates a new access token using a valid refresh token.

**Response** (200 OK)

```json
{
  "accessToken": "ey..."
}
```

_Note: This route expects the `refresh_token` to be present in the cookies._

## Error Handling

The API returns standard HTTP status codes:

- `401 Unauthorized`: Invalid credentials or expired token.
- `403 Forbidden`: Insufficient permissions or invalid tenant context.
- `400 Bad Request`: Validation errors in the request body.
