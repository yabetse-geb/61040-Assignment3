/**
 * Gemini Schedule Demo
 * 
 * This script demonstrates how to use Google's Gemini API to create
 * an intelligent schedule for students based on their tasks and preferences.
 * 
 * The script:
 * 1. Loads student data from a JSON file
 * 2. Sends the data to Gemini Flash 2.5
 * 3. Gets back a nicely organized schedule
 */

// Import the Google Generative AI library
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load the API key from the config file
let apiKey;
try {
    const config = require('./config.json');
    apiKey = config.apiKey;
} catch (error) {
    console.error('❌ Error: Could not load config.json file.');
    console.error('Please make sure you have created config.json with your Gemini API key.');
    console.error('See README.md for instructions.');
    process.exit(1);
}

// Initialize the Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Load student data from JSON file
 */
function loadStudentData() {
    try {
        const dataPath = path.join(__dirname, 'student-data.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('❌ Error loading student data:', error.message);
        process.exit(1);
    }
}

/**
 * Create a prompt for Gemini to organize the schedule
 */
function createSchedulePrompt(studentData) {
    const events = studentData.events.map(event => 
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
async function generateSchedule(studentData) {
    try {
        console.log('🤖 Sending data to Gemini AI...');
        
        // Get the Gemini model (using Flash 2.5)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        
        // Create the prompt
        const prompt = createSchedulePrompt(studentData);
        
        // Generate the response with token limit to prevent cost over-runs
        const generationConfig = {
            maxOutputTokens: 1000,
        };
        
        const result = await model.generateContent(prompt, generationConfig);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Received response from Gemini AI!');
        
        // Display the raw response from Gemini
        console.log('\n🤖 RAW GEMINI RESPONSE');
        console.log('======================');
        console.log(text);
        console.log('======================\n');
        
        return text;
        
    } catch (error) {
        console.error('❌ Error calling Gemini API:', error.message);
        throw error;
    }
}

/**
 * Parse and display the schedule
 */
function displaySchedule(scheduleText) {
    try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = scheduleText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        
        const schedule = JSON.parse(jsonMatch[0]);
        
        console.log('\n📅 DAILY SCHEDULE');
        console.log('==================\n');
        
        // Display morning schedule
        console.log('🌅 MORNING (6:00 AM - 12:00 PM)');
        console.log('--------------------------------');
        schedule.morning.forEach(item => {
            console.log(`⏰ ${item.time} - ${item.activity}`);
            console.log(`   Category: ${item.category} | Duration: ${item.duration}\n`);
        });
        
        // Display afternoon schedule
        console.log('☀️  AFTERNOON (12:00 PM - 6:00 PM)');
        console.log('----------------------------------');
        schedule.afternoon.forEach(item => {
            console.log(`⏰ ${item.time} - ${item.activity}`);
            console.log(`   Category: ${item.category} | Duration: ${item.duration}\n`);
        });
        
        // Display evening schedule
        console.log('🌙 EVENING (6:00 PM - 11:00 PM)');
        console.log('-------------------------------');
        schedule.evening.forEach(item => {
            console.log(`⏰ ${item.time} - ${item.activity}`);
            console.log(`   Category: ${item.category} | Duration: ${item.duration}\n`);
        });
        
        // Save the schedule to a file
        const outputPath = path.join(__dirname, 'generated-schedule.json');
        fs.writeFileSync(outputPath, JSON.stringify(schedule, null, 2));
        console.log(`💾 Schedule saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error parsing schedule:', error.message);
        console.log('\n📝 Raw response from Gemini:');
        console.log(scheduleText);
    }
}

/**
 * Main function to run the schedule generator
 */
async function main() {
    console.log('🎓 Gemini Schedule Demo');
    console.log('======================\n');
    
    try {
        // Load student data
        console.log('📚 Loading student data...');
        const studentData = loadStudentData();
        console.log(`✅ Loaded data for student: ${studentData.student.name}`);
        
        // Display student preferences
        console.log('\n💭 STUDENT PREFERENCES');
        console.log('======================');
        console.log(studentData.student.preferences);
        console.log('');
        
        // Display all events that will be scheduled
        console.log('📋 EVENTS TO SCHEDULE');
        console.log('====================');
        studentData.events.forEach((event, index) => {
            console.log(`${index + 1}. ${event.description}`);
            console.log(`   Category: ${event.category} | Duration: ${event.duration}`);
        });
        console.log(`\nTotal events: ${studentData.events.length}\n`);
        
        // Generate schedule using Gemini
        const scheduleText = await generateSchedule(studentData);
        
        // Display the results
        displaySchedule(scheduleText);
        
        console.log('\n🎉 Schedule generation complete!');
        
    } catch (error) {
        console.error('❌ Application error:', error.message);
        process.exit(1);
    }
}

// Run the application
if (require.main === module) {
    main();
}
