# Backend API Contract

The frontend expects the following REST API endpoints.
The base URL is configured via `NEXT_PUBLIC_API_URL` env variable (default: `http://localhost:4000`).

## Data Model

```json
{
  "id": 1,
  "title": "Buy groceries",
  "completed": false
}
```

## Endpoints

### GET /todos
Returns a JSON array of all todos.

**Response:** `200 OK`
```json
[
  { "id": 1, "title": "Buy groceries", "completed": false },
  { "id": 2, "title": "Walk the dog", "completed": true }
]
```

---

### POST /todos
Creates a new todo.

**Request body:**
```json
{ "title": "Buy groceries" }
```

**Response:** `201 Created`
```json
{ "id": 3, "title": "Buy groceries", "completed": false }
```

---

### PUT /todos/:id
Updates an existing todo (toggle completed, edit title).

**Request body** (all fields optional):
```json
{ "completed": true }
```

**Response:** `200 OK`
```json
{ "id": 1, "title": "Buy groceries", "completed": true }
```

---

### DELETE /todos/:id
Deletes a todo.

**Response:** `200 OK` or `204 No Content`

---

## CORS
The backend must allow CORS requests from `http://localhost:3000` (the frontend dev server).
