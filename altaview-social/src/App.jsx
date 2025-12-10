import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Database, 
  Bot, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Flag, 
  Globe, 
  FileText, 
  Instagram, 
  Facebook, 
  Linkedin,
  Loader2,
  Plus,
  Sparkles,
  BrainCircuit,
  Search,
  Zap,
  Pencil,
  Save,
  X,
  Image,
  ImagePlus,
  Upload
} from 'lucide-react';

// --- LANGCHAIN IMPORTS (OpenAI) ---
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAzi4Wc5wGBJnHmPhuXqwgDIx0uKds-4EE",
  authDomain: "altaview-social.firebaseapp.com",
  projectId: "altaview-social",
  storageBucket: "altaview-social.firebasestorage.app",
  messagingSenderId: "581643026310",
  appId: "1:581643026310:web:c2e28a7e9ddbcf7fa27607"
};

// LOAD API KEYS
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;

// --- WEB SEARCH TOOL (SerperDev) ---
const searchGolfNews = async (query) => {
  if (!SERPER_API_KEY) {
    console.warn("No SerperDev API key found!");
    return [];
  }
  
  console.log("🔍 Searching web for:", query);
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: 5 // Get top 5 results
      })
    });
    
    const data = await response.json();
    
    // Extract relevant info from search results
    const results = data.organic?.map(result => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    })) || [];
    
    console.log("🔍 Web search results:", results.length, "items found");
    return results;
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = "altaview-social";

// --- LANGCHAIN: Initialize OpenAI LLM ---
const getLLM = () => {
  if (!OPENAI_API_KEY) {
    console.warn("No OpenAI API key found! Make sure VITE_OPENAI_API_KEY is set in .env");
    return null;
  }
  console.log("Creating LangChain OpenAI LLM with API key...");
  return new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    model: "gpt-4o-mini",
    temperature: 0.7,
  });
};

// --- AGENT 1: The Analyst (Ingestion & Categorization) using LangChain ---
const analyzeAndCategorize = async (rawText) => {
  console.log("Agent 1 (LangChain) - Starting analysis for:", rawText.substring(0, 50) + "...");
  
  const llm = getLLM();
  if (!llm) {
    console.warn("LLM not initialized, using fallback");
    return { category: "Uncategorized", summary: rawText };
  }

  // LangChain PromptTemplate for structured output
  const analystPrompt = PromptTemplate.fromTemplate(`
You are a Data Analyst for Alta View Golf Club.
Analyze the following raw text input: "{rawText}"

1. Categorize it into exactly ONE of these buckets: [Competitor Intel, Customer Sentiment, Business Feature, Event/Promo].
2. Write a 1-sentence clean summary of the key fact.

Return the result in this exact JSON format (no markdown, no code blocks):
{{"category": "...", "summary": "..."}}
`);

  try {
    console.log("Agent 1 - Creating LangChain chain...");
    // Create LangChain chain: Prompt -> LLM -> Output Parser
    const chain = analystPrompt.pipe(llm).pipe(new StringOutputParser());
    
    console.log("Agent 1 - Invoking chain...");
    // Invoke the chain
    const result = await chain.invoke({ rawText });
    console.log("Agent 1 - Got result:", result);
    
    // Parse the JSON response
    const cleanJson = result.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Analyst Agent (LangChain) Error:", error);
    console.error("Error details:", error.message);
    return { category: "Raw Data", summary: rawText }; // Fallback if AI fails
  }
};

