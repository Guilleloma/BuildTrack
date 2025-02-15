import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';

const MilestoneForm = ({ open, onClose, onSubmit, milestone }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    budget: ''
  });
  const [error, setError] = React.useState('');
  const nameFieldRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      // Reset form data when dialog opens
      if (milestone) {
        setFormData({
          name: milestone.name || '',
          description: milestone.description || '',
          budget: milestone.budget || ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          budget: ''
        });
      }
      // Focus the name field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        if (nameFieldRef.current) {
          nameFieldRef.current.focus();
        }
      }, 100);
    }
  }, [open, milestone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    onSubmit({
      name: formData.name,
      description: formData.description,
      budget: parseFloat(formData.budget) || 0
    });
    setError('');
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      budget: ''
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {milestone ? 'Edit Milestone' : 'New Milestone'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            inputRef={nameFieldRef}
            label="Name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
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
            fullWidth
            margin="normal"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
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
            fullWidth
            margin="normal"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
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