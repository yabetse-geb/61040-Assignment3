/**
 * DayPlanner - Core Implementation
 * 
 * A simple day planner that helps organize activities for a single day.
 * You can add activities one at a time, assign them to times, and observe the completed schedule.
 */

import { Activity, Assignment } from './dayplanner-types';

export class DayPlanner {
    private activities: Activity[] = [];
    private assignments: Assignment[] = [];

    /**
     * Add a new activity to the planner
     * @param title - The title/description of the activity
     * @param duration - Duration in half-hour increments
     * @returns The created activity
     */
    addActivity(title: string, duration: number): Activity {
        const activity: Activity = {
            title,
            duration,
            startTime: undefined
        };
        this.activities.push(activity);
        return activity;
    }

    /**
     * Remove an activity from the planner
     * Also removes any assignments for this activity
     * @param activity - The activity to remove
     */
    removeActivity(activity: Activity): void {
        // Remove assignments for this activity
        this.assignments = this.assignments.filter(assignment => assignment.activity !== activity);
        
        // Remove the activity
        this.activities = this.activities.filter(a => a !== activity);
    }

    /**
     * Assign an activity to a specific start time
     * @param activity - The activity to assign
     * @param startTime - Start time in half-hour slots from midnight
     */
    assignActivity(activity: Activity, startTime: number): void {
        // Remove any existing assignment for this activity
        this.unassignActivity(activity);
        
        // Create new assignment
        const assignment: Assignment = {
            activity,
            startTime
        };
        
        this.assignments.push(assignment);
        
        // Update the activity's startTime
        activity.startTime = startTime;
    }

    /**
     * Remove assignment for an activity
     * @param activity - The activity to unassign
     */
    unassignActivity(activity: Activity): void {
        this.assignments = this.assignments.filter(assignment => assignment.activity !== activity);
        activity.startTime = undefined;
    }

    /**
     * Get all activities
     */
    getActivities(): Activity[] {
        return [...this.activities];
    }

    /**
     * Get all assignments
     */
    getAssignments(): Assignment[] {
        return [...this.assignments];
    }

    /**
     * Query the schedule - returns activities organized by time slots
     * This is the "display" function that walks through available slot times
     */
    querySchedule(): { [timeSlot: number]: Activity[] } {
        const schedule: { [timeSlot: number]: Activity[] } = {};
        
        // Initialize all possible time slots (48 half-hour slots in a day)
        for (let i = 0; i < 48; i++) {
            schedule[i] = [];
        }
        
        // Walk through assignments and place activities in their time slots
        for (const assignment of this.assignments) {
            const startTime = assignment.startTime;
            const duration = assignment.activity.duration;
            
            // Place the activity in all its occupied time slots
            for (let i = 0; i < duration; i++) {
                const slot = startTime + i;
                if (slot < 48) { // Ensure we don't go beyond 24 hours
                    schedule[slot].push(assignment.activity);
                }
            }
        }
        
        return schedule;
    }

    /**
     * Format time slot number to readable time string
     * @param timeSlot - Time slot number (0-47)
     * @returns Formatted time string (e.g., "6:30 AM")
     */
    formatTimeSlot(timeSlot: number): string {
        const hours = Math.floor(timeSlot / 2);
        const minutes = (timeSlot % 2) * 30;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Display the current schedule in a readable format
     */
    displaySchedule(): void {
        const schedule = this.querySchedule();
        
        console.log('\n📅 Daily Schedule');
        console.log('==================');
        
        let hasActivities = false;
        
        for (let slot = 0; slot < 48; slot++) {
            const activities = schedule[slot];
            if (activities.length > 0) {
                hasActivities = true;
                const timeStr = this.formatTimeSlot(slot);
                
                // Only show the start of each activity (not every half-hour)
                const isActivityStart = activities.some(activity => 
                    this.assignments.find(a => a.activity === activity)?.startTime === slot
                );
                
                if (isActivityStart) {
                    const uniqueActivities = [...new Set(activities)];
                    for (const activity of uniqueActivities) {
                        const durationStr = activity.duration === 1 ? '30 min' : `${activity.duration * 0.5} hours`;
                        console.log(`${timeStr} - ${activity.title} (${durationStr})`);
                    }
                }
            }
        }
        
        if (!hasActivities) {
            console.log('No activities scheduled yet.');
        }
        
        console.log('\n📋 Unassigned Activities');
        console.log('========================');
        const unassigned = this.activities.filter(a => !a.startTime);
        if (unassigned.length > 0) {
            unassigned.forEach(activity => {
                const durationStr = activity.duration === 1 ? '30 min' : `${activity.duration * 0.5} hours`;
                console.log(`- ${activity.title} (${durationStr})`);
            });
        } else {
            console.log('All activities are assigned!');
        }
    }
}
