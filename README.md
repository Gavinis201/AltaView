# AltaView Social AI Command Center

A multi-agent AI solution for automating social media content creation for Alta View Indoor Golf Club.

---

## 📋 Problem Statement

**Alta View Indoor Golf Club** is a 24/7 indoor golf facility in Highland, Utah, offering Trackman simulators, professional instruction, and private bays. Despite having excellent facilities and strong customer reviews, they **lack a consistent social media process** to support customer acquisition and online engagement. The owner does not have time or resources to regularly create content, respond to trends, or maintain visibility across platforms like Instagram, Facebook, and LinkedIn. This results in **missed opportunities for customer engagement, reduced brand awareness, and slower membership growth**. Our solution leverages a **multi-agent AI architecture** that automates the entire workflow—from ingesting business data and customer sentiment to generating platform-specific, on-brand social media posts with human approval checkpoints. This dramatically **reduces content creation time from hours to minutes** while maintaining quality and brand consistency, allowing the owner to focus on operations while the AI handles social presence.

---

## 🔄 Process Diagrams

### As-Is Process (Before Solution)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT MANUAL PROCESS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│   │  Owner   │───▶│ Thinks of    │───▶│ Manually     │───▶│ Manually    │  │
│   │ remembers│    │ content idea │    │ writes post  │    │ posts to    │  │
│   │ to post  │    │              │    │              │    │ each platform│  │
│   └──────────┘    └──────────────┘    └──────────────┘    └─────────────┘  │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    PAIN POINTS                                       │   │
│   │  • Inconsistent posting (weeks between posts)                        │   │
│   │  • No awareness of competitor activity                               │   │
│   │  • Customer reviews not leveraged for content                        │   │
│   │  • 2-3 hours per quality post                                        │   │
│   │  • No scheduling or content calendar                                 │   │
│   │  • Owner's time diverted from core business                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### To-Be Process (With AI Solution)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI-POWERED MULTI-AGENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  ITERATION 1 & 2: DATA INGESTION                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                        ║  │
│  ║   ┌────────────┐    ┌────────────┐    ┌────────────┐                  ║  │
│  ║   │ Manual     │    │ JSON       │    │ Web        │                  ║  │
│  ║   │ Entry      │    │ Upload     │    │ Scraper*   │                  ║  │
│  ║   └─────┬──────┘    └─────┬──────┘    └─────┬──────┘                  ║  │
│  ║         │                 │                 │                          ║  │
│  ║         └────────────────┼─────────────────┘                          ║  │
│  ║                          ▼                                             ║  │
│  ║              ┌─────────────────────────┐                               ║  │
│  ║              │   🤖 AGENT 1: ANALYST   │                               ║  │
│  ║              │  (Gemini AI)            │                               ║  │
│  ║              │  • Categorizes data     │                               ║  │
│  ║              │  • Extracts key facts   │                               ║  │
│  ║              │  • Tags by type         │                               ║  │
│  ║              └───────────┬─────────────┘                               ║  │
│  ║                          ▼                                             ║  │
│  ║              ┌─────────────────────────┐                               ║  │
│  ║              │  📊 KNOWLEDGE BASE      │                               ║  │
│  ║              │  (Firebase Firestore)   │                               ║  │
│  ║              │  • Competitor Intel     │                               ║  │
│  ║              │  • Customer Sentiment   │                               ║  │
│  ║              │  • Business Features    │                               ║  │
│  ║              │  • Events/Promos        │                               ║  │
│  ║              └───────────┬─────────────┘                               ║  │
│  ║                          │                                             ║  │
│  ╚══════════════════════════╪═════════════════════════════════════════════╝  │
│                             │                                                │
│  ╔══════════════════════════╪═════════════════════════════════════════════╗  │
│  ║  ITERATION 3: CONTENT GENERATION                                       ║  │
│  ╠══════════════════════════╪═════════════════════════════════════════════╣  │
│  ║                          ▼                                             ║  │
│  ║   ┌─────────────┐   ┌─────────────────────────┐                        ║  │
│  ║   │ User Selects│   │   🤖 AGENT 2: CREATOR   │                        ║  │
│  ║   │ • Platform  │──▶│  (Gemini AI)            │                        ║  │
│  ║   │ • Tone      │   │  • Reads knowledge base │                        ║  │
│  ║   │ • Topic     │   │  • Generates posts      │                        ║  │
│  ║   └─────────────┘   │  • Adds hashtags        │                        ║  │
│  ║                     └───────────┬─────────────┘                        ║  │
│  ║                                 ▼                                      ║  │
│  ║                  ┌─────────────────────────────┐                       ║  │
│  ║                  │  👤 HUMAN-IN-THE-LOOP      │                       ║  │
│  ║                  │  • Review draft            │                       ║  │
│  ║                  │  • Approve ✓ or Reject ✗   │                       ║  │
│  ║                  │  • Edit if needed          │                       ║  │
│  ║                  └───────────┬─────────────────┘                       ║  │
│  ║                              ▼                                         ║  │
│  ║                  ┌─────────────────────────────┐                       ║  │
│  ║                  │  📤 SCHEDULED CONTENT       │                       ║  │
│  ║                  │  Ready for posting          │                       ║  │
│  ║                  └─────────────────────────────┘                       ║  │
│  ║                                                                        ║  │
│  ╚════════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  * Web scraper planned for Iteration 2 (automated data collection)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Business Success Metrics

