import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/shared/lib/axios';
import { useAuth, type AuthUser } from '@/shared/hooks/useAuth';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    data: AuthUser;
}

export function useLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const response = await api.post<LoginResponse>('/auth/login', credentials);
            return response.data;
        },
        onSuccess: (data) => {
            login(data.token, data.data);
            navigate('/dashboard');
        },
    });
}
