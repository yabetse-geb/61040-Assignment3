/**
 * Gemini AI client for the Gemini Schedule Demo
 * 
 * This module handles all interactions with the Google Gemini API,
 * including prompt creation and response generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { StudentData } from './types';

/**
 * Create a detailed prompt for Gemini to organize the schedule
 */
function createSchedulePrompt(studentData: StudentData): string {
    const events: string = studentData.events.map(event => 
        `- ${event.description} (${event.category}, ${event.duration})`
    ).join('\n');

    return `
You are a helpful AI assistant that creates optimal daily schedules for students.

Student: ${studentData.student.name}
Preferences: ${studentData.student.preferences}

Here are the student's tasks and events for today:
${events}

Please organize these events into a daily schedule with three time periods:
- Morning (6:00 AM - 12:00 PM)
- Afternoon (12:00 PM - 6:00 PM) 
- Evening (6:00 PM - 11:00 PM)

Consider the student's preferences when scheduling. For example:
- Exercise activities work well in the morning
- Classes should be scheduled at their specified times
- Meals should be at regular intervals
- Study time should be during focused hours
- Social activities are good for evenings

Return your response as a JSON object with this exact structure:
{
  "morning": [
    {
      "time": "suggested time",
      "activity": "activity description",
      "category": "category",
      "duration": "duration"
    }
  ],
  "afternoon": [
    {
      "time": "suggested time", 
      "activity": "activity description",
      "category": "category",
      "duration": "duration"
    }
  ],
  "evening": [
    {
      "time": "suggested time",
      "activity": "activity description", 
      "category": "category",
      "duration": "duration"
    }
  ]
}

Make sure to include ALL the provided events in your schedule. Do NOT make up any events that are not provided in the student data.`;
}

/**
 * Generate schedule using Gemini AI
 */
export async function generateSchedule(studentData: StudentData, apiKey: string): Promise<string> {
    try {
        console.log('🤖 Sending data to Gemini AI...');
        
        // Initialize the Gemini AI
        const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(apiKey);
        
        // Get the Gemini model (using Flash 2.5 Lite) with generation config
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite",
            generationConfig: {
                maxOutputTokens: 1000,
            }
        });
        
        // Create the prompt
        const prompt: string = createSchedulePrompt(studentData);
        
        // Generate the response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text: string = response.text();
        
        console.log('✅ Received response from Gemini AI!');
        
        // Display the raw response from Gemini
        console.log('\n🤖 RAW GEMINI RESPONSE');
        console.log('======================');
        console.log(text);
        console.log('======================\n');
        
        return text;
        
    } catch (error) {
        console.error('❌ Error calling Gemini API:', (error as Error).message);
        throw error;
    }
}
