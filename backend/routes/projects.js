const express = require('express');
const router = express.Router();

let projects = [];
let nextId = 1;

// GET all projects
router.get('/', (req, res) => {
    res.json(projects);
});

// GET a single project by id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const project = projects.find(p => p.id === id);
    if (project) {
        res.json(project);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

// POST create a new project
router.post('/', (req, res) => {
    const newProject = {
        id: nextId++,
        name: req.body.name,
        description: req.body.description
    };
    projects.push(newProject);
    res.status(201).json(newProject);
});

// PUT update an existing project by id
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        projects[index] = {
            ...projects[index],
            name: req.body.name !== undefined ? req.body.name : projects[index].name,
            description: req.body.description !== undefined ? req.body.description : projects[index].description
        };
        res.json(projects[index]);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

// DELETE remove a project by id
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        const deleted = projects.splice(index, 1)[0];
        res.json({ message: 'Project deleted', project: deleted });
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

module.exports = router; 