import ky from 'ky';

const TOKEN_KEY = 'wc_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = ky.create({
  prefix: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? window.location.origin,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getToken();
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status === 401 && request.headers.has('Authorization')) {
          clearToken();
          window.location.replace('/login');
        }
      },
    ],
  },
});
