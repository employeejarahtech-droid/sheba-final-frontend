"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
});
// Legacy API for backward compatibility
electron_1.contextBridge.exposeInMainWorld('api', {
    login: (credentials) => electron_1.ipcRenderer.invoke('login', credentials),
});
