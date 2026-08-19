import { isAxiosError } from 'axios';

/**
 * Extracts the API's `message` from a failed request, falling back to a
 * caller-supplied default for network/parse failures that carry no body.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message || fallback : fallback;
}

/**
 * Same as `getApiErrorMessage`, for requests made with `responseType: 'blob'`
 * (PDF endpoints). Laravel still answers errors with JSON, but axios hands it
 * back as a Blob, so the body has to be read before the message is visible.
 */
export async function getBlobErrorMessage(err: unknown, fallback: string): Promise<string> {
  if (isAxiosError(err) && err.response?.data instanceof Blob) {
    try {
      const parsed: unknown = JSON.parse(await err.response.data.text());
      if (parsed && typeof parsed === 'object' && 'message' in parsed) {
        const { message } = parsed as { message?: unknown };
        if (typeof message === 'string' && message !== '') return message;
      }
    } catch {
      // Body wasn't JSON (HTML error page, truncated PDF) — use the fallback.
    }
  }
  return getApiErrorMessage(err, fallback);
}
