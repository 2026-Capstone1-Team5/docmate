import "server-only"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const ACCESS_TOKEN_COOKIE_NAME = "docmate_access_token"
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000"

type ApiErrorEnvelope = {
  error?: {
    code?: string
    message?: string
    details?: Record<string, unknown> | null
  }
}

export type BackendUserProfile = {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export type BackendAuthTokenResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: BackendUserProfile
}

export type BackendUserResponse = {
  user: BackendUserProfile
}

export type BackendApiError = {
  code?: string
  message: string
  details?: Record<string, unknown> | null
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "")
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`
}

export function getDocumentAgentApiBaseUrl(): string {
  const configured =
    process.env.DOCUMENT_AGENT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_DOCUMENT_AGENT_API_BASE_URL ??
    DEFAULT_API_BASE_URL

  return normalizeBaseUrl(configured)
}

export function buildDocumentAgentApiUrl(
  path: string,
  query?: URLSearchParams,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const url = `${getDocumentAgentApiBaseUrl()}${normalizedPath}`
  const queryString = query?.toString()
  return queryString ? `${url}?${queryString}` : url
}

export async function fetchDocumentAgentApi(
  path: string,
  init?: RequestInit,
  query?: URLSearchParams,
): Promise<Response> {
  return fetch(buildDocumentAgentApiUrl(path, query), {
    cache: "no-store",
    ...init,
  })
}

export async function parseBackendApiError(
  response: Response,
  fallbackMessage: string,
): Promise<BackendApiError> {
  try {
    const body = (await response.clone().json()) as ApiErrorEnvelope
    if (typeof body.error?.message === "string" && body.error.message.trim()) {
      return {
        code: body.error.code,
        message: body.error.message,
        details: body.error.details,
      }
    }
  } catch {
    // Ignore parse failures and fall back to the default message.
  }

  return {
    message: fallbackMessage,
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null
}

export async function setAccessToken(token: string, maxAge: number) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  })
}

export async function clearAccessToken() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME)
}

export function createAuthHeaders(
  accessToken: string,
  headers?: HeadersInit,
): Headers {
  const nextHeaders = new Headers(headers)
  nextHeaders.set("Authorization", `Bearer ${accessToken}`)
  return nextHeaders
}

export function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      error: {
        code: "unauthorized",
        message: "Authentication is required.",
      },
    },
    { status: 401 },
  )
}

export function proxyResponse(response: Response): NextResponse {
  const headers = new Headers()
  const contentType = response.headers.get("content-type")
  const contentDisposition = response.headers.get("content-disposition")
  const contentLength = response.headers.get("content-length")

  if (contentType) {
    headers.set("content-type", contentType)
  }
  if (contentDisposition) {
    headers.set("content-disposition", contentDisposition)
  }
  if (contentLength) {
    headers.set("content-length", contentLength)
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}
