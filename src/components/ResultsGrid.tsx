import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Button,
  ButtonGroup,
  Chip,
} from '@mui/material';
import {
  GetApp as ExportIcon,
  ViewList as TableViewIcon,
  ViewModule as RecordViewIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowsProp, GridToolbar } from '@mui/x-data-grid';
import { useAppStore } from '../store/appStore';
import { RecordView } from './RecordView';

export const ResultsGrid: React.FC = () => {
  const { queryResult, selectedView, setSelectedView, isExecuting } = useAppStore();
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    if (!queryResult || queryResult.rows.length === 0) {
      return;
    }

    try {
      const result = await window.electronAPI.exportData(
        queryResult.rows,
        format,
        `export_${new Date().getTime()}.${format}`
      );

      if (result.success && !result.canceled) {
        // Export successful
      }
    } catch (error: any) {
      console.error('Error exporting data:', error);
      alert('Error exporting data: ' + error.message);
    }

    handleExportClose();
  };

  const handleCopyColumnHeaders = () => {
    if (selectedColumns.length > 0) {
      navigator.clipboard.writeText(selectedColumns.join(', '));
    } else if (queryResult) {
      navigator.clipboard.writeText(queryResult.columns.join(', '));
    }
  };

  const columns: GridColDef[] = useMemo(() => {
    if (!queryResult) return [];

    return queryResult.columns.map((col) => ({
      field: col,
      headerName: col,
      width: 150,
      editable: false,
      sortable: true,
      filterable: true,
      headerClassName: 'results-grid-header',
    }));
  }, [queryResult]);

  const rows: GridRowsProp = useMemo(() => {
    if (!queryResult) return [];

    return queryResult.rows.map((row, index) => ({
      id: index,
      ...row,
    }));
  }, [queryResult]);

  if (!queryResult && !isExecuting) {
    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography color="text.secondary">Execute a query to see results</Typography>
      </Paper>
    );
  }

  if (isExecuting) {
    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography color="text.secondary">Executing query...</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        variant="dense"
        sx={{ minHeight: 48, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {queryResult && (
            <>
              {queryResult.rowCount || queryResult.rows.length} rows
              {queryResult.executionTime && ` • ${queryResult.executionTime}s`}
            </>
          )}
        </Typography>

        <ButtonGroup size="small" sx={{ mr: 2 }}>
          <Tooltip title="Table View">
            <Button
              onClick={() => setSelectedView('table')}
              variant={selectedView === 'table' ? 'contained' : 'outlined'}
            >
              <TableViewIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Record View">
            <Button
              onClick={() => setSelectedView('record')}
              variant={selectedView === 'record' ? 'contained' : 'outlined'}
            >
              <RecordViewIcon />
            </Button>
          </Tooltip>
        </ButtonGroup>

        {selectedColumns.length > 0 && (
          <>
            <Chip
              label={`${selectedColumns.length} selected`}
              size="small"
              sx={{ mr: 1 }}
              onDelete={() => setSelectedColumns([])}
            />
            <Tooltip title="Copy Column Names">
              <IconButton size="small" onClick={handleCopyColumnHeaders} sx={{ mr: 1 }}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}

        <Tooltip title="Export Data">
          <IconButton onClick={handleExportClick}>
            <ExportIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
          <MenuItem onClick={() => handleExport('json')}>Export as JSON</MenuItem>
          <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
        </Menu>
      </Toolbar>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {selectedView === 'table' ? (
          <DataGrid
            rows={rows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            slots={{
              toolbar: GridToolbar,
            }}
            onColumnHeaderClick={(params) => {
              // Handle column header click for copying
              const col = params.field;
              if (selectedColumns.includes(col)) {
                setSelectedColumns(selectedColumns.filter((c) => c !== col));
              } else {
                setSelectedColumns([...selectedColumns, col]);
              }
            }}
            sx={{
              border: 0,
              '& .results-grid-header': {
                backgroundColor: 'background.default',
              },
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaders': {
                borderColor: 'divider',
              },
            }}
          />
        ) : (
          <RecordView />
        )}
      </Box>
    </Box>
  );
};
