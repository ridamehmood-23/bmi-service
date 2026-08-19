'use strict';

/**
 * BMI category thresholds (WHO), kept as named constants instead of
 * magic numbers so the boundaries are reviewable in one place.
 */
const BMI_CATEGORIES = Object.freeze([
  { max: 18.5, label: 'Underweight' },
  { max: 25.0, label: 'Normal' },
  { max: 30.0, label: 'Overweight' },
  { max: Infinity, label: 'Obese' },
]);

const LIMITS = Object.freeze({
  WEIGHT_KG_MIN: 1,
  WEIGHT_KG_MAX: 500,
  HEIGHT_CM_MIN: 30,
  HEIGHT_CM_MAX: 300,
});

class InvalidMeasurementError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidMeasurementError';
  }
}

function assertFiniteNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidMeasurementError(`${field} must be a finite number`);
  }
}

function assertInRange(value, field, min, max) {
  if (value < min || value > max) {
    throw new InvalidMeasurementError(`${field} must be between ${min} and ${max}`);
  }
}

/**
 * Classify a BMI value into a WHO category.
 * @param {number} bmi
 * @returns {string}
 */
function categorize(bmi) {
  return BMI_CATEGORIES.find((c) => bmi < c.max).label;
}

/**
 * Calculate BMI from weight in kilograms and height in centimetres.
 *
 * @param {number} weightKg  weight in kilograms
 * @param {number} heightCm  height in centimetres (NOT metres)
 * @returns {{ bmi: number, category: string }}
 * @throws {InvalidMeasurementError} when input is missing, non-numeric or out of range
 */
function calculateBmi(weightKg, heightCm) {
  assertFiniteNumber(weightKg, 'weightKg');
  assertFiniteNumber(heightCm, 'heightCm');
  assertInRange(weightKg, 'weightKg', LIMITS.WEIGHT_KG_MIN, LIMITS.WEIGHT_KG_MAX);
  assertInRange(heightCm, 'heightCm', LIMITS.HEIGHT_CM_MIN, LIMITS.HEIGHT_CM_MAX);

  const heightM = heightCm / 100;
  const raw = weightKg / (heightM * heightM);
  const bmi = Math.round(raw * 10) / 10;

  return { bmi, category: categorize(bmi) };
}

module.exports = { calculateBmi, categorize, InvalidMeasurementError, LIMITS, BMI_CATEGORIES };
