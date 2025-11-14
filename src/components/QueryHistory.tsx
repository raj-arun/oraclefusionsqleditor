import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Divider,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  InsertDriveFile as InsertIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { QueryHistoryItem } from '../types';

const DRAWER_WIDTH = 400;

export const QueryHistory: React.FC = () => {
  const {
    historyDrawerOpen,
    setHistoryDrawerOpen,
    activeConnection,
    setCurrentQuery,
    queryHistory,
    setQueryHistory,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<QueryHistoryItem[]>([]);

  useEffect(() => {
    if (activeConnection && historyDrawerOpen) {
      loadHistory();
    }
  }, [activeConnection, historyDrawerOpen]);

  useEffect(() => {
    // Filter history based on search term
    if (searchTerm.trim()) {
      const filtered = queryHistory.filter((item) =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(queryHistory);
    }
  }, [searchTerm, queryHistory]);

  const loadHistory = async () => {
    if (!activeConnection) return;

    try {
      const history = await window.electronAPI.getQueryHistory(activeConnection.id);
      setQueryHistory(history);
    } catch (error) {
      console.error('Error loading query history:', error);
    }
  };

  const handleInsertQuery = (query: string) => {
    setCurrentQuery(query);
    setHistoryDrawerOpen(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const truncateQuery = (query: string, maxLength: number = 100) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  return (
    <Drawer
      anchor="right"
      open={historyDrawerOpen}
      onClose={() => setHistoryDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">Query History</Typography>
          <IconButton size="small" onClick={() => setHistoryDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {!activeConnection ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Connect to a database to view history
              </Typography>
            </Box>
          ) : filteredHistory.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'No matching queries found' : 'No query history yet'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Tooltip title="Insert to Editor">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleInsertQuery(item.query)}
                        >
                          <InsertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemButton onClick={() => handleInsertQuery(item.query)}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {truncateQuery(item.query)}
                          </Typography>
                        }
                        secondary={formatDate(item.timestamp)}
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
