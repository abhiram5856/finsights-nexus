import { useState, useRef, useEffect } from 'react';
import { Bot, X, MessageSquare, Send, Loader2, ImagePlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Nexus, your AI financial advisor. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.replace('data:', '').replace(/^.+,/, '');
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const currentImage = imageBase64;
    setImageBase64(null);
    
    // Show image locally in the chat feed
    const displayMsg = currentImage 
        ? <div className="flex flex-col gap-2"><span>{userMessage}</span><img src={`data:image/jpeg;base64,${currentImage}`} alt="upload" className="w-32 rounded-md"/></div> 
        : userMessage;

    setMessages((prev) => [...prev, { role: 'user', content: displayMsg }]);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { prompt: userMessage, image_base64: currentImage });
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the Nexus core.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`mb-4 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
      >
        {/* Header */}
        <div className="bg-[var(--accent-primary)] p-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <span className="font-bold">Nexus AI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            let isChart = false;
            let chartData = null;
            let contentStr = "";
            
            if (msg.role === 'assistant' && typeof msg.content === 'string') {
              try {
                // The AI might wrap the JSON in markdown code blocks
                const cleanContent = msg.content.replace(/```json/g, '').replace(/```/g, '').trim();
                if (cleanContent.startsWith('{') && cleanContent.includes('"type": "chart"')) {
                  const parsed = JSON.parse(cleanContent);
                  if (parsed.type === 'chart') {
                    isChart = true;
                    chartData = parsed;
                  }
                } else {
                  contentStr = msg.content;
                }
              } catch (e) {
                contentStr = msg.content;
              }
            }
            
            return (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[90%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white rounded-tr-none' : 'bg-[var(--bg-primary)] text-[var(--text-main)] border border-[var(--border-color)] rounded-tl-none'}`}
                >
                  {isChart && chartData ? (
                    <div className="w-[250px] sm:w-[300px] h-48 flex flex-col gap-2">
                      <div className="font-bold text-center text-[var(--accent-primary)]">{chartData.symbol} - {chartData.data.length} Day Price History</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.data}>
                          <XAxis dataKey="date" hide />
                          <YAxis domain={['auto', 'auto']} width={40} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                          <Tooltip contentStyle={{backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '8px'}} />
                          <Line type="monotone" dataKey="price" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    msg.role === 'user' ? msg.content : <div className="whitespace-pre-wrap">{contentStr || msg.content}</div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={16} />
                <span className="text-sm text-[var(--text-muted)]">Nexus is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          {imageBase64 && (
            <div className="mb-2 relative inline-block">
              <img src={`data:image/jpeg;base64,${imageBase64}`} alt="preview" className="h-16 rounded-md border border-[var(--border-color)]" />
              <button type="button" onClick={() => setImageBase64(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
            </div>
          )}
          <div className="relative flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
            >
              <ImagePlus size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nexus or upload a chart..."
              className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 pl-4 pr-12 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-shadow"
            />
            <button 
              type="submit" 
              disabled={loading || (!input.trim() && !imageBase64)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--accent-primary)] text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[var(--accent-primary)] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center ${isOpen ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`}
      >
        <MessageSquare size={28} />
      </button>
    </div>
  );
}
