/**
 * Gemini Schedule Demo - Main Application
 * 
 * This is the main entry point for the Gemini Schedule Demo application.
 * It orchestrates the loading of student data, calling the Gemini API,
 * and displaying the results in a user-friendly format.
 * 
 * The application demonstrates how to use Google's Gemini API to create
 * intelligent daily schedules for students based on their tasks and preferences.
 */

// Import all the modular components
const { loadApiKey } = require('./config-loader');
const { 
    loadStudentData, 
    displayStudentPreferences, 
    displayEventsToSchedule 
} = require('./data-loader');
const { generateSchedule } = require('./gemini-client');
const { displaySchedule } = require('./schedule-display');

/**
 * Main function to run the schedule generator
 * Orchestrates the entire process from data loading to result display
 */
async function main(): Promise<void> {
    console.log('🎓 Gemini Schedule Demo');
    console.log('======================\n');
    
    try {
        // Step 1: Load configuration
        console.log('📚 Loading student data...');
        const apiKey: string = loadApiKey();
        
        // Step 2: Load student data
        const studentData = loadStudentData();
        console.log(`✅ Loaded data for student: ${studentData.student.name}`);
        
        // Step 3: Display input data for transparency
        displayStudentPreferences(studentData);
        displayEventsToSchedule(studentData);
        
        // Step 4: Generate schedule using Gemini AI
        const scheduleText: string = await generateSchedule(studentData, apiKey);
        
        // Step 5: Display the results
        displaySchedule(scheduleText);
        
        console.log('\n🎉 Schedule generation complete!');
        
    } catch (error) {
        console.error('❌ Application error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the application if this file is executed directly
if (require.main === module) {
    main();
}