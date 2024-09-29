import { describe, expect, it } from '@jest/globals';

describe('Sample', () => {
  describe('Should throw', () => {
    describe('No data passed', () => {
      it(`Sample test`, async () => {
        expect(2 + 2).toEqual(4)
      });
    });

    describe('Incorrect data', () => {
      it(`Sample test`, async () => {
        expect(2 + 2).toEqual(4)
      });
    });
  });

  describe('Should pass', () => {
    it(`Sample test`, async () => {
      expect(2 + 2).toEqual(4)
    });
  });
});

