const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Import routes
const projectsRouter = require('./routes/projects');

// Use routes
app.use('/projects', projectsRouter);

app.get('/', (req, res) => {
  res.send('Hello from BuildTrack backend!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 