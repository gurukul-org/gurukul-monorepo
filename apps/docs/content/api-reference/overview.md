---
title: API Overview
description: API reference overview
order: 1
---

## Interactive API Documentation

Gurukul provides an interactive API documentation powered by Swagger (OpenAPI). This allows you to explore the API endpoints, view request and response schemas, and test operations directly from your browser.

- **URL**: [http://localhost:8000/api](http://localhost:8000/api) (Local Development)

## API Design

# API Reference

## Base URL

```
https://api.example.com/v1
```

## Authentication

All requests require a Bearer token:

```http
Authorization: Bearer <your-token>
```

## Response format

All responses return JSON:

```json
{
  "data": {},
  "error": null,
  "status": 200
}
```

## Rate limits

| Plan | Requests/min |
| ---- | ------------ |
| Free | 60           |
| Pro  | 600          |
| Team | 6000         |

## Error codes

| Code | Meaning               |
| ---- | --------------------- |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 404  | Not Found             |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
