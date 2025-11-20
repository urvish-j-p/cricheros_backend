// NRR Calculation Utilities

// Convert overs to decimal (e.g., 20.3 = 20.5)
const oversToDecimal = (overs) => {
  const wholeOvers = Math.floor(overs);
  const balls = (overs - wholeOvers) * 10;
  return wholeOvers + (balls / 6);
};

// Calculate NRR from runs and overs
export const calculateNRR = (runsFor, oversFor, runsAgainst, oversAgainst) => {
  const oversForDecimal = oversToDecimal(oversFor);
  const oversAgainstDecimal = oversToDecimal(oversAgainst);
  
  if (oversForDecimal === 0 || oversAgainstDecimal === 0) {
    return 0;
  }
  
  const runRateFor = runsFor / oversForDecimal;
  const runRateAgainst = runsAgainst / oversAgainstDecimal;
  
  return runRateFor - runRateAgainst;
};

// Calculate new NRR after a match
export const calculateNewNRR = (team, matchData) => {
  const {
    runsScored,
    oversBatted,
    runsConceded,
    oversBowled
  } = matchData;
  
  const newRunsFor = team.runsFor + runsScored;
  const newOversFor = team.oversFor + oversBatted;
  const newRunsAgainst = team.runsAgainst + runsConceded;
  const newOversAgainst = team.oversAgainst + oversBowled;
  
  return calculateNRR(newRunsFor, newOversFor, newRunsAgainst, newOversAgainst);
};

// Get team position after match
export const getTeamPosition = (teamName, updatedTable) => {
  const sorted = [...updatedTable].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.nrr - a.nrr;
  });
  
  return sorted.findIndex(team => 
    team.team.toLowerCase() === teamName.toLowerCase()
  ) + 1;
};

// Check if team reaches desired position (exactly, not higher)
export const reachesDesiredPosition = (teamName, desiredPosition, updatedTable) => {
  const position = getTeamPosition(teamName, updatedTable);
  // Team must finish exactly at desired position, not higher
  return position === desiredPosition;
};

// Create updated table with new match data
export const createUpdatedTable = (originalTable, teamName, opponentName, matchData) => {
  return originalTable.map(team => {
    if (team.team.toLowerCase() === teamName.toLowerCase()) {
      const newNRR = calculateNewNRR(team, matchData);
      return {
        ...team,
        matches: team.matches + 1,
        won: matchData.won ? team.won + 1 : team.won,
        lost: matchData.won ? team.lost : team.lost + 1,
        runsFor: team.runsFor + matchData.runsScored,
        oversFor: team.oversFor + matchData.oversBatted,
        runsAgainst: team.runsAgainst + matchData.runsConceded,
        oversAgainst: team.oversAgainst + matchData.oversBowled,
        points: matchData.won ? team.points + 2 : team.points,
        nrr: newNRR
      };
    } else if (team.team.toLowerCase() === opponentName.toLowerCase()) {
      const opponentMatchData = {
        runsScored: matchData.runsConceded,
        oversBatted: matchData.oversBowled,
        runsConceded: matchData.runsScored,
        oversBowled: matchData.oversBatted,
        won: !matchData.won
      };
      const newNRR = calculateNewNRR(team, opponentMatchData);
      return {
        ...team,
        matches: team.matches + 1,
        won: opponentMatchData.won ? team.won + 1 : team.won,
        lost: opponentMatchData.won ? team.lost : team.lost + 1,
        runsFor: team.runsFor + opponentMatchData.runsScored,
        oversFor: team.oversFor + opponentMatchData.oversBatted,
        runsAgainst: team.runsAgainst + opponentMatchData.runsConceded,
        oversAgainst: team.oversAgainst + opponentMatchData.oversBowled,
        points: opponentMatchData.won ? team.points + 2 : team.points,
        nrr: newNRR
      };
    }
    return team;
  });
};