// --- AGENT 2: The Creator (Content Generation) using LangChain with Web Search Tool ---
const generateSocialPost = async (platform, contextItems, tone, specificTopic, promoMessage = "", enableWebSearch = false) => {
  const llm = getLLM();
  if (!llm) {
    alert("OpenAI API Key is missing. Please add VITE_OPENAI_API_KEY to your .env file.");
    return "Error: OpenAI API Key is missing.";
  }

  // --- ALWAYS use Knowledge Base, OPTIONALLY add Web Search ---
  
  // Build Knowledge Base context
  const knowledgeBaseData = contextItems.map(item => 
    `[${item.category || 'Info'}]: ${item.summary || item.content}`
  ).join('\n');
  
  // Optionally add Web Search context
  let webSearchData = "";
  if (enableWebSearch && SERPER_API_KEY) {
    console.log("🌐 Web Search enabled - fetching current golf news...");
    
    // Dynamic search queries when no topic specified
    const defaultSearches = [
      "golf news today December 2024",
      "indoor golf trends winter 2024",
      "golf simulator technology news",
      "Utah golf events December 2024",
      "golf tips winter practice",
      "PGA tour news this week",
      "golf holiday promotions 2024",
      "best indoor golf experiences",
      "golf fitness training tips",
      "golf gift ideas holiday season"
    ];
    
    // Build smart search query based on topic, or pick random default
    const searchQuery = specificTopic 
      ? `${specificTopic} golf news 2024`
      : defaultSearches[Math.floor(Math.random() * defaultSearches.length)];
    
    console.log("🔎 Search query:", searchQuery);
    const webResults = await searchGolfNews(searchQuery);
    
    if (webResults.length > 0) {
      webSearchData = webResults.map(r => `• ${r.title}: ${r.snippet}`).join('\n');
      console.log("✅ Web search results added to context");
    }
  }
  
  const taskInstruction = (specificTopic && specificTopic.trim() !== "")
    ? `Write a post specifically about: "${specificTopic}".`
    : `Choose the most compelling info from the data below.`;

  // Build promo instruction if provided
  const promoInstruction = (promoMessage && promoMessage.trim() !== "")
    ? `\n\nIMPORTANT - Include this promotion/message: "${promoMessage}"`
    : "";

  // Build web search section if available
  const webSearchSection = webSearchData 
    ? `\n\nCURRENT NEWS & TRENDS (from web search):\n${webSearchData}`
    : "";

  // LangChain PromptTemplate - combines Knowledge Base + optional Web Search
  const creatorPrompt = PromptTemplate.fromTemplate(`
You are a social media manager for 'Alta View Indoor Golf Club', a 24/7 indoor golf facility in Highland, Utah with Trackman simulators.

TONE: {tone}
PLATFORM: {platform}

Task:
{taskInstruction}
{promoInstruction}

YOUR BUSINESS KNOWLEDGE BASE:
{knowledgeBaseData}
{webSearchSection}

FORMATTING INSTRUCTIONS:
- Structure the post in 3 SEPARATE SECTIONS with blank lines between them:

  1. MAIN CONTENT (2-3 sentences about the topic with emojis)
  
  2. PROMO/CTA (if a discount/message was provided, make it stand out with emojis like 🌟 or 🎁)
  
  3. HASHTAGS (all hashtags on their own line at the end)

- Use emojis throughout to make it engaging
- Add blank lines between sections for readability
- Keep total length under 280 chars for Twitter, else ~100 words
- Return ONLY the formatted post text
`);

  try {
    // Create LangChain chain: Prompt -> LLM -> Output Parser
    const chain = creatorPrompt.pipe(llm).pipe(new StringOutputParser());
    
    // Invoke the chain
    const result = await chain.invoke({
      tone,
      platform,
      taskInstruction,
      promoInstruction,
      knowledgeBaseData,
      webSearchSection
    });
    
    return result || "Failed to generate content.";
  } catch (error) {
    console.error("Creator Agent (LangChain) Error:", error);
    return "Error connecting to AI service.";
  }
};

// --- DALL-E Image Generation ---
const generatePostImage = async (postContent, topic) => {
  if (!OPENAI_API_KEY) {
    console.warn("No OpenAI API key found for image generation");
    return null;
  }

  console.log("🎨 Generating image for post...");

  const imagePrompt = `Professional social media image for an indoor golf facility. ${topic ? `Theme: ${topic}.` : ''} Style: Modern, clean, high-quality photography style. Golf simulator, indoor golf bay, or golfer practicing. Warm lighting, premium feel. No text or logos.`;

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      })
    });

    const data = await response.json();
    
    if (data.data && data.data[0]?.url) {
      console.log("✅ Image generated successfully");
      return data.data[0].url;
    }
    
    console.error("Image generation failed:", data);
    return null;
  } catch (error) {
    console.error("DALL-E Error:", error);
    return null;
  }
};

// --- Components ---

