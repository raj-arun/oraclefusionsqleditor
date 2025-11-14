import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  FirstPage as FirstIcon,
  LastPage as LastIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';

export const RecordView: React.FC = () => {
  const { queryResult, currentRecordIndex, setCurrentRecordIndex } = useAppStore();

  if (!queryResult || queryResult.rows.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No records to display</Typography>
      </Box>
    );
  }

  const totalRecords = queryResult.rows.length;
  const currentRecord = queryResult.rows[currentRecordIndex];

  const handleFirst = () => setCurrentRecordIndex(0);
  const handlePrev = () => setCurrentRecordIndex(Math.max(0, currentRecordIndex - 1));
  const handleNext = () => setCurrentRecordIndex(Math.min(totalRecords - 1, currentRecordIndex + 1));
  const handleLast = () => setCurrentRecordIndex(totalRecords - 1);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar variant="dense" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="First Record">
            <span>
              <IconButton
                size="small"
                onClick={handleFirst}
                disabled={currentRecordIndex === 0}
              >
                <FirstIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Previous Record">
            <span>
              <IconButton
                size="small"
                onClick={handlePrev}
                disabled={currentRecordIndex === 0}
              >
                <PrevIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Typography variant="body2">
            Record {currentRecordIndex + 1} of {totalRecords}
          </Typography>

          <Tooltip title="Next Record">
            <span>
              <IconButton
                size="small"
                onClick={handleNext}
                disabled={currentRecordIndex === totalRecords - 1}
              >
                <NextIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Last Record">
            <span>
              <IconButton
                size="small"
                onClick={handleLast}
                disabled={currentRecordIndex === totalRecords - 1}
              >
                <LastIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Toolbar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              {queryResult.columns.map((column) => (
                <TableRow key={column}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 600,
                      bgcolor: 'background.default',
                      width: '30%',
                    }}
                  >
                    {column}
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-word' }}>
                    {currentRecord[column] !== null && currentRecord[column] !== undefined
                      ? String(currentRecord[column])
                      : <Typography color="text.disabled" component="span">NULL</Typography>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};
