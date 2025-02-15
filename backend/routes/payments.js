// Dummy comment to force reload
// Updated to return nested JSON with payment and milestone
//
const express = require('express');
const router = express.Router();
const Payment = require('../models/payment');
const Milestone = require('../models/milestone');
const Project = require('../models/project');
const Task = require('../models/task');

// GET /payments - list all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'milestone',
        populate: {
          path: 'project',
          model: 'Project',
          select: 'name description totalBudget startDate endDate status progress'
        }
      });

    // Get all unique project IDs from payments
    const projectIds = [...new Set(payments.map(p => p.milestone?.project?._id).filter(Boolean))];
    
    // Get complete project information with progress
    const projects = await Promise.all(projectIds.map(async (projectId) => {
      const project = await Project.findById(projectId);
      const milestones = await Milestone.find({ project: projectId });
      const tasks = await Task.find({ 
        milestone: { $in: milestones.map(m => m._id) }
      });

      const totalProjectTasks = tasks.length;
      const totalCompletedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
      const totalProjectCost = milestones.reduce((sum, m) => sum + m.budget, 0);
      const totalPaidAmount = milestones.reduce((sum, m) => sum + m.paidAmount, 0);

      const taskCompletionPercentage = totalProjectTasks > 0 
        ? (totalCompletedTasks / totalProjectTasks) * 100 
        : 0;
      const paymentPercentage = totalProjectCost > 0 
        ? (totalPaidAmount / totalProjectCost) * 100 
        : 0;

      return {
        ...project.toObject(),
        progress: {
          taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
          paymentPercentage: Math.round(paymentPercentage * 100) / 100,
          totalTasks: totalProjectTasks,
          completedTasks: totalCompletedTasks,
          totalCost: totalProjectCost,
          paidAmount: totalPaidAmount
        }
      };
    }));

    // Attach project progress information to each payment
    const paymentsWithProgress = payments.map(payment => {
      const projectProgress = projects.find(p => 
        p._id.toString() === payment.milestone?.project?._id?.toString()
      )?.progress;

      return {
        ...payment.toObject(),
        milestone: {
          ...payment.milestone.toObject(),
          project: {
            ...payment.milestone.project.toObject(),
            progress: projectProgress
          }
        }
      };
    });

    res.json(paymentsWithProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET payments for a specific milestone
router.get('/milestone/:milestoneId', async (req, res) => {
  try {
    const payments = await Payment.find({ milestone: req.params.milestoneId })
      .populate({
        path: 'milestone',
        populate: {
          path: 'project',
          model: 'Project'
        }
      });
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

    const milestone = await Milestone.findById(milestoneId).populate('project');
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
      paymentMethod: paymentMethod || 'TRANSFERENCIA_BANCARIA'
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

    // Populate the payment with milestone and project info before sending response
    await payment.populate({
      path: 'milestone',
      populate: {
        path: 'project',
        model: 'Project'
      }
    });
    
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

// PUT /payments/:id - update a payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const milestone = await Milestone.findById(payment.milestone);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const newAmount = parseFloat(req.body.amount);
    const amountDiff = newAmount - payment.amount;

    // Check if new amount would exceed milestone total cost
    if (milestone.paidAmount + amountDiff > milestone.budget) {
      return res.status(400).json({ 
        error: 'Payment would exceed milestone total cost',
        currentlyPaid: milestone.paidAmount,
        totalCost: milestone.budget,
        remaining: milestone.budget - milestone.paidAmount
      });
    }

    // Update payment
    payment.amount = newAmount;
    payment.description = req.body.description || payment.description;
    payment.paymentMethod = req.body.paymentMethod || payment.paymentMethod;
    await payment.save();

    // Update milestone
    milestone.paidAmount += amountDiff;
    if (milestone.paidAmount >= milestone.budget) {
      milestone.status = 'PAID';
    } else if (milestone.paidAmount > 0) {
      milestone.status = 'PARTIALLY_PAID';
    } else {
      milestone.status = 'UNPAID';
    }
    await milestone.save();

    res.json({
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

// DELETE /payments/:id - delete a payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const milestone = await Milestone.findById(payment.milestone);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Update milestone
    milestone.paidAmount -= payment.amount;
    if (milestone.paidAmount <= 0) {
      milestone.status = 'UNPAID';
      milestone.paidAmount = 0; // Ensure we don't get negative values
    } else if (milestone.paidAmount < milestone.budget) {
      milestone.status = 'PARTIALLY_PAID';
    }
    await milestone.save();

    // Delete payment
    await payment.delete();

    res.json({
      message: 'Payment deleted successfully',
      milestone: milestone,
      milestoneStatus: {
        totalCost: milestone.budget,
        paidAmount: milestone.paidAmount,
        pendingAmount: milestone.budget - milestone.paidAmount,
        status: milestone.status
      }
    });
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