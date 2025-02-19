import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const location = useLocation();
  const { user } = useAuth();
  const isSandbox = location.pathname.startsWith('/sandbox');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editedTaxRate, setEditedTaxRate] = useState('');

  const fetchSettings = async () => {
    try {
      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('settings', isSandbox), {
        headers,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error loading settings');
      const data = await response.json();
      setSettings(data);
      setEditedTaxRate(data.defaultTaxRate.toString());
      setError(null);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Error loading settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [isSandbox, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const taxRate = parseFloat(editedTaxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error('Tax rate must be a number between 0 and 100');
      }

      let headers = {
        'Content-Type': 'application/json'
      };

      if (!isSandbox && user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('settings', isSandbox), {
        method: 'PUT',
        headers,
        credentials: 'include',
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
