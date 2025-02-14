import React, { useState, useEffect } from 'react';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');

  const baseURL = 'http://localhost:3000/projects';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Error fetching projects');
      }
    } catch (error) {
      console.error('Error fetching projects', error);
    }
  };

  const addProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription
        })
      });
      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
        setNewProjectName('');
        setNewProjectDescription('');
      } else {
        console.error('Error adding project');
      }
    } catch (error) {
      console.error('Error adding project', error);
    }
  };

  const deleteProject = async (id) => {
    try {
      const response = await fetch(`${baseURL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.filter(p => p.id !== id));
      } else {
        console.error('Error deleting project');
      }
    } catch (error) {
      console.error('Error deleting project', error);
    }
  };

  const startEditing = (project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
    setEditingDescription(project.description);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditingName('');
    setEditingDescription('');
  };

  const updateProject = async (id) => {
    try {
      const response = await fetch(`${baseURL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName,
          description: editingDescription
        })
      });
      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(projects.map(p => p.id === id ? updatedProject : p));
        cancelEditing();
      } else {
        console.error('Error updating project');
      }
    } catch (error) {
      console.error('Error updating project', error);
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      <form onSubmit={addProject}>
        <input 
          type="text" 
          placeholder="Project Name" 
          value={newProjectName} 
          onChange={(e) => setNewProjectName(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Project Description" 
          value={newProjectDescription} 
          onChange={(e) => setNewProjectDescription(e.target.value)} 
          required 
        />
        <button type="submit">Add Project</button>
      </form>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            {editingProjectId === project.id ? (
              <div>
                <input 
                  type="text" 
                  value={editingName} 
                  onChange={(e) => setEditingName(e.target.value)} 
                />
                <input 
                  type="text" 
                  value={editingDescription} 
                  onChange={(e) => setEditingDescription(e.target.value)} 
                />
                <button onClick={() => updateProject(project.id)}>Save</button>
                <button onClick={cancelEditing}>Cancel</button>
              </div>
            ) : (
              <div>
                <strong>{project.name}</strong>: {project.description}
                <button onClick={() => startEditing(project)}>Edit</button>
                <button onClick={() => deleteProject(project.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Projects; 