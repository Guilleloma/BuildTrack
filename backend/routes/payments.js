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
        path: 'milestone distributions.milestone',
        populate: {
          path: 'project',
          model: 'Project'
        },
        select: '_id name budget hasTax taxRate paidAmount project'
      });

    // Get all unique project IDs from both single and distributed payments
    const projectIds = [...new Set([
      ...payments.map(p => p.milestone?.project?._id).filter(Boolean),
      ...payments.flatMap(p => p.distributions?.map(d => d.milestone?.project?._id) || []).filter(Boolean)
    ])];
    
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

    // Transform payments to include project information
    const paymentsWithProgress = payments.map(payment => {
      const paymentObj = payment.toObject();

      if (payment.type === 'DISTRIBUTED') {
        // For distributed payments, get project info from the first milestone
        const firstMilestone = payment.distributions[0]?.milestone;
        if (firstMilestone) {
          const projectProgress = projects.find(p => 
            p._id.toString() === firstMilestone.project._id.toString()
          )?.progress;

          return {
            ...paymentObj,
            projectName: firstMilestone.project.name,
            milestonesInfo: payment.distributions.map(dist => ({
              name: dist.milestone.name,
              amount: dist.amount
            }))
          };
        }
      } else {
        // For single payments
        const projectProgress = projects.find(p => 
          p._id.toString() === payment.milestone?.project?._id?.toString()
        )?.progress;

        return {
          ...paymentObj,
          projectName: payment.milestone?.project?.name,
          milestonesInfo: [{
            name: payment.milestone?.name,
            amount: payment.amount
          }]
        };
      }

      return paymentObj;
    });

    res.json(paymentsWithProgress);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET payments for a specific milestone
