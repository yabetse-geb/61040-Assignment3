/**
 * Schedule display utilities for the Gemini Schedule Demo
 * 
 * This module handles parsing and displaying the schedule results
 * from Gemini AI, including saving to files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Schedule, ScheduledItem } from './types';

/**
 * Parse and display the schedule from Gemini's response
 */
export function displaySchedule(scheduleText: string): void {
    try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch: RegExpMatchArray | null = scheduleText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        
        const schedule: Schedule = JSON.parse(jsonMatch[0]) as Schedule;
        
        console.log('\n📅 DAILY SCHEDULE');
        console.log('==================\n');
        
        // Display morning schedule
        displayTimePeriod('🌅 MORNING (6:00 AM - 12:00 PM)', schedule.morning);
        
        // Display afternoon schedule
        displayTimePeriod('☀️  AFTERNOON (12:00 PM - 6:00 PM)', schedule.afternoon);
        
        // Display evening schedule
        displayTimePeriod('🌙 EVENING (6:00 PM - 11:00 PM)', schedule.evening);
        
        // Save the schedule to a file
        saveScheduleToFile(schedule);
        
    } catch (error) {
        console.error('❌ Error parsing schedule:', (error as Error).message);
        console.log('\n📝 Raw response from Gemini:');
        console.log(scheduleText);
    }
}

/**
 * Display a specific time period's schedule
 */
function displayTimePeriod(title: string, items: ScheduledItem[]): void {
    console.log(title);
    console.log('-'.repeat(title.length));
    items.forEach((item: ScheduledItem) => {
        console.log(`⏰ ${item.time} - ${item.activity}`);
        console.log(`   Category: ${item.category} | Duration: ${item.duration}\n`);
    });
}

/**
 * Save the schedule to a JSON file
 */
function saveScheduleToFile(schedule: Schedule): void {
    try {
        const outputPath: string = __dirname.includes('dist') 
            ? path.join(__dirname, '..', 'generated-schedule.json')
            : path.join(__dirname, 'generated-schedule.json');
        
        fs.writeFileSync(outputPath, JSON.stringify(schedule, null, 2));
        console.log(`💾 Schedule saved to: ${outputPath}`);
    } catch (error) {
        console.error('❌ Error saving schedule file:', (error as Error).message);
    }
}
