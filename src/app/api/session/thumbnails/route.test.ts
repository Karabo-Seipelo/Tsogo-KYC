import { expect, test } from "vitest";
import { createMemoryStore } from "../../../../lib/store/memoryStore";
import { GET as readStatus } from "../status/route";
import { GET } from "./route";

const documentThumb = "document-thumb";
const selfieThumb = "selfie-thumb";

test("AC-05.8 thumbnails without a cookie is 401", async () => {
  const response = await GET(thumbnailsRequest());

  expect(response.status).toBe(401);
});

test("AC-05.8 thumbnails with an unknown cookie is 401 and hides the id", async () => {
  const response = await GET(thumbnailsRequest("missing-session"));
  const body = await response.text();

  expect(response.status).toBe(401);
  expect(body).not.toContain("missing-session");
});

test("AC-05.8 thumbnails returns the stored document and selfie", async () => {
  const store = createMemoryStore();
  await store.set(
    "session:handoff-photos",
    {
      step: "review",
      thumbnail: documentThumb,
      selfieThumbnail: selfieThumb,
    },
    60,
  );

  const response = await GET(thumbnailsRequest("handoff-photos"));
  const body: unknown = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({
    document: `data:image/jpeg;base64,${documentThumb}`,
    selfie: `data:image/jpeg;base64,${selfieThumb}`,
  });
  expect(JSON.stringify(body)).not.toContain("handoff-photos");

  const status = JSON.stringify(
    await (await readStatus(statusRequest("handoff-photos"))).json(),
  );
  expect(status).not.toContain(documentThumb);
  expect(status).not.toContain(selfieThumb);
});

test("AC-05.8 a missing thumbnail is null", async () => {
  const store = createMemoryStore();
  await store.set(
    "session:handoff-one-photo",
    { step: "review", thumbnail: documentThumb },
    60,
  );

  const response = await GET(thumbnailsRequest("handoff-one-photo"));

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    document: `data:image/jpeg;base64,${documentThumb}`,
    selfie: null,
  });
});

function thumbnailsRequest(session?: string) {
  const headers = new Headers();
  if (session) {
    headers.set("cookie", `session=${session}`);
  }
  return new Request("http://localhost:3000/api/session/thumbnails", {
    headers,
  });
}

function statusRequest(session: string) {
  return new Request("http://localhost:3000/api/session/status", {
    headers: { cookie: `session=${session}` },
  });
}
