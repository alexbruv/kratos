import { getStore } from "@netlify/blobs";

const STORE_NAME = "kratos-state";
const MAX_BODY_BYTES = 200_000; // generous for years of check-ins + a long rewards ladder

const DEVICE_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isValidCheckIn(c: unknown): c is { date: string } {
  return (
    typeof c === "object" &&
    c !== null &&
    typeof (c as { date?: unknown }).date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test((c as { date: string }).date)
  );
}

function isValidMilestone(m: unknown): boolean {
  return (
    typeof m === "object" &&
    m !== null &&
    typeof (m as { id?: unknown }).id === "string" &&
    typeof (m as { days?: unknown }).days === "number" &&
    typeof (m as { label?: unknown }).label === "string" &&
    ((m as { source?: unknown }).source === "builtin" ||
      (m as { source?: unknown }).source === "custom")
  );
}

/** Minimal shape check — this is an unauthenticated endpoint (no accounts by design), so we don't
 * trust the body beyond "does this look like the AppState this app actually writes." */
function isValidAppState(body: unknown): body is { checkIns: unknown[]; milestones: unknown[] } {
  if (typeof body !== "object" || body === null) return false;
  const b = body as { checkIns?: unknown; milestones?: unknown };
  return (
    Array.isArray(b.checkIns) &&
    b.checkIns.every(isValidCheckIn) &&
    Array.isArray(b.milestones) &&
    b.milestones.every(isValidMilestone)
  );
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");
  if (!deviceId || !DEVICE_ID_PATTERN.test(deviceId)) {
    return jsonResponse({ error: "invalid or missing deviceId" }, 400);
  }

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    const data = await store.get(deviceId, { type: "json" });
    if (data === null) return new Response(null, { status: 404 });
    return jsonResponse(data);
  }

  if (req.method === "PUT") {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: "payload too large" }, 413);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "invalid json" }, 400);
    }

    if (!isValidAppState(body)) {
      return jsonResponse({ error: "invalid app state shape" }, 400);
    }

    await store.setJSON(deviceId, body);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "method not allowed" }, 405);
};

export const config = {
  path: "/api/sync",
};
