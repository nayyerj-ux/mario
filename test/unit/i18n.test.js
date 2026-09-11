import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPersianDigits } from '../../js/i18n.js';

test('converts every Western digit to its Persian counterpart', () => {
  assert.equal(toPersianDigits('0123456789'), '۰۱۲۳۴۵۶۷۸۹');
});

test('converts numbers, not just digit strings', () => {
  assert.equal(toPersianDigits(1250), '۱۲۵۰');
});

test('leaves non-digit characters untouched', () => {
  assert.equal(toPersianDigits('امتیاز: 20'), 'امتیاز: ۲۰');
});

test('handles zero and large level numbers beyond a hardcoded lookup table', () => {
  assert.equal(toPersianDigits(0), '۰');
  assert.equal(toPersianDigits(42), '۴۲');
});
