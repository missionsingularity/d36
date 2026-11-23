export async function requestJson(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<{ response: Response; body: Record<string, any> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      credentials: init.credentials || "same-origin",
      cache: init.cache || "no-store",
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    return { response, body: body as Record<string, any> };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("That request took too long. Check your connection and retry.");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not reach BrahmaGPT. Check your connection and retry.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
