const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const Milestone = require('../models/milestone');
const Task = require('../models/task');
const Payment = require('../models/payment');

// GET all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find();
        const projectsWithProgress = await Promise.all(projects.map(async (project) => {
            const milestones = await Milestone.find({ project: project._id });
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

        res.json(projectsWithProgress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET project progress
router.get('/:id/progress', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const milestones = await Milestone.find({ project: project._id });
        const tasks = await Task.find({
            milestone: { $in: milestones.map(m => m._id) }
        });

        // Calculate overall progress
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

        // Calculate progress for each milestone
        const milestonesWithProgress = await Promise.all(milestones.map(async (milestone) => {
            const milestoneTasks = tasks.filter(task => task.milestone.toString() === milestone._id.toString());
            const totalTasks = milestoneTasks.length;
            const completedTasks = milestoneTasks.filter(task => task.status === 'COMPLETED').length;
            const taskCompletionPercentage = totalTasks > 0 
                ? (completedTasks / totalTasks) * 100 
                : 0;
            const paymentPercentage = milestone.budget > 0 
                ? (milestone.paidAmount / milestone.budget) * 100 
                : 0;

            return {
                _id: milestone._id,
                name: milestone.name,
                description: milestone.description,
                budget: milestone.budget,
                paidAmount: milestone.paidAmount,
                status: milestone.status,
                taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
                paymentPercentage: Math.round(paymentPercentage * 100) / 100,
                totalTasks,
                completedTasks
            };
        }));

        res.json({
            projectId: project._id,
            milestones: milestonesWithProgress,
            overallProgress: {
                taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
                paymentPercentage: Math.round(paymentPercentage * 100) / 100,
                totalTasks: totalProjectTasks,
                completedTasks: totalCompletedTasks,
                totalCost: totalProjectCost,
                paidAmount: totalPaidAmount
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a single project by id
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get milestones for this project
        const milestones = await Milestone.find({ project: project._id });
        const projectData = project.toObject();
        projectData.milestones = milestones;

        res.json(projectData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create a new project
router.post('/', async (req, res) => {
    try {
        const project = new Project({
            name: req.body.name,
            description: req.body.description,
            totalBudget: req.body.totalBudget || 0,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        });

        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
        // Also delete all related milestones and tasks
        const milestones = await Milestone.find({ project: project._id });
        await Task.deleteMany({ milestone: { $in: milestones.map(m => m._id) } });
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

        const milestone = new Milestone({
            project: project._id,
            name: req.body.name,
            description: req.body.description,
            budget: req.body.budget || 0,
            dueDate: req.body.dueDate
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
        // Delete all related tasks
        await Task.deleteMany({ milestone: milestone._id });
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

module.exports = router;