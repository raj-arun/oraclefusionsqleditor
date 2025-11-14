import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  TableChart as TableIcon,
  ViewList as ViewIcon,
  Assessment as DataModelIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { DatabaseObject } from '../types';
import { createBIPublisherService } from '../services/biPublisherService';

const DRAWER_WIDTH = 280;

export const Sidebar: React.FC = () => {
  const { sidebarOpen, activeConnection, databaseObjects, setDatabaseObjects } = useAppStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeConnection) {
      loadDatabaseObjects();
    }
  }, [activeConnection]);

  const loadDatabaseObjects = async () => {
    if (!activeConnection) return;

    setLoading(true);
    try {
      const biService = createBIPublisherService(activeConnection);

      // Load catalog structure
      const result = await biService.getCatalogItems('/');

      if (result.success) {
        // Parse and structure the database objects
        // This is a simplified version - actual parsing depends on XML structure
        const mockObjects: DatabaseObject[] = [
          {
            name: 'Tables',
            type: 'table',
            children: [
              { name: 'EMPLOYEES', type: 'table' },
              { name: 'DEPARTMENTS', type: 'table' },
              { name: 'PROJECTS', type: 'table' },
            ],
          },
          {
            name: 'Views',
            type: 'view',
            children: [
              { name: 'EMP_DEPT_VIEW', type: 'view' },
              { name: 'PROJECT_STATUS_VIEW', type: 'view' },
            ],
          },
          {
            name: 'Data Models',
            type: 'datamodel',
            children: [
              {
                name: 'Custom',
                type: 'datamodel',
                folder: '/Custom',
                children: [
                  {
                    name: 'NACFusionConnector',
                    type: 'datamodel',
                    folder: '/Custom/NACFusionConnector',
                    children: [
                      { name: 'EmployeeDataModel', type: 'datamodel', path: '/Custom/NACFusionConnector/EmployeeDataModel' },
                      { name: 'FinanceDataModel', type: 'datamodel', path: '/Custom/NACFusionConnector/FinanceDataModel' },
                    ],
                  },
                ],
              },
            ],
          },
        ];

        setDatabaseObjects(mockObjects);

        // Auto-expand the first level
        setExpanded({
          Tables: true,
          Views: true,
          'Data Models': true,
        });
      }
    } catch (error) {
      console.error('Error loading database objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (name: string) => {
    setExpanded((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const getIcon = (type: DatabaseObject['type']) => {
    switch (type) {
      case 'table':
        return <TableIcon fontSize="small" />;
      case 'view':
        return <ViewIcon fontSize="small" />;
      case 'datamodel':
        return <DataModelIcon fontSize="small" />;
      default:
        return <FolderIcon fontSize="small" />;
    }
  };

  const renderTreeItem = (item: DatabaseObject, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded[item.name] || false;

    return (
      <React.Fragment key={item.name}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            onClick={() => hasChildren && handleToggle(item.name)}
            sx={{ py: 0.5 }}
          >
            {hasChildren && (
              <ListItemIcon sx={{ minWidth: 32 }}>
                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </ListItemIcon>
            )}
            <ListItemIcon sx={{ minWidth: 36, ml: hasChildren ? 0 : 4 }}>
              {getIcon(item.type)}
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              primaryTypographyProps={{
                variant: 'body2',
                noWrap: true,
              }}
            />
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderTreeItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          height: '100%',
          borderRight: 1,
          borderColor: 'divider',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DatabaseIcon color="primary" />
            <Typography variant="subtitle2" noWrap>
              {activeConnection?.name || 'No Connection'}
            </Typography>
          </Box>
          {activeConnection && (
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadDatabaseObjects} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {!activeConnection ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Connect to a database to view objects
              </Typography>
            </Box>
          ) : loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          ) : (
            <List dense>
              {databaseObjects.map((item) => renderTreeItem(item))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
