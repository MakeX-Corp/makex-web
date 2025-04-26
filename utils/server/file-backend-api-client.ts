import axios from 'axios';

const API_KEY = process.env.FILE_BACKEND_API_KEY;

if (!API_KEY) {
  throw new Error('FILE_BACKEND_API_KEY environment variable is not set');
}

export const createFileBackendApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  return {
    get: async (url: string, params?: any) => {
      const response = await client.get(url, { params });
      return response.data;
    },
    getFile: async (url: string, params?: any) => {
      const response = await client.get(url, { 
        params,
        responseType: 'arraybuffer',
        headers: {
          'X-API-Key': API_KEY,
        }
      });
      return {
        data: response.data,
        headers: response.headers,
      };
    },
    post: async (url: string, data?: any) => {
      const response = await client.post(url, data);
      return response.data;
    },
    put: async (url: string, data?: any) => {
      const response = await client.put(url, data);
      return response.data;
    },
    delete: async (url: string, data?: any) => {
      const response = await client.delete(url, { data });
      return response.data;
    },
  };
}; 