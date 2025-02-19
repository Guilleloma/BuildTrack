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
    console.log('=== GET /payments ===');
    console.log('Request details:', {
      mode: req.query.mode,
      userId: req.query.userId,
      auth: req.headers.authorization ? 'Present' : 'Not present'
    });

    let query = {};
    
    if (req.query.mode === 'sandbox') {
      query = {
        $or: [
          { 'milestone.project.userId': 'sandbox' },
          { 'distributions.milestone.project.userId': 'sandbox' }
        ]
      };
    } else if (req.headers.authorization && req.query.userId) {
      query = {
        $or: [
          { 'milestone.project.userId': req.query.userId },
          { 'distributions.milestone.project.userId': req.query.userId }
        ]
      };
    } else {
      return res.status(401).json({ error: 'Unauthorized: Token and userId required for non-sandbox mode' });
    }

    const payments = await Payment.find()
      .populate({
        path: 'milestone distributions.milestone',
        populate: {
          path: 'project',
          model: 'Project'
        },
        select: '_id name budget hasTax taxRate paidAmount project'
      });

    // Filter payments based on query after population
    const filteredPayments = payments.filter(payment => {
      if (req.query.mode === 'sandbox') {
        if (payment.type === 'DISTRIBUTED') {
          return payment.distributions.some(dist => 
            dist.milestone?.project?.userId === 'sandbox'
          );
        }
        return payment.milestone?.project?.userId === 'sandbox';
      } else {
        if (payment.type === 'DISTRIBUTED') {
          return payment.distributions.some(dist => 
            dist.milestone?.project?.userId === req.query.userId
          );
        }
        return payment.milestone?.project?.userId === req.query.userId;
      }
    });

    // Get all unique project IDs from both single and distributed payments
    const projectIds = [...new Set([
      ...filteredPayments.map(p => p.milestone?.project?._id).filter(Boolean),
      ...filteredPayments.flatMap(p => p.distributions?.map(d => d.milestone?.project?._id) || []).filter(Boolean)
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
    const paymentsWithProgress = filteredPayments.map(payment => {
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
    console.log('=== POST /payments - New Payment Processing ===');
    console.log('Request body:', req.body);
    
    try {
        const { type, milestoneId, amount, description, paymentMethod, distributions } = req.body;
        
        // Validate amount
        const paymentAmount = parseFloat(amount);
        console.log('Payment amount validation:', {
            raw: amount,
            parsed: paymentAmount
        });

        if (!paymentAmount || paymentAmount <= 0) {
            console.log('Invalid payment amount');
            return res.status(400).json({ error: 'Payment amount must be greater than 0' });
        }

        // Validate based on payment type
        if (type === 'DISTRIBUTED') {
            console.log('Processing DISTRIBUTED payment');
            if (!distributions || !distributions.length) {
                console.log('No distributions provided');
                return res.status(400).json({ error: 'Distributions are required for distributed payments' });
            }

            // Validate total distributed amount matches payment amount
            const totalDistributed = distributions.reduce((sum, dist) => sum + parseFloat(dist.amount), 0);
            console.log('Distribution validation:', {
                totalDistributed,
                paymentAmount,
                difference: Math.abs(totalDistributed - paymentAmount)
            });

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

                // Calculate base amount of this payment
                const paymentBase = milestone.hasTax 
                    ? parseFloat((dist.amount / (1 + (milestone.taxRate || 21) / 100)).toFixed(2))
                    : parseFloat(dist.amount);

                // Calculate current paid amount with tax
                const basePaidAmount = milestone.paidAmount || 0;
                const currentPaidWithTax = milestone.hasTax
                    ? basePaidAmount * (1 + (milestone.taxRate || 21) / 100)
                    : basePaidAmount;

                console.log('Current amounts for milestone:', milestone.name, {
                    basePaidAmount,
                    currentPaidWithTax,
                    remainingWithTax: totalWithTax - currentPaidWithTax,
                    attemptingToAdd: parseFloat(dist.amount)
                });

                if (currentPaidWithTax + parseFloat(dist.amount) > totalWithTax) {
                    return res.status(400).json({ 
                        error: `Payment would exceed milestone ${milestone.name} total cost (including tax)`,
                        milestoneId: dist.milestoneId,
                        currentlyPaid: currentPaidWithTax,
                        totalBase: milestone.budget,
                        totalWithTax: totalWithTax,
                        remaining: totalWithTax - currentPaidWithTax
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
                
                // Calculate base amount of this payment
                const paymentBase = milestone.hasTax 
                    ? parseFloat((dist.amount / (1 + (milestone.taxRate || 21) / 100)).toFixed(2))
                    : parseFloat(dist.amount);

                milestone.paidAmount = parseFloat((milestone.paidAmount || 0) + paymentBase).toFixed(2);
                
                if (milestone.paidAmount >= milestone.budget) {
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
                milestones: updatedMilestones.map(milestone => {
                    const totalWithTax = milestone.hasTax 
                        ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
                        : milestone.budget;
                    
                    return {
                        _id: milestone._id,
                        name: milestone.name,
                        totalCost: milestone.budget,
                        totalWithTax: totalWithTax,
                        paidAmount: milestone.paidAmount,
                        pendingAmount: milestone.budget - milestone.paidAmount,
                        status: milestone.status,
                        hasTax: milestone.hasTax,
                        taxRate: milestone.taxRate || 21
                    };
                })
            });
        } else {
            // Handle single milestone payment
            console.log('Processing SINGLE payment');
            if (!milestoneId) {
                console.log('No milestone ID provided');
                return res.status(400).json({ error: 'Milestone ID is required for single payments' });
            }

            console.log('=== DETAILED PAYMENT VALIDATION LOGS ===');
            console.log('1. Input Data:', {
                paymentAmount,
                milestoneId,
                description,
                paymentMethod
            });

            const milestone = await Milestone.findById(milestoneId).populate('project');
            if (!milestone) {
                console.log('Milestone not found:', milestoneId);
                return res.status(404).json({ error: 'Milestone not found' });
            }

            console.log('2. Milestone Data:', {
                id: milestone._id,
                name: milestone.name,
                budget: milestone.budget,
                hasTax: milestone.hasTax,
                taxRate: milestone.taxRate,
                currentPaidAmount: milestone.paidAmount
            });

            // Calcular el total con impuestos
            const totalWithTax = milestone.hasTax 
                ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
                : milestone.budget;

            // Calcular el monto base pagado y con impuestos
            const basePaidAmount = milestone.paidAmount || 0;
            const currentPaidWithTax = milestone.hasTax
                ? basePaidAmount * (1 + (milestone.taxRate || 21) / 100)
                : basePaidAmount;

            // El monto que intentamos pagar ya incluye impuestos
            const attemptingToAddWithTax = paymentAmount;

            console.log('3. Payment Calculations:', {
                totalBase: milestone.budget,
                totalWithTax,
                basePaidAmount,
                currentPaidWithTax,
                attemptingToAddWithTax,
                remainingWithTax: totalWithTax - currentPaidWithTax
            });

            if (currentPaidWithTax + attemptingToAddWithTax > totalWithTax + 0.01) {
                console.log('4. Payment Validation Failed:', {
                    currentPaidWithTax,
                    attemptingToAdd: attemptingToAddWithTax,
                    wouldBe: currentPaidWithTax + attemptingToAddWithTax,
                    maxAllowed: totalWithTax,
                    difference: (currentPaidWithTax + attemptingToAddWithTax) - totalWithTax
                });

                return res.status(400).json({ 
                    error: 'Payment would exceed milestone total cost (including tax)',
                    details: {
                        currentlyPaid: {
                            base: basePaidAmount,
                            withTax: currentPaidWithTax
                        },
                        attempting: {
                            amount: attemptingToAddWithTax
                        },
                        milestone: {
                            totalBase: milestone.budget,
                            totalWithTax: totalWithTax,
                            remaining: totalWithTax - currentPaidWithTax
                        }
                    }
                });
            }

            // Si la validación pasa, calculamos el monto base del pago
            const paymentBase = milestone.hasTax 
                ? parseFloat((paymentAmount / (1 + (milestone.taxRate || 21) / 100)).toFixed(2))
                : paymentAmount;

            console.log('5. Final Payment Amounts:', {
                paymentAmount,
                paymentBase,
                currentPaidWithTax,
                newTotalWithTax: currentPaidWithTax + paymentAmount,
                maxAllowed: totalWithTax
            });

            const payment = new Payment({
                type: 'SINGLE',
                milestone: milestoneId,
                amount: paymentAmount,
                description: description || '',
                paymentMethod: paymentMethod || 'TRANSFERENCIA_BANCARIA'
            });

            console.log('Saving payment:', payment);
            await payment.save();

            const previousPaidAmount = milestone.paidAmount || 0;
            milestone.paidAmount = parseFloat((previousPaidAmount + paymentBase).toFixed(2));
            
            console.log('Updating milestone:', {
                previousPaidAmount,
                addingBase: paymentBase,
                newPaidAmount: milestone.paidAmount
            });

            if (milestone.paidAmount >= milestone.budget) {
                milestone.status = 'PAID';
            } else if (milestone.paidAmount > 0) {
                milestone.status = 'PARTIALLY_PAID';
            }

            console.log('New milestone status:', {
                paidAmount: milestone.paidAmount,
                budget: milestone.budget,
                status: milestone.status
            });

            await milestone.save();

            // Populate payment with milestone and project info
            await payment.populate({
                path: 'milestone',
                populate: {
                    path: 'project',
                    model: 'Project'
                }
            });

            console.log('=== Payment Processing Complete ===');
            
            res.status(201).json({
                payment,
                milestones: [{
                    _id: milestone._id,
                    name: milestone.name,
                    totalCost: milestone.budget,
                    totalWithTax,
                    paidAmount: milestone.paidAmount,
                    pendingAmount: milestone.budget - milestone.paidAmount,
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
      const oldAmount = payment.amount;

      // Calculate base amounts (without tax)
      const oldBaseAmount = milestone.hasTax 
        ? oldAmount / (1 + (milestone.taxRate || 21) / 100)
        : oldAmount;
      const newBaseAmount = milestone.hasTax 
        ? newAmount / (1 + (milestone.taxRate || 21) / 100)
        : newAmount;
      const amountDiff = newBaseAmount - oldBaseAmount;

      // Calculate total with tax
      const totalWithTax = milestone.hasTax 
        ? milestone.budget * (1 + (milestone.taxRate || 21) / 100)
        : milestone.budget;

      // Check if new amount would exceed milestone total cost
      const currentPaidBase = milestone.paidAmount || 0;
      const newPaidBase = currentPaidBase + amountDiff;
      
      if (newPaidBase > milestone.budget) {
        return res.status(400).json({ 
          error: 'Payment would exceed milestone total cost',
          currentlyPaid: currentPaidBase * (1 + (milestone.hasTax ? (milestone.taxRate || 21) / 100 : 0)),
          totalCost: milestone.budget,
          totalWithTax: totalWithTax,
          remaining: totalWithTax - (currentPaidBase * (1 + (milestone.hasTax ? (milestone.taxRate || 21) / 100 : 0)))
        });
      }

      // Update payment
      payment.amount = newAmount;
      payment.description = description;
      payment.paymentMethod = paymentMethod;
      await payment.save();

      // Update milestone with base amount
      milestone.paidAmount = parseFloat(newPaidBase.toFixed(2));
      if (milestone.paidAmount >= milestone.budget) {
        milestone.status = 'PAID';
      } else if (milestone.paidAmount > 0) {
        milestone.status = 'PARTIALLY_PAID';
      } else {
        milestone.status = 'UNPAID';
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

      res.json({
        payment: payment,
        milestone: milestone,
        milestoneStatus: {
          totalCost: milestone.budget,
          totalWithTax: totalWithTax,
          paidAmount: milestone.paidAmount,
          pendingAmount: totalWithTax - (milestone.paidAmount * (1 + (milestone.hasTax ? (milestone.taxRate || 21) / 100 : 0))),
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
    console.log('=== START DELETE PAYMENT ===');
    console.log('Payment ID:', req.params.id);
    console.log('Milestone ID to remove:', req.query.milestoneId);

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.log('Payment not found');
      return res.status(404).json({ message: 'Payment not found' });
    }

    console.log('Payment found:', {
      id: payment._id,
      type: payment.type,
      amount: payment.amount,
      milestone: payment.milestone,
      distributions: payment.distributions
    });

    // Si es un pago distribuido y se especifica un milestoneId, solo eliminamos esa distribución
    if (payment.type === 'DISTRIBUTED' && req.query.milestoneId) {
      console.log('Processing partial deletion of DISTRIBUTED payment');
      const milestoneIdToRemove = req.query.milestoneId;

      // Encontrar la distribución a eliminar
      const distributionToRemove = payment.distributions.find(
        d => d.milestone.toString() === milestoneIdToRemove
      );

      if (!distributionToRemove) {
        return res.status(404).json({ 
          message: 'Distribution not found in payment'
        });
      }

      // Actualizar el milestone
      const milestone = await Milestone.findById(milestoneIdToRemove);
      if (milestone) {
        console.log('Milestone found:', {
          id: milestone._id,
          name: milestone.name,
          currentPaidAmount: milestone.paidAmount
        });

        // Calcular el monto base del pago para este milestone
        const currentPaidAmount = parseFloat(milestone.paidAmount || 0);
        const distributionAmount = parseFloat(distributionToRemove.amount || 0);
        const paymentBase = milestone.hasTax 
          ? parseFloat((distributionAmount / (1 + (milestone.taxRate || 21) / 100)).toFixed(2))
          : distributionAmount;
        let newPaidAmount = parseFloat((currentPaidAmount - paymentBase).toFixed(2));

        console.log('Calculated new paid amount:', {
          currentPaidAmount,
          distributionAmount,
          paymentBase,
          newPaidAmount
        });

        // Asegurar que no hay valores negativos
        if (newPaidAmount <= 0) {
          milestone.status = 'UNPAID';
          newPaidAmount = 0;
        } else if (newPaidAmount < milestone.budget) {
          milestone.status = 'PARTIALLY_PAID';
        }

        milestone.paidAmount = newPaidAmount;
        await milestone.save();

        // Si solo queda una distribución, convertir a pago simple
        const remainingDistributions = payment.distributions.filter(
          d => d.milestone.toString() !== milestoneIdToRemove
        );

        if (remainingDistributions.length === 1) {
          console.log('Converting to SINGLE payment');
          payment.type = 'SINGLE';
          payment.milestone = remainingDistributions[0].milestone;
          payment.amount = remainingDistributions[0].amount;
          payment.distributions = [];
        } else if (remainingDistributions.length > 1) {
          console.log('Updating distributed payment');
          payment.distributions = remainingDistributions;
          payment.amount = remainingDistributions.reduce(
            (sum, dist) => sum + parseFloat(dist.amount), 
            0
          );
        } else {
          console.log('No remaining distributions, deleting payment');
          await Payment.findByIdAndDelete(payment._id);
          return res.json({
            message: 'Payment deleted successfully',
            milestone: milestone,
            milestoneStatus: {
              totalCost: milestone.budget,
              paidAmount: newPaidAmount,
              pendingAmount: milestone.budget - newPaidAmount,
              status: milestone.status
            }
          });
        }

        // Guardar el pago actualizado
        await payment.save();
        return res.json({
          message: 'Distribution removed successfully',
          payment: payment,
          milestone: milestone,
          milestoneStatus: {
            totalCost: milestone.budget,
            paidAmount: newPaidAmount,
            pendingAmount: milestone.budget - newPaidAmount,
            status: milestone.status
          }
        });
      }
    }

    // Para pagos simples o eliminación completa de pagos distribuidos
    console.log('Processing complete payment deletion');
    const deleteResult = await Payment.findByIdAndDelete(payment._id);
    console.log('Delete result:', deleteResult ? 'Success' : 'Failed');

    if (payment.type === 'SINGLE') {
      console.log('Processing SINGLE payment deletion');
      if (payment.milestone) {
        try {
          console.log('Looking for milestone:', payment.milestone);
          const milestone = await Milestone.findById(payment.milestone);
          
          if (milestone) {
            console.log('Milestone found:', {
              id: milestone._id,
              name: milestone.name,
              currentPaidAmount: milestone.paidAmount,
              paymentAmount: payment.amount
            });

            // Calcular el monto base del pago
            const currentPaidAmount = parseFloat(milestone.paidAmount || 0);
            const paymentAmount = parseFloat(payment.amount || 0);
            const paymentBase = milestone.hasTax 
              ? parseFloat((paymentAmount / (1 + (milestone.taxRate || 21) / 100)).toFixed(2))
              : paymentAmount;
            let newPaidAmount = parseFloat((currentPaidAmount - paymentBase).toFixed(2));

            console.log('Calculated new paid amount:', {
              currentPaidAmount,
              paymentAmount,
              paymentBase,
              newPaidAmount
            });

            // Asegurar que no hay valores negativos
            if (newPaidAmount <= 0) {
              milestone.status = 'UNPAID';
              newPaidAmount = 0;
            } else if (newPaidAmount < milestone.budget) {
              milestone.status = 'PARTIALLY_PAID';
            }

            milestone.paidAmount = newPaidAmount;
            console.log('Saving milestone with new status:', {
              paidAmount: newPaidAmount,
              status: milestone.status
            });
            
            await milestone.save();

            // Calcular montos restantes con precisión
            const totalCost = parseFloat(milestone.budget || 0);
            const pendingAmount = parseFloat((totalCost - newPaidAmount).toFixed(2));

            console.log('Deletion completed successfully with milestone update');
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
          } else {
            console.log('Milestone not found in database');
          }
        } catch (err) {
          console.error('Error updating milestone:', err);
        }
      }
    } else if (payment.type === 'DISTRIBUTED') {
      console.log('Processing complete DISTRIBUTED payment deletion');
      const updates = [];
      
      if (payment.distributions && Array.isArray(payment.distributions)) {
        console.log('Number of distributions:', payment.distributions.length);
        
        for (const dist of payment.distributions) {
          try {
            if (dist.milestone) {
              const milestone = await Milestone.findById(dist.milestone);
              
              if (milestone) {
                console.log('Processing milestone:', {
                  id: milestone._id,
                  name: milestone.name,
                  currentPaidAmount: milestone.paidAmount
                });

                // Calcular el monto base del pago para este milestone
                const currentPaidAmount = parseFloat(milestone.paidAmount || 0);
                const distributionAmount = parseFloat(dist.amount || 0);
                const paymentBase = milestone.hasTax 
                  ? parseFloat((distributionAmount / (1 + (milestone.taxRate || 21) / 100)).toFixed(2))
                  : distributionAmount;
                let newPaidAmount = parseFloat((currentPaidAmount - paymentBase).toFixed(2));

                console.log('Calculated new paid amount:', {
                  currentPaidAmount,
                  distributionAmount,
                  paymentBase,
                  newPaidAmount
                });

                // Asegurar que no hay valores negativos
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
          }
        }
      }

      console.log('Deletion completed successfully. Updated milestones:', updates.length);
      return res.json({
        message: 'Distributed payment deleted successfully',
        updatedMilestones: updates
      });
    }

    return res.json({
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('=== ERROR DELETING PAYMENT ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
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