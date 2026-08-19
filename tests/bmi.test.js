'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBmi, categorize, InvalidMeasurementError } = require('../src/utils/bmi');

test('calculates BMI for a normal adult (70kg, 175cm)', () => {
  const { bmi, category } = calculateBmi(70, 175);
  assert.equal(bmi, 22.9);
  assert.equal(category, 'Normal');
});

test('height is treated as centimetres, not metres', () => {
  const { bmi } = calculateBmi(60, 160);
  assert.equal(bmi, 23.4);
});

test('classifies underweight', () => {
  assert.equal(calculateBmi(45, 175).category, 'Underweight');
});

test('classifies overweight', () => {
  assert.equal(calculateBmi(85, 175).category, 'Overweight');
});

test('classifies obese', () => {
  assert.equal(calculateBmi(110, 175).category, 'Obese');
});

test('boundary 18.5 is Normal, not Underweight', () => {
  assert.equal(categorize(18.5), 'Normal');
});

test('boundary 25 is Overweight, not Normal', () => {
  assert.equal(categorize(25), 'Overweight');
});

test('rejects zero height instead of returning Infinity', () => {
  assert.throws(() => calculateBmi(70, 0), InvalidMeasurementError);
});

test('rejects missing weight instead of returning NaN', () => {
  assert.throws(() => calculateBmi(undefined, 175), InvalidMeasurementError);
});

test('rejects string input', () => {
  assert.throws(() => calculateBmi('70', 175), InvalidMeasurementError);
});

test('rejects physiologically impossible height', () => {
  assert.throws(() => calculateBmi(70, 900), InvalidMeasurementError);
});
