/** Formato padronizado de resposta usado por todos os endpoints da API. */
export interface ApiResponse<T> {
  data: T | null;
  meta: Record<string, unknown> | null;
  errors: ApiError[] | null;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}