router.get('/milestone/:milestoneId', async (req, res) => {
  try {
    // Get both single and distributed payments for this milestone
    const payments = await Payment.find({
      $or: [
        { milestone: req.params.milestoneId }, // Single payments
        { 'distributions.milestone': req.params.milestoneId } // Distributed payments
      ]
    }).populate({
      path: 'milestone distributions.milestone',
      populate: {
        path: 'project',
        model: 'Project'
      }
    });

    // Transform distributed payments to show only the relevant portion
    const transformedPayments = payments.map(payment => {
      if (payment.type === 'DISTRIBUTED') {
        const distribution = payment.distributions.find(
          d => d.milestone._id.toString() === req.params.milestoneId
        );
        if (distribution) {
          const paymentObj = payment.toObject();
          paymentObj.amount = distribution.amount;
          return paymentObj;
        }
      }
      return payment;
    });

    res.json(transformedPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /payments - process a new payment
router.post('/', async (req, res) => {
  try {
    const { type, milestoneId, amount, description, paymentMethod, distributions } = req.body;
    
    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    // Validate based on payment type
    if (type === 'DISTRIBUTED') {
      if (!distributions || !distributions.length) {
        return res.status(400).json({ error: 'Distributions are required for distributed payments' });
      }

      // Validate total distributed amount matches payment amount
      const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);
      if (Math.abs(totalDistributed - paymentAmount) > 0.01) {
        return res.status(400).json({ 
          error: 'Total distributed amount must match payment amount',
          distributed: totalDistributed,
          payment: paymentAmount
        });
      }

      // Validate each milestone and amount
      for (const dist of distributions) {
        const milestone = await Milestone.findById(dist.milestoneId).populate('project');
        if (!milestone) {
          return res.status(404).json({ error: `Milestone ${dist.milestoneId} not found` });
        }

        const totalWithTax = milestone.hasTax 
          ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
          : milestone.budget;

        if ((milestone.paidAmount || 0) + dist.amount > totalWithTax) {
          return res.status(400).json({ 
            error: `Payment would exceed milestone ${milestone.name} total cost (including tax)`,
            milestoneId: dist.milestoneId,
            currentlyPaid: milestone.paidAmount || 0,
            totalCost: milestone.budget,
            totalWithTax: totalWithTax,
            remaining: totalWithTax - (milestone.paidAmount || 0)
          });
        }
      }

      // Create distributed payment
      const payment = new Payment({
        type: 'DISTRIBUTED',
        amount: paymentAmount,
        description: description || '',
        paymentMethod: paymentMethod || 'TRANSFERENCIA_BANCARIA',
        distributions: distributions.map(dist => ({
          milestone: dist.milestoneId,
          amount: parseFloat(dist.amount)
        }))
      });

      await payment.save();

      // Update each milestone
      const updatedMilestones = await Promise.all(distributions.map(async dist => {
        const milestone = await Milestone.findById(dist.milestoneId);
        milestone.paidAmount = (milestone.paidAmount || 0) + parseFloat(dist.amount);
        
        const totalWithTax = milestone.hasTax 
          ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
          : milestone.budget;

        if (milestone.paidAmount >= totalWithTax) {
          milestone.status = 'PAID';
        } else if (milestone.paidAmount > 0) {
          milestone.status = 'PARTIALLY_PAID';
        }

        await milestone.save();
        return milestone;
      }));

      // Populate payment with milestone and project info
      await payment.populate({
        path: 'distributions.milestone',
        populate: {
          path: 'project',
          model: 'Project'
        }
      });

      res.status(201).json({
        payment,
        milestones: updatedMilestones.map(milestone => ({
          _id: milestone._id,
          name: milestone.name,
          totalCost: milestone.budget,
          totalWithTax: milestone.hasTax 
            ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
            : milestone.budget,
          paidAmount: milestone.paidAmount,
          pendingAmount: (milestone.hasTax 
            ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
            : milestone.budget) - milestone.paidAmount,
          status: milestone.status,
          hasTax: milestone.hasTax,
          taxRate: milestone.taxRate || 21
        }))
      });
    } else {
      // Handle single milestone payment
      if (!milestoneId) {
        return res.status(400).json({ error: 'Milestone ID is required for single payments' });
      }

      const milestone = await Milestone.findById(milestoneId).populate('project');
      if (!milestone) {
        return res.status(404).json({ error: 'Milestone not found' });
      }

      const totalWithTax = milestone.hasTax 
        ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
        : milestone.budget;

      if ((milestone.paidAmount || 0) + paymentAmount > totalWithTax) {
        return res.status(400).json({ 
          error: 'Payment would exceed milestone total cost (including tax)',
          currentlyPaid: milestone.paidAmount || 0,
          totalCost: milestone.budget,
          totalWithTax: totalWithTax,
          remaining: totalWithTax - (milestone.paidAmount || 0)
        });
      }

      const payment = new Payment({
        type: 'SINGLE',
        milestone: milestoneId,
        amount: paymentAmount,
        description: description || '',
        paymentMethod: paymentMethod || 'TRANSFERENCIA_BANCARIA'
      });

      await payment.save();

      milestone.paidAmount = (milestone.paidAmount || 0) + paymentAmount;
      
      if (milestone.paidAmount >= totalWithTax) {
        milestone.status = 'PAID';
      } else if (milestone.paidAmount > 0) {
        milestone.status = 'PARTIALLY_PAID';
      }

      await milestone.save();

      // Populate payment with milestone and project info
      await payment.populate({
        path: 'milestone',
        populate: {
          path: 'project',
          model: 'Project'
        }
      });

      res.status(201).json({
        payment,
        milestones: [{
          _id: milestone._id,
          name: milestone.name,
          totalCost: milestone.budget,
          totalWithTax,
          paidAmount: milestone.paidAmount,
          pendingAmount: totalWithTax - milestone.paidAmount,
          status: milestone.status,
          hasTax: milestone.hasTax,
          taxRate: milestone.taxRate || 21
        }]
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET /payments/:id - get a specific payment by id
router.get('/:id', async (req, res) => {
  try {
    // Obtener el pago con toda la información necesaria
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'milestone distributions.milestone',
        populate: {
          path: 'project',
          model: 'Project'
        }
      });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verificar que tenemos toda la información necesaria
    if (payment.type === 'DISTRIBUTED') {
      // Verificar cada distribución
      for (const dist of payment.distributions) {
        if (!dist.milestone?._id || !dist.milestone?.name || !dist.milestone?.project?._id) {
          console.error('Incomplete milestone data in distribution:', dist);
          return res.status(500).json({ error: 'Datos incompletos en la distribución del pago' });
        }
      }
    }

    // Obtener el proyecto completo con sus milestones
    const projectId = payment.type === 'DISTRIBUTED' 
      ? payment.distributions[0].milestone.project._id
      : payment.milestone?.project?._id;

    if (!projectId) {
      return res.status(500).json({ error: 'No se encontró el ID del proyecto' });
    }

    const project = await Project.findById(projectId);
    const milestones = await Milestone.find({ project: projectId });

    // Añadir la información del proyecto y sus milestones a la respuesta
    const response = {
      payment: payment.toObject(),
      project: {
        ...project.toObject(),
        milestones: milestones.map(m => ({
          _id: m._id,
          name: m.name,
          budget: m.budget,
          hasTax: m.hasTax,
          taxRate: m.taxRate,
          paidAmount: m.paidAmount,
          status: m.status
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting payment:', error);
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

    const { type, amount, description, paymentMethod, milestoneId, distributions } = req.body;

    if (type === 'DISTRIBUTED') {
      // Validate distributions
      if (!distributions || !distributions.length) {
        return res.status(400).json({ error: 'Distributions are required for distributed payments' });
      }

      // Validate total distributed amount matches payment amount
      const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);
      if (Math.abs(totalDistributed - parseFloat(amount)) > 0.01) {
        return res.status(400).json({ 
          error: 'Total distributed amount must match payment amount',
          distributed: totalDistributed,
          payment: amount
        });
      }

      // Validate each milestone and amount
      for (const dist of distributions) {
        const milestone = await Milestone.findById(dist.milestoneId).populate('project');
        if (!milestone) {
          return res.status(404).json({ error: `Milestone ${dist.milestoneId} not found` });
        }

        const totalWithTax = milestone.hasTax 
          ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
          : milestone.budget;

        // Calculate new total paid amount for this milestone
        const currentDistribution = payment.distributions.find(d => 
          d.milestone.toString() === dist.milestoneId
        );
        const currentAmount = currentDistribution ? currentDistribution.amount : 0;
        const otherPaymentsAmount = (milestone.paidAmount || 0) - currentAmount;
        
        if (otherPaymentsAmount + parseFloat(dist.amount) > totalWithTax) {
          return res.status(400).json({ 
            error: `Payment would exceed milestone ${milestone.name} total cost (including tax)`,
            milestoneId: dist.milestoneId,
            currentlyPaid: otherPaymentsAmount,
            totalCost: milestone.budget,
            totalWithTax: totalWithTax,
            remaining: totalWithTax - otherPaymentsAmount
          });
        }
      }

      // Update payment
      payment.amount = parseFloat(amount);
      payment.description = description;
      payment.paymentMethod = paymentMethod;
      payment.distributions = distributions.map(dist => ({
        milestone: dist.milestoneId,
        amount: parseFloat(dist.amount)
      }));

      await payment.save();

      // Update milestone amounts
      const updatedMilestones = await Promise.all(distributions.map(async dist => {
        const milestone = await Milestone.findById(dist.milestoneId);
        if (!milestone) return null;

        // Remove old distribution amount
        const oldDistribution = payment.distributions.find(d => 
          d.milestone.toString() === dist.milestoneId
        );
        const oldAmount = oldDistribution ? oldDistribution.amount : 0;
        
        // Calculate new paid amount
        milestone.paidAmount = (milestone.paidAmount || 0) - oldAmount + parseFloat(dist.amount);
        
        const totalWithTax = milestone.hasTax 
          ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
          : milestone.budget;

        if (milestone.paidAmount >= totalWithTax) {
          milestone.status = 'PAID';
        } else if (milestone.paidAmount > 0) {
          milestone.status = 'PARTIALLY_PAID';
        } else {
          milestone.status = 'UNPAID';
        }

        await milestone.save();
        return milestone;
      }));

      // Populate payment with milestone and project info
      await payment.populate({
        path: 'distributions.milestone',
        populate: {
          path: 'project',
          model: 'Project'
        }
      });

      res.json({
        payment,
        milestones: updatedMilestones.filter(Boolean).map(milestone => ({
          _id: milestone._id,
          name: milestone.name,
          totalCost: milestone.budget,
          totalWithTax: milestone.hasTax 
            ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
            : milestone.budget,
          paidAmount: milestone.paidAmount,
          status: milestone.status
        }))
      });
    } else {
      // Handle single payment update
      const milestone = await Milestone.findById(milestoneId);
      if (!milestone) {
        return res.status(404).json({ error: 'Milestone not found' });
      }

      const newAmount = parseFloat(amount);
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
      payment.description = description;
      payment.paymentMethod = paymentMethod;
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
    }
  } catch (error) {
    console.error('Error updating payment:', error);
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

    if (payment.type === 'SINGLE') {
      // Only try to update milestone if it exists
      if (payment.milestone) {
        const milestone = await Milestone.findById(payment.milestone);
        if (milestone) {
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

          // Calculate remaining amounts with precision
          const totalCost = parseFloat(milestone.budget || 0);
          const pendingAmount = parseFloat((totalCost - newPaidAmount).toFixed(2));

          await Payment.findByIdAndDelete(payment._id);

          return res.json({
            message: 'Payment deleted successfully',
            milestone: milestone,
            milestoneStatus: {
              totalCost: totalCost,
              paidAmount: newPaidAmount,
              pendingAmount: pendingAmount,
              status: milestone.status
            }
          });
        }
      }
      // If we get here, either there was no milestone or it wasn't found
      await Payment.findByIdAndDelete(payment._id);
      return res.json({
        message: 'Payment deleted successfully'
      });
    } else if (payment.type === 'DISTRIBUTED') {
      // For distributed payments, we need to update all affected milestones
      const updates = [];
      
      // Only process distributions with valid milestones
      if (payment.distributions && Array.isArray(payment.distributions)) {
        for (const dist of payment.distributions) {
          try {
            if (dist.milestone) {
              const milestone = await Milestone.findById(dist.milestone);
              if (milestone) {
                // Update milestone paid amount
                const currentPaidAmount = parseFloat(milestone.paidAmount || 0);
                const distributionAmount = parseFloat(dist.amount || 0);
                let newPaidAmount = parseFloat((currentPaidAmount - distributionAmount).toFixed(2));

                // Ensure we don't get negative values
                if (newPaidAmount <= 0) {
                  milestone.status = 'UNPAID';
                  newPaidAmount = 0;
                } else if (newPaidAmount < milestone.budget) {
                  milestone.status = 'PARTIALLY_PAID';
                }

                milestone.paidAmount = newPaidAmount;
                await milestone.save();

                updates.push({
                  milestone: milestone._id,
                  paidAmount: newPaidAmount,
                  status: milestone.status
                });
              }
            }
          } catch (err) {
            console.error('Error processing distribution:', err);
            // Continue with next distribution
          }
        }
      }

      // Delete the distributed payment regardless of milestone updates
      await Payment.findByIdAndDelete(payment._id);

      return res.json({
        message: 'Distributed payment deleted successfully',
        updatedMilestones: updates
      });
    }
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