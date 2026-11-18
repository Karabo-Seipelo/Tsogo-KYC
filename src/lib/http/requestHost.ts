// Headers.get: https://developer.mozilla.org/en-US/docs/Web/API/Headers/get
// URL.protocol includes the trailing colon: https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol

export function requestOrigin(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");

  return {
    host,
    protocol,
    origin: `${protocol}://${host}`,
    secure: protocol === "https",
  };
}
