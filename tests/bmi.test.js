'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBmi } = require('../src/utils/bmi');

test('calculates BMI for a normal adult (70kg, 175cm)', () => {
  const { bmi, category } = calculateBmi(70, 175);
  assert.equal(bmi, 22.9);
  assert.equal(category, 'Normal');
});

test('classifies underweight', () => {
  assert.equal(calculateBmi(45, 175).category, 'Underweight');
});

test('classifies obese', () => {
  assert.equal(calculateBmi(110, 175).category, 'Obese');
});
