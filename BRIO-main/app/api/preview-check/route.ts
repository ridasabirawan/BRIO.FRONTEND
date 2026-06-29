import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/auth";

/**
 * Checks whether a URL can be embedded in an <iframe> by inspecting the
 * X-Frame-Options and Content-Security-Policy (frame-ancestors) response
 * headers. Sites like lamborghini.com send these to block framing, which makes
 * the chat preview panel render blank — this lets the client show a graceful
 * fallback instead.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter", canEmbed: false },
      { status: 400 }
    );
  }

  let target: URL;
  try {
    target = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return NextResponse.json(
      { error: "Invalid url", canEmbed: false },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(target.toString(), {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BrioBot/1.0)" },
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const xfo = (res.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (res.headers.get("content-security-policy") || "").toLowerCase();

    const blockedByXfo = xfo.includes("deny") || xfo.includes("sameorigin");

    // Parse the frame-ancestors directive properly (substring checks over-match,
    // e.g. "frame-ancestors *.x.com" contains "frame-ancestors *"). Extract the
    // directive's token list and only treat a bare "*" as universally embeddable;
    // anything more specific restricts framing to other origins → show fallback.
    let blockedByCsp = false;
    const faMatch = csp.match(/frame-ancestors([^;]*)/);
    if (faMatch) {
      const tokens = faMatch[1].trim().split(/\s+/).filter(Boolean);
      const allowsAll = tokens.length === 1 && tokens[0] === "*";
      blockedByCsp = !allowsAll;
    }

    const canEmbed = !blockedByXfo && !blockedByCsp;

    return NextResponse.json({
      canEmbed,
      hostname: target.hostname,
      xFrameOptions: xfo || null,
    });
  } catch (error) {
    console.error("preview-check error:", error);
    // On network failure we can't confirm embeddability — assume not embeddable
    // so the user still gets the actionable fallback card.
    return NextResponse.json({ canEmbed: false, hostname: target.hostname });
  }
}
