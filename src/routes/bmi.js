'use strict';

const express = require('express');
const { calculateBmi } = require('../utils/bmi');

const router = express.Router();

router.post('/bmi', (req, res) => {
  const { weightKg, heightCm } = req.body;
  const result = calculateBmi(weightKg, heightCm);
  return res.status(200).json({ ok: true, ...result });
});

module.exports = router;
