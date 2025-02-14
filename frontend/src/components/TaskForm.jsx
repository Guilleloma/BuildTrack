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

const TaskForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = React.useState({
    title: '',
    description: ''
  });
  const [error, setError] = React.useState('');
  const titleFieldRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      // Reset form data when dialog opens
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || ''
        });
      } else {
        setFormData({
          title: '',
          description: ''
        });
      }
      // Focus the title field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        if (titleFieldRef.current) {
          titleFieldRef.current.focus();
        }
      }, 100);
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    onSubmit({
      title: formData.title,
      description: formData.description
    });
    setError('');
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: ''
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Task' : 'New Task'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            inputRef={titleFieldRef}
            label="Title"
            fullWidth
            margin="normal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('task-description-field').focus();
              }
            }}
          />
          <TextField
            id="task-description-field"
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
            {initialData ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm; 