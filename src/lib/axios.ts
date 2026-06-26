import axios from 'axios';
import { getCookie } from './cookies';
import { useAuthStore } from '@/stores/auth-store';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
    const token = getCookie('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 = token expired or its user no longer exists. Clear the stale
        // session and send the user to login instead of trapping them in a
        // zombie session where every request keeps failing.
        if (error?.response?.status === 401) {
            const onLoginPage = window.location.pathname.startsWith('/login');
            if (!onLoginPage) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
