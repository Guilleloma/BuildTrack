const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const Milestone = require('../models/milestone');
const Task = require('../models/task');
const Payment = require('../models/payment');
const Settings = require('../models/settings');
const { generatePDFReport, generateExcelReport } = require('../utils/reportGenerator');
const XLSX = require('xlsx');

// GET all projects
router.get('/', async (req, res) => {
    try {
        console.log('=== GET /projects ===');
        console.log('Request details:', {
            mode: req.query.mode,
            userId: req.query.userId,
            auth: req.headers.authorization ? 'Present' : 'Not present',
            headers: req.headers,
            query: req.query
        });

        let query = {};
        
        if (req.query.mode === 'sandbox') {
            query.userId = 'sandbox';
            console.log('Using sandbox mode, query:', query);
        } else if (req.query.userId) {
            query.userId = req.query.userId;
            console.log('Using authenticated mode, query:', query);
        }

        console.log('Executing MongoDB query:', query);
        const projects = await Project.find(query);
        console.log('Query results:', {
            count: projects.length,
            projects: projects.map(p => ({
                id: p._id,
                name: p.name,
                userId: p.userId,
                createdAt: p.createdAt
            }))
        });

        // Log the raw projects for debugging
        console.log('Raw projects:', JSON.stringify(projects, null, 2));

        res.json(projects);
    } catch (error) {
        console.error('Error in GET /projects:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Error fetching projects', details: error.message });
    }
});

// GET project progress
router.get('/:id/progress', async (req, res) => {
    console.log('=== GET PROJECT PROGRESS ===');
    console.log('Project ID:', req.params.id);
    
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            console.log('Project not found');
            return res.status(404).json({ error: 'Project not found' });
        }
        console.log('Project found:', project);

        // Get all milestones for this project
        const milestones = await Milestone.find({ project: req.params.id });
        console.log('Milestones found:', milestones.length);
        const milestoneIds = milestones.map(m => m._id);
        
        // Get all payments related to these milestones
        const payments = await Payment.find({
            $or: [
                { milestone: { $in: milestoneIds } },
                { 'distributions.milestone': { $in: milestoneIds } }
            ]
        }).populate('milestone distributions.milestone');
        console.log('Payments found:', payments.length);

        // Get all tasks for these milestones
        const tasks = await Task.find({ 
            milestone: { $in: milestoneIds }
        });
        console.log('Tasks found:', tasks.length);

        // Calculate milestone progress
        console.log('=== Calculating Milestone Progress ===');
        const milestonesWithProgress = await Promise.all(milestones.map(async (milestone) => {
            console.log(`\nProcessing milestone: ${milestone.name}`);
            console.log('Milestone data:', {
                id: milestone._id,
                budget: milestone.budget,
                hasTax: milestone.hasTax,
                taxRate: milestone.taxRate,
                currentPaidAmount: milestone.paidAmount
            });

            // Calculate payments for this milestone
            const singlePayments = payments
                .filter(p => p.type === 'SINGLE' && p.milestone?._id.toString() === milestone._id.toString())
                .reduce((sum, p) => sum + p.amount, 0);

            const distributedPayments = payments
                .filter(p => p.type === 'DISTRIBUTED')
                .reduce((sum, p) => {
                    const distribution = p.distributions.find(d => 
                        d.milestone._id.toString() === milestone._id.toString()
                    );
                    return sum + (distribution?.amount || 0);
                }, 0);

            const totalPaid = singlePayments + distributedPayments;
            console.log('Payment calculations:', {
                singlePayments,
                distributedPayments,
                totalPaid
            });
            
            // Calculate task progress
            const milestoneTasks = tasks.filter(task => 
                task.milestone.toString() === milestone._id.toString()
            );
            const totalTasks = milestoneTasks.length;
            const completedTasks = milestoneTasks.filter(task => 
                task.status === 'COMPLETED'
            ).length;

            const baseAmount = milestone.budget;
            const taxAmount = milestone.hasTax 
                ? baseAmount * (milestone.taxRate || 21) / 100 
                : 0;
            const totalWithTax = baseAmount + taxAmount;

            // Use the stored paidAmount which is already the base amount
            const basePaid = milestone.paidAmount || 0;
            const taxPaid = milestone.hasTax 
                ? basePaid * (milestone.taxRate || 21) / 100 
                : 0;
            const totalPaidWithTax = basePaid + taxPaid;

            console.log('Amount calculations:', {
                baseAmount,
                taxAmount,
                totalWithTax,
                basePaid,
                taxPaid,
                totalPaidWithTax
            });

            return {
                _id: milestone._id,
                name: milestone.name,
                description: milestone.description,
                budget: baseAmount,
                hasTax: milestone.hasTax,
                taxRate: milestone.taxRate || 21,
                totalWithTax,
                paidAmount: basePaid,
                pendingAmount: totalWithTax - totalPaidWithTax,
                status: milestone.status,
                taskCompletionPercentage: totalTasks > 0 
                    ? Math.round((completedTasks / totalTasks) * 100 * 100) / 100 
                    : 0,
                paymentPercentage: totalWithTax > 0 
                    ? Math.round((totalPaidWithTax / totalWithTax) * 100 * 100) / 100 
                    : 0,
                totalTasks,
                completedTasks
            };
        }));

        // Calculate overall progress
        console.log('\n=== Calculating Overall Progress ===');
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
        const taskCompletionPercentage = totalTasks > 0 
            ? (completedTasks / totalTasks) * 100 
            : 0;

        // Calculate total amounts
        const totalBase = milestones.reduce((sum, m) => sum + m.budget, 0);
        const totalBasePaid = milestonesWithProgress.reduce((sum, m) => sum + m.paidAmount, 0);
        const totalTax = milestones.reduce((sum, m) => {
            if (m.hasTax) {
                const taxRate = m.taxRate || 21;
                return sum + (m.budget * (taxRate / 100));
            }
            return sum;
        }, 0);
        const totalTaxPaid = milestonesWithProgress.reduce((sum, m) => {
            if (m.hasTax) {
                const taxRate = m.taxRate || 21;
                const basePaid = m.paidAmount;
                return sum + (basePaid * (taxRate / 100));
            }
            return sum;
        }, 0);

        const totalWithTax = totalBase + totalTax;
        const totalPaid = totalBasePaid + totalTaxPaid;

        console.log('Final calculations:', {
            totalBase,
            totalBasePaid,
            totalTax,
            totalTaxPaid,
            totalWithTax,
            totalPaid
        });

        const response = {
            projectId: project._id,
            milestones: milestonesWithProgress,
            overallProgress: {
                totalTasks,
                completedTasks,
                taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100
            },
            totals: {
                base: totalBase,
                base_paid: totalBasePaid,
                tax: totalTax,
                tax_paid: totalTaxPaid,
                totalWithTax,
                paid: totalPaid,
                paymentPercentage: totalWithTax > 0 ? Math.round((totalPaid / totalWithTax) * 100 * 100) / 100 : 0
            },
            defaultTaxRate: project.defaultTaxRate || 21
        };

        console.log('=== Response ===');
        console.log('Totals:', response.totals);

        res.json(response);
    } catch (error) {
        console.error('Error getting project progress:', error);
        res.status(500).json({ error: 'Error getting project progress' });
    }
});

