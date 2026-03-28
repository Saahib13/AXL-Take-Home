import { NextResponse } from "next/server";
import { z } from "zod";

export const SessionIdSchema = z.string().uuid("Invalid session id");

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
