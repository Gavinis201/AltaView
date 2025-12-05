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
  BrainCircuit
} from 'lucide-react';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAzi4Wc5wGBJnHmPhuXqwgDIx0uKds-4EE",
  authDomain: "altaview-social.firebaseapp.com",
  projectId: "altaview-social",
  storageBucket: "altaview-social.firebasestorage.app",
  messagingSenderId: "581643026310",
  appId: "1:581643026310:web:c2e28a7e9ddbcf7fa27607"
};

// LOAD API KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = "altaview-social";

// --- AGENT 1: The Analyst (Ingestion & Categorization) ---
// This agent runs immediately when data is added. It organizes the raw text.
const analyzeAndCategorize = async (rawText) => {
  if (!GEMINI_API_KEY) return { category: "Uncategorized", summary: rawText };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `
    You are a Data Analyst for Alta View Golf Club.
    Analyze the following raw text input: "${rawText}"
    
    1. Categorize it into exactly ONE of these buckets: [Competitor Intel, Customer Sentiment, Business Feature, Event/Promo].
    2. Write a 1-sentence clean summary of the key fact.

    Return the result in this exact JSON format (no markdown):
    { "category": "...", "summary": "..." }
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Simple parsing (removing code blocks if AI adds them)
    const cleanJson = textRes.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Analyst Agent Error:", error);
    return { category: "Raw Data", summary: rawText }; // Fallback if AI fails
  }
};

// --- AGENT 2: The Creator (Content Generation) ---
// This agent uses the analyzed data to write the final post.
const generateSocialPost = async (platform, contextItems, tone, specificTopic) => {
  if (!GEMINI_API_KEY) {
    alert("Gemini API Key is missing. Please check your .env file.");
    return "Error: Gemini API Key is missing.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

  // NOTE: We now use the "summary" and "category" fields from Agent 1!
  const contextText = contextItems.map(item => 
    `[${item.category || 'Info'}]: ${item.summary || item.content}`
  ).join('\n');
  
  let taskInstruction = "";
  if (specificTopic && specificTopic.trim() !== "") {
    taskInstruction = `Write a post specifically about: "${specificTopic}".`;
  } else {
    taskInstruction = `Choose the most compelling info from the Context Data below.`;
  }

  const prompt = `
    You are a social media manager for 'Alta View Indoor Golf Club'.
    
    TONE: ${tone}
    PLATFORM: ${platform}
    
    Task:
    ${taskInstruction}

    CONTEXT DATA (Analyzed & Categorized):
    ${contextText}

    Constraints:
    - Include relevant hashtags.
    - Keep it under 280 chars for Twitter, else ~100 words.
    - Return ONLY the post text.
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate content.";
  } catch (error) {
    console.error("Creator Agent Error:", error);
    return "Error connecting to AI service.";
  }
};

// --- Components ---

const Header = ({ activeTab, setActiveTab }) => (
  <header className="bg-slate-900 text-white shadow-lg">
    <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center space-x-3 mb-4 md:mb-0">
        <div className="bg-[#C5A048] p-2 rounded-lg">
          <Flag className="w-6 h-6 text-white fill-current" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider">ALTAVIEW</h1>
          <p className="text-xs text-[#C5A048] tracking-widest uppercase">Indoor Golf Club</p>
        </div>
      </div>
      
      <nav className="flex space-x-1 bg-slate-800 p-1 rounded-xl">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'knowledge', label: 'Knowledge Base', icon: Database },
          { id: 'generator', label: 'AI Content', icon: Bot },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-[#C5A048] text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <item.icon size={16} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  </header>
);