| Metric | As-Is (Manual) | To-Be (AI Solution) | Improvement |
|--------|----------------|---------------------|-------------|
| **Time to create 1 post** | 2-3 hours | 2-5 minutes | **~95% reduction** |
| **Posts per week** | 0-1 (inconsistent) | 5-7 (daily capable) | **5-7x increase** |
| **Content variety** | Limited (owner's perspective only) | High (data-driven, multi-angle) | **Significant** |
| **Competitor awareness** | None | Real-time intel in knowledge base | **New capability** |
| **Brand consistency** | Variable | Consistent tone/style per platform | **Standardized** |
| **Owner time saved** | N/A | 5-10 hours/week | **Direct ROI** |

### Key Performance Indicators (KPIs)
1. **Efficiency**: Reduce content creation time by 90%+
2. **Consistency**: Enable daily posting capability across all platforms
3. **Quality**: Maintain or improve engagement rates with AI-generated content
4. **Scalability**: Handle unlimited knowledge base growth without additional effort

---

## 👤 Human-in-the-Loop Interrupts

Our solution intentionally includes **human checkpoints** at critical decision points:

### 1. Knowledge Base Curation (Agent 1 Output)
| Interrupt Point | Reason | User Action |
|-----------------|--------|-------------|
| After data ingestion | Verify AI categorization is accurate | Review categories, delete irrelevant items |
| Sensitive content | Ensure no competitor data is misrepresented | Flag or remove questionable entries |

### 2. Content Approval (Agent 2 Output)
| Interrupt Point | Reason | User Action |
|-----------------|--------|-------------|
| **Draft Review** | Every AI-generated post requires approval | ✓ Approve, ✗ Reject, or Edit |
| Tone verification | Ensure voice matches brand | Adjust tone settings, regenerate |
| Fact-checking | Verify promotions/prices are current | Edit before scheduling |

### Why Human-in-the-Loop Matters
- **Brand Protection**: AI can occasionally generate off-brand content
- **Accuracy**: Prices, promotions, and dates must be verified
- **Legal/Compliance**: Ensures no misleading claims are published
- **Quality Assurance**: Human judgment for nuance and timing

```
┌─────────────────────────────────────────────────────────────────┐
│              HUMAN-IN-THE-LOOP DECISION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    AI Generates Draft                                           │
│           │                                                      │
│           ▼                                                      │
│    ┌─────────────┐                                               │
│    │   Human     │                                               │
│    │   Reviews   │                                               │
│    └──────┬──────┘                                               │
│           │                                                      │
│     ┌─────┼─────┐                                                │
│     ▼     ▼     ▼                                                │
│   ┌───┐ ┌───┐ ┌───┐                                              │
│   │ ✓ │ │ ✎ │ │ ✗ │                                              │
│   │App│ │Edi│ │Rej│                                              │
│   │rov│ │ t │ │ect│                                              │
│   └─┬─┘ └─┬─┘ └─┬─┘                                              │
│     │     │     │                                                │
│     ▼     ▼     ▼                                                │
│  Schedule  Re-   Delete                                          │
│           generate                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Future Expansion Ideas

### 1. **Automated Web Scraping Agent** (Iteration 2 Full Implementation)
- Automatically scrape competitor websites (pricing changes, new offerings)
- Pull Google/Facebook reviews in real-time
- Monitor industry news and golf trends
- **Benefit**: Zero-touch data collection, always up-to-date knowledge base

### 2. **Direct Social Media API Integration**
- Connect to Instagram, Facebook, LinkedIn APIs
- Auto-publish approved content at optimal times
- Track engagement metrics (likes, comments, shares)
- A/B test different post variations
- **Benefit**: Complete automation from ideation to posting with analytics

### 3. **Comment Response Agent** (Agent 3)
- Monitor incoming comments/DMs across platforms
- AI-generated response suggestions
- Sentiment analysis for customer concerns
- Escalation workflow for negative feedback
- **Benefit**: 24/7 customer engagement without manual monitoring

---

## 🏗️ AWS Architecture (Production Implementation)

*For future production deployment, here's how the solution maps to AWS services:*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS PRODUCTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐         ┌─────────────────────────────────────────────┐   │
│   │   React     │         │              AWS CLOUD                       │   │
│   │   Frontend  │◀───────▶│                                              │   │
│   │  (Amplify)  │         │   ┌─────────────────────────────────────┐   │   │
│   └─────────────┘         │   │         API GATEWAY                  │   │   │
│                           │   └──────────────┬──────────────────────┘   │   │
│                           │                  │                           │   │
│                           │                  ▼                           │   │
│                           │   ┌─────────────────────────────────────┐   │   │
│                           │   │         STEP FUNCTIONS              │   │   │
│                           │   │    (Orchestrates Agent Workflow)    │   │   │
│                           │   └──────────────┬──────────────────────┘   │   │
│                           │                  │                           │   │
│                           │      ┌───────────┴───────────┐               │   │
│                           │      ▼                       ▼               │   │
│                           │   ┌──────────┐         ┌──────────┐         │   │
│                           │   │ Lambda   │         │ Lambda   │         │   │
│                           │   │ Agent 1  │         │ Agent 2  │         │   │
│                           │   │ Analyst  │         │ Creator  │         │   │
│                           │   └────┬─────┘         └────┬─────┘         │   │
│                           │        │                    │               │   │
│                           │        ▼                    ▼               │   │
│                           │   ┌─────────────────────────────────────┐   │   │
│                           │   │           BEDROCK                    │   │   │
│                           │   │     (Claude / Titan Models)          │   │   │
│                           │   └─────────────────────────────────────┘   │   │
│                           │                  │                           │   │
│                           │                  ▼                           │   │
│                           │   ┌─────────────────────────────────────┐   │   │
│                           │   │          DYNAMODB                    │   │   │
│                           │   │    (Knowledge Base Storage)          │   │   │
│                           │   └─────────────────────────────────────┘   │   │
│                           │                                              │   │
│                           │   ┌─────────────────────────────────────┐   │   │
│                           │   │          EVENTBRIDGE                 │   │   │
│                           │   │   (Scheduled Content Publishing)     │   │   │
│                           │   └─────────────────────────────────────┘   │   │
│                           │                                              │   │
│                           └──────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

AWS Service Mapping:
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Current Component  │ AWS Equivalent                                         │
├────────────────────┼────────────────────────────────────────────────────────┤
│ React App          │ AWS Amplify (hosting + CI/CD)                          │
│ Gemini API         │ Amazon Bedrock (Claude, Titan)                         │
│ Firebase Firestore │ DynamoDB (NoSQL database)                              │
│ Agent Orchestration│ AWS Step Functions (state machine)                     │
│ Agent 1 & 2 Logic  │ AWS Lambda (serverless functions)                      │
│ Scheduled Posts    │ EventBridge + Lambda                                   │
│ Authentication     │ Amazon Cognito                                         │
│ File Uploads       │ S3 (for JSON/media storage)                            │
└────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 🤖 Agent Design Canvases

### Agent 1: The Analyst

| Attribute | Description |
|-----------|-------------|
| **Agent Name** | Analyst Agent |
| **Role** | Data Ingestion & Categorization |
| **Goal** | Transform raw business data into structured, categorized knowledge |
| **Trigger** | User adds manual entry OR uploads JSON file |
| **Input** | Raw text (reviews, competitor info, business facts, promotions) |
| **Output** | `{ category: string, summary: string }` |
| **Categories** | Competitor Intel, Customer Sentiment, Business Feature, Event/Promo |
| **LLM** | Google Gemini 2.5 Flash |
| **Prompt Strategy** | Zero-shot classification with structured JSON output |
| **Storage** | Firebase Firestore → `knowledge_base` collection |
| **Human Oversight** | User can delete/edit categorized items |

**Prompt Template:**
```
You are a Data Analyst for Alta View Golf Club.
Analyze the following raw text input: "{rawText}"

1. Categorize it into exactly ONE of these buckets: 
   [Competitor Intel, Customer Sentiment, Business Feature, Event/Promo].
2. Write a 1-sentence clean summary of the key fact.

Return the result in this exact JSON format (no markdown):
{ "category": "...", "summary": "..." }
```

---

### Agent 2: The Creator

| Attribute | Description |
|-----------|-------------|
| **Agent Name** | Creator Agent |
| **Role** | Social Media Content Generation |
| **Goal** | Generate engaging, platform-specific posts using knowledge base context |
| **Trigger** | User clicks "Generate Content" button |
| **Input** | Platform, Tone, Topic (optional), Knowledge Base items |
| **Output** | Ready-to-post social media content with hashtags |
| **Platforms** | Instagram, Facebook, LinkedIn |
| **Tones** | Professional & Exciting, Casual & Fun, Urgent/Sales, Community |
| **LLM** | Google Gemini 2.5 Flash |
| **Prompt Strategy** | Context-aware generation with platform constraints |
| **Storage** | Firebase Firestore → `generated_content` collection |
| **Human Oversight** | **REQUIRED** - All drafts need approval before scheduling |

**Prompt Template:**
```
You are a social media manager for 'Alta View Indoor Golf Club'.

TONE: {tone}
PLATFORM: {platform}

Task: {taskInstruction}

CONTEXT DATA (Analyzed & Categorized):
{contextText}

Constraints:
- Include relevant hashtags.
- Keep it under 280 chars for Twitter, else ~100 words.
- Return ONLY the post text.
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Google Gemini API Key ([Get one free](https://aistudio.google.com/))

### Installation

```bash
cd altaview-social
npm install
```

### Setup API Key

Create a `.env` file in the `altaview-social` folder:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

### Run the App

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📂 Project Structure

```
altaview-social/
├── src/
│   ├── App.jsx          # Main application (Dashboard, KnowledgeBase, ContentGenerator)
│   ├── App.css          # Component styles
│   ├── index.css        # Tailwind imports
│   └── main.jsx         # React entry point
├── .env                 # API keys (gitignored)
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```

---

## 👥 Team

BYU MISM - AltaView Project Team

---

*Last Updated: December 2024*
