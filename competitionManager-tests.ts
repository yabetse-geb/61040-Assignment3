/**
 * DayPlanner Test Cases
 *
 * Demonstrates both manual scheduling and LLM-assisted scheduling
 */

import { Competition, CompetitionManager, userStat } from './competition';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Test 1 – Normal competition with a winner
 */
export async function testNormalCompetition(): Promise<void> {
  console.log('\n🧪 TEST 1: Normal Competition (Winner)');
  console.log('========================================');

  const manager = new CompetitionManager();
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 1);

  manager.startCompetition('Alice', 'Bob', start, end);

  // Day 1: Alice performs better
  manager.recordStat('Alice', start, "bedtime", true);
  manager.recordStat('Alice', start, "wakeup", true);
  manager.recordStat('Bob', start, "bedtime", false);
  manager.recordStat('Bob', start, "wakeup", true);

  // Day 2: Bob misses both
  const day2 = new Date(start);
  day2.setDate(start.getDate() + 1);
  manager.recordStat('Alice', day2, "bedtime", true);
  manager.recordStat('Alice', day2, "wakeup", true);
  manager.recordStat('Bob', day2, "bedtime", false);
  manager.recordStat('Bob', day2, "wakeup", false);

  const comp = (manager as any).competitions[0];
  const outcome = manager.endCompetition(comp);
  console.log('🏁 Outcome:', outcome);

  const llm = new GeminiLLM(loadConfig());
  await manager.summarizeCompetition(llm, comp);
}


/**
 * TEST 2: Tie Competition
 */
export async function testTieCompetition(): Promise<void> {
    console.log('\n🧪 TEST 2: Tie Competition');
    console.log('==========================');

    const manager = new CompetitionManager();
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    manager.startCompetition('Eli', 'Jordan', start, end);

    // Both have the same results
    manager.recordStat('Eli', start, 'bedtime', true);
    manager.recordStat('Eli', start, 'wakeup', false);
    manager.recordStat('Jordan', start, 'bedtime', true);
    manager.recordStat('Jordan', start, 'wakeup', false);

    const day2 = new Date(start);
    day2.setDate(start.getDate() + 1);
    manager.recordStat('Eli', day2, 'bedtime', false);
    manager.recordStat('Eli', day2, 'wakeup', true);
    manager.recordStat('Jordan', day2, 'bedtime', false);
    manager.recordStat('Jordan', day2, 'wakeup', true);

    const comp = (manager as any).competitions[0];
    const outcome = manager.endCompetition(comp);
    console.log('🏁 Outcome:', outcome);

    const llm = new GeminiLLM(loadConfig());
    await manager.summarizeCompetition(llm, comp);
}

/** Test 3: Incomplete Data Competition
 * Demonstrates handling of missing data in competition summary
 */
export async function testIncompleteData(): Promise<void> {
    console.log('\n🧪 TEST 3: Incomplete Data');
    console.log('==========================');

    const manager = new CompetitionManager();
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 4);

    manager.startCompetition('Ava', 'Noah', start, end);

    // Record only the first 3 of 5 days for both user and challenger
    for (let i = 0; i < 3; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        manager.recordStat('Ava', day, 'bedtime', i % 2 === 0);
        manager.recordStat('Ava', day, 'wakeup', true);
        manager.recordStat('Noah', day, 'bedtime', false);
        manager.recordStat('Noah', day, 'wakeup', i % 2 === 0);
    }

    // for last two days, only Ava reports data (use fresh Date objects)
    {
        const day3 = new Date(start);
        day3.setDate(start.getDate() + 3);
        manager.recordStat('Ava', day3, 'bedtime', true);
        manager.recordStat('Ava', day3, 'wakeup', false);
    }
    {
        const day4 = new Date(start);
        day4.setDate(start.getDate() + 4);
        manager.recordStat('Ava', day4, 'bedtime', false);
        manager.recordStat('Ava', day4, 'wakeup', false);
    }


    const comp = (manager as any).competitions[0];
    const outcome = manager.endCompetition(comp);
    console.log('🏁 Outcome:', outcome);

    const llm = new GeminiLLM(loadConfig());
    await manager.summarizeCompetition(llm, comp);
}
/**
 * 🧪 TEST 4 — Tie Scenario with Unequal Participation
 * Demonstrates how the LLM handles a tied competition where one participant misses reporting days.
 */
export async function testTieUnequalParticipation(): Promise<void> {
    console.log('\n🧪 TEST 4: Tie Scenario with Unequal Participation');
    console.log('=================================================');

    const manager = new CompetitionManager();
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // 5-day competition

    manager.startCompetition('Ava', 'Noah', start, end);

    // --- Days 1-3: Both participants report data ---
    for (let i = 0; i < 3; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);

        // Ava performs inconsistently but scores high on some days
        manager.recordStat('Ava', day, 'bedtime', i % 2 === 0);
        manager.recordStat('Ava', day, 'wakeup', i === 1);

        // Noah performs consistently but with moderate scores
        manager.recordStat('Noah', day, 'bedtime', true);
        manager.recordStat('Noah', day, 'wakeup', false);
    }

    // --- Days 4-5: Ava misses reporting; Noah continues consistently ---
    {
        const day3 = new Date(start);
        day3.setDate(start.getDate() + 3);
        manager.recordStat('Noah', day3, 'bedtime', true);
        manager.recordStat('Noah', day3, 'wakeup', false);
    }
    {
        const day4 = new Date(start);
        day4.setDate(start.getDate() + 4);
        manager.recordStat('Noah', day4, 'bedtime', true);
        manager.recordStat('Noah', day4, 'wakeup', false);
    }

    const comp = (manager as any).competitions[0];
    const outcome = manager.endCompetition(comp);
    console.log('🏁 Outcome:', outcome);

    const llm = new GeminiLLM(loadConfig());
    await manager.summarizeCompetition(llm, comp);
}
/**
 * 🧪 TEST 5 — Out-of-Order Daily Stats
 */
export async function testOutOfOrderStats(): Promise<void> {
    console.log('\n🧪 TEST 5: Out-of-Order and Partial missing data Daily Stats');
    console.log('===================================');

    const manager = new CompetitionManager();
    const start = new Date('2025-05-05');
    const end = new Date('2025-05-09');

    // Start a 5-day competition
    manager.startCompetition('Ava', 'Noah', start, end);

    // Record stats intentionally OUT OF ORDER
    manager.recordStat('Ava', new Date('2025-05-09'), 'bedtime', true);
    manager.recordStat('Noah', new Date('2025-05-07'), 'bedtime', false);
    manager.recordStat('Ava', new Date('2025-05-05'), 'wakeup', true);

    manager.recordStat('Noah', new Date('2025-05-06'), 'bedtime', true);
    manager.recordStat('Ava', new Date('2025-05-08'), 'wakeup', false);

    // End and summarize
    const comp = (manager as any).competitions[0];
    const outcome = manager.endCompetition(comp);
    console.log('🏁 Outcome:', outcome);

    const llm = new GeminiLLM(loadConfig());
    await manager.summarizeCompetition(llm, comp);
}


async function main(): Promise<void> {
    console.log('🎓 CompetitionManager Test Suite');
    console.log('========================\n');

    try {
        // Run a normal competition test with a winner
        await testNormalCompetition();

        // // Run a competition with a tie
        await testTieCompetition();

        //  Run a competition with incomplete data
        await testIncompleteData();

        // Run a tie competition with unequal participation
        await testTieUnequalParticipation();

        // Run a competition with out-of-order stats
        await testOutOfOrderStats();


        console.log('\n🎉 All test cases completed successfully!');

    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
