type RequestLogDetails = {
  step: string | null;
  errorCode: string | null;
};

export async function logRequest(
  request: Request,
  run: () => Response | Promise<Response>,
  details: RequestLogDetails,
) {
  const started = Date.now();
  const response = await run();
  console.log({
    route: new URL(request.url).pathname,
    status: response.status,
    duration: Date.now() - started,
    step: details.step,
    errorCode: details.errorCode,
  });
  return response;
}
