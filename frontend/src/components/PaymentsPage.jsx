import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatCurrency } from '../utils/formatters';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProject, setExpandedProject] = useState(null);

  // Fetch all payments and projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, projectsRes] = await Promise.all([
          fetch('http://localhost:3000/payments'),
          fetch('http://localhost:3000/projects')
        ]);

        if (!paymentsRes.ok || !projectsRes.ok) {
          throw new Error('Error fetching data');
        }

        const [paymentsData, projectsData] = await Promise.all([
          paymentsRes.json(),
          projectsRes.json()
        ]);

        setPayments(paymentsData);
        setProjects(projectsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate global statistics
  const statistics = {
    totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
    totalCount: payments.length,
    averagePayment: payments.length ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
  };

  // Calculate project-specific statistics
  const projectStats = projects.map(project => {
    const projectPayments = payments.filter(p => p.projectId === project.id);
    const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCost = project.milestones?.reduce((sum, m) => sum + m.totalCost, 0) || 0;
    const pendingAmount = totalCost - totalPaid;
    const completionPercentage = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;

    const milestoneStats = project.milestones?.map(milestone => {
      const milestonePayments = payments.filter(p => p.milestoneId === milestone.id);
      const paidAmount = milestonePayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = milestone.totalCost - paidAmount;
      return {
        ...milestone,
        paidAmount,
        pendingAmount,
        completionPercentage: (paidAmount / milestone.totalCost) * 100
      };
    }) || [];

    return {
      ...project,
      totalPaid,
      totalCost,
      pendingAmount,
      completionPercentage,
      paymentCount: projectPayments.length,
      milestoneStats
    };
  });

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    const project = projects.find(p => p.id === payment.projectId);
    const milestone = project?.milestones?.find(m => m.id === payment.milestoneId);
    const searchString = `${project?.name} ${milestone?.title} ${payment.description}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Payments Overview
      </Typography>

      {/* Global Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h5">
                {formatCurrency(statistics.totalPayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Number of Payments
              </Typography>
              <Typography variant="h5">
                {statistics.totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Payment
              </Typography>
              <Typography variant="h5">
                {formatCurrency(statistics.averagePayment)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project-specific Payment Overview */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Payments by Project
      </Typography>
      
      {projectStats.map((project) => (
        <Accordion 
          key={project.id}
          expanded={expandedProject === project.id}
          onChange={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {project.name}
                </Typography>
                <Typography variant="subtitle1">
                  {formatCurrency(project.totalPaid)} / {formatCurrency(project.totalCost)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(project.completionPercentage, 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  {project.paymentCount} payments
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {project.completionPercentage.toFixed(1)}% complete
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Milestone Payments
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Milestone</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell align="right">Paid Amount</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="right">Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.milestoneStats.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell>{milestone.title}</TableCell>
                      <TableCell align="right">{formatCurrency(milestone.totalCost)}</TableCell>
                      <TableCell align="right">{formatCurrency(milestone.paidAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(milestone.pendingAmount)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(milestone.completionPercentage, 100)}
                            sx={{ width: 100, mr: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="body2">
                            {milestone.completionPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 4 }} />

      {/* Search Field */}
      <Typography variant="h5" gutterBottom>
        Payment History
      </Typography>
      <TextField
        fullWidth
        label="Search payments"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Payments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Milestone</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map((payment) => {
              const project = projects.find(p => p.id === payment.projectId);
              const milestone = project?.milestones?.find(m => m.id === payment.milestoneId);
              
              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.timestamp).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                  <TableCell>{milestone?.title || 'Unknown Milestone'}</TableCell>
                  <TableCell>{payment.description || '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={payment.status === 'processed' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PaymentsPage; 
