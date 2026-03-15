import { NextResponse } from "next/server"

import {
  BackendAuthTokenResponse,
  fetchDocumentAgentApi,
  parseBackendApiError,
  setAccessToken,
} from "@/lib/document-agent-backend"

type RegisterBody = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterBody | null

  const email = body?.email
  const password = body?.password

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      {
        error: {
          message: "이메일과 비밀번호를 입력해 주세요.",
        },
      },
      { status: 400 },
    )
  }

  try {
    const response = await fetchDocumentAgentApi("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    })

    if (!response.ok) {
      const error = await parseBackendApiError(
        response,
        "회원가입 요청을 처리하지 못했습니다.",
      )
      return NextResponse.json(
        {
          error,
        },
        { status: response.status },
      )
    }

    const payload = (await response.json()) as BackendAuthTokenResponse
    await setAccessToken(payload.accessToken, payload.expiresIn)

    return NextResponse.json(
      {
        user: payload.user,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "인증 서버에 연결하지 못했습니다.",
        },
      },
      { status: 503 },
    )
  }
}
