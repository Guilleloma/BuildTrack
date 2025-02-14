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

const MilestoneForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    cost: ''
  });
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        cost: initialData.cost || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        cost: ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    onSubmit({
      title: formData.title,
      description: formData.description,
      cost: parseFloat(formData.cost) || 0
    });
    setError('');
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      cost: ''
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Milestone' : 'New Milestone'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
          />
          <TextField
            label="Cost"
            fullWidth
            margin="normal"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
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
            {initialData ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MilestoneForm; 