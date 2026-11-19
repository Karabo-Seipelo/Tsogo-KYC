import { expect, test } from "vitest";
import { requestOrigin } from "./requestHost";

test("a forwarded host does not replace the request URL", () => {
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
    host: "internal:3000",
    protocol: "http",
    origin: "http://internal:3000",
    secure: false,
  });
});

test("AC-11.5 a conflicting x-forwarded-host does not move the origin", () => {
  const request = new Request("https://tsogo.example/api/session", {
    headers: {
      host: "tsogo.example",
      "x-forwarded-host": "evil.example",
      "x-forwarded-proto": "http",
    },
  });

  expect(requestOrigin(request)).toEqual({
    host: "tsogo.example",
    protocol: "https",
    origin: "https://tsogo.example",
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
