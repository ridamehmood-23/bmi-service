'use strict';

const express = require('express');
const bmiRouter = require('./routes/bmi');

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api', bmiRouter);

module.exports = app;
