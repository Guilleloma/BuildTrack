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
      console.log('=== INICIO useEffect PaymentForm ===');
      console.log('Payment recibido:', JSON.stringify(payment, null, 2));
      console.log('Milestone recibido:', JSON.stringify(milestone, null, 2));
      console.log('Project recibido:', JSON.stringify(project, null, 2));

      if (payment) {
        console.log('Setting form data from payment:', JSON.stringify(payment, null, 2));
        // Si estamos editando un pago existente
        const distributions = payment.type === 'DISTRIBUTED' ? 
          payment.distributions.map(dist => {
            console.log('Processing distribution:', JSON.stringify(dist, null, 2));
            return {
              milestoneId: dist.milestoneId || dist.milestone?._id,
              amount: (dist.amount || '0').toString(),
              name: dist.name || dist.milestone?.name || 'Sin nombre'
            };
          }) : [];

        console.log('Processed distributions:', JSON.stringify(distributions, null, 2));

        setFormData({
          amount: payment.amount.toString(),
          description: payment.description || '',
          paymentMethod: payment.paymentMethod,
          isDistributed: payment.type === 'DISTRIBUTED',
          distributions: distributions
        });
      } else if (milestone?.editingPayment) {
        // Compatibilidad con el modo anterior de edición
        console.log('Setting form data from milestone.editingPayment:', JSON.stringify(milestone.editingPayment, null, 2));
        setFormData({
          amount: milestone.editingPayment.amount.toString(),
          description: milestone.editingPayment.description || '',
          paymentMethod: milestone.editingPayment.paymentMethod,
          isDistributed: false,
          distributions: []
        });
      } else {
        // Si es un nuevo pago
        console.log('Setting default form data');
        setFormData({
          amount: '',
          description: '',
          paymentMethod: 'TRANSFERENCIA_BANCARIA',
          isDistributed: !milestone,
          distributions: []
        });
      }
      
      if (milestone) {
        console.log('Calculating milestone amounts for:', JSON.stringify(milestone, null, 2));
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
        console.log('Setting milestone status:', JSON.stringify(milestoneStatusData, null, 2));
        setMilestoneStatus(milestoneStatusData);
      }
      
      setError(null);
      setWarning(null);
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
      return 'El monto debe ser mayor que 0';
    }

    if (formData.isDistributed) {
      const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount || 0), 0);
      if (Math.abs(totalDistributed - parseFloat(amount)) > 0.01) {
        return `La suma de las distribuciones (${formatCurrency(totalDistributed)}) debe ser igual al monto total (${formatCurrency(amount)})`;
      }
      return null;
    }

    if (!milestoneStatus) return null;

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > milestoneStatus.remainingAmount) {
      return `El pago excede el monto pendiente. Máximo permitido: ${formatCurrency(milestoneStatus.remainingAmount)}`;
    }

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
    console.log('=== INICIO handleSubmit PaymentForm ===');
    console.log('FormData actual:', JSON.stringify(formData, null, 2));
    console.log('Milestone actual:', JSON.stringify(milestone, null, 2));
    console.log('MilestoneStatus actual:', JSON.stringify(milestoneStatus, null, 2));
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
      console.log('Preparando datos para enviar');
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
        console.error('Error: No se encontró el ID del milestone');
        console.log('Milestone completo:', JSON.stringify(milestone, null, 2));
        throw new Error('No se pudo obtener el ID del milestone');
      }

      console.log('Datos a enviar:', JSON.stringify(dataToSubmit, null, 2));
      onSubmit(dataToSubmit);
      onClose();
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      console.error('Stack trace:', err.stack);
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
    console.log('=== FIN handleSubmit PaymentForm ===');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {payment ? 
          payment.type === 'DISTRIBUTED' ? 
            'Editar Pago Distribuido' : 
            `Editar Pago - ${milestone?.name}` 
          : milestone ? 
            milestone.editingPayment ? 
              `Editar Pago - ${milestone.name}` : 
              `Registrar Pago - ${milestone.name}` 
            : 'Pago Distribuido'
        }
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Monto Total"
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
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Método de Pago</InputLabel>
            <Select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              label="Método de Pago"
            >
              <MenuItem value="EFECTIVO">Efectivo</MenuItem>
              <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
              <MenuItem value="BIZUM">Bizum</MenuItem>
              <MenuItem value="PAYPAL">PayPal</MenuItem>
            </Select>
          </FormControl>

          {formData.isDistributed && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle1" color="primary">
                  Distribución del Pago
                </Typography>
                {formData.distributions.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    (Total distribuido: {formatCurrency(formData.distributions.reduce((sum, dist) => sum + parseFloat(dist.amount || 0), 0))})
                  </Typography>
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Añadir Hito</InputLabel>
                <Select
                  value=""
                  onChange={(e) => handleAddMilestone(e.target.value)}
                  label="Añadir Hito"
                >
                  {availableMilestones
                    .filter(m => !formData.distributions.some(dist => dist.milestoneId === m._id))
                    .map(milestone => (
                      <MenuItem key={milestone._id} value={milestone._id}>
                        {milestone.name} - Pendiente: {formatCurrency(
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">
          {milestone?.editingPayment ? 'Actualizar' : 'Registrar'} Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentForm; 