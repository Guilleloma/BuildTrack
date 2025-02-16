const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mysecret';
const users = {};

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://holaguillelopez:(Lokkito86)@buildtrack.ayjef.mongodb.net/buildtrack?retryWrites=true&w=majority';

// CORS configuration
const corsOptions = {
  origin: ['https://buildtrack-c3e8a.web.app', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Middleware configuration
app.use(cors(corsOptions));
app.use(express.json());

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BuildTrack API is running' });
});

// Auth routes
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  if (users[username]) {
    return res.status(409).json({ error: "User already exists" });
  }
  // Storing password as plain text for demonstration purposes
  users[username] = { password };
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ message: "User registered successfully", token });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
  res.json({ message: "Login successful", token });
});

// Import and use routers
const projectsRouter = require('./routes/projects');
const paymentsRouter = require('./routes/payments');
const settingsRouter = require('./routes/settings');

// Register routers
app.use('/projects', projectsRouter);
app.use('/payments', paymentsRouter);
app.use('/settings', settingsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Stack trace:', err.stack);
  
  // Handle specific types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.message 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format',
      details: err.message 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 