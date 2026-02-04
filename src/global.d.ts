export { };

declare global {
    interface Window {
        electron: {
            invoke: (channel: string, ...args: any[]) => Promise<any>;
        };
        api: {
            login: (credentials: { email: string; password: string }) => Promise<any>;
        };
    }
}
