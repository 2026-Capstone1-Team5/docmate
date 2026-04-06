import { NextRequest, NextResponse } from "next/server"

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  proxyResponse,
} from "@/lib/document-agent-backend"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return createUnauthorizedResponse()
  }

  const { id } = await context.params

  try {
    // 백엔드 API 엔드포인트: GET /api/v1/documents/{document_id}/source
    const response = await fetchDocumentAgentApi(
      `/${["documents", id, "source"].join("/")}`,
      {
        method: "GET",
        headers: createAuthHeaders(accessToken),
      },
      request.nextUrl.searchParams,
    )
    return proxyResponse(response)
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "문서 원본 API에 연결하지 못했습니다.",
        },
      },
      { status: 503 },
    )
  }
}
