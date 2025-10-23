import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Send, MessageSquare, Users } from 'lucide-react';

export default function ClassAnnouncements({ classId }) {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const listRef = useRef(null);

  const canPost = user?.role === 'teacher' || user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!classId) {
        setError(t('no-class-selected'));
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`/api/announcements/class/${classId}`);
        if (!mounted) return;
        // API returns newest first; reverse to show oldest at top
        const list = Array.isArray(res.data) ? res.data.slice().reverse() : [];
        setItems(list);
      } catch (e) {
        console.error('Failed to load announcements', e);
        if (mounted) {
          const status = e?.response?.status;
          const dataMsg = e?.response?.data?.message || e?.response?.data || e.message;
          setError(t('failed-to-load-announcements'));
          setErrorDetail(`status:${status || 'n/a'} message:${dataMsg}`);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [classId, t]);

  useEffect(() => {
    // scroll to bottom when items change
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
      // append to items
      setItems(prev => [...prev, res.data]);
      setMessage('');
      // scroll into view after posting
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 50);
    } catch (e) {
      console.error('Failed to post announcement', e);
      setError(t('failed-to-post-announcement'));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      post();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-[480px] md:h-[640px]">
      <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('announcements')}</h3>
              <div className="text-xs text-indigo-100 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {t('class')}
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-xs font-medium text-white">
              {loading ? t('loading') : `${items.length}`}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={listRef} className="flex-1 overflow-auto p-6 space-y-4">
          {loading && (
            <div className="flex justify-center items-center h-full">
              <div className="animate-pulse text-sm text-gray-400">{t('loading')}</div>
            </div>
          )}
          
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{t('no-announcements')}</p>
              <div className="text-xs text-gray-400 mt-2">classId: <span className="font-mono">{classId || 'n/a'}</span></div>
              {errorDetail && <div className="text-xs text-red-400 mt-2">{errorDetail}</div>}
            </div>
          )}

          {items.map((it, idx) => {
            const mine = it.authorId === user?._id;
            const showAvatar = idx === 0 || items[idx - 1].authorId !== it.authorId;
            
            return (
              <div key={it._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                <div className={`flex gap-2 max-w-[85%] ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      mine 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}>
                      {it.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs font-semibold text-gray-700">{it.authorName}</span>
                        <span className="text-[10px] text-gray-400">{formatTime(it.createdAt)}</span>
                      </div>
                    )}
                    
                    <div 
                      className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                        mine 
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm hover:shadow-md'
                      }`}
                    >
                      <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                        {it.message}
                      </div>
                    </div>
                    
                    {!showAvatar && (
                      <div className={`text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                        mine ? 'text-right mr-2' : 'text-left ml-2'
                      }`}>
                        {formatTime(it.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area - only for teachers/managers/admins */}
        {canPost ? (
          <div className="px-4 py-4 border-t border-gray-200 bg-white">
            {error && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('write-announcement')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 min-h-[48px] max-h-[120px]"
                  rows="1"
                  style={{ 
                    height: 'auto',
                    minHeight: '48px'
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-gray-400">
                  {message.length > 0 && `${message.length}`}
                </div>
              </div>
              
              <button 
                onClick={post}
                disabled={!message.trim()}
                className={`px-5 py-3 rounded-2xl flex items-center gap-2 transition-all duration-200 font-medium text-sm shadow-lg ${
                  message.trim()
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl transform hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{t('post')}</span>
              </button>
            </div>
            
            <div className="mt-2 text-[10px] text-gray-400 text-center">
              Press Enter to send • Shift + Enter for new line
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500 text-center">
            {t('only-teachers-can-post') || 'Only teachers can post announcements.'}
          </div>
        )}
      </div>
    </div>
  );
}