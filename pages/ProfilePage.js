import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Palette, PenLine, MessageCircle, Heart, Eye, MapPin, Clock, ArrowRight, ChevronDown, ChevronUp, Send, X, Wifi, Users, UserPlus, UserCheck, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const COLOR_OPTIONS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Green', value: '#22C55E' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Yellow', value: '#FACC15' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Amber', value: '#D97706' },
  { label: 'Rose', value: '#F43F5E' },
];

function ColorPicker({ label, value, onChange, testId }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-[#FDFCF8] transition-colors text-sm font-medium"
        data-testid={testId}
      >
        <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: value }} />
        <Palette className="w-3.5 h-3.5 text-brand-grey" />
        <span className="text-brand-grey">{label}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-none shadow-sm border border-[#E5E5E5] p-3 z-50 w-56" data-testid={`${testId}-dropdown`}>
          <div className="grid grid-cols-6 gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.value}
                onClick={() => { onChange(c.value); setOpen(false); }}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${value === c.value ? 'border-gray-900 scale-110' : 'border-gray-200'}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
                data-testid={`color-${c.label.toLowerCase()}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getWsUrl() {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  return backendUrl.replace(/^http/, 'ws');
}

function DiscussionThread({ post, onClose }) {
  const { user, token, API } = useApp();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/posts/${post.id}/comments/live`);
      setComments(res.data);
    } catch (e) {
      console.error(e);
    }
  }, [API, post.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // WebSocket for real-time
  useEffect(() => {
    const wsUrl = `${getWsUrl()}/api/ws/comments/${post.id}`;
    let ws;
    let pingInterval;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => {
          setWsConnected(true);
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
          }, 25000);
        };
        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_comment' && data.comment) {
              setComments(prev => {
                if (prev.some(c => c.id === data.comment.id)) return prev;
                return [...prev, data.comment];
              });
              // Auto-scroll to bottom
              setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
            }
          } catch (e) {}
        };
        ws.onclose = () => { setWsConnected(false); clearInterval(pingInterval); setTimeout(connect, 3000); };
        ws.onerror = () => { setWsConnected(false); ws.close(); };
      } catch (e) { setWsConnected(false); }
    };
    connect();
    return () => { clearInterval(pingInterval); if (ws) ws.close(); };
  }, [post.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
    await axios.post(`${API}/posts/${post.id}/comments`, {
  content: newComment.trim(),
  author_name: user.name,
  author_city: user.city,
  author_country: user.country,
}, {
  headers: { Authorization: `Bearer ${token}` }
});
      setNewComment('');
      // Don't refetch - WebSocket will deliver the new comment
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
      <DialogHeader className="p-5 pb-3 border-b border-[#E5E5E5]">
        <DialogTitle className="font-heading font-bold text-lg leading-snug pr-8">
          {post.title}
        </DialogTitle>
        <div className="flex items-center gap-2 text-xs text-brand-grey mt-1">
          <MapPin className="w-3 h-3" />
          <span>{post.author_name} — {post.author_city}, {post.author_country}</span>
          {wsConnected && (
            <span className="flex items-center gap-1 text-green-500 ml-auto">
              <Wifi className="w-3 h-3" /> Live
            </span>
          )}
        </div>
      </DialogHeader>

      {/* Chat-style comments */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-[#FDFCF8]/50" data-testid="discussion-thread">
        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No discussion yet. Start the conversation!
          </div>
        )}
        {comments.map(c => {
          const isMe = user && c.author_name === user.name;
          return (
            <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`} data-testid={`thread-msg-${c.id}`}>
              <div className={`max-w-[75%] rounded-none px-4 py-2.5 ${isMe ? 'bg-black text-white rounded-br-md' : 'bg-white border border-gray-200 rounded-bl-md'}`}>
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold" style={{ color: isMe ? '#A5B4FC' : '#3B82F6' }}>{c.author_name}</span>
                    <span className="text-xs opacity-50">{c.author_city}</span>
                  </div>
                )}
                <p className={`text-sm leading-relaxed ${isMe ? 'text-white' : 'text-gray-700'}`}>{c.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                  {new Date(c.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSend} className="p-4 border-t border-[#E5E5E5] flex gap-2" data-testid="thread-input-form">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border-gray-200"
            data-testid="thread-input"
          />
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="rounded-full bg-black text-white hover:bg-gray-800"
            size="icon"
            data-testid="thread-send-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t border-[#E5E5E5] text-center text-sm text-brand-grey">
          <Link to="/auth" className="text-[#1A1A1A] font-semibold hover:underline">Sign in</Link> to join the discussion.
        </div>
      )}
    </DialogContent>
  );
}

function PostCard({ post, color, type }) {
  return (
    <div
      className="group bg-white border rounded-none overflow-hidden hover:shadow-sm transition-all duration-300 hover:-translate-y-0.5"
      style={{ borderColor: `${color}30` }}
      data-testid={`profile-card-${post.id}`}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {post.category_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          {type === 'interacted' && (
            <div className="flex items-center gap-1.5">
              {post.liked && <Heart className="w-3 h-3 text-red-400 fill-red-400" />}
              {post.commented && <MessageCircle className="w-3 h-3 text-blue-400" />}
            </div>
          )}
        </div>
        <h3 className="font-heading font-bold text-base text-[#1A1A1A] mb-1.5 line-clamp-2 group-hover:text-opacity-80 transition-colors leading-snug">
          {post.title}
        </h3>
        <p className="text-sm text-brand-grey line-clamp-2 mb-3">{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.author_city}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes || 0}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, token, API } = useApp();
  const navigate = useNavigate();
  const [myPosts, setMyPosts] = useState([]);
  const [interactedPosts, setInteractedPosts] = useState([]);
  const [myPostsColor, setMyPostsColor] = useState('#3B82F6');
  const [interactedColor, setInteractedColor] = useState('#A855F7');
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [partners, setPartners] = useState([]);
  const [partnerRequests, setPartnerRequests] = useState({ incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeSection, setActiveSection] = useState('posts');

  // Wait for auth to resolve before redirecting
  useEffect(() => {
    const storedToken = localStorage.getItem('b4b_token');
    if (!storedToken) {
      navigate('/auth');
      return;
    }
    // Give context time to load user from token
    const timer = setTimeout(() => setAuthChecked(true), 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user || !token) {
      navigate('/auth');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/profile/posts`, { headers }),
      axios.get(`${API}/profile/interactions`, { headers }),
      axios.get(`${API}/profile/colors`, { headers }),
      axios.get(`${API}/partners`, { headers }),
      axios.get(`${API}/partners/requests`, { headers }),
    ]).then(([postsRes, interactionsRes, colorsRes, partnersRes, requestsRes]) => {
      setMyPosts(postsRes.data);
      setInteractedPosts(interactionsRes.data);
      setMyPostsColor(colorsRes.data.my_posts_color);
      setInteractedColor(colorsRes.data.interacted_color);
      setPartners(partnersRes.data);
      setPartnerRequests(requestsRes.data);
    }).catch(e => console.error(e))
    .finally(() => setLoading(false));
  }, [user, token, API, navigate, authChecked]);

  const saveColors = async (myColor, intColor) => {
    try {
      await axios.put(`${API}/profile/colors`, {
        my_posts_color: myColor,
        interacted_color: intColor,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Colors updated!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleMyPostsColorChange = (color) => {
    setMyPostsColor(color);
    saveColors(color, interactedColor);
  };

  const handleInteractedColorChange = (color) => {
    setInteractedColor(color);
    saveColors(myPostsColor, color);
  };

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await axios.get(`${API}/partners/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
      // Filter out existing partners and pending requests
      const partnerIds = new Set(partners.map(p => p.id));
      const outgoingIds = new Set(partnerRequests.outgoing.map(r => r.target_id));
      const incomingIds = new Set(partnerRequests.incoming.map(r => r.requester_id));
      setSearchResults(res.data.filter(u => !partnerIds.has(u.id) && !outgoingIds.has(u.id) && !incomingIds.has(u.id)));
    } catch (e) { setSearchResults([]); }
    setSearching(false);
  };

  const handleSendRequest = async (targetId) => {
    try {
      await axios.post(`${API}/partners/request`, { target_id: targetId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Partner request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== targetId));
      const reqRes = await axios.get(`${API}/partners/requests`, { headers: { Authorization: `Bearer ${token}` } });
      setPartnerRequests(reqRes.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (partnershipId) => {
    try {
      await axios.put(`${API}/partners/${partnershipId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Partner accepted!');
      const [pRes, rRes] = await Promise.all([
        axios.get(`${API}/partners`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/partners/requests`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setPartners(pRes.data);
      setPartnerRequests(rRes.data);
    } catch (e) {
      toast.error('Failed to accept');
    }
  };

  const handleRemovePartner = async (partnershipId) => {
    try {
      await axios.delete(`${API}/partners/${partnershipId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Partnership removed');
      setPartners(prev => prev.filter(p => p.partnership_id !== partnershipId));
    } catch (e) {
      toast.error('Failed to remove');
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]/50" data-testid="profile-page">
      {/* Profile header */}
      <section className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-none flex items-center justify-center text-white text-2xl font-heading font-black" style={{ backgroundColor: myPostsColor }}>
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-[#1A1A1A]" data-testid="profile-name">
                {user.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-brand-grey">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{user.city}, {user.country || ''}</span>
                <span>{user.email}</span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/write')}
              className="bg-black text-white hover:bg-gray-800 rounded-full font-bold shadow-[3px_3px_0px_0px_rgba(59,130,246,0.4)] hover:translate-y-[-1px] transition-all"
              data-testid="profile-write-btn"
            >
              <PenLine className="w-4 h-4 mr-1.5" /> New Post
            </Button>
          </div>

          {/* Color pickers */}
          <div className="flex flex-wrap gap-3 mt-6" data-testid="color-pickers">
            <ColorPicker label="My Posts" value={myPostsColor} onChange={handleMyPostsColorChange} testId="color-picker-my-posts" />
            <ColorPicker label="Interacted Posts" value={interactedColor} onChange={handleInteractedColorChange} testId="color-picker-interacted" />
          </div>

          {/* Section tabs */}
          <div className="flex gap-2 mt-6" data-testid="profile-tabs">
            {[
              { id: 'posts', label: 'My Posts', icon: <PenLine className="w-4 h-4" /> },
              { id: 'interactions', label: 'Interactions', icon: <Heart className="w-4 h-4" /> },
              { id: 'partners', label: `Partners${partners.length > 0 ? ` (${partners.length})` : ''}`, icon: <Users className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeSection === tab.id ? 'bg-[#1A1A1A] text-white' : 'text-brand-grey hover:text-[#1A1A1A] hover:bg-[#F4F4F5]'
                }`}
                data-testid={`profile-tab-${tab.id}`}
              >
                {tab.icon} {tab.label}
                {tab.id === 'partners' && partnerRequests.incoming.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{partnerRequests.incoming.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* My Posts */}
        {activeSection === 'posts' && (
        <section data-testid="my-posts-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: myPostsColor }} />
            <h2 className="font-heading font-bold text-xl text-[#1A1A1A]">
              My Posts ({myPosts.length})
            </h2>
          </div>
          {myPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="my-posts-grid">
              {myPosts.map(post => (
                <Link to={`/post/${post.id}`} key={post.id} className="no-underline">
                  <PostCard post={post} color={myPostsColor} type="mine" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-none border border-[#E5E5E5] p-10 text-center" data-testid="my-posts-empty">
              <PenLine className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-brand-grey mb-4">You haven't written any posts yet.</p>
              <Button onClick={() => navigate('/write')} className="bg-black text-white rounded-full font-bold" data-testid="my-posts-write-btn">
                <PenLine className="w-4 h-4 mr-1.5" /> Write Your First Post
              </Button>
            </div>
          )}
        </section>
        )}

        {/* Interacted Posts */}
        {activeSection === 'interactions' && (
        <section data-testid="interacted-posts-section">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: interactedColor }} />
            <h2 className="font-heading font-bold text-xl text-[#1A1A1A]">
              Posts I've Engaged With ({interactedPosts.length})
            </h2>
          </div>
          <p className="text-sm text-gray-400 mb-6 ml-6">Click a card to open the discussion thread</p>

          {interactedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="interacted-posts-grid">
              {interactedPosts.map(post => (
                <div key={post.id} className="cursor-pointer" onClick={() => setSelectedPost(post)}>
                  <PostCard post={post} color={interactedColor} type="interacted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-none border border-[#E5E5E5] p-10 text-center" data-testid="interacted-posts-empty">
              <Heart className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-brand-grey mb-4">You haven't interacted with any posts yet.</p>
              <Button variant="outline" onClick={() => navigate('/')} className="rounded-full font-bold" data-testid="interacted-browse-btn">
                Browse Posts <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}
        </section>
        )}

        {/* Partners Section */}
        {activeSection === 'partners' && (
        <section data-testid="partners-section">
          <div className="space-y-8">
            {/* Search for Partners */}
            <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
              <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1A1A1A]" /> Find Partners
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Search users by name..."
                  className="pl-10 border-2 border-[#E5E5E5] focus:border-black rounded-none"
                  data-testid="partner-search-input"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2" data-testid="partner-search-results">
                  {searchResults.map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-none bg-[#FDFCF8] hover:bg-[#F4F4F5] transition-colors">
                      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A]">{u.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{u.city}, {u.country}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(u.id)}
                        className="rounded-full bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white"
                        data-testid={`send-request-${u.id}`}
                      >
                        <UserPlus className="w-4 h-4 mr-1" /> Partner Up
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <p className="text-sm text-gray-400 mt-3">No users found matching "{searchQuery}"</p>
              )}
            </div>

            {/* Pending Requests */}
            {(partnerRequests.incoming.length > 0 || partnerRequests.outgoing.length > 0) && (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
                <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" /> Pending Requests
                </h3>
                {partnerRequests.incoming.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Incoming</p>
                    <div className="space-y-2">
                      {partnerRequests.incoming.map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-none bg-amber-50 border border-amber-100" data-testid={`incoming-request-${req.id}`}>
                          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {req.requester_name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A]">{req.requester_name}</p>
                            <p className="text-xs text-gray-400">Wants to partner with you</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" onClick={() => handleAcceptRequest(req.id)} className="rounded-full bg-green-600 hover:bg-green-700 text-white" data-testid={`accept-${req.id}`}>
                              <UserCheck className="w-4 h-4 mr-1" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRemovePartner(req.id)} className="rounded-full text-red-500 border-red-200 hover:bg-red-50" data-testid={`decline-${req.id}`}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {partnerRequests.outgoing.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-brand-grey uppercase tracking-wider mb-2">Sent</p>
                    <div className="space-y-2">
                      {partnerRequests.outgoing.map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-none bg-[#FDFCF8]" data-testid={`outgoing-request-${req.id}`}>
                          <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {req.target_name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A]">{req.target_name}</p>
                            <p className="text-xs text-gray-400">Pending acceptance</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleRemovePartner(req.id)} className="rounded-full text-gray-400 hover:text-red-500" data-testid={`cancel-request-${req.id}`}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Partners */}
            <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
              <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" /> My Partners ({partners.length})
              </h3>
              {partners.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="partners-grid">
                  {partners.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-4 rounded-none border border-[#E5E5E5] hover:border-green-200 hover:bg-green-50/30 transition-colors" data-testid={`partner-${p.id}`}>
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A1A]">{p.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.city}, {p.country}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePartner(p.partnership_id)}
                        className="rounded-full text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                        data-testid={`remove-partner-${p.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="no-partners">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-brand-grey mb-2">No partners yet</p>
                  <p className="text-xs text-gray-400">Search for users above to send partner requests. Partners can co-author posts together!</p>
                </div>
              )}
            </div>
          </div>
        </section>
        )}
      </div>

      {/* Discussion thread dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        {selectedPost && <DiscussionThread post={selectedPost} onClose={() => setSelectedPost(null)} />}
      </Dialog>
    </div>
  );
}
