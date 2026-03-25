import type { ApiResponse } from "../types";
import { getApiBaseUrl } from "./endpoints";

/**
 * API Client
 * Handles HTTP requests with error handling and mock mode support
 */

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

export interface FetchOptions extends RequestInit {
  skipErrorHandling?: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl();
  }

  /**
   * Generic fetch method with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipErrorHandling, ...fetchOptions } = options;

    const url = this.baseUrl + endpoint;
    const headers = {
      ...DEFAULT_HEADERS,
      ...fetchOptions.headers,
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`API Error [${endpoint}]:`, message);

      if (skipErrorHandling) {
        throw error;
      }

      return {
        success: false,
        error: {
          code: "FETCH_ERROR",
          message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // GET
  async get<T>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: "GET" });
  }

  // POST
  async post<T>(
    endpoint: string,
    body?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT
  async put<T>(
    endpoint: string,
    body?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH
  async patch<T>(
    endpoint: string,
    body?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE
  async delete<T>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
