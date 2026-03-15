import { NextResponse } from "next/server"

import { clearAccessToken } from "@/lib/document-agent-backend"

export async function POST() {
  await clearAccessToken()
  return NextResponse.json({ ok: true })
}
