import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { formatCurrency } from '../utils/formatters';

const PaymentForm = ({ open, onClose, milestone, onSubmit, projectId }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA_BANCARIA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const amountFieldRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      // Reset form data when dialog opens
      setAmount('');
      setDescription('');
      setPaymentMethod('TRANSFERENCIA_BANCARIA');
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
      projectId: projectId,
      milestoneId: milestone._id,
      amount: parseFloat(amount),
      description,
      paymentMethod,
    };

    try {
      const response = await fetch('/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'Payment would exceed milestone total cost') {
          throw new Error(
            `El pago excedería el presupuesto total del milestone:\n` +
            `• Pagado: ${formatCurrency(data.currentlyPaid)}\n` +
            `• Total: ${formatCurrency(data.totalCost)}\n` +
            `• Restante: ${formatCurrency(data.remaining)}`
          );
        }
        throw new Error(data.error || 'Error al procesar el pago');
      }

      setAmount('');
      setDescription('');
      setPaymentMethod('TRANSFERENCIA_BANCARIA');
      onClose();
      await onSubmit(paymentData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setPaymentMethod('TRANSFERENCIA_BANCARIA');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Realizar Pago para {milestone?.name}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                whiteSpace: 'pre-line',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              {error}
            </Alert>
          )}

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
              helperText={`Monto pendiente: ${formatCurrency(milestone?.budget - milestone?.paidAmount || 0)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  document.getElementById('payment-method-select').focus();
                }
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <FormControl fullWidth>
              <InputLabel id="payment-method-label">Método de Pago</InputLabel>
              <Select
                id="payment-method-select"
                labelId="payment-method-label"
                value={paymentMethod}
                label="Método de Pago"
                onChange={(e) => setPaymentMethod(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    document.getElementById('payment-description-field').focus();
                  }
                }}
              >
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
                <MenuItem value="BIZUM">Bizum</MenuItem>
                <MenuItem value="PAYPAL">PayPal</MenuItem>
              </Select>
            </FormControl>
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