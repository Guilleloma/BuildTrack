const express = require('express');
const router = express.Router();
const data = require('../data');

// GET all projects
router.get('/', (req, res) => {
    const projectsWithProgress = data.projects.map(project => {
        // Calculate totals across all milestones
        const totalProjectTasks = project.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
        const totalCompletedTasks = project.milestones.reduce((sum, m) => 
            sum + m.tasks.filter(task => task.completed).length, 0);
        const totalProjectCost = project.milestones.reduce((sum, m) => sum + m.totalCost, 0);
        const totalPaidAmount = project.milestones.reduce((sum, m) => sum + m.paidAmount, 0);

        // Calculate overall progress
        const taskCompletionPercentage = totalProjectTasks > 0 
            ? (totalCompletedTasks / totalProjectTasks) * 100 
            : 0;
        const paymentPercentage = totalProjectCost > 0 
            ? (totalPaidAmount / totalProjectCost) * 100 
            : 0;

        return {
            ...project,
            progress: {
                taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
                paymentPercentage: Math.round(paymentPercentage * 100) / 100,
                totalTasks: totalProjectTasks,
                completedTasks: totalCompletedTasks,
                totalCost: totalProjectCost,
                paidAmount: totalPaidAmount
            }
        };
    });

    res.json(projectsWithProgress);
});

// GET a single project by id
router.get('/:id', (req, res) => {
    const project = data.projects.find(p => p.id === parseInt(req.params.id));
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
});

// POST create a new project
router.post('/', (req, res) => {
    const { name, description } = req.body;
    const newProject = {
        id: data.projects.length + 1,
        name,
        description,
        createdAt: new Date().toISOString(),
        milestones: [],
        milestoneNextId: 1
    };
    data.projects.push(newProject);
    res.status(201).json(newProject);
});

// PUT update an existing project by id
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = data.projects.findIndex(p => p.id === id);
    if (index !== -1) {
        data.projects[index] = {
            ...data.projects[index],
            name: req.body.name !== undefined ? req.body.name : data.projects[index].name,
            description: req.body.description !== undefined ? req.body.description : data.projects[index].description
        };
        res.json(data.projects[index]);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

// DELETE remove a project by id
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = data.projects.findIndex(p => p.id === id);
    if (index !== -1) {
        const deleted = data.projects.splice(index, 1)[0];
        res.json({ message: 'Project deleted', project: deleted });
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

// Sprint 3: Endpoints for Milestones
router.post('/:projectId/milestones', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    // Initialize milestones array if it doesn't exist
    if (!project.milestones) {
        project.milestones = [];
        project.milestoneNextId = 1;
    }

    const { title, description, cost } = req.body;
    
    // Validate required fields
    if (!title) {
        return res.status(400).json({ message: 'Title is required for the milestone' });
    }

    // Parse and validate cost
    const parsedCost = cost ? parseFloat(cost) : 0;
    if (isNaN(parsedCost) || parsedCost < 0) {
        return res.status(400).json({ message: 'Cost must be a valid number greater than or equal to 0' });
    }
    
    const newMilestone = {
        id: project.milestoneNextId++,
        title,
        description: description || '',
        totalCost: parsedCost,
        paidAmount: 0,
        pendingAmount: parsedCost,
        paymentStatus: 'UNPAID',
        completed: false,
        tasks: [],
        taskNextId: 1,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    project.milestones.push(newMilestone);
    res.status(201).json(newMilestone);
});

router.put('/:projectId/milestones/:milestoneId', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
         return res.status(404).json({ message: 'Project not found' });
    }
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
         return res.status(404).json({ message: 'Milestone not found' });
    }

    // Update basic fields
    milestone.title = req.body.title !== undefined ? req.body.title : milestone.title;
    milestone.description = req.body.description !== undefined ? req.body.description : milestone.description;
    milestone.completed = req.body.completed !== undefined ? req.body.completed : milestone.completed;
    
    // Update cost if provided (only if no payments have been made)
    if (req.body.cost !== undefined) {
        const newCost = parseFloat(req.body.cost);
        if (milestone.paidAmount > 0) {
            return res.status(400).json({ 
                message: 'Cannot modify cost after payments have been made',
                currentPaidAmount: milestone.paidAmount
            });
        }
        if (isNaN(newCost) || newCost <= 0) {
            return res.status(400).json({ message: 'Invalid cost value' });
        }
        milestone.totalCost = newCost;
        milestone.pendingAmount = newCost - milestone.paidAmount;
    }

    milestone.lastUpdated = new Date().toISOString();
    res.json(milestone);
});

router.delete('/:projectId/milestones/:milestoneId', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
         return res.status(404).json({ message: 'Project not found' });
    }
    const index = project.milestones.findIndex(m => m.id === milestoneId);
    if (index === -1) {
         return res.status(404).json({ message: 'Milestone not found' });
    }
    const deletedMilestone = project.milestones.splice(index, 1)[0];
    res.json({ message: 'Milestone deleted', milestone: deletedMilestone });
});

