const express = require('express');
const { env } = require('process');
const router = require('./routes/index');

const app = express();
const port = env.PORT || 5000;
app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
