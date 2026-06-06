import { HTTPError } from 'ky';

export async function getHttpErrorStatus(error: unknown): Promise<number | undefined> {
  if (error instanceof HTTPError) {
    return error.response.status;
  }
  return undefined;
}

export async function getHttpErrorDetail(error: unknown): Promise<string | undefined> {
  if (!(error instanceof HTTPError)) return undefined;
  try {
    const body = (await error.response.clone().json()) as { detail?: string };
    return typeof body.detail === 'string' ? body.detail : undefined;
  } catch {
    return undefined;
  }
}
