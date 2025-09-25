/**
 * Data loading utilities for the Gemini Schedule Demo
 * 
 * This module handles loading student data from JSON files
 * with proper error handling and path resolution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { StudentData } from './types';

/**
 * Load student data from the student-data.json file
 * Handles both development (ts-node) and production (compiled) paths
 */
export function loadStudentData(): StudentData {
    try {
        // Handle both development (ts-node) and production (compiled) paths
        const dataPath: string = __dirname.includes('dist') 
            ? path.join(__dirname, '..', 'student-data.json')
            : path.join(__dirname, 'student-data.json');
        
        const rawData: string = fs.readFileSync(dataPath, 'utf8');
        const studentData: StudentData = JSON.parse(rawData) as StudentData;
        
        // Validate the data structure
        if (!studentData.student || !studentData.events) {
            throw new Error('Invalid student data structure');
        }
        
        if (!studentData.student.name || !studentData.student.preferences) {
            throw new Error('Missing student name or preferences');
        }
        
        if (!Array.isArray(studentData.events)) {
            throw new Error('Events must be an array');
        }
        
        return studentData;
    } catch (error) {
        console.error('❌ Error loading student data:', (error as Error).message);
        process.exit(1);
    }
}

/**
 * Display student preferences in a formatted way
 */
export function displayStudentPreferences(studentData: StudentData): void {
    console.log('\n💭 STUDENT PREFERENCES');
    console.log('======================');
    console.log(studentData.student.preferences);
    console.log('');
}

/**
 * Display all events that will be scheduled
 */
export function displayEventsToSchedule(studentData: StudentData): void {
    console.log('📋 EVENTS TO SCHEDULE');
    console.log('====================');
    studentData.events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.description}`);
        console.log(`   Category: ${event.category} | Duration: ${event.duration}`);
    });
    console.log(`\nTotal events: ${studentData.events.length}\n`);
}
