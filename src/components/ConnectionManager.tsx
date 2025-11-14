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
  IconButton,
  Typography,
  Paper,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudQueue as CloudIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
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
      alert('Invalid URL: The URL must end with oraclecloud.com');
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
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'divider',
                }}
              >
                <CloudIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No connections yet
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Add your first Oracle Fusion connection to get started
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {connections.map((conn) => (
                  <Grid item xs={12} key={conn.id}>
                    <Card
                      elevation={2}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          elevation: 4,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <CloudIcon color="primary" />
                          <Typography variant="h6" component="div">
                            {conn.name}
                          </Typography>
                          {conn.useSSO && (
                            <Chip label="SSO" size="small" color="info" />
                          )}
                        </Stack>
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LinkIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {conn.url}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {conn.username}
                            </Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleConnectTo(conn)}
                        >
                          Connect
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleEditConnection(conn)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteConnection(conn.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CloudIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="URL"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  validateUrl(e.target.value.trim());
                }
              }}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="https://your-instance.oraclecloud.com"
              required
              helperText="Must end with oraclecloud.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon color="action" />
                  </InputAdornment>
                ),
              }}
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
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
