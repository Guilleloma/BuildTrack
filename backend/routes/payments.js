// Dummy comment to force reload
// Updated to return nested JSON with payment and milestone
//
const express = require('express');
const router = express.Router();
const data = require('../data');

// GET /payments - list all payments
router.get('/', (req, res) => {
  res.json(data.payments);
});

// GET payments for a specific milestone
router.get('/milestone/:milestoneId', (req, res) => {
  const milestoneId = parseInt(req.params.milestoneId);
  const milestonePayments = data.payments.filter(p => p.milestoneId === milestoneId);
  res.json(milestonePayments);
});

// POST /payments - process a new payment
router.post('/', (req, res) => {
  const { projectId, milestoneId, amount, description } = req.body;
  
  // Validate required fields
  if (!projectId || !milestoneId || !amount) {
    return res.status(400).json({ error: 'projectId, milestoneId, and amount are required' });
  }

  const project = data.projects.find(p => p.id === parseInt(projectId));
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const milestone = project.milestones.find(m => m.id === parseInt(milestoneId));
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const paymentAmount = parseFloat(amount);
  
  // Validate payment amount
  if (paymentAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than 0' });
  }

  // Check if payment would exceed total cost
  if (milestone.paidAmount + paymentAmount > milestone.totalCost) {
    return res.status(400).json({ 
      error: 'Payment would exceed milestone total cost',
      currentlyPaid: milestone.paidAmount,
      totalCost: milestone.totalCost,
      remaining: milestone.totalCost - milestone.paidAmount
    });
  }

  // Update milestone payment values
  milestone.paidAmount += paymentAmount;
  milestone.pendingAmount = milestone.totalCost - milestone.paidAmount;
  
  // Update milestone status if fully paid
  if (milestone.paidAmount >= milestone.totalCost) {
    milestone.paymentStatus = 'PAID';
  } else if (milestone.paidAmount > 0) {
    milestone.paymentStatus = 'PARTIALLY_PAID';
  }

  const payment = {
    id: data.nextPaymentId++,
    projectId: parseInt(projectId),
    milestoneId: parseInt(milestoneId),
    amount: paymentAmount,
    description: description || '',
    status: 'processed',
    timestamp: new Date().toISOString()
  };
  
  data.payments.push(payment);
  
  res.status(201).json({ 
    payment: payment, 
    milestone: milestone,
    milestoneStatus: {
      totalCost: milestone.totalCost,
      paidAmount: milestone.paidAmount,
      pendingAmount: milestone.pendingAmount,
      paymentStatus: milestone.paymentStatus
    }
  });
});

// GET /payments/:id - get a specific payment by id
router.get('/:id', (req, res) => {
  const payment = data.payments.find(p => p.id === parseInt(req.params.id));
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

module.exports = router; 