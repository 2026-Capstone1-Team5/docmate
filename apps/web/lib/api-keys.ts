import { requestJson, requestVoid } from "@/lib/api-client";

export type ApiKeySummary = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
};

export type ApiKeyListResponse = {
  items: ApiKeySummary[];
};

export type IssuedApiKeyResponse = {
  apiKey: string;
  key: ApiKeySummary;
};

const API_ROOT = "/api/auth/api-keys";

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

export async function listApiKeys(): Promise<ApiKeyListResponse> {
  return requestJson<ApiKeyListResponse>({
    apiRoot: API_ROOT,
    path: "/",
    init: {
      method: "GET",
    },
    fallbackMessage: "API key 요청에 실패했습니다.",
  });
}

export async function issueApiKey(name: string): Promise<IssuedApiKeyResponse> {
  return requestJson<IssuedApiKeyResponse>({
    apiRoot: API_ROOT,
    path: "/",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    },
    fallbackMessage: "API key 요청에 실패했습니다.",
  });
}

export async function renameApiKey(
  apiKeyId: string,
  name: string,
): Promise<ApiKeySummary> {
  return requestJson<ApiKeySummary>({
    apiRoot: API_ROOT,
    path: `/${encodePathSegment(apiKeyId)}`,
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    },
    fallbackMessage: "API key 요청에 실패했습니다.",
  });
}

export async function revokeApiKey(apiKeyId: string): Promise<void> {
  await requestVoid({
    apiRoot: API_ROOT,
    path: `/${encodePathSegment(apiKeyId)}`,
    init: {
      method: "DELETE",
    },
    fallbackMessage: "API key 요청에 실패했습니다.",
  });
}
