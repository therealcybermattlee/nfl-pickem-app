import { describe, it, expect } from 'vitest';
import {
  formatScore,
  formatSpread,
  formatOverUnder,
  formatPercentage,
  formatWinPercentage,
  formatPoints,
  formatRecord,
  formatMoneyline,
  formatOrdinal,
  formatRank,
  formatTeamAbbreviation,
  formatConfidence,
  formatNumber,
  formatCompactNumber,
} from '../../src/utils/formatters';

describe('formatters', () => {
  describe('formatScore', () => {
    it('should format completed game scores', () => {
      expect(formatScore(24, 17, true)).toBe('24-17');
      expect(formatScore(0, 0, true)).toBe('0-0');
      expect(formatScore(35, 42, true)).toBe('35-42');
    });

    it('should return em-dash for incomplete games', () => {
      expect(formatScore(24, 17, false)).toBe('—');
      expect(formatScore(undefined, undefined, false)).toBe('—');
    });

    it('should return em-dash for null scores', () => {
      expect(formatScore(null, null, true)).toBe('—');
      expect(formatScore(24, null, true)).toBe('—');
      expect(formatScore(null, 17, true)).toBe('—');
    });
  });

  describe('formatSpread', () => {
    it('should format positive spreads with plus sign', () => {
      expect(formatSpread(3.5)).toBe('+3.5');
      expect(formatSpread(7)).toBe('+7.0');
    });

    it('should format negative spreads with minus sign', () => {
      expect(formatSpread(-3.5)).toBe('-3.5');
      expect(formatSpread(-10)).toBe('-10.0');
    });

    it('should format pick\'em as PK', () => {
      expect(formatSpread(0)).toBe('PK');
    });

    it('should handle team perspective for home team', () => {
      expect(formatSpread(-3.5, 'home')).toBe('-3.5');
      expect(formatSpread(3.5, 'home')).toBe('+3.5');
    });

    it('should handle team perspective for away team', () => {
      expect(formatSpread(-3.5, 'away')).toBe('+3.5');
      expect(formatSpread(3.5, 'away')).toBe('-3.5');
    });

    it('should return em-dash for null spread', () => {
      expect(formatSpread(null)).toBe('—');
      expect(formatSpread(undefined)).toBe('—');
    });
  });

  describe('formatOverUnder', () => {
    it('should format over/under values', () => {
      expect(formatOverUnder(47.5)).toBe('O/U 47.5');
      expect(formatOverUnder(52)).toBe('O/U 52.0');
    });

    it('should return em-dash for null values', () => {
      expect(formatOverUnder(null)).toBe('—');
      expect(formatOverUnder(undefined)).toBe('—');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages with default 1 decimal', () => {
      expect(formatPercentage(75.5)).toBe('75.5%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('should format with custom decimal places', () => {
      expect(formatPercentage(75.555, 2)).toBe('75.56%');
      expect(formatPercentage(75.555, 0)).toBe('76%');
    });

    it('should normalize from 0-1 to 0-100 when specified', () => {
      expect(formatPercentage(0.755, 1, true)).toBe('75.5%');
      expect(formatPercentage(1, 0, true)).toBe('100%');
    });

    it('should return em-dash for null values', () => {
      expect(formatPercentage(null)).toBe('—');
      expect(formatPercentage(undefined)).toBe('—');
      expect(formatPercentage(NaN)).toBe('—');
    });
  });

  describe('formatWinPercentage', () => {
    it('should calculate and format win percentage', () => {
      expect(formatWinPercentage(12, 16)).toBe('75.0%');
      expect(formatWinPercentage(8, 16)).toBe('50.0%');
      expect(formatWinPercentage(16, 16)).toBe('100.0%');
    });

    it('should handle zero total picks', () => {
      expect(formatWinPercentage(0, 0)).toBe('0.0%');
    });

    it('should handle zero wins', () => {
      expect(formatWinPercentage(0, 16)).toBe('0.0%');
    });
  });

  describe('formatPoints', () => {
    it('should format points with plural', () => {
      expect(formatPoints(12)).toBe('12 pts');
      expect(formatPoints(0)).toBe('0 pts');
      expect(formatPoints(100)).toBe('100 pts');
    });

    it('should format single point with singular', () => {
      expect(formatPoints(1)).toBe('1 pt');
    });

    it('should handle null values', () => {
      expect(formatPoints(null)).toBe('0 pts');
      expect(formatPoints(undefined)).toBe('0 pts');
    });
  });

  describe('formatRecord', () => {
    it('should format win-loss records', () => {
      expect(formatRecord(12, 4)).toBe('12-4');
      expect(formatRecord(0, 16)).toBe('0-16');
      expect(formatRecord(16, 0)).toBe('16-0');
    });
  });

  describe('formatMoneyline', () => {
    it('should format positive moneylines with plus sign', () => {
      expect(formatMoneyline(150)).toBe('+150');
      expect(formatMoneyline(250)).toBe('+250');
    });

    it('should format negative moneylines with minus sign', () => {
      expect(formatMoneyline(-150)).toBe('-150');
      expect(formatMoneyline(-200)).toBe('-200');
    });

    it('should return em-dash for null values', () => {
      expect(formatMoneyline(null)).toBe('—');
      expect(formatMoneyline(undefined)).toBe('—');
    });
  });

  describe('formatOrdinal', () => {
    it('should format 1st, 2nd, 3rd correctly', () => {
      expect(formatOrdinal(1)).toBe('1st');
      expect(formatOrdinal(2)).toBe('2nd');
      expect(formatOrdinal(3)).toBe('3rd');
    });

    it('should format 4th and above with "th"', () => {
      expect(formatOrdinal(4)).toBe('4th');
      expect(formatOrdinal(5)).toBe('5th');
      expect(formatOrdinal(10)).toBe('10th');
    });

    it('should handle teens correctly', () => {
      expect(formatOrdinal(11)).toBe('11th');
      expect(formatOrdinal(12)).toBe('12th');
      expect(formatOrdinal(13)).toBe('13th');
    });

    it('should handle 21st, 22nd, 23rd correctly', () => {
      expect(formatOrdinal(21)).toBe('21st');
      expect(formatOrdinal(22)).toBe('22nd');
      expect(formatOrdinal(23)).toBe('23rd');
      expect(formatOrdinal(24)).toBe('24th');
    });

    it('should handle 100+ correctly', () => {
      expect(formatOrdinal(101)).toBe('101st');
      expect(formatOrdinal(112)).toBe('112th');
      expect(formatOrdinal(123)).toBe('123rd');
    });
  });

  describe('formatRank', () => {
    it('should format rank same as ordinal', () => {
      expect(formatRank(1)).toBe('1st');
      expect(formatRank(2)).toBe('2nd');
      expect(formatRank(10)).toBe('10th');
    });
  });

  describe('formatTeamAbbreviation', () => {
    it('should convert to uppercase', () => {
      expect(formatTeamAbbreviation('phi')).toBe('PHI');
      expect(formatTeamAbbreviation('kc')).toBe('KC');
      expect(formatTeamAbbreviation('sf')).toBe('SF');
    });

    it('should handle already uppercase', () => {
      expect(formatTeamAbbreviation('PHI')).toBe('PHI');
    });

    it('should handle mixed case', () => {
      expect(formatTeamAbbreviation('PhI')).toBe('PHI');
    });
  });

  describe('formatConfidence', () => {
    it('should format confidence points', () => {
      expect(formatConfidence(5)).toBe('5 pts');
      expect(formatConfidence(16)).toBe('16 pts');
    });

    it('should format singular point', () => {
      expect(formatConfidence(1)).toBe('1 pt');
    });

    it('should return em-dash for null values', () => {
      expect(formatConfidence(null)).toBe('—');
      expect(formatConfidence(undefined)).toBe('—');
    });
  });

  describe('formatNumber', () => {
    it('should format with commas', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(123)).toBe('123');
      expect(formatNumber(12)).toBe('12');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format millions with M suffix', () => {
      expect(formatCompactNumber(1200000)).toBe('1.2M');
      expect(formatCompactNumber(3456789)).toBe('3.5M');
    });

    it('should format thousands with K suffix', () => {
      expect(formatCompactNumber(1200)).toBe('1.2K');
      expect(formatCompactNumber(3456)).toBe('3.5K');
    });

    it('should return number as-is for values under 1000', () => {
      expect(formatCompactNumber(999)).toBe('999');
      expect(formatCompactNumber(500)).toBe('500');
      expect(formatCompactNumber(0)).toBe('0');
    });
  });
});
