import { NextRequest, NextResponse } from "next/server"

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  parseBackendApiError,
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
    const response = await fetchDocumentAgentApi(`/${["documents", id].join("/")}`, {
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

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return createUnauthorizedResponse()
  }

  const { id } = await context.params

  try {
    const response = await fetchDocumentAgentApi(`/${["documents", id].join("/")}`, {
      method: "DELETE",
      headers: createAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await parseBackendApiError(
        response,
        "문서 삭제를 처리하지 못했습니다.",
      )
      return NextResponse.json(
        {
          error,
        },
        { status: response.status },
      )
    }

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
