import { create } from 'zustand';
import api from './api';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    fetchProfile: () => Promise<void>;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: false,

    hydrate: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                set({ token, user: JSON.parse(userStr) });
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    },

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/auth/login', { email, password });
            const { user, access_token } = res.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token: access_token, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
            const res = await api.post('/auth/register', { username, email, password });
            const { user, access_token } = res.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token: access_token, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
    },

    fetchProfile: async () => {
        try {
            const res = await api.get('/auth/profile');
            const user = res.data;
            localStorage.setItem('user', JSON.stringify(user));
            set({ user });
        } catch {
            // Token might be expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null });
        }
    },
}));
