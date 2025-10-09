<concept_spec>
concept CompetitionManager

purpose
    manage multiple sleep-adherence competitions between users, each tracking daily bedtime
    and wake-up performance over a defined time period and establishing a winner based off of scores,
    while ensuring competitions do not overlap for the same user.

principle
    A user sets up a competition with another user from a certain start date to an end date.
    Users' sleep adherences according to their set bedtimes and wake up times are reported.
    A score is calculated for each user at the end of the competition and a winner is established.

state
    a set of Competitions with
        user: User
        challenger: User
        startDate: Date
        endDate: Date
        a set of userStats with
            user: User
            date: Date
            bedtimeSuccess: Boolean
            wakeupSuccess: Boolean
            dailyScore: Number
        outcome: String
        summary: String

    invariants
        each competition’s user and challenger are distinct
        no two competitions overlap in time for the same participant
        each userStat’s date lies within [startDate, endDate] of its competition
        dailyScore = (1 if bedtimeSuccess == true else -1 if bedtimeSuccess == false else 0) +(1 if wakeUpSuccess == true else -1 if wakeUpSuccess == false else 0)

actions
    startCompetition(user:User, challenger:User, start:Date, end:Date)
        requires user is not the challenger and no overlapping Competition already exists
        effects create a Competition with empty dailyUserStats, blank outcome, and blank summary

    recordStat(u:User, d:Date, event:Boolean, success:Boolean)
        requires
            u is part of a Competition
            d is within startDate and endDate of that Competition
        effects
            finds or creates a userStat for (u, d)
            updates bedtimeSuccess or wakeUpSuccess
            recomputes dailyScore using invariant formula

    endCompetition(c:Competition): status:Number
        requires current date is greater than or equal to the endDate of Competition
        effects set and return the outcome of who won by aggregating the daily scores of the user and challenger, where 0 represents user winning, 1 represents challenger winning, and 2 represents a tie

    summarizeCompetition(c:Competition, llm:GeminiLLM): String
        effects: Calls the llm to generate a natural-language summary that shows the highlights for each day within the start date and the competition, as well as scores and who won, and finally a motivational message at the end to provide supportive feedback and encouragement.

</concept_spec>
