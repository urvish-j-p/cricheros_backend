import { describe, it, expect } from '@jest/globals';
import { calculateNRR, calculateNewNRR } from '../utils/nrrCalculator.js';
import { pointsTable, getTeamByName } from '../data/pointsTable.js';
import { findRangeForBowling, findRangeForBatting, createUpdatedTable, getTeamPosition } from '../utils/nrrCalculator.js';

describe('NRR Calculator Tests', () => {
  
  describe('calculateNRR', () => {
    it('should calculate NRR correctly', () => {
      const nrr = calculateNRR(100, 20, 80, 20);
      expect(nrr).toBeCloseTo(1.0, 2);
    });
    
    it('should handle zero overs', () => {
      const nrr = calculateNRR(100, 0, 80, 20);
      expect(nrr).toBe(0);
    });
  });
  
  describe('calculateNewNRR', () => {
    it('should calculate new NRR after match', () => {
      const team = getTeamByName('Rajasthan Royals');
      const matchData = {
        runsScored: 120,
        oversBatted: 20,
        runsConceded: 100,
        oversBowled: 20,
        won: true
      };
      
      const newNRR = calculateNewNRR(team, matchData);
      expect(typeof newNRR).toBe('number');
    });
  });
  
  describe('getTeamPosition', () => {
    it('should return correct position', () => {
      const position = getTeamPosition('Chennai Super Kings', pointsTable);
      expect(position).toBeGreaterThan(0);
      expect(position).toBeLessThanOrEqual(pointsTable.length);
    });
  });
  
  describe('createUpdatedTable', () => {
    it('should update table with match data', () => {
      const team = getTeamByName('Rajasthan Royals');
      const opponent = getTeamByName('Delhi Capitals');
      
      const matchData = {
        runsScored: 120,
        oversBatted: 20,
        runsConceded: 100,
        oversBowled: 20,
        won: true
      };
      
      const updated = createUpdatedTable(pointsTable, team.team, opponent.team, matchData);
      expect(updated.length).toBe(pointsTable.length);
      
      const updatedTeam = updated.find(t => t.team === team.team);
      expect(updatedTeam.matches).toBe(team.matches + 1);
    });
  });
  
  describe('findRangeForBowling', () => {
    it('should find range when batting first', () => {
      const team = getTeamByName('Rajasthan Royals');
      const opponent = getTeamByName('Delhi Capitals');
      
      const result = findRangeForBowling(
        team,
        opponent,
        20,
        120,
        20,
        3,
        pointsTable
      );
      
      if (result) {
        expect(result.minRuns).toBeDefined();
        expect(result.maxRuns).toBeDefined();
        expect(result.minNRR).toBeDefined();
        expect(result.maxNRR).toBeDefined();
      }
    });
  });
  
  describe('findRangeForBatting', () => {
    it('should find range when bowling first', () => {
      const team = getTeamByName('Rajasthan Royals');
      const opponent = getTeamByName('Delhi Capitals');
      
      const result = findRangeForBatting(
        team,
        opponent,
        20,
        120,
        119,
        20,
        3,
        pointsTable
      );
      
      if (result) {
        expect(result.minOvers).toBeDefined();
        expect(result.maxOvers).toBeDefined();
        expect(result.minNRR).toBeDefined();
        expect(result.maxNRR).toBeDefined();
      }
    });
  });
  
});

