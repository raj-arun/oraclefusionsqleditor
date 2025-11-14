// Connection types
export interface Connection {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  useSSO: boolean;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Database object types
export interface DatabaseObject {
  name: string;
  type: 'table' | 'view' | 'datamodel';
  path?: string;
  folder?: string;
  children?: DatabaseObject[];
}

// Query history
export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
}

// Settings
export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
}

// Query result
export interface QueryResult {
  columns: string[];
  rows: any[];
  executionTime?: number;
  rowCount?: number;
}

// Export format
export type ExportFormat = 'csv' | 'excel' | 'json';

// BI Publisher types
export interface BICatalogFolder {
  path: string;
  name: string;
  type: 'folder' | 'datamodel' | 'report';
}

export interface DataModel {
  path: string;
  name: string;
  folder: string;
}

// Web Service response types
export interface SOAPResponse {
  success: boolean;
  data?: any;
  error?: string;
}
