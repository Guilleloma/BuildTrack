// Dummy comment to force reload
// Updated to return nested JSON with payment and milestone
//
const express = require('express');
const router = express.Router();
const Payment = require('../models/payment');
const Milestone = require('../models/milestone');

// GET /payments - list all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().populate('milestone');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET payments for a specific milestone
router.get('/milestone/:milestoneId', async (req, res) => {
  try {
    const payments = await Payment.find({ milestone: req.params.milestoneId });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /payments - process a new payment
router.post('/', async (req, res) => {
  try {
    const { milestoneId, amount, description, paymentMethod } = req.body;
    
    // Validate required fields
    if (!milestoneId || !amount) {
      return res.status(400).json({ error: 'milestoneId and amount are required' });
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const paymentAmount = parseFloat(amount);
    
    // Validate payment amount
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    // Check if payment would exceed total cost
    if (milestone.paidAmount + paymentAmount > milestone.budget) {
      return res.status(400).json({ 
        error: 'Payment would exceed milestone total cost',
        currentlyPaid: milestone.paidAmount,
        totalCost: milestone.budget,
        remaining: milestone.budget - milestone.paidAmount
      });
    }

    // Create and save the payment
    const payment = new Payment({
      milestone: milestoneId,
      amount: paymentAmount,
      description: description || '',
      paymentMethod: paymentMethod || 'BANK_TRANSFER'
    });
    
    await payment.save();

    // Update milestone payment values
    milestone.paidAmount += paymentAmount;
    
    // Update milestone status
    if (milestone.paidAmount >= milestone.budget) {
      milestone.status = 'PAID';
    } else if (milestone.paidAmount > 0) {
      milestone.status = 'PARTIALLY_PAID';
    }

    await milestone.save();
    
    res.status(201).json({ 
      payment: payment, 
      milestone: milestone,
      milestoneStatus: {
        totalCost: milestone.budget,
        paidAmount: milestone.paidAmount,
        pendingAmount: milestone.budget - milestone.paidAmount,
        status: milestone.status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /payments/:id - get a specific payment by id
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('milestone');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TEMPORARY: DELETE all payments
router.delete('/clean-all', async (req, res) => {
  try {
    await Payment.deleteMany({});
    res.json({ message: 'All payments have been deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 