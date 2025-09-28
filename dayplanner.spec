concept DayPlanner
purpose help organize activities for a single day
principle
state 
actions    
notes

This is a very rudimentary 


     * 
 * A simple day planner concept that helps organize activities for a single day.
 * You can add activities one at a time, assign them to times, and observe the completed schedule.


/**
     * Add a new activity to the planner
     * @param title - The title/description of the activity
     * @param duration - Duration in half-hour increments
     * @returns The created activity
     */
    addActivity(title: string, duration: number): Activity {

    /**
     * Remove an activity from the planner
     * Also removes any assignments for this activity
     * @param activity - The activity to remove
     */
    removeActivity(activity: Activity): void {


    /**
     * Assign an activity to a specific start time
     * @param activity - The activity to assign
     * @param startTime - Start time in half-hour slots from midnight
     */
    assignActivity(activity: Activity, startTime: number): void {


    /**
     * Remove assignment for an activity
     * @param activity - The activity to unassign
     */
    unassignActivity(activity: Activity): void {


    /**
     * Request assignments from LLM for all unassigned activities
     * Uses hardwired preferences in the prompt
     */
    async assignActivities(llm: GeminiLLM): Promise<void> {
