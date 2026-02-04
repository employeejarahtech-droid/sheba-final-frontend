import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});

// Legacy API for backward compatibility
contextBridge.exposeInMainWorld('api', {
    login: (credentials: { email: string; password: string }) => ipcRenderer.invoke('login', credentials),
});
