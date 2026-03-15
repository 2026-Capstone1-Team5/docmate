import { NextResponse } from "next/server";

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  proxyResponse,
} from "@/lib/document-agent-backend";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return createUnauthorizedResponse();
  }

  try {
    const response = await fetchDocumentAgentApi("/auth/api-keys", {
      method: "GET",
      headers: createAuthHeaders(accessToken),
    });

    return proxyResponse(response);
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "API key 목록을 불러오지 못했습니다.",
        },
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return createUnauthorizedResponse();
  }

  try {
    const body = await request.text();
    const response = await fetchDocumentAgentApi("/auth/api-keys", {
      method: "POST",
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
          message: "API key를 발급하지 못했습니다.",
        },
      },
      { status: 503 },
    );
  }
}
