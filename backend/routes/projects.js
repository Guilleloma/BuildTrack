const express = require('express');
const router = express.Router();
const data = require('../data');

// GET all projects
router.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(data.projects);
});

// GET a single project by id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const project = data.projects.find(p => p.id === id);
    if (project) {
        res.json(project);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

// POST create a new project
router.post('/', (req, res) => {
    const newProject = {
        id: data.nextProjectId++,
        name: req.body.name,
        description: req.body.description,
        tasks: [],
        taskNextId: 1,
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
    const { title, description, cost } = req.body;
    const totalCost = cost ? parseFloat(cost) : 0;
    const newMilestone = {
         id: project.milestoneNextId++,
         title,
         description,
         totalCost: totalCost,
         paidAmount: 0,
         pendingAmount: totalCost,
         completed: false,
         tasks: [],
         taskNextId: 1
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
    milestone.title = req.body.title !== undefined ? req.body.title : milestone.title;
    milestone.description = req.body.description !== undefined ? req.body.description : milestone.description;
    milestone.completed = req.body.completed !== undefined ? req.body.completed : milestone.completed;
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
    task.title = req.body.title !== undefined ? req.body.title : task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;
    res.json(task);
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

module.exports = router;