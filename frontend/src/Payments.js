import React, { useState, useEffect } from 'react';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    milestoneId: '',
    amount: ''
  });
  const [message, setMessage] = useState('');

  // Fetch projects from backend when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/projects');
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects for payments', err);
      }
    };
    fetchProjects();
  }, []);

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    setForm({ ...form, projectId, milestoneId: '' });
    setSelectedMilestone('');
  };

  const handleMilestoneChange = (e) => {
    const milestoneId = e.target.value;
    setSelectedMilestone(milestoneId);
    setForm({ ...form, milestoneId });
  };

  const handleAmountChange = (e) => {
    setForm({ ...form, amount: e.target.value });
  };

  const processPayment = async () => {
    if (!form.projectId || !form.milestoneId || !form.amount) {
      setMessage('All fields are required');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          milestoneId: form.milestoneId,
          amount: parseFloat(form.amount)
        })
      });
      if (!response.ok) {
        const err = await response.json();
        setMessage('Error: ' + err.error);
      } else {
        const data = await response.json();
        setMessage(`Payment processed (ID ${data.payment.id}). Milestone update: paid ${data.milestone.paidAmount}, pending ${data.milestone.pendingAmount}`);
        setPayments([...payments, data.payment]);
      }
    } catch (error) {
      setMessage('Error processing payment');
    }
  };

  const listPayments = async () => {
    try {
      const response = await fetch('http://localhost:3000/payments');
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setMessage('Error fetching payments');
    }
  };

  // Get milestones for the selected project, assuming the project object has a 'milestones' array
  const selectedProjectObj = projects.find(p => p.id.toString() === selectedProject);
  const milestones = selectedProjectObj && selectedProjectObj.milestones ? selectedProjectObj.milestones : [];

  return (
    <div style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
      <h2>Payments</h2>
      <div>
        <label>Project: </label>
        <select value={selectedProject} onChange={handleProjectChange}>
          <option value="">Select a project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Milestone: </label>
        <select value={selectedMilestone} onChange={handleMilestoneChange} disabled={!selectedProject || milestones.length === 0}>
          <option value="">{milestones.length === 0 ? "No milestones" : "Select a milestone"}</option>
          {milestones.map(ms => (
            <option key={ms.id} value={ms.id}>{ms.title || ms.id}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Amount: </label>
        <input type="text" name="amount" placeholder="Amount" value={form.amount} onChange={handleAmountChange} />
      </div>
      <button onClick={processPayment}>Process Payment</button>
      <div style={{ marginTop: '10px' }}>
        <button onClick={listPayments}>List Payments</button>
      </div>
      {message && <p>{message}</p>}
      {payments.length > 0 && (
        <ul>
          {payments.map(payment => (
            <li key={payment.id}>ID: {payment.id} - Project: {payment.projectId}, Milestone: {payment.milestoneId}, Amount: {payment.amount} - Status: {payment.status}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Payments; 