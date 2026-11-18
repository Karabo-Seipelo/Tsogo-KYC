import { expect, test } from "vitest";
import { requestOrigin } from "./requestHost";

test("R-02.4 x-forwarded-host and x-forwarded-proto win", () => {
  expect(
    requestOrigin(
      new Request("http://internal:3000/api/session", {
        headers: {
          host: "internal:3000",
          "x-forwarded-host": "preview.example",
          "x-forwarded-proto": "https",
        },
      }),
    ),
  ).toEqual({
    host: "preview.example",
    protocol: "https",
    origin: "https://preview.example",
    secure: true,
  });
});

test("R-02.4 the host header and the request URL are the fallback", () => {
  expect(
    requestOrigin(
      new Request("http://localhost:3000/api/session", {
        headers: { host: "localhost:3000" },
      }),
    ),
  ).toEqual({
    host: "localhost:3000",
    protocol: "http",
    origin: "http://localhost:3000",
    secure: false,
  });
});
