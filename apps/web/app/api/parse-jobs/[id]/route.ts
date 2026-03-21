import { NextResponse } from "next/server";

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  parseBackendApiError,
  proxyResponse,
} from "@/lib/document-agent-backend";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_request",
          message: "A parse job id is required.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetchDocumentAgentApi(`/${["parse-jobs", id].join("/")}`, {
      method: "GET",
      headers: createAuthHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await parseBackendApiError(
        response,
        "파싱 작업 상태를 불러오지 못했습니다.",
      );
      return NextResponse.json(
        {
          error,
        },
        { status: response.status },
      );
    }

    return proxyResponse(response);
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "문서 API에 연결하지 못했습니다.",
        },
      },
      { status: 503 },
    );
  }
}
