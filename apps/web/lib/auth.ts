import {
  BackendUserProfile,
  BackendUserResponse,
  fetchDocumentAgentApi,
  getAccessToken,
  parseBackendApiError,
} from "@/lib/document-agent-backend"

export type AuthSession = {
  id: string
  email: string
  displayName: string
  initials: string
}

function toDisplayName(email: string): string {
  const localPart = email.split("@")[0] ?? ""
  const normalized = localPart.replace(/[._-]+/g, " ").trim()
  if (!normalized) {
    return email
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase())
}

function getInitials(value: string): string {
  const letters = value
    .split(/\s+/)
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return letters || "DM"
}

function toSession(user: BackendUserProfile): AuthSession {
  const displayName = toDisplayName(user.email)
  return {
    id: user.id,
    email: user.email,
    displayName,
    initials: getInitials(displayName),
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return null
  }

  try {
    const response = await fetchDocumentAgentApi("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401 || response.status === 403) {
      return null
    }

    if (!response.ok) {
      const error = await parseBackendApiError(
        response,
        "Failed to verify the current session.",
      )
      console.error("[auth] Failed to load current user:", error.message)
      return null
    }

    const payload = (await response.json()) as BackendUserResponse
    return toSession(payload.user)
  } catch (error) {
    console.error("[auth] Failed to reach document-agent-api:", error)
    return null
  }
}
