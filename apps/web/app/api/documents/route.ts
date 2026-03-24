import { NextRequest, NextResponse } from "next/server"

import {
  DOCUMENT_AI_PARSER_ENABLED,
} from "@/lib/document-agent-api"

import {
  createAuthHeaders,
  createUnauthorizedResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  parseBackendApiError,
  proxyResponse,
} from "@/lib/document-agent-backend"

const VALID_PARSER_BACKENDS = new Set(["markitdown", "pdftotext", "document_ai"])

const ALLOWED_PARSER_BACKENDS = DOCUMENT_AI_PARSER_ENABLED
  ? VALID_PARSER_BACKENDS
  : new Set(["markitdown", "pdftotext"])

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
    const query = new URLSearchParams()
    const parserBackend = request.nextUrl.searchParams.get("parserBackend")
    if (parserBackend) {
      if (!ALLOWED_PARSER_BACKENDS.has(parserBackend)) {
        return NextResponse.json(
          {
            error: {
              message: "지원하지 않는 parserBackend 값입니다.",
            },
          },
          { status: 400 },
        )
      }
      query.set("parserBackend", parserBackend)
    }

    const response = await fetchDocumentAgentApi(
      "/documents",
      {
        method: "POST",
        headers: createAuthHeaders(accessToken),
        body: formData,
      },
      query,
    )

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