const Header = ({ activeTab, setActiveTab }) => (
  <header className="bg-[#3D5A3D] text-white shadow-lg">
    <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center space-x-4 mb-4 md:mb-0">
        {/* Logo - white on green */}
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="text-white text-2xl font-serif tracking-tight">ALTA</span>
          <div className="mx-1">
            <Flag className="w-5 h-5 text-[#C5A048]" />
          </div>
          <span className="text-white text-2xl font-serif tracking-tight">VIEW</span>
        </button>
        <div className="hidden md:block h-6 w-px bg-white/30"></div>
        <p className="text-white/70 text-xs tracking-[0.15em] uppercase hidden md:block">Content Manager</p>
      </div>
      
      <nav className="flex space-x-1 bg-white/10 p-1 rounded-lg backdrop-blur">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'knowledge', label: 'Knowledge Base', icon: Database },
          { id: 'generator', label: 'AI Content', icon: Bot },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-[#C5A048] text-white font-medium shadow-sm' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon size={16} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  </header>
);

const Dashboard = () => (
  <div className="space-y-6 animate-fadeIn">
    {/* Welcome Banner - 30% olive green */}
    <div className="bg-[#3D5A3D] rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Welcome back</p>
          <h1 className="text-3xl font-serif">Alta View Content Manager</h1>
          <p className="text-white/70 mt-2">Manage your social media content with AI-powered tools</p>
        </div>
        <div className="hidden md:block">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#C5A048] rounded-full animate-pulse"></div>
              <span className="text-sm">All systems active</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Status Cards - 60% white background */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <Database className="w-5 h-5 text-black" />
          <span className="text-xs bg-[#3D5A3D]/10 text-black px-2 py-1 rounded-full">Ready</span>
        </div>
        <h3 className="font-medium text-black">Knowledge Base</h3>
        <p className="text-sm text-slate-500 mt-1">Firebase • Human-vetted</p>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <BrainCircuit className="w-5 h-5 text-black" />
          <span className="text-xs bg-[#C5A048]/10 text-[#C5A048] px-2 py-1 rounded-full">Active</span>
        </div>
        <h3 className="font-medium text-black">Agent 1: Analyst</h3>
        <p className="text-sm text-slate-500 mt-1">LangChain + OpenAI</p>
      </div>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <Bot className="w-5 h-5 text-[#C5A048]" />
          <span className="text-xs bg-[#C5A048]/10 text-[#C5A048] px-2 py-1 rounded-full">Active</span>
        </div>
        <h3 className="font-medium text-black">Agent 2: Creator</h3>
        <p className="text-sm text-slate-500 mt-1">LangChain + SerperDev</p>
      </div>
    </div>

    {/* How It Works - White with 10% gold accents */}
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
      <h2 className="text-xl font-medium text-black mb-6">How It Works</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 p-5 rounded-xl hover:border-[#3D5A3D]/30 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-[#3D5A3D] text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">1</div>
            <h3 className="font-medium text-black">Agent 1: The Analyst</h3>
          </div>
          <p className="text-sm text-[#C5A048] mb-3 font-medium">Data Ingestion & Categorization</p>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li>• Receives raw text, JSON, or CSV</li>
            <li>• Cleans and summarizes key facts</li>
            <li>• Auto-categorizes data type</li>
            <li>• Saves to Firebase knowledge base</li>
          </ul>
        </div>
        <div className="border border-slate-200 p-5 rounded-xl hover:border-[#C5A048]/50 transition-colors">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-[#C5A048] text-white rounded-lg flex items-center justify-center text-sm font-bold mr-3">2</div>
            <h3 className="font-medium text-black">Agent 2: The Creator</h3>
          </div>
          <p className="text-sm text-[#C5A048] mb-3 font-medium">Content Generation + Web Search</p>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li>• Reads knowledge base context</li>
            <li>• Optional live web search (SerperDev)</li>
            <li>• Multi-platform post generation</li>
            <li>• Human-in-the-loop approval</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const KnowledgeBase = ({ user, appId }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user, appId]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    setIsProcessing(true);
    setStatusMsg('Agent 1 (Analyst) is categorizing...');
    
    // Step 1: Call Analyst Agent
    const analysis = await analyzeAndCategorize(newItem);
    
    // Step 2: Save Structured Data
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'), {
        content: newItem, // Keep raw
        summary: analysis.summary, // Enriched
        category: analysis.category, // Tagged
        source: 'Manual Entry',
        type: 'internal',
        createdAt: serverTimestamp()
      });
      setNewItem('');
      setStatusMsg('');
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'knowledge_base', id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllItems = async () => {
    if (!window.confirm('Are you sure you want to delete ALL items from the Knowledge Base? This cannot be undone.')) {
      return;
    }
    try {
      for (const item of items) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'knowledge_base', item.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Parse CSV text into array of objects (handles quoted fields with commas)
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Function to parse a CSV line respecting quotes
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim()); // Push last field
      return result;
    };
    
    // Get headers from first row
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      const values = parseCSVLine(lines[i]);
      
        const row = {};
        headers.forEach((header, index) => {
        row[header] = (values[index] || '').replace(/"/g, '');
        });
        data.push(row);
    }
    return data;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset the input so the same file can be uploaded again
    const inputElement = event.target;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let dataArray = [];
        const fileContent = e.target.result;
        const fileName = file.name.toLowerCase();
        
        // Handle JSON files
        if (fileName.endsWith('.json')) {
          const json = JSON.parse(fileContent);
          dataArray = Array.isArray(json) ? json : [json];
        }
        // Handle CSV files - accepts ANY column names
        else if (fileName.endsWith('.csv')) {
          const csvData = parseCSV(fileContent);
          // Combine ALL columns into readable content for each row
          dataArray = csvData.map(row => {
            // Build content from all non-empty fields
            const entries = Object.entries(row)
              .filter(([key, value]) => value && value.trim()) // Only non-empty values
              .filter(([key, value]) => !key.includes('url') && !key.includes('image')) // Skip URL/image columns
              .map(([key, value]) => `${key}: ${value}`);
            
            return {
              content: entries.join(' | '),
              source: 'CSV Upload'
            };
          }).filter(item => item.content && item.content.trim().length > 10);
        }
        
        if (dataArray.length === 0) {
          setStatusMsg('Error: No valid data found in file');
          return;
        }

        setIsProcessing(true);
        setStatusMsg(`Analyst Agent processing ${dataArray.length} items...`);

        let processed = 0;
        for (const item of dataArray) {
          if (item.content && item.content.trim()) {
            // Analyst Agent runs on each item
            const analysis = await analyzeAndCategorize(item.content);
            
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'), {
              content: item.content,
              summary: analysis.summary,
              category: analysis.category,
              source: item.source || 'Uploaded File',
              type: 'external',
              createdAt: serverTimestamp()
            });
            processed++;
            setStatusMsg(`Processing ${processed}/${dataArray.length}...`);
          }
        }
        setStatusMsg(`✓ Processed ${processed} items successfully!`);
        setTimeout(() => setStatusMsg(''), 3000);
        setIsProcessing(false);
        inputElement.value = ''; // Reset file input
      } catch (err) {
        console.error(err);
        setStatusMsg('Error: Invalid file format');
        setIsProcessing(false);
        inputElement.value = ''; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#3D5A3D]">
            <h3 className="font-bold text-[#3D5A3D] mb-4 flex items-center">
              <BrainCircuit className="w-4 h-4 mr-2 text-[#3D5A3D]" />
              Agent 1: Ingestion
            </h3>
            
            <form onSubmit={handleManualAdd} className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase">Manual Input</label>
              <textarea
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Paste raw text here (e.g. 'Competitor X just raised prices to $50')..."
                className="w-full p-3 mt-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3D5A3D] outline-none h-24 resize-none"
              />
              <button 
                type="submit" 
                disabled={isProcessing}
                className="mt-2 w-full bg-[#3D5A3D] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#4a6b4a] transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Plus size={16} className="mr-2" />}
                Add & Analyze
              </button>
            </form>

            <div className="p-3 bg-[#3D5A3D]/5 rounded-lg border border-[#3D5A3D]/20">
              <label className="text-xs font-bold text-black uppercase">Batch Upload (JSON or CSV)</label>
              <input 
                type="file" 
                accept=".json,.csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3D5A3D] file:text-white hover:file:bg-[#4a6b4a]"
              />
              <p className="text-[10px] text-black/70 mt-2">
                Any CSV format works - all columns become context
              </p>
            </div>
            
            {statusMsg && (
              <div className="mt-4 p-3 bg-[#C5A048]/10 text-[#C5A048] text-xs rounded border border-[#C5A048]/30 flex items-center">
                <Loader2 className="animate-spin w-3 h-3 mr-2" />
                {statusMsg}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm min-h-[500px] border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#3D5A3D]">Knowledge Repository</h3>
            <div className="flex items-center gap-2">
              <span className="bg-[#3D5A3D]/10 text-black px-3 py-1 rounded-full text-xs font-bold">
              {items.length} Items
            </span>
              {items.length > 0 && (
                <button
                  onClick={deleteAllItems}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  Delete All
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {items.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Database className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No data ingested yet.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group flex items-start p-4 border border-slate-100 rounded-lg hover:border-[#C5A048]/50 transition-all bg-white shadow-sm">
                  <div className={`mt-1 w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                    item.category?.includes('Competitor') ? 'bg-red-400' : 'bg-[#3D5A3D]'
                  }`} />
                  <div className="flex-grow">
                    {/* Display the AI Generated Category */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black bg-[#3D5A3D]/10 px-2 py-0.5 rounded">
                        {item.category || 'Uncategorized'}
                      </span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{item.source}</span>
                    </div>
                    
                    {/* Display the AI Summary instead of raw content if available */}
                    <p className="text-black text-sm leading-relaxed">
                      {item.summary || item.content}
                    </p>
                    
                    {/* Show raw content on hover or if no summary */}
                    {item.summary && (
                      <p className="text-xs text-slate-400 mt-2 italic border-t border-slate-100 pt-2">
                        Original: "{item.content.substring(0, 100)}..."
                      </p>
                    )}

                    <div className="flex justify-end mt-2">
                       <button 
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentGenerator = ({ user, appId }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]); // No platforms selected by default
  const [tone, setTone] = useState('');
  const [topic, setTopic] = useState(''); 
  const [customTopic, setCustomTopic] = useState(''); // Custom topic input
  const [promoMessage, setPromoMessage] = useState(''); // NEW: Discount/promo message
  const [customPromo, setCustomPromo] = useState(''); // Custom promo input
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState([]);
  const [enableWebSearch, setEnableWebSearch] = useState(false); // Web search toggle
  const [contentTab, setContentTab] = useState('pending'); // 'pending' or 'posted'
  const [editingId, setEditingId] = useState(null); // Track which post is being edited
  const [editContent, setEditContent] = useState(''); // Temporary edit content
  const [platformFilter, setPlatformFilter] = useState('all'); // 'all', 'Instagram', 'Facebook', 'LinkedIn'
  const [enableImageGeneration, setEnableImageGeneration] = useState(false); // AI image generation toggle

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'generated_content'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sorted = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(sorted);
    });
    return () => unsubscribe();
  }, [user, appId]);

  const handleGenerate = async () => {
    if (!OPENAI_API_KEY) {
      alert("OpenAI API Key is missing. Check .env file.");
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform.");
      return;
    }
    
    setIsGenerating(true);
    
    let knowledgeDocs = [];
    try {
      const kbSnapshot = await new Promise((resolve, reject) => {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'));
        const unsub = onSnapshot(q, (snap) => {
          unsub(); 
          resolve(snap.docs.map(d => d.data()));
        }, reject);
      });
      knowledgeDocs = kbSnapshot;
    } catch (e) {
      console.error("Error fetching context", e);
    }

    // Get actual topic and promo values (use custom if selected)
    const actualTopic = topic === 'custom' ? customTopic : topic;
    const actualPromo = promoMessage === 'custom' ? customPromo : promoMessage;

    // Generate image once if enabled (shared across all platforms)
    let imageUrl = null;
    if (enableImageGeneration) {
      imageUrl = await generatePostImage(actualTopic, actualTopic);
    }

    // Generate a post for EACH selected platform
    for (const platform of selectedPlatforms) {
      const content = await generateSocialPost(platform, knowledgeDocs, tone, actualTopic, actualPromo, enableWebSearch);

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'generated_content'), {
          platform,
          content,
          status: 'Draft',
          createdAt: serverTimestamp(),
          tone: tone || 'Default',
          topic: actualTopic || 'General',
          promoMessage: actualPromo || null,
          webSearchEnabled: enableWebSearch,
          imageUrl: imageUrl || null
        });
      } catch (e) {
        console.error(e);
      }
    } // End of for loop
    
    setIsGenerating(false);
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', id), { status });
  };

  const deletePost = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', id));
  };

  const startEditing = (post) => {
    setEditingId(post.id);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', id), { 
      content: editContent 
    });
    setEditingId(null);
    setEditContent('');
  };

  const handleImageUpload = async (postId, file) => {
    if (!file) return;
    
    // Compress and resize image before storing
    const compressImage = (file, maxWidth = 800, quality = 0.7) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize if too large
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', postId), { 
        imageUrl: compressedImage 
      });
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Image is too large. Please try a smaller image.");
    }
  };

  const removeImage = async (postId) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', postId), { 
      imageUrl: null 
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#C5A048]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#3D5A3D] flex items-center">
                 <Bot className="w-5 h-5 mr-2 text-[#C5A048]" />
                 Agent 2: Creator
              </h3>
              <button
                onClick={() => {
                  setSelectedPlatforms([]);
                  setTone('');
                  setTopic('');
                  setCustomTopic('');
                  setPromoMessage('');
                  setCustomPromo('');
                  setEnableWebSearch(false);
                  setEnableImageGeneration(false);
                }}
                className="flex items-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
                title="Reset all settings"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reset
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Platforms <span className="text-[10px] font-normal text-slate-400">(select multiple)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Instagram', 'Facebook', 'LinkedIn'].map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelectedPlatforms(prev => 
                          prev.includes(p) 
                            ? prev.filter(x => x !== p) // Remove if already selected
                            : [...prev, p] // Add if not selected
                        );
                      }}
                      className={`py-2 px-1 rounded-lg text-sm border transition-all ${
                        selectedPlatforms.includes(p) 
                          ? 'border-[#C5A048] bg-[#C5A048]/10 text-[#C5A048] font-bold' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {selectedPlatforms.includes(p) && <span className="mr-1">✓</span>}
                      {p}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedPlatforms.length === 0 
                    ? "Select at least one platform" 
                    : `${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''} selected`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-[#C5A048] outline-none"
                >
                  <option value="">None</option>
                  <option>Professional & Exciting</option>
                  <option>Casual & Fun</option>
                  <option>Urgent / Sales-focused</option>
                  <option>Community & Welcoming</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic / Focus</label>
                <select 
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (e.target.value !== 'custom') setCustomTopic('');
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-[#C5A048] outline-none"
                >
                  <option value="">None</option>
                  <option value="Winter Golf">Winter Golf</option>
                  <option value="New Hitting Bays">New Hitting Bays</option>
                  <option value="Trackman Technology">Trackman Technology</option>
                  <option value="Private Bay Experience">Private Bay Experience</option>
                  <option value="24/7 Availability">24/7 Availability</option>
                  <option value="Golf Lessons">Golf Lessons</option>
                  <option value="League Play">League Play</option>
                  <option value="Corporate Events">Corporate Events</option>
                  <option value="Holiday Hours">Holiday Hours</option>
                  <option value="Gift Cards">Gift Cards</option>
                  <option value="custom">Custom...</option>
                </select>
                {topic === 'custom' && (
                  <textarea
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter your custom topic..."
                    className="w-full mt-2 p-2 border border-[#C5A048] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#C5A048] outline-none resize-none h-20"
                  />
                )}
              </div>

              {/* Promo/Discount Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Discount / Promo</label>
                <select 
                  value={promoMessage}
                  onChange={(e) => {
                    setPromoMessage(e.target.value);
                    if (e.target.value !== 'custom') setCustomPromo('');
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-[#C5A048] outline-none"
                >
                  <option value="">No promo</option>
                  <option value="20% off this Christmas season">20% off this Christmas season</option>
                  <option value="FREE 1-week trial in January">FREE 1-week trial in January</option>
                  <option value="Book now and get 1 hour free">Book now and get 1 hour free</option>
                  <option value="First session 50% off">First session 50% off</option>
                  <option value="Refer a friend, both get 20% off">Refer a friend, both get 20% off</option>
                  <option value="Student discount - 15% off with ID">Student discount - 15% off with ID</option>
                  <option value="Happy Hour: $10 off after 9pm">Happy Hour: $10 off after 9pm</option>
                  <option value="Gift cards available - perfect for the holidays">Gift cards available - perfect for the holidays</option>
                  <option value="New member special - join today">New member special - join today</option>
                  <option value="custom">Custom...</option>
                </select>
                {promoMessage === 'custom' && (
                  <textarea
                    value={customPromo}
                    onChange={(e) => setCustomPromo(e.target.value)}
                    placeholder="Enter your custom promo..."
                    className="w-full mt-2 p-2 border border-[#C5A048] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#C5A048] outline-none resize-none h-20"
                  />
                )}
              </div>

              {/* Web Search Toggle */}
              <div className="p-3 bg-[#3D5A3D]/5 rounded-lg border border-[#3D5A3D]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Search className="w-4 h-4 text-[#3D5A3D] mr-2" />
                    <label className="text-xs font-bold text-[#3D5A3D]">Web Search Tool</label>
                  </div>
                  <button
                    onClick={() => setEnableWebSearch(!enableWebSearch)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      enableWebSearch ? 'bg-[#3D5A3D]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow ${
                      enableWebSearch ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {enableWebSearch 
                    ? "🌐 Adds live web trends to your Knowledge Base" 
                    : "📚 Uses your Knowledge Base data only"}
                </p>
                {enableWebSearch && (
                  <div className="mt-2 flex items-center text-[10px] text-[#C5A048]">
                    <Zap className="w-3 h-3 mr-1" />
                    Powered by SerperDev
                  </div>
                )}
              </div>

              {/* AI Image Generation Toggle */}
              <div className="p-3 bg-[#C5A048]/5 rounded-lg border border-[#C5A048]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ImagePlus className="w-4 h-4 text-[#C5A048] mr-2" />
                    <label className="text-xs font-bold text-[#3D5A3D]">AI Image Generation</label>
                  </div>
                  <button
                    onClick={() => setEnableImageGeneration(!enableImageGeneration)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      enableImageGeneration ? 'bg-[#C5A048]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow ${
                      enableImageGeneration ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {enableImageGeneration 
                    ? "🎨 Creates a custom image for your post" 
                    : "📝 Text-only post (no image)"}
                </p>
                {enableImageGeneration && (
                  <div className="mt-2 flex items-center text-[10px] text-[#C5A048]">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Powered by DALL-E 3
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-[#C5A048] hover:bg-[#b08d3b] text-white py-3 px-4 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  {isGenerating ? (
                    <><Loader2 className="animate-spin mr-2" /> Agent 2 Working...</>
                  ) : (
                    <><Bot className="mr-2" /> Generate Content</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="lg:col-span-8 space-y-4">
          
          
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setContentTab('pending')}
                className={`flex items-center py-3 px-5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  contentTab === 'pending'
                    ? 'border-[#C5A048] text-[#C5A048]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Pending Approval
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  contentTab === 'pending' ? 'bg-[#C5A048] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {posts.filter(p => p.status === 'Draft' && (platformFilter === 'all' || p.platform === platformFilter)).length}
                </span>
              </button>
              <button
                onClick={() => setContentTab('posted')}
                className={`flex items-center py-3 px-5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  contentTab === 'posted'
                    ? 'border-[#3D5A3D] text-[#3D5A3D]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Posted
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  contentTab === 'posted' ? 'bg-[#3D5A3D] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {posts.filter(p => p.status === 'Posted' && (platformFilter === 'all' || p.platform === platformFilter)).length}
                </span>
              </button>
            </div>
            
            {/* Platform Filter */}
            <div className="flex items-center gap-1 pb-2">
              <span className="text-xs text-slate-400 mr-2">Platform:</span>
              {['all', 'Instagram', 'Facebook', 'LinkedIn'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => setPlatformFilter(platform)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    platformFilter === platform
                      ? 'bg-[#3D5A3D] text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {platform === 'all' ? 'All' : platform}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtered Posts */}
          {posts.filter(p => 
            (contentTab === 'pending' ? p.status === 'Draft' : p.status === 'Posted') &&
            (platformFilter === 'all' || p.platform === platformFilter)
          ).length === 0 ? (
            <div className="bg-[#3D5A3D]/5 rounded-xl border-2 border-dashed border-[#3D5A3D]/20 p-12 text-center text-slate-400">
              <p>{contentTab === 'pending' ? 'No posts pending approval.' : 'No posts have been approved yet.'}</p>
              <p className="text-sm">{platformFilter !== 'all' ? `No ${platformFilter} posts in this tab.` : (contentTab === 'pending' ? 'Generate content using the controls on the left.' : 'Approve pending posts to see them here.')}</p>
            </div>
          ) : (
            posts.filter(p => 
              (contentTab === 'pending' ? p.status === 'Draft' : p.status === 'Posted') &&
              (platformFilter === 'all' || p.platform === platformFilter)
            ).map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-[#C5A048]/50 transition-colors flex flex-col md:flex-row gap-6 animate-slideIn">
                <div className="flex-grow space-y-3">
                  <div className="flex items-center space-x-2 mb-2">
                    {post.platform === 'Instagram' && <Instagram size={16} className="text-pink-600" />}
                    {post.platform === 'Facebook' && <Facebook size={16} className="text-blue-600" />}
                    {post.platform === 'LinkedIn' && <Linkedin size={16} className="text-blue-700" />}
                    <span className="text-xs font-medium text-black uppercase">{post.platform}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.status === 'Draft' ? 'bg-[#C5A048]/10 text-[#C5A048]' :
                      post.status === 'Posted' ? 'bg-[#3D5A3D]/10 text-[#3D5A3D]' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {post.status === 'Draft' ? 'Pending' : post.status}
                    </span>
                  </div>
                  
                  {editingId === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 rounded-lg text-black text-sm border-2 border-[#C5A048] focus:ring-2 focus:ring-[#C5A048] outline-none min-h-[150px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(post.id)}
                          className="flex items-center px-3 py-1.5 bg-[#3D5A3D] text-white rounded-lg text-sm font-medium hover:bg-[#4a6b4a] transition-colors"
                        >
                          <Save size={14} className="mr-1" /> Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                        >
                          <X size={14} className="mr-1" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-lg text-black text-sm whitespace-pre-wrap border border-slate-100">
                    {post.content}
                  </div>
                  )}
                  
                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="relative group">
                      <img 
                        src={post.imageUrl} 
                        alt="Post image" 
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center">
                        {post.imageUrl.startsWith('data:') ? (
                          <><Upload className="w-3 h-3 mr-1" />Uploaded</>
                        ) : (
                          <><Sparkles className="w-3 h-3 mr-1" />AI Generated</>
                        )}
                      </div>
                      <button 
                        onClick={() => removeImage(post.id)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-200 text-[#3D5A3D] rounded-full hover:bg-slate-300 transition-colors"
                        title="Remove Image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div>Tone: <span className="text-black/70 italic">{post.tone}</span></div>
                    {post.topic && (
                      <div className="bg-[#3D5A3D]/10 px-2 py-1 rounded text-black">
                        Focus: {post.topic}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {post.status === 'Draft' && editingId !== post.id && (
                    <>
                      <button 
                        onClick={() => updateStatus(post.id, 'Posted')}
                        className="p-2 bg-[#3D5A3D]/10 text-[#3D5A3D] rounded-lg hover:bg-[#3D5A3D]/20 transition-colors"
                        title="Approve Post"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => startEditing(post)}
                        className="p-2 bg-[#C5A048]/10 text-[#C5A048] rounded-lg hover:bg-[#C5A048]/20 transition-colors"
                        title="Edit Post"
                      >
                        <Pencil size={20} />
                      </button>
                      <label 
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        title={post.imageUrl ? "Replace Image" : "Upload Image"}
                      >
                        <Upload size={20} />
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(post.id, e.target.files[0])}
                        />
                      </label>
                      <button 
                         onClick={() => deletePost(post.id)}
                         className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                         title="Delete"
                      >
                        <XCircle size={20} />
                      </button>
                    </>
                  )}
                  {post.status === 'Posted' && editingId !== post.id && (
                    <>
                      <button 
                        onClick={() => startEditing(post)}
                        className="p-2 bg-[#C5A048]/10 text-[#C5A048] rounded-lg hover:bg-[#C5A048]/20 transition-colors"
                        title="Edit Post"
                      >
                        <Pencil size={20} />
                      </button>
                      <label 
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        title={post.imageUrl ? "Replace Image" : "Upload Image"}
                      >
                        <Upload size={20} />
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(post.id, e.target.files[0])}
                        />
                      </label>
                     <button 
                       onClick={() => updateStatus(post.id, 'Draft')}
                        className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium"
                        title="Move to Pending"
                     >
                       Revert
                     </button>
                    <button 
                      onClick={() => deletePost(post.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete"
                    >
                        <XCircle size={20} />
                    </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Auth Flow: Simple anonymous sign-in for local dev
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900 selection:bg-[#C5A048] selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'knowledge' && <KnowledgeBase user={user} appId={appId} />}
        {activeTab === 'generator' && <ContentGenerator user={user} appId={appId} />}
      </main>
      
      <footer className="py-6 bg-[#3D5A3D] text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-1 mb-3 md:mb-0">
              <span className="text-white text-lg font-serif">ALTA</span>
              <Flag className="w-4 h-4 text-[#C5A048]" />
              <span className="text-white text-lg font-serif">VIEW</span>
              <span className="text-white/50 text-xs ml-2">Content Manager</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <span>Highland, Utah</span>
              <span>•</span>
              <a href="https://www.altaviewgolf.com" target="_blank" rel="noopener noreferrer" 
                 className="hover:text-[#C5A048] transition-colors">
                altaviewgolf.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}