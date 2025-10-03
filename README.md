# Assignment 3- LLM Augmentation

## Original Competition concept without LLM augmentation
Competition[User] concept:
- **concept** Competition[User]
- **purpose** Allow users to engage in friendly weekly competitions that compare their adherence and sleep habits with a chosen partner.
- **principle** After two users agree to a challenge, the app records their weekly adherence statistics (derived from their SleepSchedules) and produces a weekly outcome (winner, loser, or tie).
- **state**
    - a set of Competitions with:
        - user: User
        - challenger: User
        - startDate: Date
        - endDate: Date
        - a set of userStats with
            - user: User
            - date: Date
            - score: Number
- **actions**
    - startCompetition(user:User, challenger:User, start:Date, end:Date)
        - **requires**: user is not the challenger and no overlapping Competition already exists
        - **effects**: create a Competition with a set of userStats for each user from start to end dates and with scores = 0
    - recordStat(u:User, d:Date, deltaScore:Number)
        - **requires**: u is part of a Competition and d is within startDate and endDate of that Competition
        - **effects**: add a userStat to the set of userStats with user=u, date=d, and score= score+deltaScore
    - endCompetition(c:Competition): status:Number
        - **requires**: current date is greater than or equal to the endDate of Competition
        - **effects**: return the outcome of who won by aggregating the scores of the user and challenger, where 0 represents user winning, 1 represents challenger winning, and 2 represents a tie

## Updated Competition concept with LLM Augmentation
Competition[User] concept:
- **concept** Competition[User]
- **purpose** Allow users to engage in friendly weekly competitions that compare their adherence and sleep habits with a chosen partner.
- **principle** After two users agree to a challenge, the app records their weekly adherence statistics (derived from their SleepSchedules) and produces a weekly outcome (winner, loser, or tie). With LLM augmentation, the app not only records daily success/failure but also generates a natural-language weekly summary of the competition. The LLM interprets raw stats into trends, highlights strengths and weaknesses, and provides motivational feedback. This increases usability by giving users a more engaging, human-readable reflection of their sleep habits compared to raw numbers alone.
- **state**
    - a set of Competitions with:
        - user: User
        - challenger: User
        - startDate: Date
        - endDate: Date
        - a set of userStats with
            - user: User
            - date: Date
            - bedtimeSuccess: Boolean
            - wakeupSuccess: Boolean
            - dailyScore: Number
        - outcome: Number
        - summary: String
- **actions**
    - startCompetition(user:User, challenger:User, start:Date, end:Date)
        - **requires**: user is not the challenger and no overlapping Competition already exists
        - **effects**: create a Competition with a set of userStats for each user from start to end dates and with scores = 0
    - recordStat(u:User, d:Date, event:Boolean, success:Boolean)
        - **requires**:
            - u is part of a Competition
            - d is within startDate and endDate of that Competition
        - **effects**:
            - if there is no userStat for user and d create one with default values
                - bedtimeSuccess = false
                - wakeupSuccess = false
                - dailyScore = 0
            - update the corresponding field for the userStat with user and d
                - if event = true, set bedtimeSuccess = success
                - if event = false, set wakeupSuccess = success
            - recompute daily score for that (user, d) userData
                - dailyScore = (1 if bedtimeSuccess==true else -1 if bedtimeSuccess==false else 0)
                   + (1 if wakeupSuccess==true else -1 if wakeupSuccess==false else 0)
    - endCompetition(c:Competition): status:Number
        - **requires**: current date is greater than or equal to the endDate of Competition
        - **effects**: set and return the outcome of who won by aggregating the daily scores of the user and challenger, where 0 represents user winning, 1 represents challenger winning, and 2 represents a tie
    - summarizeCompetition(c:Competition, llm:GeminiLLM): String
        - requires: Competition c has ended
        - effects: Calls the llm to generate a natural-language summary using the userStats and outcome. Stores this in summary and returns
