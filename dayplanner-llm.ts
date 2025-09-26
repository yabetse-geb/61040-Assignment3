/**
 * LLM Integration for DayPlanner
 * 
 * Handles the requestAssignmentsFromLLM functionality using Google's Gemini API.
 * The LLM prompt is hardwired with user preferences and doesn't take external hints.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DayPlanner } from './dayplanner';
import { Activity, Config } from './dayplanner-types';

export class DayPlannerLLM {
    private apiKey: string;

    constructor(config: Config) {
        this.apiKey = config.apiKey;
    }

    /**
     * Request assignments from LLM for all unassigned activities
     * Uses hardwired preferences in the prompt
     */
    async requestAssignmentsFromLLM(dayPlanner: DayPlanner): Promise<void> {
        try {
            console.log('🤖 Requesting schedule assignments from Gemini AI...');
            
            // Get unassigned activities
            const unassignedActivities = dayPlanner.getActivities().filter(a => !a.startTime);
            
            if (unassignedActivities.length === 0) {
                console.log('✅ All activities are already assigned!');
                return;
            }

            // Initialize Gemini AI
            const genAI = new GoogleGenerativeAI(this.apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash-lite",
                generationConfig: {
                    maxOutputTokens: 1000,
                }
            });

            // Create the prompt with hardwired preferences
            const prompt = this.createAssignmentPrompt(unassignedActivities);
            
            // Generate the response
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');
            
            // Parse and apply the assignments
            this.parseAndApplyAssignments(dayPlanner, text, unassignedActivities);
            
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }

    /**
     * Create the prompt for Gemini with hardwired preferences
     */
    private createAssignmentPrompt(activities: Activity[]): string {
        const activitiesList = activities.map(activity => {
            const durationStr = activity.duration === 1 ? '30 minutes' : `${activity.duration * 0.5} hours`;
            return `- ${activity.title} (${durationStr})`;
        }).join('\n');

        return `
You are a helpful AI assistant that creates optimal daily schedules for students.

STUDENT PREFERENCES:
- Exercise activities work well in the morning (6:00 AM - 10:00 AM)
- Classes and study time should be scheduled during focused hours (9:00 AM - 5:00 PM)
- Meals should be at regular intervals (breakfast 7-9 AM, lunch 12-1 PM, dinner 6-8 PM)
- Social activities and relaxation are good for evenings (6:00 PM - 10:00 PM)
- Avoid scheduling demanding activities too late at night (after 10:00 PM)
- Leave buffer time between different types of activities

TIME SYSTEM:
- Times are represented in half-hour slots starting at midnight
- Slot 0 = 12:00 AM, Slot 13 = 6:30 AM, Slot 26 = 1:00 PM, Slot 38 = 7:00 PM, etc.
- There are 48 slots total (24 hours x 2)
- Valid slots are 0-47 (midnight to 11:30 PM)

ACTIVITIES TO SCHEDULE (ONLY THESE - DO NOT ADD OTHERS):
${activitiesList}

CRITICAL REQUIREMENTS:
1. ONLY assign the activities listed above - do NOT add any new activities
2. Use ONLY valid time slots (0-47)
3. Avoid conflicts - don't overlap activities
4. Consider the duration of each activity when scheduling
5. Use appropriate time slots based on the preferences above

Return your response as a JSON object with this exact structure:
{
  "assignments": [
    {
      "title": "exact activity title from the list above",
      "startTime": valid_slot_number_0_to_47
    }
  ]
}

Return ONLY the JSON object, no additional text.`;

    }

    /**
     * Parse the LLM response and apply assignments to the day planner
     */
    private parseAndApplyAssignments(dayPlanner: DayPlanner, responseText: string, unassignedActivities: Activity[]): void {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const response = JSON.parse(jsonMatch[0]);
            
            if (!response.assignments || !Array.isArray(response.assignments)) {
                throw new Error('Invalid response format');
            }

            console.log('📝 Applying LLM assignments...');
            
            for (const assignment of response.assignments) {
                const activity = unassignedActivities.find(a => a.title === assignment.title);
                if (activity && typeof assignment.startTime === 'number') {
                    dayPlanner.assignActivity(activity, assignment.startTime);
                    console.log(`✅ Assigned "${activity.title}" to ${dayPlanner.formatTimeSlot(assignment.startTime)}`);
                } else {
                    console.log(`⚠️  Could not find activity "${assignment.title}" or invalid start time`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            console.log('Response was:', responseText);
            throw error;
        }
    }
}
