import { getCacheName } from './subtitle';

test('getCacheName returns the correct cache name', () => {
  expect(getCacheName(39)).toBe(3);
  expect(getCacheName(39.9)).toBe(3);
  expect(getCacheName(40)).toBe(4);
  expect(getCacheName(0)).toBe(0);
});
