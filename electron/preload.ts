import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Connection management
  saveConnection: (connection: any) => ipcRenderer.invoke('save-connection', connection),
  getConnections: () => ipcRenderer.invoke('get-connections'),
  deleteConnection: (connectionId: string) => ipcRenderer.invoke('delete-connection', connectionId),

  // Query history
  saveQueryHistory: (connectionId: string, query: string) =>
    ipcRenderer.invoke('save-query-history', connectionId, query),
  getQueryHistory: (connectionId: string) => ipcRenderer.invoke('get-query-history', connectionId),

  // Settings
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),

  // File operations
  saveSQLFile: (content: string) => ipcRenderer.invoke('save-sql-file', content),
  exportData: (data: any[], format: string, fileName: string) =>
    ipcRenderer.invoke('export-data', data, format, fileName),
});

// Type definitions for TypeScript
export interface ElectronAPI {
  saveConnection: (connection: any) => Promise<any>;
  getConnections: () => Promise<any[]>;
  deleteConnection: (connectionId: string) => Promise<any>;
  saveQueryHistory: (connectionId: string, query: string) => Promise<any>;
  getQueryHistory: (connectionId: string) => Promise<any[]>;
  saveSettings: (settings: any) => Promise<any>;
  getSettings: () => Promise<any>;
  saveSQLFile: (content: string) => Promise<any>;
  exportData: (data: any[], format: string, fileName: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
