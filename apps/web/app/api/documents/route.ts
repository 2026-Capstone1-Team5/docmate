import { NextRequest, NextResponse } from "next/server"

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  parseBackendApiError,
  proxyResponse,
} from "@/lib/document-agent-backend"

export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return createUnauthorizedResponse()
  }

  try {
    const response = await fetchDocumentAgentApi(
      "/documents",
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
          message: "문서 API에 연결하지 못했습니다.",
        },
      },
      { status: 503 },
    )
  }
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return createUnauthorizedResponse()
  }

  try {
    const formData = await request.formData()
    const response = await fetchDocumentAgentApi("/documents", {
      method: "POST",
      headers: createAuthHeaders(accessToken),
      body: formData,
    })

    if (!response.ok) {
      const error = await parseBackendApiError(
        response,
        "문서 업로드를 처리하지 못했습니다.",
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
