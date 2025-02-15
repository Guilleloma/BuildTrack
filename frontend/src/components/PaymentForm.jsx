import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  Tooltip,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { formatCurrency } from '../utils/formatters';

const PaymentForm = ({ open, onClose, onSubmit, milestone }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paymentMethod: 'TRANSFERENCIA_BANCARIA'
  });
  const [error, setError] = useState(null);
  const [milestoneStatus, setMilestoneStatus] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (open && milestone) {
      // Calculate milestone amounts
      const baseAmount = parseFloat(milestone.budget || 0);
      const taxAmount = milestone.hasTax 
        ? baseAmount * (parseFloat(milestone.taxRate || 21) / 100)
        : 0;
      const totalWithTax = baseAmount + taxAmount;
      const paidAmount = parseFloat(milestone.paidAmount || 0);
      const remainingAmount = parseFloat((totalWithTax - paidAmount).toFixed(2));

      // Calculate percentages for warning
      const totalTasks = milestone.tasks?.length || 0;
      const completedTasks = milestone.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
      const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const currentPaymentPercentage = totalWithTax > 0 ? (paidAmount / totalWithTax) * 100 : 0;

      setMilestoneStatus({
        baseAmount,
        taxAmount,
        totalWithTax,
        paidAmount,
        remainingAmount,
        taskCompletionPercentage,
        currentPaymentPercentage,
        totalTasks,
        completedTasks
      });

      // Solo rellenar el formulario si estamos editando un pago existente
      if (milestone.editingPayment) {
        setFormData({
          amount: milestone.editingPayment.amount.toString(),
          description: milestone.editingPayment.description || '',
          paymentMethod: milestone.editingPayment.paymentMethod
        });
      } else {
        // Si es un nuevo pago, resetear el formulario
        setFormData({
          amount: '',
          description: '',
          paymentMethod: 'TRANSFERENCIA_BANCARIA'
        });
      }
      
      setError(null);
      setWarning(null);
    }
  }, [open, milestone]);

  const validateAmount = (amount) => {
    if (!amount || amount <= 0) {
      return 'El monto debe ser mayor que 0';
    }

    if (!milestoneStatus) return null;

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > milestoneStatus.remainingAmount) {
      return `El pago excede el monto pendiente. Máximo permitido: ${formatCurrency(milestoneStatus.remainingAmount)}`;
    }

    // Solo mostrar warning si:
    // 1. Hay tareas en el milestone
    // 2. El porcentaje de pago sería mayor que el porcentaje de tareas completadas
    // 3. El porcentaje de tareas completadas no es 100%
    if (milestoneStatus.totalTasks > 0 && milestoneStatus.taskCompletionPercentage < 100) {
      const newPaymentPercentage = ((milestoneStatus.paidAmount + paymentAmount) / milestoneStatus.totalWithTax) * 100;
      if (newPaymentPercentage > milestoneStatus.taskCompletionPercentage) {
        setWarning({
          message: `Atención: Se va a pagar el ${Math.round(newPaymentPercentage)}% del total cuando solo hay un ${Math.round(milestoneStatus.taskCompletionPercentage)}% de tareas completadas`,
          taskCompletion: `${milestoneStatus.completedTasks}/${milestoneStatus.totalTasks} tareas completadas`
        });
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validateAmount(formData.amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      // Extraer información detallada del error si está disponible
      let errorMessage = err.message;
      if (err.message.includes('exceed')) {
        const match = err.message.match(/\d+(\.\d{1,2})?/);
        if (match) {
          const remaining = parseFloat(match[0]);
          errorMessage = `El pago excedería el costo total del hito. Monto máximo permitido: ${formatCurrency(remaining)}`;
        }
      }
      setError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {milestone ? 
          milestone.editingPayment ? 
            `Editar Pago - ${milestone.name}` : 
            `Registrar Pago - ${milestone.name}` 
          : 'Pago'
        }
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {error}
              </Typography>
              {milestoneStatus && (
                <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total con IVA: {formatCurrency(milestoneStatus.totalWithTax)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ya pagado: {formatCurrency(milestoneStatus.paidAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendiente: {formatCurrency(milestoneStatus.remainingAmount)}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}

          {warning && (
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              icon={
                <Tooltip title={warning.taskCompletion}>
                  <WarningIcon />
                </Tooltip>
              }
            >
              {warning.message}
            </Alert>
          )}

          {milestoneStatus && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Base Amount: {formatCurrency(milestoneStatus.baseAmount)}
              </Typography>
              {milestone?.hasTax && (
                <Typography variant="subtitle2" color="text.secondary">
                  Tax Amount ({milestone.taxRate || 21}%): {formatCurrency(milestoneStatus.taxAmount)}
                </Typography>
              )}
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                Total Amount: {formatCurrency(milestoneStatus.totalWithTax)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Paid Amount: {formatCurrency(milestoneStatus.paidAmount)}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Pending Amount: {formatCurrency(milestoneStatus.remainingAmount)}
              </Typography>
            </Box>
          )}

          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value });
              setError(validateAmount(e.target.value));
            }}
            fullWidth
            required
            margin="normal"
            inputProps={{ 
              min: 0, 
              step: "0.01",
              lang: "es-ES"
            }}
            error={!!error}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData.paymentMethod}
              label="Payment Method"
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <MenuItem value="EFECTIVO">Efectivo</MenuItem>
              <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
              <MenuItem value="BIZUM">Bizum</MenuItem>
              <MenuItem value="PAYPAL">PayPal</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!!error || !formData.amount || parseFloat(formData.amount) <= 0}
          >
            Process Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentForm; 