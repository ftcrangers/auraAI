import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  MessageSquare, Plus, Lock, Globe, Sparkles, Settings, Trash2, 
  ChevronLeft, ChevronRight, Moon, Sun, User, Bot, Send, Shield, 
  Brain, RefreshCw, Zap, Lightbulb, Bookmark, CheckCircle2, Eye, EyeOff,
  Edit3, Compass, Flame, Radio, Atom, Cpu, Star, Check
} from 'lucide-react';

// Initialize Gemini Client
const apiKey = ""; // Canvas provides runtime API key when empty
const ai = new GoogleGenAI({ apiKey });

// Suggested AI Names with emblems
const AI_NAME_SUGGESTIONS = [
  { name: 'Aether', desc: 'Ethereal & highly intelligent', icon: Sparkles, gradient: 'from-blue-500 via-indigo-500 to-purple-500' },
  { name: 'Nova', desc: 'Bright, fast & versatile', icon: Flame, gradient: 'from-amber-500 via-rose-500 to-purple-600' },
  { name: 'Nexus', desc: 'Connected & analytical', icon: Atom, gradient: 'from-cyan-500 via-teal-500 to-emerald-500' },
  { name: 'Solis', desc: 'Warm, clear & intuitive', icon: Star, gradient: 'from-orange-400 via-amber-500 to-yellow-500' },
  { name: 'Lyra', desc: 'Creative, articulate & sharp', icon: Compass, gradient: 'from-pink-500 via-purple-500 to-indigo-500' },
  { name: 'Kairo', desc: 'Focused, strategic & precise', icon: Cpu, gradient: 'from-violet-600 via-indigo-600 to-blue-600' }
];

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(true);

  // Assistant Naming & Emblem State
  const [aiConfig, setAiConfig] = useState({
    name: 'Aether',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    tagline: 'Personalized AI Intelligence'
  });

  const [showNameModal, setShowNameModal] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mode State: Sync vs Private
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // Chat Sessions State
  const [chats, setChats] = useState([
    {
      id: 'default-1',
      title: 'Welcome Session',
      isPrivate: false,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'm1',
          sender: 'assistant',
          text: "Hello! I'm **Aether**, your personalized AI assistant.\n\nI adapt to your workflow in **Sync Mode**, or keep conversations strictly ephemeral in **Private Mode**. How can I assist you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState('default-1');

  // Input & Streaming State
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Memory & Preferences State
  const [userPreferences, setUserPreferences] = useState({
    name: 'User',
    favoriteTopics: ['Artificial Intelligence', 'Software Architecture'],
    preferredStyle: 'Concise & Structured',
    keyInsights: ['Prefers direct answers with clean markdown layout.']
  });

  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, currentChatId, isLoading]);

  const currentChat = chats.find(c => c.id === currentChatId) || chats[0];

  // Switch or create new chat
  const handleNewChat = (privateMode = isPrivateMode) => {
    const newChat = {
      id: `chat-${Date.now()}`,
      title: privateMode ? 'Private Session' : 'New Session',
      isPrivate: privateMode,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'assistant',
          text: privateMode 
            ? `🔒 **Private Mode Active.** Sessions are isolated. ${aiConfig.name} will not record conversations or save memory profiles.` 
            : `✨ **Sync Mode Active.** ${aiConfig.name} remembers preferences and tailors responses to your profile.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (currentChatId === id && updated.length > 0) {
      setCurrentChatId(updated[0].id);
    } else if (updated.length === 0) {
      handleNewChat();
    }
  };

  // Preference Extraction Function using Gemini API
  const extractUserPreferences = async (userMessage) => {
    try {
      const prompt = `Analyze this user message for personal preferences, interests, or tone choices. 
Extract key insights into JSON format without extra commentary.
User message: "${userMessage}"
Current memory profile: ${JSON.stringify(userPreferences)}

Return JSON with format:
{
  "newTopics": ["topic1"],
  "newInsights": ["insight description"]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (res.text) {
        const parsed = JSON.parse(res.text);
        let updated = false;

        const updatedTopics = [...userPreferences.favoriteTopics];
        if (parsed.newTopics && Array.isArray(parsed.newTopics)) {
          parsed.newTopics.forEach(topic => {
            if (topic && !updatedTopics.includes(topic)) {
              updatedTopics.push(topic);
              updated = true;
            }
          });
        }

        const updatedInsights = [...userPreferences.keyInsights];
        if (parsed.newInsights && Array.isArray(parsed.newInsights)) {
          parsed.newInsights.forEach(insight => {
            if (insight && !updatedInsights.includes(insight)) {
              updatedInsights.push(insight);
              updated = true;
            }
          });
        }

        if (updated) {
          setUserPreferences(prev => ({
            ...prev,
            favoriteTopics: updatedTopics.slice(-8),
            keyInsights: updatedInsights.slice(-10)
          }));
        }
      }
    } catch (err) {
      console.log('Preference extraction skipped:', err);
    }
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsgText = textToSend.trim();
    setInputText('');

    const userMessage = {
      id: `m-usr-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const newTitle = chat.messages.length <= 1 ? (userMsgText.slice(0, 24) + (userMsgText.length > 24 ? '...' : '')) : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, userMessage]
        };
      }
      return chat;
    }));

    setIsLoading(true);

    let systemInstruction = `You are ${aiConfig.name}, an exceptionally smart, elegant, and responsive AI assistant inspired by modern AI models like Gemini and Claude. Speak clearly, concisely, and use formatted Markdown with bold titles and code blocks where helpful. Always identify yourself as ${aiConfig.name}.`;

    if (!isPrivateMode) {
      systemInstruction += `\n\n[USER SYNCED MEMORY CONTEXT]
- Preferred Name: ${userPreferences.name}
- Response Style Preference: ${userPreferences.preferredStyle}
- User Interests: ${userPreferences.favoriteTopics.join(', ')}
- Known Preferences & Insights: ${userPreferences.keyInsights.join(' | ')}
*Use these insights subtly to personalize your responses and recommendations.*`;
    } else {
      systemInstruction += `\n\n[PRIVATE MODE]
You are operating in Incognito / Private mode. Do NOT refer to prior history outside this conversation or record user details. Keep responses helpful, crisp, and objective.`;
    }

    try {
      const activeChat = chats.find(c => c.id === currentChatId);
      const historyParts = (activeChat ? activeChat.messages : []).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      historyParts.push({
        role: 'user',
        parts: [{ text: userMsgText }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: historyParts,
        config: {
          systemInstruction: systemInstruction
        }
      });

      const assistantReply = response.text || "I'm sorry, I couldn't process that request properly.";

      const assistantMessage = {
        id: `m-ast-${Date.now()}`,
        sender: 'assistant',
        text: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage]
          };
        }
        return chat;
      }));

      if (!isPrivateMode) {
        extractUserPreferences(userMsgText);
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Connection Error**: Unable to reach ${aiConfig.name} services right now. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: [...chat.messages, errorMessage] };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTopic = () => {
    if (newTopicInput.trim() && !userPreferences.favoriteTopics.includes(newTopicInput.trim())) {
      setUserPreferences(prev => ({
        ...prev,
        favoriteTopics: [...prev.favoriteTopics, newTopicInput.trim()]
      }));
      setNewTopicInput('');
    }
  };

  const applyCustomName = (name, gradient = 'from-indigo-500 via-purple-500 to-pink-500') => {
    const finalName = name.trim() || 'Aether';
    setAiConfig({
      name: finalName,
      gradient,
      tagline: `${finalName} AI Companion`
    });
    setShowNameModal(false);
    setCustomNameInput('');
  };

  return (
    <div className={`flex h-screen w-full font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Naming / AI Customization Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold text-lg">Name Your Assistant</h3>
              </div>
              <button onClick={() => setShowNameModal(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-400 mt-3 mb-4">
              Select a curated name suggestion or enter your own custom brand identity.
            </p>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {AI_NAME_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.name}
                  onClick={() => applyCustomName(sug.name, sug.gradient)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    aiConfig.name === sug.name 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : darkMode ? 'border-slate-800 bg-slate-800/40 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-tr ${sug.gradient} flex items-center justify-center text-white shrink-0 mt-0.5`}>
                    <sug.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1">
                      {sug.name}
                      {aiConfig.name === sug.name && <Check className="h-3 w-3 text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">{sug.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Or enter a custom name:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Orion, Sol, Jarvis"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm bg-transparent focus:outline-none ${
                    darkMode ? 'border-slate-700 text-slate-100' : 'border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  onClick={() => applyCustomName(customNameInput)}
                  disabled={!customNameInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-all duration-300 md:static ${
        sidebarOpen ? 'w-72' : 'w-0 md:w-20'
      } ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-transparent">
          {sidebarOpen && (
            <div className="flex items-center justify-between w-full pr-1">
              <div className="flex items-center space-x-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr ${aiConfig.gradient} text-white shadow-md`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className={`text-xl font-bold bg-gradient-to-r ${aiConfig.gradient} bg-clip-text text-transparent`}>
                  {aiConfig.name}
                </span>
              </div>
              <button 
                onClick={() => setShowNameModal(true)}
                className="p-1 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50"
                title="Change AI Name"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-slate-800/50 transition-colors ${!sidebarOpen ? 'mx-auto' : ''}`}
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Action Controls */}
        <div className="px-3 py-2 space-y-2">
          <button
            onClick={() => handleNewChat(isPrivateMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border font-medium transition-all shadow-sm ${
              darkMode 
                ? 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 text-slate-100' 
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
            } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
          >
            <Plus className="h-5 w-5 text-indigo-400" />
            {sidebarOpen && <span>New Chat</span>}
          </button>

          {/* Sync vs Private Toggle Button */}
          <button
            onClick={() => {
              const nextMode = !isPrivateMode;
              setIsPrivateMode(nextMode);
              handleNewChat(nextMode);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              isPrivateMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
            } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
            title={isPrivateMode ? "Switch to Synced Memory Mode" : "Switch to Incognito / Private Chat"}
          >
            {isPrivateMode ? (
              <>
                <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                {sidebarOpen && <span>Private Mode (Active)</span>}
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 shrink-0 text-indigo-400" />
                {sidebarOpen && <span>Sync Mode (Active)</span>}
              </>
            )}
          </button>
        </div>

        {/* Chat History List */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Conversations
            </div>
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setIsPrivateMode(chat.isPrivate);
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all ${
                  chat.id === currentChatId
                    ? darkMode ? 'bg-slate-800 text-indigo-300 font-medium' : 'bg-indigo-50 text-indigo-700 font-medium'
                    : darkMode ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {chat.isPrivate ? (
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-indigo-400 shrink-0" />
                  )}
                  <span className="truncate">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title="Delete Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Memory Profile Drawer Button */}
        {sidebarOpen && (
          <div className="p-3 border-t border-slate-800/60">
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${
                darkMode ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span>Memory Profile ({userPreferences.favoriteTopics.length} topics)</span>
              </div>
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            </button>
          </div>
        )}

        {/* Footer Settings & Theme Switch */}
        <div className="p-3 border-t border-slate-800/60 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-semibold text-xs text-white">
                  {userPreferences.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{userPreferences.name}</span>
                  <span className="text-[10px] text-slate-500">{isPrivateMode ? 'Incognito' : 'Memory Synced'}</span>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="mx-auto p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Header Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-6 z-10 ${
          darkMode ? 'bg-slate-950/80 border-slate-800/80 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-base flex items-center gap-2">
              <span>{currentChat?.title || 'Chat'}</span>
              {currentChat?.isPrivate ? (
                <span className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="h-3 w-3" /> Private Mode
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Globe className="h-3 w-3" /> Synced Profile
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNameModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Name: {aiConfig.name}</span>
            </button>
            <button
              onClick={() => setShowMemoryPanel(!showMemoryPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                showMemoryPanel 
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                  : darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Brain className="h-3.5 w-3.5 text-purple-400" />
              <span>Memory</span>
            </button>
          </div>
        </header>

        {/* Layout with Chat & Memory Drawer */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Chat Messages Section */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl mx-auto w-full">
              {currentChat?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${aiConfig.gradient} flex items-center justify-center text-white shrink-0 shadow-md`}>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`group relative max-w-[82%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : darkMode
                        ? 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>
                    <div className={`text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                    }`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {userPreferences.name[0]}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 items-center">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${aiConfig.gradient} flex items-center justify-center text-white shrink-0 animate-pulse`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                    darkMode ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'
                  }`}>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    {aiConfig.name} is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {currentChat?.messages.length <= 2 && (
              <div className="max-w-4xl mx-auto w-full px-4 mb-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Suggest daily routine", icon: Zap, text: `Suggest an optimized daily routine based on my preferences.` },
                    { label: "Analyze preferences", icon: Brain, text: `What preferences have you learned about me so far?` },
                    { label: "Draft clear email", icon: Sparkles, text: `Draft a concise email asking for a project update.` },
                    { label: "Brainstorm app ideas", icon: Lightbulb, text: `Brainstorm 5 sleek ideas for modern web applications.` }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.text)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between h-20 ${
                        darkMode 
                          ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-300' 
                          : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700'
                      }`}
                    >
                      <item.icon className="h-4 w-4 text-indigo-400 mb-1" />
                      <span className="font-medium line-clamp-2">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Input Area */}
            <div className="p-4 max-w-4xl mx-auto w-full">
              <div className={`relative rounded-2xl border p-2 shadow-lg transition-all ${
                isPrivateMode 
                  ? 'border-amber-500/40 bg-slate-900/90 focus-within:border-amber-500' 
                  : darkMode 
                    ? 'border-slate-800 bg-slate-900/90 focus-within:border-indigo-500' 
                    : 'border-slate-300 bg-white focus-within:border-indigo-500'
              }`}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isPrivateMode ? `Ask ${aiConfig.name} anything (Private Mode - No memory sync)...` : `Ask ${aiConfig.name} anything (Sync Mode active)...`}
                  rows={2}
                  className="w-full bg-transparent resize-none px-3 py-1.5 text-sm focus:outline-none placeholder:text-slate-500"
                />

                <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-800/40">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {isPrivateMode ? (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Shield className="h-3 w-3" /> Incognito isolation active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-indigo-400">
                        <Sparkles className="h-3 w-3" /> Dynamic memory synced
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isLoading}
                    className={`p-2 rounded-xl transition-all ${
                      inputText.trim() && !isLoading
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-center text-[11px] text-slate-500 mt-2">
                {aiConfig.name} can personalize answers using stored preferences in Sync Mode.
              </div>
            </div>
          </div>

          {/* User Memory & Insights Drawer (Right Panel) */}
          {showMemoryPanel && (
            <div className={`w-80 border-l flex flex-col h-full overflow-y-auto p-5 transition-all ${
              darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <h2 className="font-semibold text-sm">Memory & Preferences</h2>
                </div>
                <button 
                  onClick={() => setShowMemoryPanel(false)}
                  className="p-1 hover:text-slate-400 text-slate-500"
                >
                  ✕
                </button>
              </div>

              {/* Personalization Details */}
              <div className="py-4 space-y-5 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={userPreferences.name}
                    onChange={(e) => setUserPreferences({ ...userPreferences, name: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border bg-transparent font-medium focus:outline-none ${
                      darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Preferred Response Tone</label>
                  <select
                    value={userPreferences.preferredStyle}
                    onChange={(e) => setUserPreferences({ ...userPreferences, preferredStyle: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border bg-transparent font-medium focus:outline-none ${
                      darkMode ? 'border-slate-700 text-slate-200 bg-slate-900' : 'border-slate-300 text-slate-800 bg-white'
                    }`}
                  >
                    <option value="Concise & Structured">Concise & Structured</option>
                    <option value="Friendly & Detailed">Friendly & Detailed</option>
                    <option value="Technical & Precise">Technical & Precise</option>
                    <option value="Creative & Expressive">Creative & Expressive</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-2">Tracked Topics & Interests</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {userPreferences.favoriteTopics.map((topic, i) => (
                      <span 
                        key={i} 
                        className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add topic manually..."
                      value={newTopicInput}
                      onChange={(e) => setNewTopicInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                      className={`flex-1 px-2.5 py-1 rounded-lg border text-xs bg-transparent focus:outline-none ${
                        darkMode ? 'border-slate-700' : 'border-slate-300'
                      }`}
                    />
                    <button
                      onClick={handleAddTopic}
                      className="px-2 py-1 bg-indigo-600 text-white rounded-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-2">Auto-Learned Insights</label>
                  <div className="space-y-2">
                    {userPreferences.keyInsights.map((insight, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                          darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    💡 Memory insights are updated live during Sync Mode conversations with {aiConfig.name}.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
