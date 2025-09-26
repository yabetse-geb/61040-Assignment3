# Gemini Schedule Demo. Built using Cursor.

A TypeScript application that demonstrates how to use Google's Gemini API to create intelligent daily schedules for students. This demo shows how AI can help organize tasks and events into optimal time slots based on student preferences.

## What This Demo Does

This application:
1. **Loads student data** from a JSON file containing tasks, events, and preferences
2. **Sends the data to Gemini Flash 2.5 Lite** with instructions to create an optimal schedule
3. **Receives a structured schedule** organized into morning, afternoon, and evening time slots
4. **Displays the results** in a user-friendly format and saves them to a file

## Prerequisites

- **Node.js** (version 14 or higher)
- **TypeScript** (will be installed automatically)
- **Google Gemini API Key** (free to get at [Google AI Studio](https://makersuite.google.com/app/apikey))

## Quick Setup

### 0. Clone the repo locally and navigate to it
```cd intro-gemini-schedule```

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your API Key

**Important:** The `config.json` file is not included in this repository for security reasons. You need to create it yourself.

**Step 1:** Copy the template file:
```bash
cp config.json.template config.json
```

**Step 2:** Edit `config.json` and add your API key:
```json
{
  "apiKey": "YOUR_GEMINI_API_KEY_HERE"
}
```

**To get your API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it into `config.json`

### 3. Run the Application

You can run the application in several ways:

**Option 1: Using npm (recommended)**
```bash
npm start
```
This will compile TypeScript and run the application.

**Option 2: Development mode (with ts-node)**
```bash
npm run dev
```
This runs TypeScript directly without compilation. Note: Due to module resolution complexities with ts-node, the compiled version (Option 1) is recommended for reliability.

**Option 3: Manual compilation**
```bash
npm run build
node dist/schedule.js
```

All methods do the same thing! The application will load the sample student data and generate a schedule using Gemini AI.

## File Structure

```
gemini-schedule-demo/
├── package.json          # Node.js dependencies and TypeScript config
├── tsconfig.json         # TypeScript configuration
├── config.json.template  # Template for API key configuration
├── config.json           # Your Gemini API key (create this from template)
├── student-data.json     # Sample student data with tasks and preferences
├── schedule.ts           # Main application entry point
├── types.ts              # TypeScript interfaces and type definitions
├── config-loader.ts      # Configuration loading utilities
├── data-loader.ts        # Student data loading and display functions
├── gemini-client.ts      # Gemini AI API interactions
├── schedule-display.ts   # Schedule parsing and output formatting
├── dist/                 # Compiled JavaScript output (auto-generated)
├── .gitignore           # Git ignore file (protects your API key)
└── README.md            # This file
```

## Sample Output

The application will generate a schedule like this:

```
📅 DAILY SCHEDULE
==================

🌅 MORNING (6:00 AM - 12:00 PM)
--------------------------------
⏰ 7:00 AM - morning run
   Category: exercise | Duration: 30 minutes

⏰ 8:00 AM - breakfast
   Category: meal | Duration: 20 minutes

⏰ 10:00 AM - grocery shopping
   Category: errand | Duration: 45 minutes

☀️  AFTERNOON (12:00 PM - 6:00 PM)
----------------------------------
⏰ 12:00 PM - lunch
   Category: meal | Duration: 30 minutes

⏰ 2:30 PM - CS 6104 lecture at 2:30pm
   Category: class | Duration: 75 minutes

⏰ 4:00 PM - study for math exam
   Category: study | Duration: 2 hours

🌙 EVENING (6:00 PM - 11:00 PM)
-------------------------------
⏰ 6:00 PM - dinner with jane and joe
   Category: social | Duration: 90 minutes

⏰ 8:00 PM - group project meeting
   Category: study | Duration: 90 minutes
```

## Customizing the Data

To use your own student data:

1. **Edit `student-data.json`**:
   - Change the student name
   - Update the preferences paragraph
   - Modify the events list with your own tasks


## Troubleshooting

### "Could not load config.json"
- Make sure you've created `config.json` with your API key
- Check that the JSON format is correct (no extra commas, proper quotes)

### "Error calling Gemini API"
- Verify your API key is correct
- Check your internet connection
- Make sure you have API access enabled in Google AI Studio

### "No JSON found in response"
- This sometimes happens if Gemini returns extra text
- The raw response will be displayed so you can see what went wrong

### "loadApiKey is not a function" or similar module errors
- This happens with ts-node in development mode due to module resolution issues
- Use `npm start` (compiled version) instead of `npm run dev`
- The compiled version works perfectly and is recommended

## Next Steps

Try modifying the code to:
- Add more detailed time preferences
- Include location information for events
- Generate weekly schedules instead of daily
- Add conflict detection for overlapping events
- Create a web interface for easier interaction

## Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js File System Module](https://nodejs.org/api/fs.html)
- [JSON Format Guide](https://www.json.org/json-en.html)
