import { expect, test } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { POST as createSession } from "../route";
import { GET as readStatus } from "../status/route";
import { POST } from "./route";

test("AC-08.3 manual review stores one reference and reports that outcome", async () => {
  const id = await sessionId();

  const first = await POST(review(id));
  const body: unknown = await first.json();
  const again = await POST(review(id));
  const stored = await createMemoryStore().get(`session:${id}`);
  const status = await readStatus(review(id));
  const statusBody: unknown = await status.json();

  expect(first.status).toBe(200);
  expect(body).toEqual(await again.json());
  expect(body).toMatchObject({
    reference: expect.stringMatching(/^[0-9A-F]{8}$/),
  });
  expect(JSON.stringify(body)).not.toContain(id);
  expect(stored).toMatchObject({
    outcome: "manualReview",
    reference: referenceOf(body),
  });
  expect(statusBody).toMatchObject({
    outcome: "manualReview",
    reference: referenceOf(body),
  });
  expect(JSON.stringify(statusBody)).not.toMatch(
    /blurry|glare|cropped|fraud|confidence/i,
  );
});

test("AC-02.14 manual review without a cookie is 401", async () => {
  const response = await POST(review());

  expect(response.status).toBe(401);
});

async function sessionId() {
  const created = await createSession(
    new Request("http://localhost:3000/api/session", {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
    }),
  );
  const header = created.headers
    .getSetCookie()
    .find((line) => line.toLowerCase().startsWith("session="));
  if (!header) {
    throw new Error("session cookie was not set");
  }
  return header.split(";")[0]?.slice("session=".length) ?? "";
}

function review(session?: string) {
  const headers = new Headers({
    host: "localhost:3000",
    origin: "http://localhost:3000",
  });
  if (session) {
    headers.set("cookie", `session=${session}`);
  }
  return new Request("http://localhost:3000/api/session/manual-review", {
    method: "POST",
    headers,
  });
}

function referenceOf(body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    "reference" in body &&
    typeof body.reference === "string"
  ) {
    return body.reference;
  }
  throw new Error("reference was not returned");
}
