import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { getApiUrl } from '../config';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editedTaxRate, setEditedTaxRate] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl('/settings'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Error fetching settings');
        const data = await response.json();
        setSettings(data);
        setEditedTaxRate(data.defaultTaxRate.toString());
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const taxRate = parseFloat(editedTaxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error('Tax rate must be a number between 0 and 100');
      }

      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          defaultTaxRate: taxRate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating settings');
      }

      await fetchSettings();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={2} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Tax Settings
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure the default tax rate (IVA) that will be applied to new milestones.
              This rate will be used when creating milestones with tax enabled.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Settings updated successfully
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Default Tax Rate (%)"
              type="number"
              value={editedTaxRate}
              onChange={(e) => setEditedTaxRate(e.target.value)}
              fullWidth
              required
              inputProps={{
                min: "0",
                max: "100",
                step: "0.1"
              }}
              helperText="Enter a value between 0 and 100"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Current default tax rate: {settings?.defaultTaxRate}%
            </Typography>
            {settings?.updatedAt && (
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
          >
            Save Changes
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SettingsPage; 
