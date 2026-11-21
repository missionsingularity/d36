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
    "Gemini could not complete this request. Please retry. Local search and saved approvals remain available.";
  if (/billing|paid tier|free tier|project.unavailable/i.test(raw))
    message =
      "This Google project requires Gemini billing to be enabled in Google AI Studio.";
  else if (status === 401 || status === 403 || /api.?key|credential/i.test(raw))
    message =
      "Gemini credentials were rejected. Check GEMINI_API_KEY and project access in .env.local.";
  else if (status === 404 || /model.*not found|no longer available/i.test(raw))
    message =
      "The configured Gemini model is unavailable. Update GEMINI_MODEL in .env.local and restart the app.";
  else if (status === 429)
    message =
      "Gemini quota or rate limit reached. Retry later or check your Google project quota.";
  else if (
    status === 504 ||
    status === 408 ||
    /deadline|timeout|timed out|abort/i.test(raw)
  )
    message =
      "Gemini took too long to respond. Please retry. Local search and saved approvals remain available.";
  else if (status === 503 || /high demand|overload/i.test(raw))
    message =
      "Gemini is temporarily busy. Please retry shortly. Local search and saved approvals remain available.";
  else if (/fetch|network|ENOTFOUND|ECONNRESET/i.test(raw))
    message =
      "Gemini could not be reached. Local search and saved approvals remain available.";
  return {
    message,
    retryable:
      temporary &&
      !/billing|paid tier|free tier|project.unavailable/i.test(raw),
    status,
  };
}
