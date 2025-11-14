import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Box, IconButton, Toolbar, Tooltip, Divider } from '@mui/material';
import {
  PlayArrow as RunIcon,
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import * as monaco from 'monaco-editor';

export const SQLEditor: React.FC = () => {
  const {
    currentQuery,
    setCurrentQuery,
    settings,
    setHistoryDrawerOpen,
    activeConnection,
    setIsExecuting,
    setQueryResult,
    addToHistory,
  } = useAppStore();

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure SQL language
    monaco.languages.setLanguageConfiguration('sql', {
      comments: {
        lineComment: '--',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: "'", close: "'" },
        { open: '"', close: '"' },
      ],
    });

    // Add keyboard shortcut for running query (Ctrl+Enter or Cmd+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunQuery();
    });
  };

  const handleRunQuery = async () => {
    if (!currentQuery.trim()) {
      return;
    }

    if (!activeConnection) {
      alert('Please select a connection first');
      return;
    }

    setIsExecuting(true);

    try {
      // Add to history
      const historyItem = {
        id: crypto.randomUUID(),
        query: currentQuery,
        timestamp: new Date().toISOString(),
      };
      addToHistory(historyItem);
      await window.electronAPI.saveQueryHistory(activeConnection.id, currentQuery);

      // Execute query using BI Publisher service
      // For now, we'll show a mock result
      // In production, this will call the ExternalReportWSSService

      // Mock result for demonstration
      setTimeout(() => {
        setQueryResult({
          columns: ['ID', 'NAME', 'EMAIL', 'CREATED_DATE'],
          rows: [
            { ID: 1, NAME: 'John Doe', EMAIL: 'john@example.com', CREATED_DATE: '2024-01-01' },
            { ID: 2, NAME: 'Jane Smith', EMAIL: 'jane@example.com', CREATED_DATE: '2024-01-02' },
            { ID: 3, NAME: 'Bob Johnson', EMAIL: 'bob@example.com', CREATED_DATE: '2024-01-03' },
          ],
          rowCount: 3,
          executionTime: 0.45,
        });
        setIsExecuting(false);
      }, 1000);
    } catch (error: any) {
      console.error('Error executing query:', error);
      alert('Error executing query: ' + error.message);
      setIsExecuting(false);
    }
  };

  const handleSaveQuery = async () => {
    if (!currentQuery.trim()) {
      return;
    }

    try {
      const result = await window.electronAPI.saveSQLFile(currentQuery);
      if (result.success && !result.canceled) {
        // File saved successfully
      }
    } catch (error: any) {
      console.error('Error saving file:', error);
      alert('Error saving file: ' + error.message);
    }
  };

  const handleOpenQuery = async () => {
    try {
      const result = await window.electronAPI.openSQLFile();
      if (result.success && !result.canceled && result.content) {
        setCurrentQuery(result.content);
      }
    } catch (error: any) {
      console.error('Error opening file:', error);
      alert('Error opening file: ' + error.message);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ minHeight: 48, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Tooltip title="Run Query (Ctrl+Enter)">
          <IconButton color="primary" onClick={handleRunQuery}>
            <RunIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open SQL File">
          <IconButton onClick={handleOpenQuery}>
            <OpenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save Query">
          <IconButton onClick={handleSaveQuery}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Query History">
          <IconButton onClick={() => setHistoryDrawerOpen(true)}>
            <HistoryIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={currentQuery}
          onChange={(value) => setCurrentQuery(value || '')}
          onMount={handleEditorDidMount}
          theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            minimap: { enabled: true },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </Box>
    </Box>
  );
};
