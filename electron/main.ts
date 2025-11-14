import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import Store from 'electron-store';
import crypto from 'crypto';

// Initialize secure store
const store = new Store({
  encryptionKey: 'oracle-fusion-sql-editor-secret-key', // In production, use a more secure key
});

let mainWindow: BrowserWindow | null = null;

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = crypto.scryptSync('oracle-fusion-key', 'salt', 32);

// Encryption helper functions
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    backgroundColor: '#1e1e1e',
    show: false,
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// Save connection (encrypted)
ipcMain.handle('save-connection', async (_event, connection: any) => {
  try {
    const connections = store.get('connections', []) as any[];

    // Encrypt sensitive data
    const encryptedConnection = {
      ...connection,
      password: connection.password ? encrypt(connection.password) : '',
      id: connection.id || crypto.randomUUID(),
      createdAt: connection.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = connections.findIndex((c: any) => c.id === encryptedConnection.id);
    if (existingIndex >= 0) {
      connections[existingIndex] = encryptedConnection;
    } else {
      connections.push(encryptedConnection);
    }

    store.set('connections', connections);
    return { success: true, connection: { ...connection, id: encryptedConnection.id } };
  } catch (error) {
    console.error('Error saving connection:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get all connections (decrypted)
ipcMain.handle('get-connections', async () => {
  try {
    const connections = store.get('connections', []) as any[];
    return connections.map((conn: any) => ({
      ...conn,
      password: conn.password ? decrypt(conn.password) : '',
    }));
  } catch (error) {
    console.error('Error getting connections:', error);
    return [];
  }
});

// Delete connection
ipcMain.handle('delete-connection', async (_event, connectionId: string) => {
  try {
    const connections = store.get('connections', []) as any[];
    const filtered = connections.filter((c: any) => c.id !== connectionId);
    store.set('connections', filtered);
    return { success: true };
  } catch (error) {
    console.error('Error deleting connection:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Save query history
ipcMain.handle('save-query-history', async (_event, connectionId: string, query: string) => {
  try {
    const historyKey = `history_${connectionId}`;
    const history = store.get(historyKey, []) as any[];

    history.unshift({
      query,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    });

    // Keep only latest 100 queries
    const trimmedHistory = history.slice(0, 100);
    store.set(historyKey, trimmedHistory);

    return { success: true };
  } catch (error) {
    console.error('Error saving query history:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get query history
ipcMain.handle('get-query-history', async (_event, connectionId: string) => {
  try {
    const historyKey = `history_${connectionId}`;
    return store.get(historyKey, []) as any[];
  } catch (error) {
    console.error('Error getting query history:', error);
    return [];
  }
});

// Save settings
ipcMain.handle('save-settings', async (_event, settings: any) => {
  try {
    store.set('settings', settings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get settings
ipcMain.handle('get-settings', async () => {
  try {
    return store.get('settings', {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
    };
  }
});

// File dialog for saving SQL files
ipcMain.handle('save-sql-file', async (_event, content: string) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save SQL File',
      defaultPath: 'query.sql',
      filters: [
        { name: 'SQL Files', extensions: ['sql'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    }

    return { success: false, canceled: true };
  } catch (error) {
    console.error('Error saving SQL file:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Export data
ipcMain.handle('export-data', async (_event, data: any[], format: string, fileName: string) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Data',
      defaultPath: fileName,
      filters: [
        { name: format.toUpperCase() + ' Files', extensions: [format] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      let content = '';

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        // Simple CSV export
        const headers = Object.keys(data[0] || {});
        content = headers.join(',') + '\n';
        content += data.map(row =>
          headers.map(h => JSON.stringify(row[h] || '')).join(',')
        ).join('\n');
      }

      await fs.writeFile(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    }

    return { success: false, canceled: true };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: (error as Error).message };
  }
});
