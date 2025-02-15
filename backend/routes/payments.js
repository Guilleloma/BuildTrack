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
      
      // Calculate totals with tax
      const totalProjectCost = milestones.reduce((sum, m) => sum + m.budget, 0);
      const totalProjectCostWithTax = milestones.reduce((sum, m) => {
        const milestoneWithTax = m.hasTax 
          ? m.budget * (1 + (m.taxRate || 21) / 100)
          : m.budget;
        return sum + milestoneWithTax;
      }, 0);
      const totalPaidAmount = milestones.reduce((sum, m) => sum + (m.paidAmount || 0), 0);

      const taskCompletionPercentage = totalProjectTasks > 0 
        ? (totalCompletedTasks / totalProjectTasks) * 100 
        : 0;
      const paymentPercentage = totalProjectCostWithTax > 0 
        ? (totalPaidAmount / totalProjectCostWithTax) * 100 
        : 0;

      return {
        ...project.toObject(),
        progress: {
          taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
          paymentPercentage: Math.round(paymentPercentage * 100) / 100,
          totalTasks: totalProjectTasks,
          completedTasks: totalCompletedTasks,
          totalCost: totalProjectCost,
          totalCostWithTax: totalProjectCostWithTax,
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

    // Calculate total cost with tax
    const totalWithTax = milestone.hasTax 
      ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
      : milestone.budget;

    // Check if payment would exceed total cost with tax
    if (milestone.paidAmount + paymentAmount > totalWithTax) {
      return res.status(400).json({ 
        error: 'Payment would exceed milestone total cost (including tax)',
        currentlyPaid: milestone.paidAmount,
        totalCost: milestone.budget,
        totalWithTax: totalWithTax,
        remaining: totalWithTax - milestone.paidAmount
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
    
    // Update milestone status based on total with tax
    if (milestone.paidAmount >= totalWithTax) {
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
        totalWithTax: totalWithTax,
        paidAmount: milestone.paidAmount,
        pendingAmount: totalWithTax - milestone.paidAmount,
        status: milestone.status,
        hasTax: milestone.hasTax,
        taxRate: milestone.taxRate || 21
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

    // Calculate total with tax
    const totalWithTax = milestone.hasTax 
      ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
      : milestone.budget;

    // Check if new amount would exceed milestone total cost
    if (milestone.paidAmount + amountDiff > totalWithTax) {
      return res.status(400).json({ 
        error: 'Payment would exceed milestone total cost',
        currentlyPaid: milestone.paidAmount,
        totalCost: milestone.budget,
        totalWithTax: totalWithTax,
        remaining: totalWithTax - milestone.paidAmount
      });
    }

    // Update payment
    payment.amount = newAmount;
    payment.description = req.body.description || payment.description;
    payment.paymentMethod = req.body.paymentMethod || payment.paymentMethod;
    await payment.save();

    // Update milestone
    milestone.paidAmount = parseFloat((milestone.paidAmount + amountDiff).toFixed(2));
    if (milestone.paidAmount >= totalWithTax) {
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
        totalWithTax: totalWithTax,
        paidAmount: milestone.paidAmount,
        pendingAmount: totalWithTax - milestone.paidAmount,
        status: milestone.status
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /payments/:id - delete a payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const milestone = await Milestone.findById(payment.milestone);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Update milestone with precise decimal handling
    const currentPaidAmount = parseFloat(milestone.paidAmount || 0);
    const paymentAmount = parseFloat(payment.amount || 0);
    let newPaidAmount = parseFloat((currentPaidAmount - paymentAmount).toFixed(2));

    // Ensure we don't get negative values
    if (newPaidAmount <= 0) {
      milestone.status = 'UNPAID';
      newPaidAmount = 0;
    } else if (newPaidAmount < milestone.budget) {
      milestone.status = 'PARTIALLY_PAID';
    }

    milestone.paidAmount = newPaidAmount;
    await milestone.save();

    // Delete payment
    await Payment.findByIdAndDelete(payment._id);

    // Calculate remaining amounts with precision
    const totalCost = parseFloat(milestone.budget || 0);
    const pendingAmount = parseFloat((totalCost - newPaidAmount).toFixed(2));

    res.json({
      message: 'Payment deleted successfully',
      milestone: milestone,
      milestoneStatus: {
        totalCost: totalCost,
        paidAmount: newPaidAmount,
        pendingAmount: pendingAmount,
        status: milestone.status
      }
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: error.message || 'Error deleting payment' });
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