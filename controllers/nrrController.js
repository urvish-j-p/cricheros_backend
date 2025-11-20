import { getTeamByName, pointsTable } from "../data/pointsTable.js";
import {
  findRangeForBowling,
  findRangeForBatting,
} from "../utils/nrrCalculator.js";

// Get points table
export const getPointsTable = (req, res) => {
  try {
    const sorted = [...pointsTable].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.nrr - a.nrr;
    });

    res.json({ success: true, data: sorted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Calculate NRR range
export const calculateNRRRange = (req, res) => {
  try {
    const {
      yourTeam,
      oppositionTeam,
      matchOvers,
      desiredPosition,
      tossResult,
      runs,
    } = req.body;

    // Validation
    if (
      !yourTeam ||
      !oppositionTeam ||
      !matchOvers ||
      !desiredPosition ||
      !tossResult ||
      runs === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (yourTeam === oppositionTeam) {
      return res.status(400).json({
        success: false,
        error: "Your team and opposition team cannot be the same",
      });
    }

    const team = getTeamByName(yourTeam);
    const opponent = getTeamByName(oppositionTeam);

    if (!team) {
      return res.status(400).json({
        success: false,
        error: `Team "${yourTeam}" not found in points table`,
      });
    }

    if (!opponent) {
      return res.status(400).json({
        success: false,
        error: `Opposition team "${oppositionTeam}" not found in points table`,
      });
    }

    let result = null;

    if (tossResult === "batting") {
      // Batting first - need to restrict opponent runs
      const runsScored = runs;
      const oversBatted = matchOvers;

      result = findRangeForBowling(
        team,
        opponent,
        matchOvers,
        runsScored,
        oversBatted,
        desiredPosition,
        pointsTable
      );

      if (!result) {
        return res.status(400).json({
          success: false,
          error: "Cannot achieve desired position with given parameters",
        });
      }

      res.json({
        success: true,
        data: {
          scenario: "batting_first",
          yourTeam,
          oppositionTeam,
          runsScored,
          oversBatted,
          minRunsToRestrict: result.minRuns,
          maxRunsToRestrict: result.maxRuns,
          oversToRestrict: matchOvers,
          minNRR: result.minNRR,
          maxNRR: result.maxNRR,
        },
      });
    } else if (tossResult === "bowling") {
      // Bowling first - need to chase in overs
      const runsToChase = runs;
      // The opponent's score (Runs Conceded) must be 1 run less than the target to win.
      const runsConceded = runs - 1;
      const oversBowled = matchOvers;

      result = findRangeForBatting(
        team,
        opponent,
        matchOvers,
        runsToChase,
        runsConceded,
        oversBowled,
        desiredPosition,
        pointsTable
      );

      if (!result) {
        return res.status(400).json({
          success: false,
          error: "Cannot achieve desired position with given parameters",
        });
      }

      res.json({
        success: true,
        data: {
          scenario: "bowling_first",
          yourTeam,
          oppositionTeam,
          runsToChase,
          runsConceded,
          oversBowled,
          minOversToChase: result.minOvers,
          maxOversToChase: result.maxOvers,
          minNRR: result.minNRR,
          maxNRR: result.maxNRR,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid toss result. Must be "batting" or "bowling"',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
