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
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { formatCurrency } from '../utils/formatters';
import DeleteIcon from '@mui/icons-material/Delete';

const PaymentForm = ({ open, onClose, onSubmit, milestone, project, payment }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paymentMethod: 'TRANSFERENCIA_BANCARIA',
    isDistributed: false,
    distributions: []
  });
  const [error, setError] = useState(null);
  const [milestoneStatus, setMilestoneStatus] = useState(null);
  const [warning, setWarning] = useState(null);
  const [availableMilestones, setAvailableMilestones] = useState([]);

  useEffect(() => {
    if (open) {
      console.log('=== INICIO useEffect PaymentForm con LOGS DETALLADOS ===');
      console.log('Estado inicial del formulario:', formData);
      console.log('Payment prop:', payment);
      console.log('Milestone prop:', milestone);
      console.log('Project prop:', project);

      if (payment) {
        console.log('=== Procesando pago existente ===');
        console.log('Tipo de pago:', payment.type);
        console.log('ID del pago:', payment._id);
        console.log('Milestone en el pago:', payment.milestone);
        
        const distributions = payment.type === 'DISTRIBUTED' ? 
          payment.distributions.map(dist => {
            console.log('Procesando distribución:', dist);
            console.log('ID del milestone en distribución:', dist.milestoneId || dist.milestone?._id);
            return {
              milestoneId: dist.milestoneId || dist.milestone?._id,
              amount: (dist.amount || '0').toString(),
              name: dist.name || dist.milestone?.name || 'Sin nombre'
            };
          }) : [];

        console.log('Distribuciones procesadas:', distributions);

        setFormData({
          amount: payment.amount.toString(),
          description: payment.description || '',
          paymentMethod: payment.paymentMethod,
          isDistributed: payment.type === 'DISTRIBUTED',
          distributions: distributions
        });
      } else if (milestone?.editingPayment) {
        console.log('=== Procesando milestone.editingPayment ===');
        console.log('Datos de editingPayment:', milestone.editingPayment);
        setFormData({
          amount: milestone.editingPayment.amount.toString(),
          description: milestone.editingPayment.description || '',
          paymentMethod: milestone.editingPayment.paymentMethod,
          isDistributed: false,
          distributions: []
        });
      } else {
        console.log('=== Configurando formulario nuevo ===');
        console.log('Es pago distribuido:', !milestone);
        setFormData({
          amount: '',
          description: '',
          paymentMethod: 'TRANSFERENCIA_BANCARIA',
          isDistributed: !milestone,
          distributions: []
        });
      }
      
      if (milestone) {
        console.log('=== Calculando estado del milestone ===');
        console.log('Budget:', milestone.budget);
        console.log('Has Tax:', milestone.hasTax);
        console.log('Tax Rate:', milestone.taxRate);
        console.log('Paid Amount:', milestone.paidAmount);
        console.log('Tasks:', milestone.tasks);

        const baseAmount = parseFloat(milestone.budget || 0);
        const taxAmount = milestone.hasTax 
          ? baseAmount * (parseFloat(milestone.taxRate || 21) / 100)
          : 0;
        const totalWithTax = baseAmount + taxAmount;
        const paidAmount = parseFloat(milestone.paidAmount || 0);
        const remainingAmount = parseFloat((totalWithTax - paidAmount).toFixed(2));

        const totalTasks = milestone.tasks?.length || 0;
        const completedTasks = milestone.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
        const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const currentPaymentPercentage = totalWithTax > 0 ? (paidAmount / totalWithTax) * 100 : 0;

        const milestoneStatusData = {
          baseAmount,
          taxAmount,
          totalWithTax,
          paidAmount,
          remainingAmount,
          taskCompletionPercentage,
          currentPaymentPercentage,
          totalTasks,
          completedTasks
        };
        console.log('Estado del milestone calculado:', milestoneStatusData);
        setMilestoneStatus(milestoneStatusData);
      }
      
      console.log('=== FIN useEffect PaymentForm ===');
    }
  }, [open, milestone, payment]);

  useEffect(() => {
    // Fetch available milestones when in distributed mode
    if (formData.isDistributed && project?._id) {
      console.log('Project data:', project);
      console.log('Available milestones from project:', project.milestones);
      
      if (project.milestones) {
        // Filtrar hitos que no estén completamente pagados o que ya estén en las distribuciones
        const unpaidMilestones = project.milestones.filter(m => {
          // Si el hito ya está en las distribuciones, incluirlo
          if (formData.distributions.some(dist => dist.milestoneId === m._id)) {
            return true;
          }
          // Si no está en las distribuciones, verificar si está completamente pagado
          const totalWithTax = m.hasTax 
            ? m.budget * (1 + (m.taxRate || 21) / 100)
            : m.budget;
          return (m.paidAmount || 0) < totalWithTax;
        });
        setAvailableMilestones(unpaidMilestones);
      } else {
        console.error('No milestones found in project data');
        setError('Error al cargar los hitos disponibles');
      }
    }
  }, [formData.isDistributed, project, formData.distributions]);

  const validateAmount = (amount, distributions = []) => {
    if (!amount || amount <= 0) {
      return 'Amount must be greater than 0';
    }

    if (formData.isDistributed) {
      const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount || 0), 0);
      if (Math.abs(totalDistributed - parseFloat(amount)) > 0.01) {
        return `The sum of distributions (${formatCurrency(totalDistributed)}) must equal the total amount (${formatCurrency(amount)})`;
      }
      return null;
    }

    if (!milestoneStatus) return null;

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > milestoneStatus.remainingAmount) {
      return `Payment exceeds remaining amount. Maximum allowed: ${formatCurrency(milestoneStatus.remainingAmount)}`;
    }

    if (milestoneStatus.totalTasks > 0 && milestoneStatus.taskCompletionPercentage < 100) {
      const newPaymentPercentage = ((milestoneStatus.paidAmount + paymentAmount) / milestoneStatus.totalWithTax) * 100;
      if (newPaymentPercentage > milestoneStatus.taskCompletionPercentage) {
        setWarning({
          message: `Warning: You are going to pay ${Math.round(newPaymentPercentage)}% of the total when only ${Math.round(milestoneStatus.taskCompletionPercentage)}% of tasks are completed`,
          taskCompletion: `${milestoneStatus.completedTasks}/${milestoneStatus.totalTasks} tasks completed`
        });
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }

    return null;
  };

  const handleDistributionChange = (milestoneId, amount) => {
    console.log('Changing distribution for milestone:', milestoneId, 'amount:', amount);
    const newDistributions = formData.distributions.map(dist => 
      dist.milestoneId === milestoneId ? { ...dist, amount } : dist
    );
    setFormData(prev => ({
      ...prev,
      distributions: newDistributions
    }));
    setError(validateAmount(formData.amount, newDistributions));
  };

  const handleAddMilestone = (milestoneId) => {
    console.log('Adding milestone:', milestoneId);
    const milestone = availableMilestones.find(m => m._id === milestoneId);
    if (!milestone) {
      console.error('Milestone not found:', milestoneId);
      return;
    }

    setFormData(prev => ({
      ...prev,
      distributions: [
        ...prev.distributions,
        {
          milestoneId,
          amount: '0',
          name: milestone.name
        }
      ]
    }));
  };

  const handleRemoveMilestone = (milestoneId) => {
    setFormData(prev => ({
      ...prev,
      distributions: prev.distributions.filter(dist => dist.milestoneId !== milestoneId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('=== INICIO handleSubmit PaymentForm con LOGS DETALLADOS ===');
    console.log('FormData actual:', formData);
    console.log('Milestone actual:', milestone);
    console.log('MilestoneStatus actual:', milestoneStatus);
    setError(null);

    const validationError = validateAmount(formData.amount, formData.distributions);
    if (validationError) {
      console.log('Error de validación:', validationError);
      setError(validationError);
      return;
    }

    // Validación adicional para pagos distribuidos
    if (formData.isDistributed && (!formData.distributions || formData.distributions.length === 0)) {
      console.log('Error: No hay distribuciones para pago distribuido');
      setError('Debe seleccionar al menos un hito para distribuir el pago');
      return;
    }

    try {
      console.log('=== Preparando datos para enviar ===');
      const dataToSubmit = formData.isDistributed ? {
        amount: parseFloat(formData.amount),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        type: 'DISTRIBUTED',
        distributions: formData.distributions.map(dist => ({
          milestoneId: dist.milestoneId,
          amount: parseFloat(dist.amount)
        }))
      } : {
        amount: parseFloat(formData.amount),
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        type: 'SINGLE',
        milestoneId: milestone?._id
      };

      if (!formData.isDistributed && !milestone?._id) {
        console.error('Error crítico: No se encontró el ID del milestone');
        console.log('Milestone completo:', milestone);
        throw new Error('No se pudo obtener el ID del milestone');
      }

      console.log('Datos preparados para enviar:', dataToSubmit);
      onSubmit(dataToSubmit);
      onClose();
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      console.error('Stack trace:', err.stack);
      setError(err.message);
    }
    console.log('=== FIN handleSubmit PaymentForm ===');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {payment ? 
          payment.type === 'DISTRIBUTED' ? 
            'Edit Distributed Payment' : 
            `Edit Payment - ${milestone?.name}` 
          : milestone ? 
            milestone.editingPayment ? 
              `Edit Payment - ${milestone.name}` : 
              `Register Payment - ${milestone.name}` 
            : 'Distributed Payment'
        }
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Total Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => {
              const newAmount = e.target.value;
              setFormData(prev => ({ ...prev, amount: newAmount }));
              setError(validateAmount(newAmount, formData.distributions));
            }}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              label="Payment Method"
            >
              <MenuItem value="EFECTIVO">Cash</MenuItem>
              <MenuItem value="TRANSFERENCIA_BANCARIA">Bank Transfer</MenuItem>
              <MenuItem value="BIZUM">Bizum</MenuItem>
              <MenuItem value="PAYPAL">PayPal</MenuItem>
            </Select>
          </FormControl>

          {formData.isDistributed && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Payment Distribution
                </Typography>
                {formData.distributions.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    (Total distributed: {formatCurrency(formData.distributions.reduce((sum, dist) => sum + parseFloat(dist.amount || 0), 0))})
                  </Typography>
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Add Milestone</InputLabel>
                <Select
                  value=""
                  onChange={(e) => handleAddMilestone(e.target.value)}
                  label="Add Milestone"
                >
                  {availableMilestones
                    .filter(m => !formData.distributions.some(dist => dist.milestoneId === m._id))
                    .map(milestone => (
                      <MenuItem key={milestone._id} value={milestone._id}>
                        {milestone.name} - Pending: {formatCurrency(
                          milestone.hasTax 
                            ? milestone.budget * (1 + (milestone.taxRate || 21) / 100) - (milestone.paidAmount || 0)
                            : milestone.budget - (milestone.paidAmount || 0)
                        )}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              {formData.distributions.map((dist, index) => (
                <Box key={dist.milestoneId} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                  <Typography sx={{ flex: 1 }}>{dist.name}</Typography>
                  <TextField
                    type="number"
                    label="Monto"
                    value={dist.amount}
                    onChange={(e) => handleDistributionChange(dist.milestoneId, e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <IconButton 
                    onClick={() => handleRemoveMilestone(dist.milestoneId)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </>
          )}

          {milestone && milestoneStatus && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Base Amount: {formatCurrency(milestoneStatus.baseAmount)}
              </Typography>
              {milestone.hasTax && (
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

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {warning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {warning.message}
              <br />
              {warning.taskCompletion}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {milestone?.editingPayment ? 'Update' : 'Register'} Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm; 