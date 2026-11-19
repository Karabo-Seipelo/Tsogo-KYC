// URL.origin is the scheme, host and port the browser sends as Origin.
// Source: https://developer.mozilla.org/en-US/docs/Web/API/URL/origin

export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const protocol = url.protocol.replace(":", "");

  return {
    host: url.host,
    protocol,
    origin: url.origin,
    secure: protocol === "https",
  };
}
