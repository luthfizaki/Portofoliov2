import { cookies } from "next/headers";
import { apiInternalUrl, type SessionUser } from "./api";

export async function sessionApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  const cookieStore = await cookies();
  try {
    const response = await fetch(`${apiInternalUrl}${path}`, {
      ...init,
      headers: { Cookie: cookieStore.toString(), ...init?.headers },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const response = await sessionApi<{ success: boolean; data: { user: SessionUser } }>("/api/v1/auth/me");
  return response?.success ? response.data.user : null;
}
