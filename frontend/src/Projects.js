import React, { useState, useEffect } from 'react';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [expandedProjects, setExpandedProjects] = useState({});
  const [newMilestoneData, setNewMilestoneData] = useState({});
  const [newMilestoneTaskData, setNewMilestoneTaskData] = useState({});

  const baseURL = 'http://localhost:3000/projects';

  useEffect(() => {
    fetchProjects();
    const intervalId = setInterval(() => {
      fetchProjects();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log('Projects state updated:', projects);
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${baseURL}?_=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched projects', data);
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
    console.log('addProject called', newProjectName, newProjectDescription);
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
        await fetchProjects();
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
        await fetchProjects();
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
        await fetchProjects();
      } else {
        console.error('Error updating project');
      }
    } catch (error) {
      console.error('Error updating project', error);
    }
  };

  const toggleExpand = (projectId) => {
    setExpandedProjects({ ...expandedProjects, [projectId]: !expandedProjects[projectId] });
  };

  const handleMilestoneChange = (projectId, field, value) => {
    setNewMilestoneData({ ...newMilestoneData, [projectId]: { ...(newMilestoneData[projectId] || {}), [field]: value } });
  };

  const addMilestone = async (projectId) => {
    const milestoneData = newMilestoneData[projectId];
    if (!milestoneData || !milestoneData.title || !milestoneData.description) return;
    try {
      const response = await fetch(`${baseURL}/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneData)
      });
      if (response.ok) {
        const newMilestone = await response.json();
        setProjects(projects.map(p => p.id === projectId ? { ...p, milestones: [...p.milestones, newMilestone] } : p));
        setNewMilestoneData({ ...newMilestoneData, [projectId]: { title: '', description: '', cost: '' } });
        await fetchProjects();
      } else {
        console.error('Error adding milestone');
      }
    } catch (error) {
      console.error('Error adding milestone', error);
    }
  };

  const deleteMilestone = async (projectId, milestoneId) => {
    try {
      const response = await fetch(`${baseURL}/${projectId}/milestones/${milestoneId}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.map(p => p.id === projectId ? { ...p, milestones: p.milestones.filter(m => m.id !== milestoneId) } : p));
        await fetchProjects();
      } else {
        console.error('Error deleting milestone');
      }
    } catch (error) {
      console.error('Error deleting milestone', error);
    }
  };

  const handleMilestoneTaskChange = (projectId, milestoneId, field, value) => {
    const key = `${projectId}-${milestoneId}`;
    setNewMilestoneTaskData({ ...newMilestoneTaskData, [key]: { ...(newMilestoneTaskData[key] || {}), [field]: value } });
  };

  const addTaskToMilestone = async (projectId, milestoneId) => {
    const key = `${projectId}-${milestoneId}`;
    const taskData = newMilestoneTaskData[key];
    if (!taskData || !taskData.title || !taskData.description) return;
    try {
      const response = await fetch(`${baseURL}/${projectId}/milestones/${milestoneId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (response.ok) {
        const newTask = await response.json();
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            return { ...p, milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, tasks: [...m.tasks, newTask] } : m) };
          } else {
            return p;
          }
        }));
        setNewMilestoneTaskData({ ...newMilestoneTaskData, [key]: { title: '', description: '' } });
        await fetchProjects();
      } else {
        console.error('Error adding task to milestone');
      }
    } catch (error) {
      console.error('Error adding task to milestone', error);
    }
  };

  const deleteTaskFromMilestone = async (projectId, milestoneId, taskId) => {
    try {
      const response = await fetch(`${baseURL}/${projectId}/milestones/${milestoneId}/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            return { ...p, milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, tasks: m.tasks.filter(t => t.id !== taskId) } : m) };
          } else {
            return p;
          }
        }));
        await fetchProjects();
      } else {
        console.error('Error deleting task from milestone');
      }
    } catch (error) {
      console.error('Error deleting task from milestone', error);
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        console.log('Formulario enviado', newProjectName, newProjectDescription); 
        addProject(e); 
      }}>
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
        <button type="submit" onClick={() => console.log("submit button clicked")}>Add Project</button>
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
                  onKeyDown={(e) => { if(e.key === 'Enter') { updateProject(project.id); } }}
                />
                <input 
                  type="text" 
                  value={editingDescription} 
                  onChange={(e) => setEditingDescription(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') { updateProject(project.id); } }}
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
            <button onClick={() => toggleExpand(project.id)}>
              {expandedProjects[project.id] ? 'Hide' : 'Show'} Milestones
            </button>
            {expandedProjects[project.id] && (
              <div style={{ border: '1px solid #ccc', marginTop: '10px', padding: '10px' }}>
                <h4>Milestones</h4>
                <ul>
                  {project.milestones && project.milestones.map(milestone => (
                    <li key={milestone.id}>
                      <div style={{ border: '1px solid #aaa', margin: '5px', padding: '5px' }}>
                        <strong>{milestone.title}</strong>: {milestone.description} - {milestone.completed ? 'Completed' : 'Pending'}
                        <div>
                          Cost: {milestone.totalCost} | Paid: {milestone.paidAmount} | Pending: {milestone.pendingAmount}
                        </div>
                        <button onClick={() => deleteMilestone(project.id, milestone.id)}>Delete Milestone</button>
                        <div style={{ marginLeft: '20px' }}>
                          <h5>Tasks</h5>
                          <ul>
                            {milestone.tasks && milestone.tasks.map(task => (
                              <li key={task.id}>
                                {task.title}: {task.description} - {task.completed ? 'Completed' : 'Pending'}
                                <button onClick={() => deleteTaskFromMilestone(project.id, milestone.id, task.id)}>Delete Task</button>
                              </li>
                            ))}
                          </ul>
                          <div>
                            <input
                              type="text"
                              placeholder="Task Title"
                              value={newMilestoneTaskData[`${project.id}-${milestone.id}`]?.title || ''}
                              onChange={(e) => handleMilestoneTaskChange(project.id, milestone.id, 'title', e.target.value)}
                              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addTaskToMilestone(project.id, milestone.id); } }}
                            />
                            <input
                              type="text"
                              placeholder="Task Description"
                              value={newMilestoneTaskData[`${project.id}-${milestone.id}`]?.description || ''}
                              onChange={(e) => handleMilestoneTaskChange(project.id, milestone.id, 'description', e.target.value)}
                              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addTaskToMilestone(project.id, milestone.id); } }}
                            />
                            <button onClick={() => addTaskToMilestone(project.id, milestone.id)}>Add Task</button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div>
                  <input
                    type="text"
                    placeholder="Milestone Title"
                    value={newMilestoneData[project.id]?.title || ''}
                    onChange={(e) => handleMilestoneChange(project.id, 'title', e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addMilestone(project.id); } }}
                  />
                  <input
                    type="text"
                    placeholder="Milestone Description"
                    value={newMilestoneData[project.id]?.description || ''}
                    onChange={(e) => handleMilestoneChange(project.id, 'description', e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addMilestone(project.id); } }}
                  />
                  <input
                    type="text"
                    placeholder="Cost"
                    value={newMilestoneData[project.id]?.cost || ''}
                    onChange={(e) => handleMilestoneChange(project.id, 'cost', e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addMilestone(project.id); } }}
                  />
                  <button onClick={() => addMilestone(project.id)}>Add Milestone</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Projects; 