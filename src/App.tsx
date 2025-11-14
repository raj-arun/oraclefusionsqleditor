import React, { useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Storage as ConnectionIcon,
} from '@mui/icons-material';
import { useAppStore } from './store/appStore';
import { getTheme } from './styles/theme';
import { ConnectionManager } from './components/ConnectionManager';
import { SettingsDialog } from './components/SettingsDialog';
import { Sidebar } from './components/Sidebar';
import { SQLEditor } from './components/SQLEditor';
import { ResultsGrid } from './components/ResultsGrid';
import { QueryHistory } from './components/QueryHistory';

const SIDEBAR_WIDTH = 280;

function App() {
  const {
    settings,
    setSettings,
    sidebarOpen,
    setSidebarOpen,
    connectionDialogOpen,
    setConnectionDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,
    activeConnection,
  } = useAppStore();

  const theme = getTheme(settings.theme);

  useEffect(() => {
    // Load settings on startup
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.electronAPI.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleTheme = () => {
    const newSettings = {
      ...settings,
      theme: settings.theme === 'dark' ? 'light' as const : 'dark' as const,
    };
    setSettings(newSettings);
    window.electronAPI.saveSettings(newSettings);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static" elevation={1}>
          <Toolbar variant="dense">
            <Tooltip title="Toggle Sidebar">
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>

            <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 3 }}>
              Oracle Fusion SQL Editor
            </Typography>

            {activeConnection && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                  flexGrow: 1,
                  maxWidth: 400,
                }}
              >
                <ConnectionIcon fontSize="small" />
                <Typography variant="body2" noWrap>
                  {activeConnection.name}
                </Typography>
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Connections">
              <IconButton color="inherit" onClick={() => setConnectionDialogOpen(true)}>
                <ConnectionIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {settings.theme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={() => setSettingsDialogOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <Sidebar />

          {/* Main Panel */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              ml: sidebarOpen ? 0 : 0,
              transition: 'margin 0.2s',
            }}
          >
            {/* SQL Editor - Top Half */}
            <Box
              sx={{
                height: '50%',
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <SQLEditor />
            </Box>

            {/* Results Grid - Bottom Half */}
            <Box
              sx={{
                height: '50%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ResultsGrid />
            </Box>
          </Box>
        </Box>

        {/* Dialogs and Drawers */}
        <ConnectionManager
          open={connectionDialogOpen}
          onClose={() => setConnectionDialogOpen(false)}
        />

        <SettingsDialog
          open={settingsDialogOpen}
          onClose={() => setSettingsDialogOpen(false)}
        />

        <QueryHistory />
      </Box>
    </ThemeProvider>
  );
}

export default App;