/* Sprint 3: Endpoints for Tasks within a Milestone */
router.post('/:projectId/milestones/:milestoneId/tasks', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
         return res.status(404).json({ message: 'Project not found' });
    }
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
         return res.status(404).json({ message: 'Milestone not found' });
    }
    const { title, description } = req.body;
    const newTask = {
         id: milestone.taskNextId++,
         title,
         description,
         completed: false
    };
    milestone.tasks.push(newTask);
    res.status(201).json(newTask);
});

router.put('/:projectId/milestones/:milestoneId/tasks/:taskId', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const taskId = parseInt(req.params.taskId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
         return res.status(404).json({ message: 'Project not found' });
    }
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
         return res.status(404).json({ message: 'Milestone not found' });
    }
    const task = milestone.tasks.find(t => t.id === taskId);
    if (!task) {
         return res.status(404).json({ message: 'Task not found' });
    }

    // Update task fields
    task.title = req.body.title !== undefined ? req.body.title : task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;

    // Calculate task completion percentage and update milestone completion status
    const totalTasks = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(t => t.completed).length;
    const taskCompletionPercentage = (completedTasks / totalTasks) * 100;

    // Update milestone completion status
    milestone.completed = completedTasks === totalTasks;
    milestone.lastUpdated = new Date().toISOString();

    res.json({
        task,
        milestoneProgress: {
            taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
            totalTasks,
            completedTasks,
            milestoneCompleted: milestone.completed
        }
    });
});

router.delete('/:projectId/milestones/:milestoneId/tasks/:taskId', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const taskId = parseInt(req.params.taskId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
         return res.status(404).json({ message: 'Project not found' });
    }
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
         return res.status(404).json({ message: 'Milestone not found' });
    }
    const index = milestone.tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
         return res.status(404).json({ message: 'Task not found' });
    }
    const deletedTask = milestone.tasks.splice(index, 1)[0];
    res.json({ message: 'Task deleted', task: deletedTask });
});

// GET project progress
router.get('/:projectId/progress', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }

    // Calculate totals across all milestones
    const totalProjectTasks = project.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
    const totalCompletedTasks = project.milestones.reduce((sum, m) => 
        sum + m.tasks.filter(task => task.completed).length, 0);
    const totalProjectCost = project.milestones.reduce((sum, m) => sum + m.totalCost, 0);
    const totalPaidAmount = project.milestones.reduce((sum, m) => sum + m.paidAmount, 0);

    const progress = project.milestones.map(milestone => {
        // Calculate task completion percentage
        const totalTasks = milestone.tasks.length;
        const completedTasks = milestone.tasks.filter(task => task.completed).length;
        const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate payment percentage
        const paymentPercentage = milestone.totalCost > 0 ? (milestone.paidAmount / milestone.totalCost) * 100 : 0;

        return {
            id: milestone.id,
            title: milestone.title,
            taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
            paymentPercentage: Math.round(paymentPercentage * 100) / 100,
            totalTasks,
            completedTasks,
            totalCost: milestone.totalCost,
            paidAmount: milestone.paidAmount
        };
    });

    // Calculate overall project progress
    const overallTaskCompletion = totalProjectTasks > 0 
        ? (totalCompletedTasks / totalProjectTasks) * 100 
        : 0;
    const overallPaymentPercentage = totalProjectCost > 0 
        ? (totalPaidAmount / totalProjectCost) * 100 
        : 0;

    res.json({
        projectId,
        milestones: progress,
        overallProgress: {
            taskCompletionPercentage: Math.round(overallTaskCompletion * 100) / 100,
            paymentPercentage: Math.round(overallPaymentPercentage * 100) / 100,
            totalTasks: totalProjectTasks,
            completedTasks: totalCompletedTasks,
            totalCost: totalProjectCost,
            paidAmount: totalPaidAmount
        }
    });
});

// Modify the existing milestone GET endpoint to include progress information
router.get('/:projectId/milestones/:milestoneId', (req, res) => {
    const projectId = parseInt(req.params.projectId, 10);
    const milestoneId = parseInt(req.params.milestoneId, 10);
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
        return res.status(404).json({ message: 'Project not found' });
    }
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
        return res.status(404).json({ message: 'Milestone not found' });
    }

    // Calculate progress percentages
    const totalTasks = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(task => task.completed).length;
    const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const paymentPercentage = milestone.totalCost > 0 ? (milestone.paidAmount / milestone.totalCost) * 100 : 0;

    res.json({
        ...milestone,
        progress: {
            taskCompletionPercentage: Math.round(taskCompletionPercentage * 100) / 100,
            paymentPercentage: Math.round(paymentPercentage * 100) / 100,
            totalTasks,
            completedTasks
        }
    });
});

module.exports = router;