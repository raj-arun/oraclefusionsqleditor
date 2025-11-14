import { create } from 'zustand';
import { Connection, QueryHistoryItem, AppSettings, QueryResult, DatabaseObject } from '../types';

interface AppState {
  // Connections
  connections: Connection[];
  activeConnection: Connection | null;
  setConnections: (connections: Connection[]) => void;
  setActiveConnection: (connection: Connection | null) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (connection: Connection) => void;
  deleteConnection: (connectionId: string) => void;

  // Database objects
  databaseObjects: DatabaseObject[];
  setDatabaseObjects: (objects: DatabaseObject[]) => void;

  // Query
  currentQuery: string;
  setCurrentQuery: (query: string) => void;
  queryResult: QueryResult | null;
  setQueryResult: (result: QueryResult | null) => void;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;

  // Query history
  queryHistory: QueryHistoryItem[];
  setQueryHistory: (history: QueryHistoryItem[]) => void;
  addToHistory: (item: QueryHistoryItem) => void;

  // Settings
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedView: 'table' | 'record';
  setSelectedView: (view: 'table' | 'record') => void;
  currentRecordIndex: number;
  setCurrentRecordIndex: (index: number) => void;

  // Dialogs
  connectionDialogOpen: boolean;
  setConnectionDialogOpen: (open: boolean) => void;
  settingsDialogOpen: boolean;
  setSettingsDialogOpen: (open: boolean) => void;
  historyDrawerOpen: boolean;
  setHistoryDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Connections
  connections: [],
  activeConnection: null,
  setConnections: (connections) => set({ connections }),
  setActiveConnection: (connection) => set({ activeConnection: connection }),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  updateConnection: (connection) =>
    set((state) => ({
      connections: state.connections.map((c) => (c.id === connection.id ? connection : c)),
    })),
  deleteConnection: (connectionId) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
      activeConnection: state.activeConnection?.id === connectionId ? null : state.activeConnection,
    })),

  // Database objects
  databaseObjects: [],
  setDatabaseObjects: (objects) => set({ databaseObjects: objects }),

  // Query
  currentQuery: '',
  setCurrentQuery: (query) => set({ currentQuery: query }),
  queryResult: null,
  setQueryResult: (result) => set({ queryResult: result }),
  isExecuting: false,
  setIsExecuting: (executing) => set({ isExecuting: executing }),

  // Query history
  queryHistory: [],
  setQueryHistory: (history) => set({ queryHistory: history }),
  addToHistory: (item) =>
    set((state) => ({ queryHistory: [item, ...state.queryHistory].slice(0, 100) })),

  // Settings
  settings: {
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'Consolas, Monaco, monospace',
  },
  setSettings: (settings) => set({ settings }),

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedView: 'table',
  setSelectedView: (view) => set({ selectedView: view }),
  currentRecordIndex: 0,
  setCurrentRecordIndex: (index) => set({ currentRecordIndex: index }),

  // Dialogs
  connectionDialogOpen: false,
  setConnectionDialogOpen: (open) => set({ connectionDialogOpen: open }),
  settingsDialogOpen: false,
  setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),
  historyDrawerOpen: false,
  setHistoryDrawerOpen: (open) => set({ historyDrawerOpen: open }),
}));
