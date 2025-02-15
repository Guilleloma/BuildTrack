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

const TaskForm = ({ open, onClose, onSubmit, task }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });
  const [error, setError] = React.useState('');
  const nameFieldRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      // Solo rellenar el formulario si estamos editando una tarea existente
      if (task) {
        setFormData({
          name: task.name || '',
          description: task.description || ''
        });
      } else {
        // Si es una nueva tarea, resetear el formulario
        setFormData({
          name: '',
          description: ''
        });
      }
      // Focus the name field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        if (nameFieldRef.current) {
          nameFieldRef.current.focus();
        }
      }, 100);
    }
  }, [open, task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    onSubmit({
      name: formData.name,
      description: formData.description
    });
    setError('');
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: ''
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {task ? 'Edit Task' : 'New Task'}
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
            {task ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm; 