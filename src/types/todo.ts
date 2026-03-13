export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}
