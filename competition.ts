/**
 * DayPlanner Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';

// A single competition with user and challenger competiting over a time period
export interface Competition {
    user: string;
    challenger: string;
    startDate: Date;
    endDate: Date;
    outcome: string;
    summary:string;
    dailyUserStats: userStat[];
}
// An assignment of an activity to a time slot
 export interface userStat {
    user: string;
    date: Date;
    bedtimeSuccess:boolean|null;
    wakeUpSuccess:boolean|null;
    dailyScore:number;
}

export class CompetitionManager {
    private competitions: Competition[] = [];


    startCompetition(user: string, challenger: string, startDate: Date, endDate:Date): void {
        if (user===challenger) {
            throw new Error(`User and challenger must be different individuals.`);
        }

        //must check if no overlaping competitions for either user
        for (const comp of this.competitions) {
            if(startDate>=comp.startDate && startDate<=comp.endDate
                && (user===comp.user || user===comp.challenger ||
                    challenger===comp.user || challenger===comp.challenger)
            )
            {
                throw new Error(`One of the users is already in a competition during this time period.`);
            }
        }
        // Do not prefill dailyUserStats here; recordStat will create per-day stats
        const competition: Competition = {
            user,
            challenger,
            startDate,
            endDate,
            outcome: '',
            summary:'',
            dailyUserStats: []
        };

        this.competitions.push(competition);
    }

     recordStat(u: string, d: Date, event: string, success: boolean): void {
        // 1. Check if user is part of a competition AND date within range
        const validCompetition = this.competitions.find(comp =>
            (comp.user === u || comp.challenger === u) &&
            d >= comp.startDate &&
            d <= comp.endDate
        );

        if (!validCompetition) {
            throw new Error(`No valid competition found for user ${u} on ${d.toDateString()}`);
        }

        // 2. Find or create userStat inside the competition's dailyUserStats for (u, d).
        let stat = validCompetition.dailyUserStats.find(s =>
            s.user === u &&
            s.date.toDateString() === d.toDateString()
        );

        if (!stat) {
            // create the stat and add to competition list
            stat = { user: u,
                     date: d,
                     bedtimeSuccess: null,
                     wakeUpSuccess: null,
                     dailyScore: 0 };
            validCompetition.dailyUserStats.push(stat);

            // no global master list; competition.dailyUserStats is the canonical source
        }

        // Ensure the stat is present in the competition's dailyUserStats
        // Find existing stat in the validCompetition.dailyUserStats by matching user and date
        const existingIndex = validCompetition.dailyUserStats.findIndex(s =>
            s.user === stat!.user && s.date.toDateString() === stat!.date.toDateString()
        );

        if (existingIndex >= 0) {
            // Replace the entry to keep a single source of truth
            validCompetition.dailyUserStats[existingIndex] = stat;
        }

        // 3. Update based on event type
        if (event=="bedtime") { //true represents bedtime event
            stat.bedtimeSuccess = success;
        } else if(event=="wakeup") { //false represents wake-up event
            stat.wakeUpSuccess = success;
        }

        // 4. Recompute dailyScore
        let score = 0;

        if (stat.bedtimeSuccess === true) score += 1;
        else if (stat.bedtimeSuccess === false) score -= 1;

        if (stat.wakeUpSuccess === true) score += 1;
        else if (stat.wakeUpSuccess === false) score -= 1;

        stat.dailyScore = score;
    }



    endCompetition(c: Competition): string {
        const currentDate = new Date();
        if (currentDate >= c.endDate) {
            // Calculate total scores from the competition's own dailyUserStats (authoritative)
            const userTotal = c.dailyUserStats
                .filter(s => s.user === c.user && s.date >= c.startDate && s.date <= c.endDate)
                .reduce((sum, s) => sum + s.dailyScore, 0);
            const challengerTotal = c.dailyUserStats
                .filter(s => s.user === c.challenger && s.date >= c.startDate && s.date <= c.endDate)
                .reduce((sum, s) => sum + s.dailyScore, 0);
            // Determine outcome
            if (userTotal > challengerTotal) {
                c.outcome = `${c.user} wins! (${userTotal} to ${challengerTotal})`;
            } else if (challengerTotal > userTotal) {
                c.outcome = `${c.challenger} wins! (${challengerTotal} to ${userTotal})`;
            } else {
                c.outcome = `It's a tie! (${userTotal} to ${challengerTotal})`;
            }
            return c.outcome;
        }

        // If the competition has ended we returned above. If we reach here,
        // the competition hasn't ended yet. Return a clear status message.
        return `Competition between ${c.user} and ${c.challenger} has not ended yet`;
    }

    async summarizeCompetition(llm: GeminiLLM, comp:Competition): Promise<void> {
        try {
            console.log('Competition report generation in progress...');
            // const userStatsPerDay: string[] = comp.dailyUserStats.map(stat => stat.toString());
            let userStatsPerDay: string[] = [];
            for (const stat of comp.dailyUserStats) {
                userStatsPerDay.push('' + JSON.stringify({
                    user: stat.user,
                    date: stat.date.toISOString().slice(0, 10), // YYYY-MM-DD
                    bedtimeSuccess: stat.bedtimeSuccess,
                    wakeUpSuccess: stat.wakeUpSuccess,
                    dailyScore: stat.dailyScore
                }));
            }

            const prompt = this.createAssignmentPrompt(userStatsPerDay, comp);
            const text = await llm.executeLLM(prompt);

             // Extract JSON from response (in case there's extra text)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            // Validate LLM totals against the provided stats before using the summary
            const validation = this.validateLLMOutput(jsonMatch[0], comp, userStatsPerDay);
            if (!validation.valid) {
                console.error('LLM output validation failed:', validation.message);
                throw new Error('LLM output validation failed: ' + validation.message);
            }

            const summary = JSON.parse(jsonMatch[0]);

        const summaryString = `
            🏆 ${summary.summaryTitle}
            ------------------------------------
            Winner: ${summary.winner}
            Scores — ${summary.userTotal} vs ${summary.challengerTotal}

            📅 Daily Highlights:
            ${summary.dailyHighlights.map((line: string) => `- ${line}`).join('\n')}

            💬 Motivation: ${summary.motivation}`
            .replace(/^\s+/gm, ''); // remove indentation from each line

        console.log(summaryString);

        // Save the clean version in competition object if valid

        comp.summary = summaryString;

        } catch (err) {
        console.error('❌ Could not parse LLM output:', (err as Error).message);
        }
    }

    private validateLLMOutput(summaryString: string, comp: Competition, userStatsPerDay: string[]): { valid: boolean; expectedUserTotal: number; expectedChallengerTotal: number; message?: string } {
        try {
            // Parse the LLM-provided JSON string into an object we can inspect.
            const parsed = JSON.parse(summaryString);

            // Extract the numeric totals the LLM reported. Use Number(...) to coerce types
            // and guard against strings like "6". If the values are missing or not numbers
            // we treat that as an invalid response.
            const reportedUserTotal = Number(parsed.userTotal ?? NaN);
            const reportedChallengerTotal = Number(parsed.challengerTotal ?? NaN);

            if (!Number.isFinite(reportedUserTotal) || !Number.isFinite(reportedChallengerTotal)) {
                // Early exit: LLM didn't return valid numeric totals.
                return { valid: false, expectedUserTotal: 0, expectedChallengerTotal: 0, message: 'reported totals are not numbers' };
            }

            // Compute expected totals from the canonical competition data. We iterate the
            // competition's dailyUserStats array (which is maintained by the application)
            // and sum dailyScore per participant. This avoids re-parsing the prompt input
            // and ensures we validate against the authoritative in-memory state.
            let expectedUserTotal = 0;
            let expectedChallengerTotal = 0;

            for (const s of comp.dailyUserStats) {
                if (!s) continue; // defensive guard
                const score = Number(s.dailyScore ?? 0) || 0;
                if (s.user === comp.user) expectedUserTotal += score;
                else if (s.user === comp.challenger) expectedChallengerTotal += score;
            }

            // Compare computed totals with the LLM-reported totals. If they match exactly,
            // validation succeeds. We return a helpful message either way for logging.
            // Determine expected winner from computed totals
            let expectedWinner: string;
            if (expectedUserTotal > expectedChallengerTotal) expectedWinner = comp.user;
            else if (expectedChallengerTotal > expectedUserTotal) expectedWinner = comp.challenger;
            else expectedWinner = 'Draw';

            // Normalize reported winner and accept common synonyms for draw/tie
            const reportedWinnerRaw = String(parsed.winner ?? '').trim();
            const reportedWinnerNorm = reportedWinnerRaw.toLowerCase();
            const normalizeWinner = (name: string) => name.trim().toLowerCase();
            const reportedIsDraw = ['draw', 'tie', 'tied'].includes(reportedWinnerNorm);
            const expectedIsDraw = expectedWinner.toLowerCase() === 'draw';

            // The winner field must be either the exact name of comp.user, comp.challenger, or "Draw".
            const reportedIsOneOfExpected = reportedIsDraw
                || normalizeWinner(reportedWinnerRaw) === normalizeWinner(comp.user)
                || normalizeWinner(reportedWinnerRaw) === normalizeWinner(comp.challenger);
            if (!reportedIsOneOfExpected) {
                return { valid: false, expectedUserTotal, expectedChallengerTotal, message: `reported winner "${reportedWinnerRaw}" is not one of [${comp.user}, ${comp.challenger}, Draw]` };
            }

            const winnerMatches = reportedIsDraw
                ? expectedIsDraw
                : normalizeWinner(reportedWinnerRaw) === normalizeWinner(expectedWinner);

            const totalsMatch = (expectedUserTotal === reportedUserTotal) && (expectedChallengerTotal === reportedChallengerTotal);

            // === New date-consistency check ===
            // Ensure the LLM did not hallucinate or omit dates. We extract the dates
            const extractDatesFromHighlights = (highlights: any[]): string[] => {
                if (!Array.isArray(highlights)) return [];
                const found: string[] = [];
                for (const h of highlights) {
                    if (typeof h !== 'string') continue;
                    // attempt to capture a YYYY-MM-DD sequence inside the highlight
                    const m = h.match(/\d{4}-\d{2}-\d{2}/);
                    if (m) found.push(m[0]);
                }
                return found;
            };

            // treat the response as invalid if the LLM reports any date outside the
            // competition range (before startDate or after endDate). This allows the
            // LLM to omit days or summarize differently as long as it doesn't hallucinate
            // dates outside the period.

            const reportedDates = extractDatesFromHighlights(parsed.dailyHighlights);
            // normalize and dedupe reportedDates
            const reportedDatesUnique = Array.from(new Set(reportedDates)).sort();

            // Build canonical start/end strings in YYYY-MM-DD for comparison
            const startStr = comp.startDate.toISOString().slice(0, 10);
            const endStr = comp.endDate.toISOString().slice(0, 10);

            // Any reported date outside [startStr, endStr] is invalid
            const outOfRangeDates = reportedDatesUnique.filter(d => (d < startStr) || (d > endStr));

            // Build the full expected date list from start to end inclusive
            const expectedDates: string[] = [];
            {
                const s = new Date(comp.startDate.toISOString().slice(0, 10));
                const e = new Date(comp.endDate.toISOString().slice(0, 10));
                for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
                    expectedDates.push(dt.toISOString().slice(0, 10));
                }
            }

            // Detect any missing canonical dates in the reported highlights
            const missingDates = expectedDates.filter(d => !reportedDatesUnique.includes(d));

            const errors: string[] = [];
            if (outOfRangeDates.length > 0) {
                errors.push(`date out of range: LLM reported dates outside ${startStr}..${endStr}: ${JSON.stringify(outOfRangeDates)}`);
            }
            if (missingDates.length > 0) {
                errors.push(`missing dates: LLM did not include these dates from ${startStr}..${endStr}: ${JSON.stringify(missingDates)}`);
            }
            if (!totalsMatch) {
                errors.push(`expected totals ${expectedUserTotal}/${expectedChallengerTotal} but LLM reported ${reportedUserTotal}/${reportedChallengerTotal}`);
            }
            if (!winnerMatches) {
                errors.push(`expected winner "${expectedWinner}" but LLM reported "${reportedWinnerRaw}"`);
            }

            const message = errors.length === 0 ? 'totals, winner, and dates match' : errors.join('; ');
            const valid = errors.length === 0;
            return { valid, expectedUserTotal, expectedChallengerTotal, message };
        } catch (e) {
            // If parsing the LLM string fails entirely, return a descriptive failure message.
            return { valid: false, expectedUserTotal: 0, expectedChallengerTotal: 0, message: 'could not parse summary JSON: ' + (e as Error).message };
        }
    }


private createAssignmentPrompt(statsPerDay: string[], comp: Competition): string {
    return `
Competition participants: ${comp.user} (user) and ${comp.challenger} (challenger)

Input stats (one JSON object per line, date format YYYY-MM-DD):
${statsPerDay.join('\n')}

Instructions (must follow exactly):
1) Parse each line as JSON. Ignore lines that are not valid JSON.
2) Sort all parsed entries strictly in ascending order by "date".
3) Only include dates between ${comp.startDate.toISOString().slice(0, 10)} and ${comp.endDate.toISOString().slice(0, 10)} (inclusive).
   - Do NOT fabricate or infer any days outside this range.
   - If an input line contains an out-of-range date, ignore it completely.
4) Compute "userTotal" and "challengerTotal" by summing all "dailyScore" values for each participant.
   - Be explicit: add positive scores and subtract negative ones exactly as written in each parsed JSON.
   - Verify that these totals are correct and consistent with the per-day highlights.
5) Build "dailyHighlights" in chronological order, ensuring one entry for every date from start to end.
6) For each date:
   - If both users have entries, summarize both results (e.g., "Alice hit bedtime while Bob missed wake-up").
   - If only one user has data, describe that user’s result and clearly state that the other did not report data.
   - If neither user has any entry, explicitly note that both participants did not report data.
   - DO NOT ASSUME MISSING DATA IS A MISSED TARGET. Only report what is explicitly given.
   - Do not decrease ${comp.challenger}’s or ${comp.user}'s score for days they did not report data.
7) Continue numbering days sequentially (Day 1, Day 2, …) regardless of missing data.
8) Determine the winner:
   - If userTotal > challengerTotal → winner = ${comp.user}
   - If challengerTotal > userTotal → winner = ${comp.challenger}
   - If totals tie → winner = "Draw"
   - If totals and winner disagree, correct the inconsistency by adjusting the winner to match the totals.
9) Motivation message (one to three sentences):
   - Must reflect both scoring and participation.
   - If one user missed multiple days but scored higher, emphasize their perseverance while encouraging steadier reporting.
   - If both missed days, focus on teamwork and mutual accountability.
   - If totals tie but participation differs, celebrate the participant who stayed consistent while motivating the other to log daily.
   - Keep tone constructive, specific, and directly grounded in the highlights—avoid generic praise or scolding.
10) Return VALID JSON ONLY in the exact format below. No explanations, no markdown, no extra text.

Required JSON schema:
{
  "summaryTitle": "${comp.user} vs ${comp.challenger} Weekly Competition Summary",
  "winner": "<NAME if userTotal != challengerTotal otherwise \"Draw\">",
  "userTotal": <number>,
  "challengerTotal": <number>,
  "dailyHighlights": ["Day 1 (YYYY-MM-DD): ...", "Day 2 (YYYY-MM-DD): ..."],
  "motivation": "<one to three sentence motivational message>"
}
`;
}


}
