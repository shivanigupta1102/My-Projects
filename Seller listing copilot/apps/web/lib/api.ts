import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type { ApiResponse } from "@listingpilot/shared-types";

const TOKEN_HEADER = "Authorization";
const LOCALHOST_API = "http://localhost:4000/api/v1";

function resolveBaseUrl(): string {
  if (typeof window === "undefined") return LOCALHOST_API;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return LOCALHOST_API;
  return `${window.location.origin}/api/v1`;
}

export const api: AxiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  config.baseURL = resolveBaseUrl();
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("listingpilot_auth_token");
    if (token) {
      config.headers.set(TOKEN_HEADER, `Bearer ${token}`);
    }
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
