import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Send, Plus, MessageSquare, Trash2, Bot, User, Loader2
} from 'lucide-react';

const STARTER_PROMPTS = [
  'BCS প্রিলিমিনারি পরীক্ষার কৌশল কী?',
  'বাংলাদেশের মুক্তিযুদ্ধ সম্পর্কে গুরুত্বপূর্ণ তথ্য কী?',
  'ইংরেজি ব্যাকরণের কোন বিষয়গুলো BCS-এ বেশি আসে?',
  'সাম্প্রতিক আন্তর্জাতিক ঘটনাবলী কীভাবে পড়বো?',
  'গণিতের কোন অধ্যায়গুলো BCS প্রিলিতে বেশি গুরুত্বপূর্ণ?',
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-[#2d6a4f]' : 'bg-[#1e3a5f]'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed font-bengali ${
        isUser
          ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        {message.content}
      </div>
    </div>
  );
}

export default function Tutor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [streamingMsg, setStreamingMsg] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Sessions list
  const { data: sessions = [] } = useQuery({
    queryKey: ['tutor-sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('tutor_sessions').select('*')
        .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Messages for active session
  const { data: messages = [] } = useQuery({
    queryKey: ['tutor-messages', activeSessionId],
    enabled: !!activeSessionId,
    queryFn: async () => {
      const { data } = await supabase.from('tutor_messages').select('*')
        .eq('session_id', activeSessionId).order('created_at', { ascending: true });
      return data || [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMsg]);

  // Create new session
  const createSession = useMutation({
    mutationFn: async (title) => {
      const { data, error } = await supabase.from('tutor_sessions')
        .insert({ user_id: user.id, title: title || 'নতুন আলোচনা' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (session) => {
      setActiveSessionId(session.id);
      qc.invalidateQueries(['tutor-sessions', user?.id]);
    },
  });

  // Delete session
  const deleteSession = useMutation({
    mutationFn: async (sessionId) => {
      await supabase.from('tutor_sessions').delete().eq('id', sessionId);
    },
    onSuccess: (_, sessionId) => {
      if (activeSessionId === sessionId) setActiveSessionId(null);
      qc.invalidateQueries(['tutor-sessions', user?.id]);
    },
  });

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || isStreaming) return;

    let sessionId = activeSessionId;

    // Auto-create session if none active
    if (!sessionId) {
      const { data: newSession, error } = await supabase.from('tutor_sessions')
        .insert({ user_id: user.id, title: content.slice(0, 50) })
        .select().single();
      if (error) { toast.error('আলোচনা শুরু করতে সমস্যা হয়েছে।'); return; }
      sessionId = newSession.id;
      setActiveSessionId(newSession.id);
      qc.invalidateQueries(['tutor-sessions', user?.id]);
    }

    setInput('');
    setIsStreaming(true);
    setStreamingMsg('');

    // Save user message
    await supabase.from('tutor_messages').insert({ session_id: sessionId, role: 'user', content });
    qc.invalidateQueries(['tutor-messages', sessionId]);

    // Call AI tutor function
    try {
      const res = await fetch('/.netlify/functions/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('AI সাড়া দেয়নি।');
      const data = await res.json();
      const reply = data.reply || 'দুঃখিত, উত্তর দেওয়া সম্ভব হয়নি।';

      // Save assistant reply
      await supabase.from('tutor_messages').insert({ session_id: sessionId, role: 'assistant', content: reply });

      // Update session updated_at
      await supabase.from('tutor_sessions').update({ updated_at: new Date().toISOString(), title: content.slice(0, 50) })
        .eq('id', sessionId);
    } catch (err) {
      const errMsg = err.message || 'সংযোগ সমস্যা হয়েছে।';
      await supabase.from('tutor_messages').insert({ session_id: sessionId, role: 'assistant', content: errMsg });
    } finally {
      setIsStreaming(false);
      setStreamingMsg('');
      qc.invalidateQueries(['tutor-messages', sessionId]);
      qc.invalidateQueries(['tutor-sessions', user?.id]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <Helmet>
        <title>AI টিউটর | শব্দকোষ নিউজ</title>
        <meta name="description" content="BCS পরীক্ষার জন্য AI টিউটরের সাথে আলোচনা করুন। যেকোনো বিষয়ে প্রশ্ন করুন।" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] flex gap-4">
        {/* Sidebar: sessions */}
        <div className="w-64 shrink-0 hidden md:flex flex-col gap-3">
          <button onClick={() => createSession.mutate('')}
            className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl text-sm font-bengali transition">
            <Plus className="w-4 h-4" /> নতুন আলোচনা
          </button>

          <div className="flex-1 overflow-y-auto space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 font-bengali">কোনো আলোচনা নেই</p>
            ) : sessions.map(s => (
              <div key={s.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                  activeSessionId === s.id ? 'bg-[#1e3a5f] text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveSessionId(s.id)}>
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bengali flex-1 truncate">{s.title}</span>
                <button onClick={e => { e.stopPropagation(); deleteSession.mutate(s.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 hover:text-red-600 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 font-bengali">BCS AI টিউটর</p>
              <p className="text-xs text-gray-400 font-bengali">যেকোনো প্রশ্ন করুন</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                  <Bot className="w-16 h-16 text-[#1e3a5f]/20 mx-auto mb-3" />
                  <p className="text-gray-500 font-bengali">BCS ও চাকরির প্রস্তুতি নিয়ে যেকোনো প্রশ্ন করুন</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                  {STARTER_PROMPTS.map(p => (
                    <button key={p} onClick={() => sendMessage(p)}
                      className="text-left text-sm px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 font-bengali transition border border-gray-100">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                {isStreaming && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="আপনার প্রশ্ন লিখুন... (Enter পাঠাতে, Shift+Enter নতুন লাইন)"
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] font-bengali"
                style={{ maxHeight: '120px' }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || isStreaming}
                className="w-11 h-11 bg-[#1e3a5f] hover:bg-[#163050] text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 shrink-0">
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 font-bengali">
              AI ভুল তথ্য দিতে পারে। গুরুত্বপূর্ণ বিষয়ে যাচাই করুন।
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
