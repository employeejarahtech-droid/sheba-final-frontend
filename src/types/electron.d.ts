export interface IElectronAPI {
    login: (credentials: { email: string; password: string }) => Promise<{
        success: boolean;
        user?: {
            id: number;
            name: string;
            email: string;
            role_id: number;
        };
        error?: string;
    }>;
}

declare global {
    interface Window {
        api?: IElectronAPI;
    }
}
