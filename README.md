AltaView Social AI Command Center

A React-based dashboard for automating social media content creation for Alta View Indoor Golf Club. This application utilizes Google's Gemini AI to analyze business data and generate platform-specific posts.

🚀 Getting Started

1. Prerequisites

Node.js (v18 or higher) must be installed on your machine.

A Google Gemini API Key (Get one for free at Google AI Studio).

2. Installation

Navigate to this folder in your terminal and install the dependencies:

cd altaview-social
npm install


3. Setup API Keys (Important!)

For security reasons, the AI API key is not stored in the repository. You must configure it locally.

Create a new file in this folder named .env (just .env, no name before the dot).

Open the file and paste the following line:

VITE_GEMINI_API_KEY=AIzaSy...YourKeyHere...


Replace the value with your actual Google Gemini API Key.

4. Run the App

Start the local development server:

npm run dev


Click the link (usually http://localhost:5173) to open the app.

🛠 Features

Iteration 1 & 2: Knowledge Base (Agent 1)

Manual Entry: Add facts about the business manually.

JSON Upload: Drag and drop scraper results (JSON format).

The Analyst Agent: Automatically reads raw input, categorizes it (e.g., "Competitor Intel", "Customer Sentiment"), and saves a clean summary to the database.

Iteration 3: Content Generator (Agent 2)

Context-Aware: Reads the summarized data from the Knowledge Base.

Customizable: Select Platform (Instagram, LinkedIn, Facebook) and Tone.

Topic Focus: optionally tell the AI exactly what to write about (e.g., "Winter League").

📂 Project Structure

src/App.jsx: Main application logic (Dashboard, KnowledgeBase, ContentGenerator).

src/index.css: Tailwind CSS imports.

.env: Local environment variables (Ignored by Git).