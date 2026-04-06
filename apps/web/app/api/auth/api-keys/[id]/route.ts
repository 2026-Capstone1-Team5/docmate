import { NextResponse } from "next/server";

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  proxyResponse,
} from "@/lib/document-agent-backend";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  const encodedId = encodeURIComponent(id);

  try {
    const body = await request.text();
    const response = await fetchDocumentAgentApi(`/auth/api-keys/${encodedId}`, {
      method: "PATCH",
      headers: createAuthHeaders(accessToken, {
        "Content-Type": "application/json",
      }),
      body,
    });

    return proxyResponse(response);
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "API key 이름을 변경하지 못했습니다.",
        },
      },
      { status: 503 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  const encodedId = encodeURIComponent(id);

  try {
    const response = await fetchDocumentAgentApi(`/auth/api-keys/${encodedId}`, {
      method: "DELETE",
      headers: createAuthHeaders(accessToken),
    });

    return proxyResponse(response);
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "API key를 폐기하지 못했습니다.",
        },
      },
      { status: 503 },
    );
  }
}