// GET a single project by id
router.get('/:id', async (req, res) => {
    try {
        console.log('Getting project with id:', req.params.id);
        const project = await Project.findById(req.params.id);
        if (!project) {
            console.log('Project not found');
            return res.status(404).json({ message: 'Project not found' });
        }
        console.log('Project found:', project);

        // Get milestones for this project
        const milestones = await Milestone.find({ project: project._id });
        console.log('Milestones found:', milestones.length);
        const milestoneIds = milestones.map(m => m._id);

        // Get all payments (both single and distributed)
        const payments = await Payment.find({
            $or: [
                { milestone: { $in: milestoneIds } },
                { 'distributions.milestone': { $in: milestoneIds } }
            ]
        }).populate('milestone distributions.milestone');
        console.log('Payments found:', payments.length);
        
        // Get tasks and payments for each milestone
        const milestonesWithTasksAndPayments = await Promise.all(milestones.map(async (milestone) => {
            const tasks = await Task.find({ milestone: milestone._id });
            console.log(`Tasks found for milestone ${milestone._id}:`, tasks.length);

            // Calculate total paid amount including distributed payments
            const singlePayments = payments
                .filter(p => p.type === 'SINGLE' && p.milestone?._id.toString() === milestone._id.toString())
                .reduce((sum, p) => sum + p.amount, 0);

            const distributedPayments = payments
                .filter(p => p.type === 'DISTRIBUTED')
                .reduce((sum, p) => {
                    const distribution = p.distributions.find(d => 
                        d.milestone._id.toString() === milestone._id.toString()
                    );
                    return sum + (distribution?.amount || 0);
                }, 0);

            const totalPaid = singlePayments + distributedPayments;
            console.log('Payment calculations for milestone:', {
                id: milestone._id,
                name: milestone.name,
                singlePayments,
                distributedPayments,
                totalPaid
            });
            
            // Calculate amounts with tax
            const baseAmount = parseFloat(milestone.budget);
            const taxAmount = milestone.hasTax ? baseAmount * (milestone.taxRate || 21) / 100 : 0;
            const totalWithTax = baseAmount + taxAmount;

            // Use the stored paidAmount which is already the base amount
            const basePaid = milestone.paidAmount || 0;
            const taxPaid = milestone.hasTax 
                ? basePaid * (milestone.taxRate || 21) / 100 
                : 0;
            const totalPaidWithTax = basePaid + taxPaid;

            console.log('Amount calculations for milestone:', {
                id: milestone._id,
                name: milestone.name,
                baseAmount,
                taxAmount,
                totalWithTax,
                basePaid,
                taxPaid,
                totalPaidWithTax
            });

            const milestoneObj = milestone.toObject();
            milestoneObj.tasks = tasks;
            milestoneObj.payments = payments.filter(p => 
                (p.type === 'SINGLE' && p.milestone?._id.toString() === milestone._id.toString()) ||
                (p.type === 'DISTRIBUTED' && p.distributions.some(d => d.milestone._id.toString() === milestone._id.toString()))
            );
            milestoneObj.totalWithTax = totalWithTax;
            milestoneObj.taxAmount = taxAmount;
            milestoneObj.baseAmount = baseAmount;
            milestoneObj.paidAmount = basePaid;
            milestoneObj.pendingAmount = totalWithTax - totalPaidWithTax;
            milestoneObj.paymentPercentage = (totalPaidWithTax / totalWithTax) * 100;

            return milestoneObj;
        }));

        // Calculate project totals
        const projectTotals = milestonesWithTasksAndPayments.reduce((totals, m) => ({
            totalBase: totals.totalBase + m.baseAmount,
            totalTax: totals.totalTax + m.taxAmount,
            totalWithTax: totals.totalWithTax + m.totalWithTax,
            totalBasePaid: totals.totalBasePaid + m.paidAmount,
            totalTaxPaid: totals.totalTaxPaid + (m.hasTax ? m.paidAmount * (m.taxRate || 21) / 100 : 0)
        }), { totalBase: 0, totalTax: 0, totalWithTax: 0, totalBasePaid: 0, totalTaxPaid: 0 });

        const totalPaid = projectTotals.totalBasePaid + projectTotals.totalTaxPaid;

        console.log('Project totals:', {
            ...projectTotals,
            totalPaid
        });

        const projectData = project.toObject();
        projectData.milestones = milestonesWithTasksAndPayments;
        projectData.totals = {
            base: parseFloat(projectTotals.totalBase.toFixed(2)),
            tax: parseFloat(projectTotals.totalTax.toFixed(2)),
            totalWithTax: parseFloat(projectTotals.totalWithTax.toFixed(2)),
            base_paid: parseFloat(projectTotals.totalBasePaid.toFixed(2)),
            tax_paid: parseFloat(projectTotals.totalTaxPaid.toFixed(2)),
            paid: parseFloat(totalPaid.toFixed(2)),
            paymentPercentage: (totalPaid / projectTotals.totalWithTax) * 100
        };

        // Send the response
        console.log('Sending response with totals:', projectData.totals);
        res.json(projectData);
    } catch (error) {
        console.error('Error in GET /:id:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST create a new project
router.post('/', async (req, res) => {
    try {
        console.log('=== POST /projects ===');
        console.log('Request details:', {
            body: req.body,
            headers: req.headers,
            auth: req.headers.authorization ? 'Present' : 'Not present'
        });

        console.log('Creating project with data:', {
            name: req.body.name,
            description: req.body.description,
            userId: req.body.userId,
            totalBudget: req.body.totalBudget || 0,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        });

        const project = new Project({
            name: req.body.name,
            description: req.body.description,
            totalBudget: req.body.totalBudget || 0,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            userId: req.body.userId
        });

        console.log('Project model instance created:', project);
        const newProject = await project.save();
        console.log('Project saved successfully:', {
            id: newProject._id,
            name: newProject.name,
            userId: newProject.userId,
            createdAt: newProject.createdAt
        });

        // Log the raw project for debugging
        console.log('Raw project:', JSON.stringify(newProject, null, 2));

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error in POST /projects:', error);
        console.error('Stack trace:', error.stack);
        res.status(400).json({ message: error.message, details: error });
    }
});

// PUT update an existing project
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE remove a project
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        // Get all milestones for this project
        const milestones = await Milestone.find({ project: project._id });
        const milestoneIds = milestones.map(m => m._id);
        
        // Delete all related tasks, payments and milestones
        await Task.deleteMany({ milestone: { $in: milestoneIds } });
        await Payment.deleteMany({ milestone: { $in: milestoneIds } });
        await Milestone.deleteMany({ project: project._id });
        
        res.json({ message: 'Project deleted', project });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create a new milestone
router.post('/:projectId/milestones', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const settings = await Settings.getSettings();
        
        const milestone = new Milestone({
            project: project._id,
            name: req.body.name,
            description: req.body.description,
            budget: req.body.budget || 0,
            dueDate: req.body.dueDate,
            hasTax: req.body.hasTax !== undefined ? req.body.hasTax : true,
            taxRate: req.body.taxRate !== undefined ? req.body.taxRate : settings.defaultTaxRate
        });

        const newMilestone = await milestone.save();
        res.status(201).json(newMilestone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update a milestone
router.put('/:projectId/milestones/:milestoneId', async (req, res) => {
    try {
        const milestone = await Milestone.findOneAndUpdate(
            { _id: req.params.milestoneId, project: req.params.projectId },
            req.body,
            { new: true }
        );
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }
        res.json(milestone);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE remove a milestone
router.delete('/:projectId/milestones/:milestoneId', async (req, res) => {
    try {
        const milestone = await Milestone.findOneAndDelete({
            _id: req.params.milestoneId,
            project: req.params.projectId
        });
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }
        // Delete all related tasks and payments
        await Task.deleteMany({ milestone: milestone._id });
        await Payment.deleteMany({ milestone: milestone._id });
        res.json({ message: 'Milestone deleted', milestone });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create a new task
router.post('/:projectId/milestones/:milestoneId/tasks', async (req, res) => {
    try {
        const milestone = await Milestone.findOne({
            _id: req.params.milestoneId,
            project: req.params.projectId
        });
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        const task = new Task({
            milestone: milestone._id,
            name: req.body.name,
            description: req.body.description,
            dueDate: req.body.dueDate,
            status: req.body.status || 'PENDING'
        });

        const newTask = await task.save();
        
        // Get updated milestone data with tasks
        const updatedMilestone = await Milestone.findById(milestone._id);
        const milestoneTasks = await Task.find({ milestone: milestone._id });
        
        res.status(201).json({
            task: newTask,
            milestone: updatedMilestone,
            tasks: milestoneTasks
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update a task
router.put('/:projectId/milestones/:milestoneId/tasks/:taskId', async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { 
                _id: req.params.taskId,
                milestone: req.params.milestoneId
            },
            req.body,
            { new: true }
        );
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Calculate task completion percentage
        const milestone = await Milestone.findById(req.params.milestoneId);
        const tasks = await Task.find({ milestone: milestone._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
        const taskCompletionPercentage = (completedTasks / totalTasks) * 100;

        res.json({
            task,
            milestoneProgress: {
                taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
                totalTasks,
                completedTasks
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE remove a task
router.delete('/:projectId/milestones/:milestoneId/tasks/:taskId', async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.taskId,
            milestone: req.params.milestoneId
        });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted', task });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: error.message || 'Error deleting task' });
    }
});

// GET project report in PDF format
router.get('/:id/report/pdf', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get complete project data with milestones, tasks and payments
        const milestones = await Milestone.find({ project: project._id });
        const milestoneIds = milestones.map(m => m._id);
        
        const payments = await Payment.find({
            $or: [
                { milestone: { $in: milestoneIds } },
                { 'distributions.milestone': { $in: milestoneIds } }
            ]
        }).populate('milestone distributions.milestone');

        const tasks = await Task.find({ milestone: { $in: milestoneIds } });

        // Calculate project totals and progress
        const projectData = await calculateProjectData(project, milestones, payments, tasks);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=project-${project.name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);

        // Manejar errores del stream
        const chunks = [];
        const stream = new require('stream').PassThrough();

        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {
            const result = Buffer.concat(chunks);
            res.end(result);
        });
        stream.on('error', err => {
            console.error('Error en el stream:', err);
            res.status(500).json({ message: 'Error generating PDF' });
        });

        // Generate PDF
        generatePDFReport(projectData, stream);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET project report in Excel format
router.get('/:id/report/excel', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get complete project data with milestones, tasks and payments
        const milestones = await Milestone.find({ project: project._id });
        const milestoneIds = milestones.map(m => m._id);
        
        const payments = await Payment.find({
            $or: [
                { milestone: { $in: milestoneIds } },
                { 'distributions.milestone': { $in: milestoneIds } }
            ]
        }).populate('milestone distributions.milestone');

        const tasks = await Task.find({ milestone: { $in: milestoneIds } });

        // Calculate project totals and progress
        const projectData = await calculateProjectData(project, milestones, payments, tasks);

        // Generate Excel workbook
        const workbook = generateExcelReport(projectData);

        // Convert workbook to buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=project-${project.name.toLowerCase().replace(/\s+/g, '-')}-report.xlsx`);

        // Send buffer
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a single milestone
router.get('/:projectId/milestones/:milestoneId', async (req, res) => {
    console.log('=== GET MILESTONE ===');
    console.log('Project ID:', req.params.projectId);
    console.log('Milestone ID:', req.params.milestoneId);
    
    try {
        console.log('Searching for milestone with query:', {
            _id: req.params.milestoneId,
            project: req.params.projectId
        });
        
        const milestone = await Milestone.findOne({
            _id: req.params.milestoneId,
            project: req.params.projectId
        });
        
        console.log('Raw milestone from DB:', milestone);
        console.log('Milestone found:', milestone ? 'Yes' : 'No');
        
        if (!milestone) {
            console.log('Milestone not found, sending 404');
            return res.status(404).json({ 
                message: 'Milestone not found',
                query: {
                    _id: req.params.milestoneId,
                    project: req.params.projectId
                }
            });
        }
        
        console.log('Sending milestone data:', milestone);
        res.json(milestone);
    } catch (err) {
        console.error('Error getting milestone:', err);
        res.status(500).json({ 
            message: err.message,
            query: {
                _id: req.params.milestoneId,
                project: req.params.projectId
            }
        });
    }
});

// Helper function to calculate project data
async function calculateProjectData(project, milestones, payments, tasks) {
    const milestonesWithData = await Promise.all(milestones.map(async (milestone) => {
        const milestoneTasks = tasks.filter(t => t.milestone.toString() === milestone._id.toString());
        const totalTasks = milestoneTasks.length;
        const completedTasks = milestoneTasks.filter(t => t.status === 'COMPLETED').length;

        // Calculate payments for this milestone
        const singlePayments = payments
            .filter(p => p.type === 'SINGLE' && p.milestone?._id.toString() === milestone._id.toString());
        
        const distributedPayments = payments
            .filter(p => p.type === 'DISTRIBUTED' && p.distributions.some(d => 
                d.milestone._id.toString() === milestone._id.toString()
            ));

        const milestonePayments = [
            ...singlePayments,
            ...distributedPayments.map(p => ({
                ...p.toObject(),
                amount: p.distributions.find(d => 
                    d.milestone._id.toString() === milestone._id.toString()
                ).amount
            }))
        ];

        const totalPaid = milestonePayments.reduce((sum, p) => sum + p.amount, 0);
        
        const baseAmount = milestone.budget;
        const taxAmount = milestone.hasTax ? baseAmount * (milestone.taxRate || 21) / 100 : 0;
        const totalWithTax = baseAmount + taxAmount;

        return {
            ...milestone.toObject(),
            tasks: milestoneTasks,
            payments: milestonePayments,
            totalTasks,
            completedTasks,
            taskCompletionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            paymentPercentage: totalWithTax > 0 ? (totalPaid / totalWithTax) * 100 : 0,
            paidAmount: totalPaid,
            totalWithTax,
            baseAmount,
            taxAmount
        };
    }));

    // Calculate project totals
    const totalBase = milestonesWithData.reduce((sum, m) => sum + m.baseAmount, 0);
    const totalTax = milestonesWithData.reduce((sum, m) => sum + m.taxAmount, 0);
    const totalWithTax = milestonesWithData.reduce((sum, m) => sum + m.totalWithTax, 0);
    const totalPaid = milestonesWithData.reduce((sum, m) => sum + m.paidAmount, 0);

    return {
        ...project.toObject(),
        milestones: milestonesWithData,
        totals: {
            base: totalBase,
            tax: totalTax,
            totalWithTax,
            paid: totalPaid,
            paymentPercentage: totalWithTax > 0 ? (totalPaid / totalWithTax) * 100 : 0
        }
    };
}

module.exports = router;