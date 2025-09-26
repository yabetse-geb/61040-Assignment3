/**
 * DayPlanner Types - First Principles Implementation
 * 
 * This file contains the core types for the DayPlanner concept.
 * Times are represented in half-hour slots starting at midnight (0 = 12:00 AM, 13 = 6:30 AM).
 * Durations are also in half-hour increments.
 */

/**
 * Represents a single activity that can be scheduled
 */
export interface Activity {
    title: string;
    duration: number; // in half-hour increments
    startTime?: number; // optional, in half-hour slots from midnight
}

/**
 * Represents an assignment of an activity to a specific time slot
 */
export interface Assignment {
    activity: Activity;
    startTime: number; // in half-hour slots from midnight
}

/**
 * Configuration for API access
 */
export interface Config {
    apiKey: string;
}
