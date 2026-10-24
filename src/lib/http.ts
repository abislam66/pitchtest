import "server-only";
import { headers } from "next/headers";

export async function clientFingerprint() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent") };
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
