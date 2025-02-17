import React from 'react';
import { getApiUrl } from '../config';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';

const MilestoneForm = ({ open, onClose, onSubmit, milestone }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    budget: '',
    hasTax: true,
    taxRate: null
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [defaultTaxRate, setDefaultTaxRate] = React.useState(21);
  const nameFieldRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      fetchDefaultTaxRate();
      
      // Solo rellenar el formulario si estamos editando un milestone existente
      if (milestone) {
        setFormData({
          name: milestone.name || '',
          description: milestone.description || '',
          budget: milestone.budget || '',
          hasTax: milestone.hasTax !== undefined ? milestone.hasTax : true,
          taxRate: milestone.taxRate || defaultTaxRate
        });
      } else {
        // Si es un nuevo milestone, resetear el formulario
        setFormData({
          name: '',
          description: '',
          budget: '',
          hasTax: true,
          taxRate: defaultTaxRate
        });
      }
      setLoading(false);
    }
  }, [open, milestone, defaultTaxRate]);

  const fetchDefaultTaxRate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/settings'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error fetching settings');
      const data = await response.json();
      setDefaultTaxRate(data.defaultTaxRate || 21);
    } catch (error) {
      console.error('Error fetching default tax rate:', error);
      setDefaultTaxRate(21);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    onSubmit({
      name: formData.name,
      description: formData.description,
      budget: parseFloat(formData.budget) || 0,
      hasTax: formData.hasTax,
      taxRate: formData.hasTax ? parseFloat(formData.taxRate) || 21 : null
    });
    setError('');
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      budget: '',
      hasTax: true,
      taxRate: null
    });
    setError('');
    onClose();
  };

  const totalWithTax = formData.hasTax 
    ? (parseFloat(formData.budget) || 0) * (1 + (parseFloat(formData.taxRate) || 0) / 100)
    : parseFloat(formData.budget) || 0;

  if (loading && open) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{milestone ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            inputRef={nameFieldRef}
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            margin="normal"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('description-field').focus();
              }
            }}
          />
          
          <TextField
            id="description-field"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            margin="normal"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('budget-field').focus();
              }
            }}
          />
          
          <TextField
            id="budget-field"
            label="Budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            fullWidth
            required
            margin="normal"
            inputProps={{ min: 0, step: "0.01" }}
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasTax}
                  onChange={(e) => setFormData({ ...formData, hasTax: e.target.checked })}
                />
              }
              label="Apply Tax"
            />

            {formData.hasTax && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Using default tax rate: {formData.taxRate}%
                <br />
                The tax rate can be configured in Settings
              </Typography>
            )}
          </Box>

          {formData.budget && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Base Amount: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(parseFloat(formData.budget) || 0)}
              </Typography>
              {formData.hasTax && (
                <Typography variant="subtitle2" color="text.secondary">
                  Tax Amount ({formData.taxRate}%): {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format((parseFloat(formData.budget) || 0) * (parseFloat(formData.taxRate) || 0) / 100)}
                </Typography>
              )}
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                Total Amount: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalWithTax)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {milestone ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MilestoneForm; 