export interface ElectronAPI {
  saveConnection: (connection: any) => Promise<any>;
  getConnections: () => Promise<any[]>;
  deleteConnection: (connectionId: string) => Promise<any>;
  saveQueryHistory: (connectionId: string, query: string) => Promise<any>;
  getQueryHistory: (connectionId: string) => Promise<any[]>;
  saveSettings: (settings: any) => Promise<any>;
  getSettings: () => Promise<any>;
  saveSQLFile: (content: string) => Promise<any>;
  openSQLFile: () => Promise<any>;
  exportData: (data: any[], format: string, fileName: string) => Promise<any>;
  soapRequest: (config: any) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
