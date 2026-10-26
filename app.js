const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('<h1>Hello from Azure Kubernetes Service! 🚀</h1>');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});