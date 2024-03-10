const express = require('express');
const { env } = require('process');
const router = require('./routes/index');

const app = express();
app.use('/', router);

app.listen(env.PORT || 5000);
