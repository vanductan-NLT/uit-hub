import { NextResponse } from "next/server";

const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 5_000;
const BLOCKED_HOST_PREFIXES = [
  "localhost",
  "127.",
  "10.",
  "192.168.",
  "169.254.",
  "0.",
  "::1",
];

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (BLOCKED_HOST_PREFIXES.some((p) => h === p || h.startsWith(p))) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

function extractMeta(html: string, prop: string): string | null {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()) : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "only http(s) supported" }, { status: 400 });
  }
  if (isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: "private host blocked" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 UITHubMetadataBot/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "not html" }, { status: 415 });
    }

    const reader = res.body?.getReader();
    if (!reader) return NextResponse.json({ error: "no body" }, { status: 502 });
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    reader.cancel();
    const html = new TextDecoder("utf-8", { fatal: false }).decode(
      Buffer.concat(chunks.map((c) => Buffer.from(c)))
    );

    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      extractTitle(html);
    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "twitter:description") ??
      extractMeta(html, "description");
    const image =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image");
    const siteName = extractMeta(html, "og:site_name");

    return NextResponse.json({
      title: title?.slice(0, 300) ?? null,
      description: description?.slice(0, 500) ?? null,
      image: image ?? null,
      siteName: siteName ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError" ? "timeout" : "fetch failed";
    return NextResponse.json({ error: msg }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
