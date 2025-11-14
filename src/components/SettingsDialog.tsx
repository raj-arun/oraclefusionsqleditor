import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { useAppStore } from '../store/appStore';
import { AppSettings } from '../types';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const FONT_FAMILIES = [
  'Consolas, Monaco, monospace',
  'Courier New, monospace',
  'Menlo, Monaco, monospace',
  'Monaco, Consolas, monospace',
  'Fira Code, monospace',
  'Source Code Pro, monospace',
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const { settings, setSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  const handleSave = async () => {
    try {
      await window.electronAPI.saveSettings(localSettings);
      setSettings(localSettings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Appearance
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Theme</InputLabel>
            <Select
              value={localSettings.theme}
              label="Theme"
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  theme: e.target.value as 'light' | 'dark',
                })
              }
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" gutterBottom>
            Editor
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Font Size: {localSettings.fontSize}px
            </Typography>
            <Slider
              value={localSettings.fontSize}
              onChange={(_, value) =>
                setLocalSettings({
                  ...localSettings,
                  fontSize: value as number,
                })
              }
              min={10}
              max={24}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Font Family</InputLabel>
            <Select
              value={localSettings.fontFamily}
              label="Font Family"
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  fontFamily: e.target.value,
                })
              }
            >
              {FONT_FAMILIES.map((font) => (
                <MenuItem key={font} value={font}>
                  <Typography sx={{ fontFamily: font }}>{font.split(',')[0]}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: localSettings.fontFamily,
                fontSize: `${localSettings.fontSize}px`,
              }}
            >
              SELECT * FROM employees WHERE department = 'Engineering';
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
