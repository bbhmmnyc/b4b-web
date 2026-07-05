import { BACKEND_URL } from '@/config';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Send, MapPin, Clock, Wifi, WifiOff, AtSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function getWsUrl() {
  const backendUrl = BACKEND_URL || '';
  return backendUrl.replace(/^http/, 'ws');
}

export default function CommentSection({ postId }) {
  const { user, token, API } = useApp();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [guestCountry, setGuestCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const textareaRef = useRef(null);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionStartIdx, setMentionStartIdx] = useState(-1);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/posts/${postId}/comments`);
      setComments(res.data);
    } catch (e) {
      console.error(e);
    }
  }, [API, postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // WebSocket
  useEffect(() => {
    const wsUrl = `${getWsUrl()}/api/ws/comments/${postId}`;
    let ws;
    let pingInterval;
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => {
          setWsConnected(true);
          pingInterval = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send('ping'); }, 25000);
        };
        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_comment' && data.comment) {
              setComments(prev => {
                if (prev.some(c => c.id === data.comment.id)) return prev;
                return [data.comment, ...prev];
              });
            }
          } catch (e) {}
        };
        ws.onclose = () => { setWsConnected(false); clearInterval(pingInterval); setTimeout(connect, 3000); };
        ws.onerror = () => { setWsConnected(false); ws.close(); };
      } catch (e) { setWsConnected(false); }
    };
    connect();
    return () => { clearInterval(pingInterval); if (ws) ws.close(); };
  }, [postId]);

  // @mention search
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setMentionResults([]);
      setShowMentionPopup(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/users/search`, { params: { q: mentionQuery, post_id: postId, limit: 6 } });
        setMentionResults(res.data);
        setShowMentionPopup(res.data.length > 0);
        setSelectedMentionIdx(0);
      } catch (e) {
        setMentionResults([]);
        setShowMentionPopup(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [mentionQuery, API, postId]);

  const handleContentChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    // Detect @mention trigger
    const textBeforeCursor = val.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionStartIdx(cursorPos - atMatch[0].length);
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery('');
      setShowMentionPopup(false);
      setMentionStartIdx(-1);
    }
  };

  const insertMention = (userName) => {
    const before = content.substring(0, mentionStartIdx);
    const after = content.substring(mentionStartIdx + mentionQuery.length + 1); // +1 for @
    const newContent = `${before}@${userName} ${after}`;
    setContent(newContent);
    setShowMentionPopup(false);
    setMentionQuery('');
    setMentionStartIdx(-1);
    // Focus textarea and place cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + userName.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (showMentionPopup && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx(prev => (prev + 1) % mentionResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[selectedMentionIdx].name);
      } else if (e.key === 'Escape') {
        setShowMentionPopup(false);
      }
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!content.trim()) return;

  const isGuest = !user;

  if (isGuest && (!guestName.trim() || !guestCity.trim())) {
    setSubmitting(false);
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      content: content.trim(),
      author_name: user ? user.name : guestName.trim(),
      author_city: user ? user.city : guestCity.trim(),
      author_country: user ? user.country : (guestCountry.trim() || 'Unknown'),
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    await axios.post(`${API}/posts/${postId}/comments`, payload, { headers });

    setContent('');
    setGuestName('');
    setGuestCity('');
    setGuestCountry('');
    onCommentPosted();
  } catch {
    toast.error('Failed to post comment');
  }

  setSubmitting(false);
};

  // Render comment text with highlighted @mentions
  const renderCommentContent = (text) => {
    const parts = text.split(/(@\w[\w\s]*?)(?=\s|$|[.,!?])/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-semibold text-[#3D6B8E] bg-[#3D6B8E]/10 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div data-testid="comment-section">
      <div className="flex items-center gap-3 mb-8">
        <h3 className="font-heading font-bold text-xl text-[#1A1A1A]">
          Discussion ({comments.length})
        </h3>
        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 ${wsConnected ? 'text-brand-green' : 'text-brand-grey'}`} data-testid="ws-status">
          {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {wsConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-10 bg-white border border-[#E5E5E5] p-5" data-testid="comment-form">
        {!user && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Input placeholder="Your name *" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="bg-[#FDFCF8] border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="comment-guest-name" />
            <Input placeholder="City *" value={guestCity} onChange={(e) => setGuestCity(e.target.value)} className="bg-[#FDFCF8] border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="comment-guest-city" />
            <Input placeholder="Country" value={guestCountry} onChange={(e) => setGuestCountry(e.target.value)} className="bg-[#FDFCF8] border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none" data-testid="comment-guest-country" />
          </div>
        )}

        {/* Textarea with @mention popup */}
        <div className="relative mb-3">
          <textarea
            ref={textareaRef}
            placeholder="Share your thoughts... Type @ to mention someone"
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            rows={3}
            className="w-full bg-[#FDFCF8] border border-[#E5E5E5] focus:border-[#1A1A1A] focus:outline-none rounded-none p-3 text-sm resize-none"
            data-testid="comment-content"
          />

          {/* @mention autocomplete popup */}
          {showMentionPopup && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-[#E5E5E5] shadow-lg z-50 max-h-64 overflow-y-auto" data-testid="mention-popup">
              <div className="px-3 py-1.5 border-b border-[#E5E5E5] bg-[#FDFCF8]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-grey flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> Mention a user
                </span>
              </div>
              {mentionResults.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => insertMention(u.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#FDFCF8] transition-colors ${i === selectedMentionIdx ? 'bg-[#3D6B8E]/8' : ''}`}
                  data-testid={`mention-option-${u.id}`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#3D6B8E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{u.name}</p>
                    {u.city && <p className="text-[10px] text-brand-grey">{u.city}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-brand-grey">
              {user ? `Posting as ${user.name}` : 'Posting as guest'}
            </p>
            <span className="text-[10px] text-brand-grey flex items-center gap-1">
              <AtSign className="w-3 h-3" /> Type @ to mention
            </span>
          </div>
          <Button
            type="submit"
            disabled={submitting || !content.trim()}
            className="bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold uppercase tracking-widest text-xs transition-colors"
            data-testid="comment-submit-btn"
          >
            <Send className="w-3.5 h-3.5 mr-2" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-px bg-[#E5E5E5]">
        {comments.map(comment => (
          <div key={comment.id} className="bg-[#FDFCF8] p-5" data-testid={`comment-${comment.id}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {comment.author_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-[#1A1A1A]">{comment.author_name}</span>
                  <span className="flex items-center gap-1 text-xs text-brand-grey">
                    <MapPin className="w-3 h-3" />
                    {comment.author_city}, {comment.author_country}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-brand-grey">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {comment.is_guest && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-grey border border-[#E5E5E5] px-2 py-0.5">guest</span>
                  )}
                </div>
                <p className="text-sm text-[#404040] leading-relaxed">
                  {renderCommentContent(comment.content)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {comments.length === 0 && (
        <div className="text-center py-12 text-brand-grey" data-testid="no-comments">
          <p className="text-sm">No comments yet. Be the first to share your perspective!</p>
        </div>
      )}
    </div>
  );
}
