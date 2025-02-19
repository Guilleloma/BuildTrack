// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mysecret';
const users = {};
const admin = require('firebase-admin');

// Load environment variables
console.log('Loading environment variables...');

// Verify environment variables are loaded
console.log('Environment variables check:', {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length
});

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://holaguillelopez:(Lokkito86)@buildtrack.ayjef.mongodb.net/buildtrack?retryWrites=true&w=majority';

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB successfully');
  console.log('Database:', MONGODB_URI.split('@')[1]); // Log only the non-sensitive part of the URI
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  console.error('Connection string used:', MONGODB_URI.split('@')[1]); // Log only the non-sensitive part of the URI
});

// CORS configuration
const corsOptions = {
  origin: ['https://buildtrack-c3e8a.web.app', 'http://localhost:3001', 'http://localhost:3002', 'https://buildtrack-c3e8a.firebaseapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware configuration
app.use(cors(corsOptions));
app.use(express.json());

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  next();
});

// Basic route for health check (no authentication required)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BuildTrack API is running' });
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  console.log('=== Authentication Middleware ===');
  console.log('Path:', req.path);
  console.log('Query mode:', req.query.mode);
  console.log('Headers:', req.headers); // Añadir log de headers
  
  // Skip authentication for sandbox mode
  if (req.query.mode === 'sandbox') {
    console.log('Sandbox mode detected, skipping authentication');
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header found');
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log('Token verified successfully for user:', decodedToken.uid);
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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

// Register routers with authentication
app.use('/projects', authenticateToken, projectsRouter);
app.use('/payments', authenticateToken, paymentsRouter);
app.use('/settings', authenticateToken, settingsRouter);

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
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Full URL: http://0.0.0.0:${port}`);
}); 