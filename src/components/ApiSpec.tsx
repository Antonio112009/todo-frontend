"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

const methodStyle: Record<string, { badge: string; border: string; bg: string }> = {
  GET: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/50",
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
  },
  POST: {
    badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    border: "border-green-200 dark:border-green-800/50",
    bg: "bg-green-50/50 dark:bg-green-900/10",
  },
  PUT: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
    bg: "bg-amber-50/50 dark:bg-amber-900/10",
  },
  DELETE: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    border: "border-red-200 dark:border-red-800/50",
    bg: "bg-red-50/50 dark:bg-red-900/10",
  },
};

export default function ApiSpec() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API Specification</CardTitle>
        <CardDescription>
          Your backend must implement these endpoints at{" "}
          <code className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-mono font-semibold">
            {API_BASE_URL}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CORS notice */}
        <Alert className="border-amber-200 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-900/20">
          <AlertTitle className="text-amber-700 dark:text-amber-300">⚠️ CORS Required</AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            Your backend must allow requests from{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs font-mono font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              http://localhost:3000
            </code>
          </AlertDescription>
        </Alert>

        {/* Todo Model */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex size-5 items-center justify-center rounded bg-violet-100 text-[10px] font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
              T
            </span>
            Todo Model
          </h3>
          <pre className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 text-sm font-mono overflow-x-auto leading-relaxed text-violet-900 dark:border-violet-800/40 dark:bg-violet-900/10 dark:text-violet-200">
{`{
  "id":        number,    // auto-generated
  "title":     string,    // from request body
  "completed": boolean    // default: false
}`}
          </pre>
        </div>

        <Separator />

        {/* Endpoints */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Endpoints
          </h3>
          <div className="flex flex-col gap-3">
            {endpoints.map((ep) => {
              const style = methodStyle[ep.method];
              return (
                <div
                  key={`${ep.method}-${ep.path}`}
                  className={`rounded-lg border ${style.border} ${style.bg} p-4 space-y-3`}
                >
                  {/* Method + Path */}
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold leading-none ${style.badge}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-semibold font-mono">{ep.path}</code>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{ep.description}</p>

                  {/* Request body */}
                  {ep.requestBody && (
                    <div>
                      <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span className="text-blue-500 dark:text-blue-400">→</span> Request Body
                      </span>
                      <pre className="mt-1 rounded-md border border-border bg-background p-2.5 text-xs font-mono overflow-x-auto leading-relaxed">
                        {ep.requestBody}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="text-green-500 dark:text-green-400">←</span> Response
                    </span>
                    <pre className="mt-1 rounded-md border border-border bg-background p-2.5 text-xs font-mono overflow-x-auto leading-relaxed">
                      {ep.responseExample}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
