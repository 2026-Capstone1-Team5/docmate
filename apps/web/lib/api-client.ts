export type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown> | null;
  };
};

type RequestOptions = {
  apiRoot: string;
  path: string;
  init?: RequestInit;
  query?: URLSearchParams;
  fallbackMessage: string;
};

export function buildApiUrl(
  apiRoot: string,
  path: string,
  query?: URLSearchParams,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = path === "/" ? apiRoot : `${apiRoot}${normalizedPath}`;

  if (!query) {
    return base;
  }

  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export async function buildApiError(
  response: Response,
  fallbackMessage: string,
): Promise<Error> {
  let message = `${fallbackMessage} (${response.status})`;

  try {
    const body = (await response.json()) as ApiErrorResponse;
    if (
      typeof body.error?.message === "string" &&
      body.error.message.trim() !== ""
    ) {
      message = body.error.message;
    }
  } catch {
    // Ignore parse failure and fall back to the default message.
  }

  return new Error(message);
}

export async function requestJson<T>({
  apiRoot,
  path,
  init,
  query,
  fallbackMessage,
}: RequestOptions): Promise<T> {
  const response = await fetch(buildApiUrl(apiRoot, path, query), init);
  if (!response.ok) {
    throw await buildApiError(response, fallbackMessage);
  }

  return (await response.json()) as T;
}

export async function requestVoid({
  apiRoot,
  path,
  init,
  query,
  fallbackMessage,
}: RequestOptions): Promise<void> {
  const response = await fetch(buildApiUrl(apiRoot, path, query), init);
  if (!response.ok) {
    throw await buildApiError(response, fallbackMessage);
  }
}
