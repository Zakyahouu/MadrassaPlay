import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Send, MessageSquare, Paperclip, MoreVertical, CheckCheck, FileText, Download, User } from 'lucide-react';

export default function ClassAnnouncements({ classId, classData, className = '' }) {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  const canPost = user?.role === 'teacher' || user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!classId) return;
      setLoading(true);
      try {
        const res = await axios.get(`/api/announcements/class/${classId}`);
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data.slice().reverse() : [];
        setItems(list);
      } catch (e) {
        console.error('Failed to load announcements', e);
        if (mounted) setError(t.failedToLoadAnnouncements);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [classId, t]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [items]);

  const post = async () => {
    if (!message.trim()) return;
    setError(null);
    const payload = { classId, message: message.trim() };
    try {
      const res = await axios.post('/api/announcements', payload);
      setItems(prev => [...prev, res.data]);
      setMessage('');
    } catch (e) {
      console.error('Failed to post announcement', e);
      setError(t.failedToPostAnnouncement);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      post();
    }
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return t.today || 'Today';
    if (isSameDay(date, yesterday)) return t.yesterday || 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className={`flex flex-col bg-white relative ${className || 'h-[600px]'}`}>
      {/* Header - Clean White */}
      <div className="bg-white px-5 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            {classData?.name || t.announcements}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span>{classData?.enrolledStudents?.length || 0} Students</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/20">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
            <MessageSquare className="w-10 h-10 mb-2 opacity-5" />
            <p className="text-xs font-medium">No announcements yet</p>
          </div>
        )}

        {items.map((it, idx) => {
          const mine = it.authorId === user?._id;
          const showDateHeader = idx === 0 || !isSameDay(items[idx - 1].createdAt, it.createdAt);

          return (
            <div key={it._id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {showDateHeader && (
                <div className="flex justify-center my-4">
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border border-gray-200/50">
                    {formatDateHeader(it.createdAt)}
                  </span>
                </div>
              )}

              <div className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''} group`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm ring-1 ring-inset ${mine
                    ? 'bg-primary text-white ring-primary/20'
                    : 'bg-white text-gray-600 ring-gray-200'
                    }`}>
                    {it.authorName?.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {/* Name & Time */}
                  <div className={`flex items-center gap-2 mb-1 px-0.5 ${mine ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-bold text-gray-900">{mine ? t.you || 'You' : it.authorName}</span>
                    <span className="text-[10px] text-gray-400">{formatTime(it.createdAt)}</span>
                  </div>

                  {/* Message Bubble - Reduced Roundness */}
                  <div className={`px-4 py-2.5 rounded-xl shadow-sm text-sm leading-relaxed border ${mine
                    ? 'bg-primary/5 text-gray-900 border-primary/10 rounded-tr-none'
                    : 'bg-white text-gray-900 border-gray-100 rounded-tl-none'
                    }`}>
                    {/* Mock Attachment */}
                    {it.message.toLowerCase().includes('practice') && (
                      <div className="mb-2 p-2 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-2.5 w-full sm:min-w-[240px]">
                        <div className="w-8 h-8 bg-red-50 rounded-md flex items-center justify-center flex-shrink-0 text-red-500">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate">Worksheet.pdf</p>
                          <p className="text-[10px] text-gray-500">2.4 MB</p>
                        </div>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white transition-colors">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words">{it.message}</div>
                  </div>

                  {/* Status (Mock) */}
                  <div className={`flex items-center gap-1 mt-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
                    <CheckCheck className={`w-3 h-3 ${mine ? 'text-primary' : 'text-gray-300'}`} />
                    <span className="text-[10px] text-gray-400 font-medium">
                      {Math.floor(Math.random() * 20 + 5)} reads
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-2" />
      </div>

      {/* Input Area - Integrated & Clean */}
      {canPost ? (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          {error && (
            <div className="mb-2 px-3 py-1.5 bg-red-50 text-red-600 text-[11px] rounded-lg border border-red-100 flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="text-red-400 text-base leading-none">×</button>
            </div>
          )}
          <div className="relative group">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.writeAnnouncement || "Communicate with the group..."}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm p-3 pr-12 min-h-[50px] max-h-[120px] resize-none"
              rows="1"
              style={{ height: 'auto' }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Attach">
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={post}
                disabled={!message.trim()}
                className={`p-1.5 rounded-lg transition-all ${message.trim() ? 'bg-primary text-white shadow-sm hover:scale-105' : 'text-gray-300 cursor-not-allowed'
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between px-1 mt-1.5">
            <p className="text-[10px] text-gray-400 font-medium">Enter to send • Shift+Enter for new line</p>
            <div className="flex gap-2">
              <span className="text-[10px] text-gray-300 font-bold tracking-tighter cursor-default hover:text-gray-400 uppercase serif">B</span>
              <span className="text-[10px] text-gray-300 font-bold italic tracking-tighter cursor-default hover:text-gray-400 uppercase serif ml-1">I</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center text-[11px] text-gray-400 font-medium">
          {t.onlyTeachersCanPost || "Only teachers can send announcements."}
        </div>
      )}
    </div>
  );
}