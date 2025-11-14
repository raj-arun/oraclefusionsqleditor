import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { Connection } from '../types';
import { createBIPublisherService } from '../services/biPublisherService';

interface ConnectionManagerProps {
  open: boolean;
  onClose: () => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({ open, onClose }) => {
  const { connections, setConnections, setActiveConnection, addConnection } = useAppStore();

  const [editMode, setEditMode] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    useSSO: false,
  });
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const loadedConnections = await window.electronAPI.getConnections();
      setConnections(loadedConnections);
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateUrl = (url: string): boolean => {
    if (!url.endsWith('oraclecloud.com') && !url.includes('oraclecloud.com/')) {
      setError('URL must end with oraclecloud.com');
      return false;
    }
    return true;
  };

  const handleSaveConnection = async () => {
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Connection name is required');
      return;
    }

    if (!formData.url.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(formData.url)) {
      return;
    }

    if (!formData.useSSO) {
      if (!formData.username.trim()) {
        setError('Username is required');
        return;
      }

      if (!formData.password.trim() && !selectedConnection) {
        setError('Password is required');
        return;
      }
    }

    try {
      const connectionData: Connection = {
        id: selectedConnection?.id || '',
        name: formData.name,
        url: formData.url.startsWith('https://') ? formData.url : `https://${formData.url}`,
        username: formData.username,
        password: formData.password,
        useSSO: formData.useSSO,
        createdAt: selectedConnection?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await window.electronAPI.saveConnection(connectionData);

      if (result.success) {
        // Create folder in BI Catalog
        try {
          const biService = createBIPublisherService(result.connection);
          await biService.createFolder('/Custom/NACFusionConnector');
        } catch (err) {
          console.error('Error creating folder:', err);
          // Continue even if folder creation fails
        }

        await loadConnections();
        handleCloseForm();
      } else {
        setError(result.error || 'Failed to save connection');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save connection');
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setTesting(true);

    if (!validateUrl(formData.url)) {
      setTesting(false);
      return;
    }

    try {
      const tempConnection: Connection = {
        id: 'temp',
        name: formData.name,
        url: formData.url.startsWith('https://') ? formData.url : `https://${formData.url}`,
        username: formData.username,
        password: formData.password,
        useSSO: formData.useSSO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const biService = createBIPublisherService(tempConnection);
      const result = await biService.testConnection();

      if (result.success) {
        setError('');
        alert('Connection successful!');
      } else {
        setError('Connection failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err: any) {
      setError('Connection failed: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleEditConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setFormData({
      name: connection.name,
      url: connection.url,
      username: connection.username,
      password: '', // Don't show password
      useSSO: connection.useSSO,
    });
    setEditMode(true);
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        await window.electronAPI.deleteConnection(connectionId);
        await loadConnections();
      } catch (err) {
        console.error('Error deleting connection:', err);
      }
    }
  };

  const handleConnectTo = async (connection: Connection) => {
    try {
      // Login to get session ID
      const biService = createBIPublisherService(connection);
      const loginResult = await biService.login();

      if (loginResult.success) {
        // Update connection with session ID
        const updatedConnection = {
          ...connection,
          sessionId: loginResult.data.sessionId,
        };
        setActiveConnection(updatedConnection);
        onClose();
      } else {
        setError('Failed to login: ' + (loginResult.error || 'Unknown error'));
      }
    } catch (err: any) {
      setError('Failed to login: ' + err.message);
    }
  };

  const handleCloseForm = () => {
    setEditMode(false);
    setSelectedConnection(null);
    setFormData({
      name: '',
      url: '',
      username: '',
      password: '',
      useSSO: false,
    });
    setError('');
  };

  const handleClose = () => {
    handleCloseForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? (selectedConnection ? 'Edit Connection' : 'New Connection') : 'Manage Connections'}
      </DialogTitle>
      <DialogContent>
        {!editMode ? (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setEditMode(true)}
                fullWidth
              >
                Add New Connection
              </Button>
            </Box>

            {connections.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography color="text.secondary">No connections yet. Add your first connection to get started.</Typography>
              </Paper>
            ) : (
              <List>
                {connections.map((conn, index) => (
                  <React.Fragment key={conn.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={conn.name}
                        secondary={`${conn.url} • ${conn.username}`}
                      />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleConnectTo(conn)}
                          sx={{ mr: 1 }}
                        >
                          Connect
                        </Button>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditConnection(conn)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteConnection(conn.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Connection Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              required
            />

            <TextField
              label="URL"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="https://your-instance.oraclecloud.com"
              required
              helperText="Must end with oraclecloud.com"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.useSSO}
                  onChange={(e) => handleInputChange('useSSO', e.target.checked)}
                />
              }
              label="Use SSO Authentication"
              sx={{ mb: 2 }}
            />

            {!formData.useSSO && (
              <>
                <TextField
                  label="Username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                  required={!selectedConnection}
                  helperText={selectedConnection ? 'Leave empty to keep existing password' : ''}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}

            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testing}
              fullWidth
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button onClick={handleSaveConnection} variant="contained">
              Save
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
