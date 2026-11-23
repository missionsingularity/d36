export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function geminiFailure(error: unknown) {
  const value = error as {
    status?: number;
    code?: number;
    message?: string;
    name?: string;
  };
  const raw = String(value?.message || error);
  const status =
    Number(
      value?.status || value?.code || raw.match(/"code"\s*:\s*(\d{3})/)?.[1],
    ) || undefined;
  const temporary =
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500) ||
    /fetch|network|timeout|timed out|deadline|ENOTFOUND|ECONNRESET|abort/i.test(
      raw,
    );
  let message =
    "BrahmaGPT could not complete this request. Please retry. Local search and saved approvals remain available.";
  if (/billing|paid tier|free tier|project.unavailable/i.test(raw))
    message =
      "The assistant service is not available for this workspace. Ask an administrator to check the service setup.";
  else if (status === 401 || status === 403 || /api.?key|credential/i.test(raw))
    message =
      "The assistant service could not authenticate. Ask an administrator to check the server connection.";
  else if (status === 404 || /model.*not found|no longer available/i.test(raw))
    message =
      "The assistant service is temporarily unavailable. Please try again later.";
  else if (status === 429)
    message =
      "The assistant service is busy. Please wait a moment and try again.";
  else if (
    status === 504 ||
    status === 408 ||
    /deadline|timeout|timed out|abort/i.test(raw)
  )
    message =
      "BrahmaGPT took too long to respond. Please retry. Local search and saved approvals remain available.";
  else if (status === 503 || /high demand|overload/i.test(raw))
    message =
      "BrahmaGPT is temporarily busy. Please retry shortly. Local search and saved approvals remain available.";
  else if (/fetch|network|ENOTFOUND|ECONNRESET/i.test(raw))
    message =
      "BrahmaGPT could not be reached. Local search and saved approvals remain available.";
  return {
    message,
    retryable:
      temporary &&
      !/billing|paid tier|free tier|project.unavailable/i.test(raw),
    status,
  };
}
