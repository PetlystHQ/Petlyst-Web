import axios, { AxiosError } from 'axios';

/**
 * Type guard re-export of `axios.isAxiosError`. Lets call sites narrow
 * `unknown` to `AxiosError` without needing to import axios directly.
 */
export function isApiError(err: unknown): err is AxiosError {
  return axios.isAxiosError(err);
}

/**
 * Extracts a user-displayable message from an unknown error.
 *
 * Order of precedence:
 *   1. Axios error with a server-supplied `response.data.message` field.
 *   2. Axios error fallback to its top-level `.message`.
 *   3. Native Error instance — its `.message`.
 *   4. The provided `fallback` (or empty string).
 *
 * Use inside `catch (err) { ... }` blocks where the error is typed as
 * `unknown` (TypeScript's default for catch parameters under the
 * `useUnknownInCatchVariables` setting).
 */
export function getApiErrorMessage(err: unknown, fallback: string = ''): string {
  if (axios.isAxiosError(err)) {
    const serverMessage = err.response?.data?.message;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) return serverMessage;
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Returns the HTTP status code if the error is an axios error with a response,
 * or `undefined` otherwise.
 */
export function getApiErrorStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) return err.response?.status;
  return undefined;
}

/**
 * Returns the raw axios `response` object if the error is an axios error,
 * or `undefined` otherwise. Use sparingly — prefer `getApiErrorMessage` /
 * `getApiErrorStatus`. This is the escape hatch for code that needs to look
 * at non-standard response fields (e.g. `response.data.error`,
 * `response.statusText`, `response.headers`).
 */
export function getApiErrorResponse(err: unknown): import('axios').AxiosResponse | undefined {
  if (axios.isAxiosError(err)) return err.response;
  return undefined;
}
