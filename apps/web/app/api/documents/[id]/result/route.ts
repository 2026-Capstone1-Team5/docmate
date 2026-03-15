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
  _request: NextRequest,
  context: RouteContext,
) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return createUnauthorizedResponse()
  }

  const { id } = await context.params

  try {
    const response = await fetchDocumentAgentApi(`/${["documents", id, "result"].join("/")}`, {
      method: "GET",
      headers: createAuthHeaders(accessToken),
    })
    return proxyResponse(response)
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "문서 API에 연결하지 못했습니다.",
        },
      },
      { status: 503 },
    )
  }
}
