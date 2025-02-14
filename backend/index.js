const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const SECRET = 'mysecret';
const users = {};

// Middleware configuration
app.use(express.json());
app.use(cors());

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from BuildTrack backend!');
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

// Register routers
app.use('/projects', projectsRouter);
app.use('/payments', paymentsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 