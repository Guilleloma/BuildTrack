const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware: if needed you can add JSON body parsing, etc.
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from BuildTrack backend!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 