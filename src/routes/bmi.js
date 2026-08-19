'use strict';

const express = require('express');
const { calculateBmi, InvalidMeasurementError } = require('../utils/bmi');

const router = express.Router();

router.post('/bmi', (req, res) => {
  const { weightKg, heightCm } = req.body ?? {};

  try {
    const result = calculateBmi(weightKg, heightCm);
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof InvalidMeasurementError) {
      return res.status(400).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

module.exports = router;
