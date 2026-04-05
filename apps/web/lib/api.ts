import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type { ApiResponse } from "@listingpilot/shared-types";

const TOKEN_HEADER = "Authorization";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
  ).replace(/\/$/, "");
}

export const api: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = window.localStorage.getItem("listingpilot_auth_token");
  if (token) {
    config.headers.set(TOKEN_HEADER, `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; error?: string }>) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("listingpilot_auth_token");
    }
    return Promise.reject(error);
  },
);

function unwrap<T>(res: AxiosResponse<ApiResponse<T>>): T {
  const body = res.data;
  if (!body.success) {
    throw new Error(body.error ?? "Request failed");
  }
  return body.data;
}

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.get<ApiResponse<T>>(url, config);
  return unwrap(res);
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, body, config);
  return unwrap(res);
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.patch<ApiResponse<T>>(url, body, config);
  return unwrap(res);
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.delete<ApiResponse<T>>(url, config);
  return unwrap(res);
}

/** Multipart upload (omit JSON Content-Type so axios sets boundary). */
export async function apiPostMultipart<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": undefined,
    },
  });
  return unwrap(res);
}