// Find range for bowling (restricting opponent runs)
export const findRangeForBowling = (team, opponent, matchOvers, runsScored, oversBatted, desiredPosition, originalTable) => {
  // We need to win, so opponent must score less than runsScored
  // Use binary search for efficiency
  let validRuns = [];
  let left = 0;
  let right = runsScored - 1;
  
  // Find minimum valid runs
  let minRun = null;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const matchData = {
      runsScored,
      oversBatted,
      runsConceded: mid,
      oversBowled: matchOvers,
      won: true
    };
    
    const updatedTable = createUpdatedTable(originalTable, team.team, opponent.team, matchData);
    const reaches = reachesDesiredPosition(team.team, desiredPosition, updatedTable);
    
    if (reaches) {
      minRun = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  // Find maximum valid runs
  left = minRun !== null ? minRun : 0;
  right = runsScored - 1;
  let maxRun = null;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const matchData = {
      runsScored,
      oversBatted,
      runsConceded: mid,
      oversBowled: matchOvers,
      won: true
    };
    
    const updatedTable = createUpdatedTable(originalTable, team.team, opponent.team, matchData);
    const reaches = reachesDesiredPosition(team.team, desiredPosition, updatedTable);
    
    if (reaches) {
      maxRun = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  if (minRun === null || maxRun === null) {
    return null;
  }
  
  // Calculate NRR for min and max
  const minMatchData = {
    runsScored,
    oversBatted,
    runsConceded: minRun,
    oversBowled: matchOvers,
    won: true
  };
  
  const maxMatchData = {
    runsScored,
    oversBatted,
    runsConceded: maxRun,
    oversBowled: matchOvers,
    won: true
  };
  
  const updatedTableMin = createUpdatedTable(originalTable, team.team, opponent.team, minMatchData);
  const updatedTableMax = createUpdatedTable(originalTable, team.team, opponent.team, maxMatchData);
  
  const teamAfterMin = updatedTableMin.find(t => t.team.toLowerCase() === team.team.toLowerCase());
  const teamAfterMax = updatedTableMax.find(t => t.team.toLowerCase() === team.team.toLowerCase());
  
  return {
    minRuns: minRun,
    maxRuns: maxRun,
    minNRR: teamAfterMin.nrr,
    maxNRR: teamAfterMax.nrr
  };
};

// Find range for batting (chasing)
export const findRangeForBatting = (team, opponent, matchOvers, runsToChase, runsConceded, oversBowled, desiredPosition, originalTable) => {
  // We need to win, so we must chase within matchOvers
  // In cricket, overs format is: wholeOvers.balls where balls is 0-5
  // So we iterate properly: 0.1, 0.2, 0.3, 0.4, 0.5, 1.0, 1.1, etc.
  let validOvers = [];
  
  const wholeOvers = Math.floor(matchOvers);
  const maxBalls = Math.floor((matchOvers - wholeOvers) * 10);
  
  // Check all possible overs from 0.1 to matchOvers
  // Start from 0.1 (0 overs + 1 ball)
  for (let whole = 0; whole <= wholeOvers; whole++) {
    const maxBallsForOver = whole === wholeOvers ? maxBalls : 5;
    const minBallsForOver = whole === 0 ? 1 : 0; // Start from 0.1, not 0.0
    
    for (let balls = minBallsForOver; balls <= maxBallsForOver; balls++) {
      const oversValue = whole + (balls / 10);
      
      // Don't exceed matchOvers
      if (oversValue > matchOvers) {
        break;
      }
      
      const matchData = {
        runsScored: runsToChase,
        oversBatted: oversValue,
        runsConceded,
        oversBowled,
        won: true
      };
      
      const updatedTable = createUpdatedTable(originalTable, team.team, opponent.team, matchData);
      const reaches = reachesDesiredPosition(team.team, desiredPosition, updatedTable);
      
      if (reaches) {
        const updatedTeam = updatedTable.find(t => t.team.toLowerCase() === team.team.toLowerCase());
        // Normalize overs to ensure valid cricket format (balls 0-5)
        const whole = Math.floor(oversValue);
        const balls = Math.round((oversValue - whole) * 10);
        const validBalls = Math.min(balls, 5);
        const normalizedOvers = whole + (validBalls / 10);
        
        validOvers.push({
          overs: normalizedOvers,
          nrr: updatedTeam.nrr
        });
      }
    }
  }
  
  if (validOvers.length === 0) {
    return null;
  }
  
  // Find min and max from valid overs (already normalized)
  const minOvers = Math.min(...validOvers.map(v => v.overs));
  const maxOvers = Math.max(...validOvers.map(v => v.overs));
  
  const minNRR = validOvers.find(v => v.overs === minOvers).nrr;
  const maxNRR = validOvers.find(v => v.overs === maxOvers).nrr;
  
  return {
    minOvers: minOvers,
    maxOvers: maxOvers,
    minNRR: minNRR,
    maxNRR: maxNRR
  };
};

