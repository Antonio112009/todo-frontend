"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const methodVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  GET: "default",
  POST: "secondary",
  PUT: "outline",
  DELETE: "destructive",
};

export default function ApiSpec() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📋 Backend API Specification</CardTitle>
        <CardDescription>
          Base URL:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
            {API_BASE_URL}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert>
          <AlertTitle>⚠️ CORS Required</AlertTitle>
          <AlertDescription>
            Backend must allow requests from{" "}
            <code className="text-xs font-mono">http://localhost:3000</code>
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Todo Model
          </h3>
          <pre className="rounded-lg bg-muted p-3 text-sm font-mono overflow-x-auto">
{`{
  "id": number,
  "title": string,
  "completed": boolean
}`}
          </pre>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Endpoints
          </h3>
          <div className="flex flex-col gap-3">
            {endpoints.map((ep) => (
              <Card key={`${ep.method}-${ep.path}`} size="sm">
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={methodVariant[ep.method]}>{ep.method}</Badge>
                    <code className="text-sm font-semibold font-mono">{ep.path}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">{ep.description}</p>
                  {ep.requestBody && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Request body:
                      </span>
                      <pre className="mt-1 rounded bg-muted p-2 text-xs font-mono overflow-x-auto">
                        {ep.requestBody}
                      </pre>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Response:
                    </span>
                    <pre className="mt-1 rounded bg-muted p-2 text-xs font-mono overflow-x-auto">
                      {ep.responseExample}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
