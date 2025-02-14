// Dummy comment to force reload
// Updated to return nested JSON with payment and milestone
//
const express = require('express');
const router = express.Router();
const { projects } = require('../data');

// In-memory storage for payments
let payments = [];
let nextId = 1;

// GET /payments - list all payments
router.get('/', (req, res) => {
  res.json(payments);
});

// POST /payments - process a new payment
router.post('/', (req, res) => {
  const { projectId, milestoneId, amount } = req.body;
  if (!projectId || !milestoneId || !amount) {
    return res.status(400).json({ error: 'projectId, milestoneId, and amount are required' });
  }

  const project = projects.find(p => p.id === parseInt(projectId));
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const milestone = project.milestones.find(m => m.id === parseInt(milestoneId));
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const paymentAmount = parseFloat(amount);
  // Update milestone payment values
  milestone.paidAmount += paymentAmount;
  if (milestone.paidAmount > milestone.totalCost) {
    milestone.paidAmount = milestone.totalCost;
  }
  milestone.pendingAmount = milestone.totalCost - milestone.paidAmount;

  const payment = {
    id: nextId++,
    projectId: parseInt(projectId),
    milestoneId: parseInt(milestoneId),
    amount: paymentAmount,
    status: 'processed'
  };
  payments.push(payment);
  res.status(201).json({ payment: payment, milestone: milestone });
});

// GET /payments/:id - get a specific payment by id
router.get('/:id', (req, res) => {
  const payment = payments.find(p => p.id === parseInt(req.params.id));
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

module.exports = router; 