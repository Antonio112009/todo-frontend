"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const endpoints = [
  {
    method: "GET",
    path: "/todos",
    description: "Returns a JSON array of all todos",
    requestBody: null,
    responseExample: `[
  { "id": 1, "title": "Buy groceries", "completed": false },
  { "id": 2, "title": "Walk the dog", "completed": true }
]`,
  },
  {
    method: "POST",
    path: "/todos",
    description: "Creates a new todo. Returns the created todo with an id",
    requestBody: `{ "title": "Buy groceries" }`,
    responseExample: `{ "id": 3, "title": "Buy groceries", "completed": false }`,
  },
  {
    method: "PUT",
    path: "/todos/:id",
    description: "Updates an existing todo (title, completed). Returns the updated todo",
    requestBody: `{ "title": "Updated title", "completed": true }`,
    responseExample: `{ "id": 1, "title": "Updated title", "completed": true }`,
  },
  {
    method: "DELETE",
    path: "/todos/:id",
    description: "Deletes a todo by id",
    requestBody: null,
    responseExample: `200 OK or 204 No Content`,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
};

export default function ApiSpec() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
        📋 Backend API Specification
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Base URL: <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">{API_BASE_URL}</code>
      </p>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800
                      dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <strong>CORS required:</strong> Backend must allow requests from <code className="text-xs">http://localhost:3000</code>
      </div>

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Todo Model
      </h3>
      <pre className="mb-5 rounded-lg bg-gray-800 p-3 text-sm text-gray-100 overflow-x-auto">
{`{
  "id": number,
  "title": string,
  "completed": boolean
}`}
      </pre>

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Endpoints
      </h3>
      <div className="flex flex-col gap-4">
        {endpoints.map((ep) => (
          <div
            key={`${ep.method}-${ep.path}`}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${methodColors[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {ep.path}
              </code>
            </div>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {ep.description}
            </p>
            {ep.requestBody && (
              <div className="mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Request body:</span>
                <pre className="mt-1 rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300 overflow-x-auto">
                  {ep.requestBody}
                </pre>
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Response:</span>
              <pre className="mt-1 rounded bg-gray-100 p-2 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300 overflow-x-auto">
                {ep.responseExample}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
