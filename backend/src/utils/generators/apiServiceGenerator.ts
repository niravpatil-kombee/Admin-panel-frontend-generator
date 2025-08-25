// src/utils/generators/apiServiceGenerator.ts

import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateApiService(): void {
  const servicesDir = path.join(getBaseDir(), "src", "services");
  if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir, { recursive: true });
  }

  const apiServicePath = path.join(servicesDir, "apiService.ts");

  const apiServiceContent = `
import api from '@/lib/api'; // Import the pre-configured Axios instance

/**
 * A consistent response shape for all API calls.
 * On success, it returns [data, null].
 * On error, it returns [null, error].
 * This allows for easy destructuring and error checking in components.
 * 
 * @example
 * const [users, error] = await apiService.get<User[]>('/users');
 * if (error) {
 *   // Handle the error
 * } else {
 *   // Use the users data
 * }
 */
export type ServiceResponse<T> = [T | null, any | null];

/**
 * A wrapper for the GET request that includes try-catch error handling.
 * @param url The API endpoint to call.
 * @param params Optional query parameters.
 * @returns A promise that resolves to a [data, error] tuple.
 */
const get = async <T>(url: string, params?: object): Promise<ServiceResponse<T>> => {
  try {
    const response = await api.get<T>(url, { params });
    return [response.data, null];
  } catch (error) {
    console.error('API GET Error:', error);
    return [null, error];
  }
};

/**
 * A wrapper for the POST request that includes try-catch error handling.
 * @param url The API endpoint to call.
 * @param data The payload to send.
 * @returns A promise that resolves to a [data, error] tuple.
 */
const post = async <T>(url: string, data: object): Promise<ServiceResponse<T>> => {
  try {
    const response = await api.post<T>(url, data);
    return [response.data, null];
  } catch (error) {
    console.error('API POST Error:', error);
    return [null, error];
  }
};

/**
 * A wrapper for the PUT request that includes try-catch error handling.
 * @param url The API endpoint to call.
 * @param data The payload to send.
 * @returns A promise that resolves to a [data, error] tuple.
 */
const put = async <T>(url: string, data: object): Promise<ServiceResponse<T>> => {
  try {
    const response = await api.put<T>(url, data);
    return [response.data, null];
  } catch (error) {
    console.error('API PUT Error:', error);
    return [null, error];
  }
};

/**
 * A wrapper for the PATCH request that includes try-catch error handling.
 * @param url The API endpoint to call.
 * @param data The payload to send.
 * @returns A promise that resolves to a [data, error] tuple.
 */
const patch = async <T>(url: string, data: object): Promise<ServiceResponse<T>> => {
  try {
    const response = await api.patch<T>(url, data);
    return [response.data, null];
  } catch (error) {
    console.error('API PATCH Error:', error);
    return [null, error];
  }
};

/**
 * A wrapper for the DELETE request that includes try-catch error handling.
 * 'del' is used as 'delete' is a reserved keyword.
 * @param url The API endpoint to call.
 * @returns A promise that resolves to a [data, error] tuple.
 */
const del = async <T>(url: string): Promise<ServiceResponse<T>> => {
  try {
    const response = await api.delete<T>(url);
    return [response.data, null];
  } catch (error) {
    console.error('API DELETE Error:', error);
    return [null, error];
  }
};

/**
 * A centralized API service object with built-in error handling.
 */
export const apiService = {
  get,
  post,
  put,
  patch,
  del,
};
`;

  fs.writeFileSync(apiServicePath, apiServiceContent, "utf8");
  console.log(`✅ Generated API Service with error handling at: ${apiServicePath}`);
}