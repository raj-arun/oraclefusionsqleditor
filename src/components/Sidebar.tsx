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
  Refresh as RefreshIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import TableViewIcon from '@mui/icons-material/TableView';
import ViewListIcon from '@mui/icons-material/ViewList';
import InsertChartIcon from '@mui/icons-material/InsertChart';
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

  const parseCatalogResponse = (responseData: any): DatabaseObject[] => {
    try {
      console.log('Parsing catalog response:', JSON.stringify(responseData, null, 2));

      const envelope = responseData?.['soapenv:Envelope'] || responseData?.Envelope;
      const body = envelope?.['soapenv:Body'] || envelope?.Body;
      const response = body?.getFolderContentsInSessionResponse;

      if (!response) {
        console.log('No getFolderContentsInSessionResponse found');
        return [];
      }

      const items = response.item || [];
      const itemArray = Array.isArray(items) ? items : [items];

      console.log('Found items:', itemArray);

      const dataModels: DatabaseObject[] = [];

      itemArray.forEach((item: any) => {
        const type = item['@_type'] || item.type;
        const name = item['@_name'] || item.name;
        const path = item['@_path'] || item.path;

        console.log('Processing item:', { type, name, path });

        if (type === 'folder') {
          dataModels.push({
            name: name,
            type: 'datamodel',
            path: path,
            folder: path,
            children: [], // Will be loaded on demand
          });
        } else if (type === 'dataModel' || type === 'datamodel') {
          dataModels.push({
            name: name,
            type: 'datamodel',
            path: path,
          });
        }
      });

      return dataModels;
    } catch (error) {
      console.error('Error parsing catalog response:', error);
      return [];
    }
  };

  const loadDatabaseObjects = async () => {
    if (!activeConnection) return;

    setLoading(true);
    try {
      const biService = createBIPublisherService(activeConnection);

      // Load root catalog structure
      const result = await biService.getCatalogItems('/');

      if (result.success) {
        const dataModels = parseCatalogResponse(result.data);

        const objects: DatabaseObject[] = [
          {
            name: 'Tables',
            type: 'table',
            children: [
              // Tables will be loaded from a different source in the future
            ],
          },
          {
            name: 'Views',
            type: 'view',
            children: [
              // Views will be loaded from a different source in the future
            ],
          },
          {
            name: 'Data Models',
            type: 'datamodel',
            children: dataModels,
          },
        ];

        setDatabaseObjects(objects);

        // Auto-expand the first level
        setExpanded({
          'Data Models': true,
        });
      }
    } catch (error) {
      console.error('Error loading database objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContents = async (folderPath: string): Promise<DatabaseObject[]> => {
    if (!activeConnection) return [];

    try {
      const biService = createBIPublisherService(activeConnection);
      const result = await biService.getCatalogItems(folderPath);

      if (result.success) {
        return parseCatalogResponse(result.data);
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
    }

    return [];
  };

  const handleToggle = async (item: DatabaseObject) => {
    const isCurrentlyExpanded = expanded[item.name];

    // If expanding a folder and it has no children loaded yet, load them
    if (!isCurrentlyExpanded && item.folder && (!item.children || item.children.length === 0)) {
      console.log('Loading folder contents for:', item.folder);
      const contents = await loadFolderContents(item.folder);

      if (contents.length > 0) {
        // Update the item's children
        setDatabaseObjects((prevObjects) => {
          const updateChildren = (objects: DatabaseObject[]): DatabaseObject[] => {
            return objects.map((obj) => {
              if (obj.name === item.name && obj.path === item.path) {
                return { ...obj, children: contents };
              }
              if (obj.children) {
                return { ...obj, children: updateChildren(obj.children) };
              }
              return obj;
            });
          };
          return updateChildren(prevObjects);
        });
      }
    }

    setExpanded((prev) => ({
      ...prev,
      [item.name]: !prev[item.name],
    }));
  };

  const getIcon = (type: DatabaseObject['type'], isExpanded?: boolean, isFolder?: boolean) => {
    if (isFolder) {
      return isExpanded ? (
        <FolderOpenIcon fontSize="small" sx={{ color: '#FFB74D' }} />
      ) : (
        <FolderIcon fontSize="small" sx={{ color: '#FFA726' }} />
      );
    }

    switch (type) {
      case 'table':
        return <TableViewIcon fontSize="small" sx={{ color: '#42A5F5' }} />;
      case 'view':
        return <ViewListIcon fontSize="small" sx={{ color: '#AB47BC' }} />;
      case 'datamodel':
        return <InsertChartIcon fontSize="small" sx={{ color: '#66BB6A' }} />;
      default:
        return <FolderIcon fontSize="small" sx={{ color: '#FFA726' }} />;
    }
  };

  const renderTreeItem = (item: DatabaseObject, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = !!item.folder;
    const hasChildrenOrIsFolder = hasChildren || isFolder;
    const isExpanded = expanded[item.name] || false;

    return (
      <React.Fragment key={`${item.path || item.name}-${level}`}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            onClick={() => hasChildrenOrIsFolder && handleToggle(item)}
            sx={{ py: 0.5 }}
          >
            {hasChildrenOrIsFolder && (
              <ListItemIcon sx={{ minWidth: 32 }}>
                {isExpanded ? (
                  <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                ) : (
                  <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                )}
              </ListItemIcon>
            )}
            <ListItemIcon sx={{ minWidth: 36, ml: hasChildrenOrIsFolder ? 0 : 4 }}>
              {getIcon(item.type, isExpanded, isFolder)}
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
