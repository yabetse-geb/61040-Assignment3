/**
 * TypeScript interfaces and types for the Gemini Schedule Demo
 * 
 * This file contains all the type definitions used throughout the application,
 * making it easy to maintain type safety and understand the data structures.
 */

/**
 * Represents a single event/task for a student
 */
export interface StudentEvent {
    description: string;
    category: string;
    duration: string;
}

/**
 * Represents student information and preferences
 */
export interface Student {
    name: string;
    preferences: string;
}

/**
 * Complete student data including personal info and events
 */
export interface StudentData {
    student: Student;
    events: StudentEvent[];
}

/**
 * Configuration file structure for API key
 */
export interface Config {
    apiKey: string;
}

/**
 * A single scheduled item with time and details
 */
export interface ScheduledItem {
    time: string;
    activity: string;
    category: string;
    duration: string;
}

/**
 * Complete daily schedule organized by time periods
 */
export interface Schedule {
    morning: ScheduledItem[];
    afternoon: ScheduledItem[];
    evening: ScheduledItem[];
}