const Dashboard = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#C5A048]">
        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">Project Status</h3>
        <p className="text-2xl font-bold text-slate-800">Iteration 3</p>
        <p className="text-sm text-slate-600 mt-1">Multi-Agent System Active</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-slate-600">
        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">Analyst Agent</h3>
        <p className="text-2xl font-bold text-slate-800">Active</p>
        <p className="text-sm text-slate-600 mt-1">Ingests & Categorizes Data</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
        <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">Creator Agent</h3>
        <p className="text-2xl font-bold text-slate-800">Active</p>
        <p className="text-sm text-slate-600 mt-1">Generates Final Posts</p>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Problem Statement</h2>
      <p className="text-lg text-slate-600 leading-relaxed">
        Alta View Golf Club lacks a consistent social media process. 
        This solution leverages a <strong>Multi-Agent AI Architecture</strong> to automate the flow from raw data ingestion to final content creation.
      </p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-slate-800 mb-3 flex items-center">
            <BrainCircuit className="w-5 h-5 mr-2 text-blue-500" />
            Agent 1: The Analyst
          </h3>
          <p className="text-sm text-slate-600 mb-2">Running on Data Ingestion</p>
          <ul className="space-y-2 text-slate-600 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
            <li className="flex items-start">1. Receives raw JSON or manual text.</li>
            <li className="flex items-start">2. Cleans and summarizes the key facts.</li>
            <li className="flex items-start">3. Tags data (e.g., "Competitor Intel").</li>
            <li className="flex items-start">4. Saves structured knowledge to DB.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 mb-3 flex items-center">
            <Bot className="w-5 h-5 mr-2 text-[#C5A048]" />
            Agent 2: The Creator
          </h3>
          <p className="text-sm text-slate-600 mb-2">Running on Content Generation</p>
          <ul className="space-y-2 text-slate-600 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
            <li className="flex items-start">1. Reads structured context from DB.</li>
            <li className="flex items-start">2. Matches platform and tone settings.</li>
            <li className="flex items-start">3. Drafts platform-specific posts.</li>
            <li className="flex items-start">4. Submits for human approval.</li>
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const dataArray = Array.isArray(json) ? json : [json];

        setIsProcessing(true);
        setStatusMsg(`Analyst Agent processing ${dataArray.length} items...`);

        for (const item of dataArray) {
          if (item.content) {
            // Analyst Agent runs on each item
            const analysis = await analyzeAndCategorize(item.content);
            
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'knowledge_base'), {
              content: item.content,
              summary: analysis.summary,
              category: analysis.category,
              source: item.source || 'Uploaded JSON',
              type: 'external',
              createdAt: serverTimestamp()
            });
          }
        }
        setStatusMsg('Batch processing complete.');
        setTimeout(() => setStatusMsg(''), 3000);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        setStatusMsg('Error: Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <BrainCircuit className="w-4 h-4 mr-2 text-blue-500" />
              Agent 1: Ingestion
            </h3>
            
            <form onSubmit={handleManualAdd} className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase">Manual Input</label>
              <textarea
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Paste raw text here (e.g. 'Competitor X just raised prices to $50')..."
                className="w-full p-3 mt-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              />
              <button 
                type="submit" 
                disabled={isProcessing}
                className="mt-2 w-full bg-slate-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Plus size={16} className="mr-2" />}
                Add & Analyze
              </button>
            </form>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <label className="text-xs font-bold text-blue-700 uppercase">Batch Upload (JSON)</label>
              <input 
                type="file" 
                accept=".json"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="mt-2 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
            </div>
            
            {statusMsg && (
              <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100 flex items-center">
                <Loader2 className="animate-spin w-3 h-3 mr-2" />
                {statusMsg}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Knowledge Repository</h3>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
              {items.length} Items
            </span>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {items.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Database className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No data ingested yet.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="group flex items-start p-4 border border-slate-100 rounded-lg hover:border-blue-200 transition-all bg-white shadow-sm">
                  <div className={`mt-1 w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                    item.category?.includes('Competitor') ? 'bg-red-400' : 'bg-emerald-400'
                  }`} />
                  <div className="flex-grow">
                    {/* Display the AI Generated Category */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {item.category || 'Uncategorized'}
                      </span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{item.source}</span>
                    </div>
                    
                    {/* Display the AI Summary instead of raw content if available */}
                    <p className="text-slate-700 text-sm font-medium leading-relaxed">
                      {item.summary || item.content}
                    </p>
                    
                    {/* Show raw content on hover or if no summary */}
                    {item.summary && (
                      <p className="text-xs text-slate-400 mt-2 italic border-t border-slate-50 pt-2">
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
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('Professional & Exciting');
  const [topic, setTopic] = useState(''); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState([]);

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
    if (!GEMINI_API_KEY) {
      alert("Gemini API Key is missing. Check .env file.");
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

    const content = await generateSocialPost(platform, knowledgeDocs, tone, topic);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'generated_content'), {
        platform,
        content,
        status: 'Draft',
        createdAt: serverTimestamp(),
        tone,
        topic: topic || 'General' 
      });
    } catch (e) {
      console.error(e);
    }
    
    setIsGenerating(false);
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', id), { status });
  };

  const deletePost = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'generated_content', id));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-[#C5A048]">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center">
               <Bot className="w-5 h-5 mr-2 text-[#C5A048]" />
               Agent 2: Creator
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Instagram', 'Facebook', 'LinkedIn'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`py-2 px-1 rounded-lg text-sm border ${
                        platform === p 
                          ? 'border-[#C5A048] bg-[#C5A048]/10 text-[#C5A048] font-bold' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-[#C5A048] outline-none"
                >
                  <option>Professional & Exciting</option>
                  <option>Casual & Fun</option>
                  <option>Urgent / Sales-focused</option>
                  <option>Community & Welcoming</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic / Focus (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Winter League, New Simulators..."
                    className="w-full p-2 pl-9 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C5A048] outline-none"
                  />
                  <Sparkles className="absolute left-2.5 top-2.5 text-[#C5A048] w-4 h-4" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Leave blank for a random post.</p>
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
          <h3 className="font-bold text-slate-800 mb-2 flex justify-between items-center">
            <span>Content Pipeline</span>
            <span className="text-xs font-normal bg-slate-200 px-2 py-1 rounded text-slate-600">Iteration 3 Output</span>
          </h3>
          
          {posts.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
              <p>No content generated yet.</p>
              <p className="text-sm">Configure the settings on the left to start.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 animate-slideIn">
                <div className="flex-grow space-y-3">
                  <div className="flex items-center space-x-2 mb-2">
                    {post.platform === 'Instagram' && <Instagram size={16} className="text-pink-600" />}
                    {post.platform === 'Facebook' && <Facebook size={16} className="text-blue-600" />}
                    {post.platform === 'LinkedIn' && <Linkedin size={16} className="text-blue-700" />}
                    <span className="text-xs font-bold text-slate-500 uppercase">{post.platform}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      post.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
                      post.status === 'Scheduled' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm whitespace-pre-wrap font-medium border border-slate-100">
                    {post.content}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div>Tone: <span className="text-slate-500 italic">{post.tone}</span></div>
                    {post.topic && (
                      <div className="bg-slate-100 px-2 py-1 rounded text-slate-500">
                        Focus: {post.topic}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {post.status === 'Draft' && (
                    <>
                      <button 
                        onClick={() => updateStatus(post.id, 'Scheduled')}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors tooltip-trigger"
                        title="Approve & Schedule"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                         onClick={() => deletePost(post.id)}
                         className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                         title="Reject & Delete"
                      >
                        <XCircle size={20} />
                      </button>
                    </>
                  )}
                  {post.status === 'Scheduled' && (
                     <button 
                       onClick={() => updateStatus(post.id, 'Draft')}
                       className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors text-xs font-medium"
                     >
                       Revert
                     </button>
                  )}
                  {post.status !== 'Draft' && (
                    <button 
                      onClick={() => deletePost(post.id)}
                      className="p-2 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-[#C5A048] selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'knowledge' && <KnowledgeBase user={user} appId={appId} />}
        {activeTab === 'generator' && <ContentGenerator user={user} appId={appId} />}
      </main>
      
      <footer className="py-8 text-center text-slate-400 text-xs">
        <p>Alta View Golf Club • AI Content Project</p>
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