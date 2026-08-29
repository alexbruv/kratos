import { beforeEach, describe, expect, it, vi } from "vitest";

const stores = new Map<string, Map<string, unknown>>();

vi.mock("@netlify/blobs", () => ({
  getStore: (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      get: async (key: string) => (store.has(key) ? store.get(key) : null),
      setJSON: async (key: string, value: unknown) => {
        store.set(key, value);
      },
    };
  },
}));

import handler from "../sync.mts";

const DEVICE_ID = "abcdefgh-1234";
const VALID_STATE = {
  checkIns: [{ date: "2026-08-01" }],
  milestones: [{ id: "d3", days: 3, label: "FIRST SPARK", source: "builtin" }],
};

function req(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

describe("sync function", () => {
  beforeEach(() => stores.clear());

  it("rejects a request with no deviceId", async () => {
    const res = await handler(req("http://x/api/sync"));
    expect(res.status).toBe(400);
  });

  it("rejects a malformed deviceId", async () => {
    const res = await handler(req("http://x/api/sync?deviceId=../etc/passwd"));
    expect(res.status).toBe(400);
  });

  it("returns 404 for a device with nothing stored yet", async () => {
    const res = await handler(req(`http://x/api/sync?deviceId=${DEVICE_ID}`));
    expect(res.status).toBe(404);
  });

  it("stores valid app state via PUT and returns it via GET", async () => {
    const putRes = await handler(
      req(`http://x/api/sync?deviceId=${DEVICE_ID}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(VALID_STATE),
      }),
    );
    expect(putRes.status).toBe(200);

    const getRes = await handler(req(`http://x/api/sync?deviceId=${DEVICE_ID}`));
    expect(getRes.status).toBe(200);
    expect(await getRes.json()).toEqual(VALID_STATE);
  });

  it("rejects a body that isn't valid JSON", async () => {
    const res = await handler(
      req(`http://x/api/sync?deviceId=${DEVICE_ID}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a body that doesn't look like AppState", async () => {
    const res = await handler(
      req(`http://x/api/sync?deviceId=${DEVICE_ID}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hello: "world" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a check-in with a malformed date", async () => {
    const res = await handler(
      req(`http://x/api/sync?deviceId=${DEVICE_ID}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checkIns: [{ date: "not-a-date" }], milestones: [] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a payload over the size limit", async () => {
    const res = await handler(
      req(`http://x/api/sync?deviceId=${DEVICE_ID}`, {
        method: "PUT",
        headers: { "content-type": "application/json", "content-length": "999999" },
        body: JSON.stringify(VALID_STATE),
      }),
    );
    expect(res.status).toBe(413);
  });

  it("rejects unsupported HTTP methods", async () => {
    const res = await handler(req(`http://x/api/sync?deviceId=${DEVICE_ID}`, { method: "DELETE" }));
    expect(res.status).toBe(405);
  });

  it("keeps devices isolated from each other", async () => {
    await handler(
      req(`http://x/api/sync?deviceId=${DEVICE_ID}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(VALID_STATE),
      }),
    );
    const res = await handler(req(`http://x/api/sync?deviceId=other-device-99`));
    expect(res.status).toBe(404);
  });
});
