import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';

const PaymentForm = ({ open, onClose, milestone, onSubmit, projectId }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const amountFieldRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      // Reset form data when dialog opens
      setAmount('');
      setDescription('');
      setError(null);
      // Focus the amount field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        if (amountFieldRef.current) {
          amountFieldRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const paymentData = {
      projectId: parseInt(projectId),
      milestoneId: milestone.id,
      amount: parseFloat(amount),
      description,
    };

    try {
      await onSubmit(paymentData);
      setAmount('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Realizar Pago para {milestone?.title}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <div style={{ marginBottom: '1rem' }}>
            <TextField
              inputRef={amountFieldRef}
              label="Monto"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, step: "0.01" }}
              helperText={`Monto pendiente: ${milestone?.pendingAmount || 0}€`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  document.getElementById('payment-description-field').focus();
                }
              }}
            />
          </div>
          
          <TextField
            id="payment-description-field"
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? 'Procesando...' : 'Realizar Pago'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm; 