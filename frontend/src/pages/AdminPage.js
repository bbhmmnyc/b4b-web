import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import {
  Shield, Check, X, Trash2, Users, FileText, MessageCircle,
  Globe, Tag, Clock, AlertTriangle, Eye, Heart, MapPin,
  ChevronDown, ChevronUp, RefreshCw, Mail, Send, Calendar,
  BarChart3, MousePointerClick, TrendingUp, Star, Megaphone, ExternalLink, DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-white rounded-none border border-[#E5E5E5] p-5 flex items-start gap-4" data-testid={`admin-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <div className="font-heading font-bold text-2xl" style={{ color }}>{value}</div>
        <div className="text-xs text-brand-grey">{label}</div>
      </div>
    </div>
  );
}

function PendingCategoryCard({ cat, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(cat.slug);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(cat.slug);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-none border border-amber-200 p-4 flex items-start gap-4" data-testid={`pending-cat-${cat.slug}`}>
      <div className="w-10 h-10 rounded-none flex items-center justify-center text-amber-600 bg-amber-50 flex-shrink-0">
        <Tag className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-heading font-bold text-base text-[#1A1A1A]">{cat.name}</h4>
          <Badge className="text-xs bg-amber-100 text-amber-700 border-0">Pending</Badge>
        </div>
        <p className="text-sm text-brand-grey mb-2 line-clamp-2">{cat.description}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {cat.suggested_by && <span>Suggested by <strong className="text-brand-grey">{cat.suggested_by}</strong></span>}
          {cat.created_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(cat.created_at).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full h-9 px-4"
          data-testid={`approve-${cat.slug}`}
        >
          <Check className="w-4 h-4 mr-1" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={loading}
          className="border-red-200 text-red-600 hover:bg-red-50 rounded-full h-9 px-4"
          data-testid={`reject-${cat.slug}`}
        >
          <X className="w-4 h-4 mr-1" /> Reject
        </Button>
      </div>
    </div>
  );
}

function RecentPostRow({ post, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F4F4F5] last:border-0" data-testid={`admin-post-${post.id}`}>
      <div className="flex-1 min-w-0">
        <Link to={`/post/${post.id}`} className="text-sm font-medium text-[#1A1A1A] hover:text-[#1A1A1A] no-underline line-clamp-1">
          {post.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
          <span>{post.author_name}</span>
          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{post.author_city}</span>
          <Badge variant="secondary" className="text-xs py-0 h-5">{post.category_slug.replace(/-/g, ' ')}</Badge>
          {post.is_guest && <Badge className="text-xs bg-yellow-100 text-yellow-700 border-0 py-0 h-5">guest</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes || 0}</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views || 0}</span>
      </div>
      {confirmDelete ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="destructive" className="h-7 text-xs rounded-full" onClick={() => { onDelete(post.id); setConfirmDelete(false); }} data-testid={`confirm-delete-${post.id}`}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDelete(true)} data-testid={`delete-post-${post.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

function RecentCommentRow({ comment, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F4F4F5] last:border-0" data-testid={`admin-comment-${comment.id}`}>
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-brand-grey flex-shrink-0 mt-0.5">
        {comment.author_name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-brand-grey mb-0.5">
          <span className="font-semibold text-gray-700">{comment.author_name}</span>
          <span>{comment.author_city}</span>
          {comment.is_guest && <Badge className="text-xs bg-yellow-100 text-yellow-700 border-0 py-0 h-4">guest</Badge>}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2">{comment.content}</p>
      </div>
      {confirmDelete ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="destructive" className="h-7 text-xs rounded-full" onClick={() => { onDelete(comment.id); setConfirmDelete(false); }}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDelete(true)} data-testid={`delete-comment-${comment.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

function UserRow({ u, currentUserId, onToggleAdmin }) {
  const [loading, setLoading] = useState(false);
  const isSelf = u.id === currentUserId;

  const handleToggle = async () => {
    setLoading(true);
    await onToggleAdmin(u.id, u.is_admin);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F4F4F5] last:border-0" data-testid={`admin-user-${u.id}`}>
      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {u.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1A1A1A]">{u.name}</span>
          {u.is_admin && <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0 py-0 h-4">admin</Badge>}
          {isSelf && <Badge className="text-xs bg-[#F4F4F5] text-brand-grey border-0 py-0 h-4">you</Badge>}
        </div>
        <div className="text-xs text-gray-400">{u.email} — {u.city}, {u.country}</div>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0 mr-2">{new Date(u.created_at).toLocaleDateString()}</span>
      {!isSelf && (
        <Button
          size="sm"
          variant={u.is_admin ? "outline" : "default"}
          disabled={loading}
          onClick={handleToggle}
          className={`h-7 text-xs rounded-full flex-shrink-0 ${u.is_admin ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          data-testid={`toggle-admin-${u.id}`}
        >
          {loading ? '...' : u.is_admin ? 'Remove Admin' : 'Make Admin'}
        </Button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, token, API } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingCats, setPendingCats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [authChecked, setAuthChecked] = useState(false);
  const [digestStatus, setDigestStatus] = useState(null);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [adInquiries, setAdInquiries] = useState([]);
  const [campaigns, setCampaigns] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('b4b_token');
    if (!storedToken) { navigate('/auth'); return; }
    const timer = setTimeout(() => setAuthChecked(true), 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const headers = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, pendingRes, usersRes, digestRes, analyticsRes, postsRes, inquiriesRes, campaignsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: headers() }),
        axios.get(`${API}/categories/pending/list`, { headers: headers() }),
        axios.get(`${API}/admin/users`, { headers: headers() }),
        axios.get(`${API}/admin/digest-status`, { headers: headers() }),
        axios.get(`${API}/admin/analytics`, { headers: headers() }),
        axios.get(`${API}/posts?limit=50`, { headers: headers() }),
        axios.get(`${API}/admin/ad-inquiries`, { headers: headers() }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/campaigns`, { headers: headers() }).catch(() => ({ data: null })),
      ]);
      setStats(statsRes.data);
      setPendingCats(pendingRes.data);
      setUsers(usersRes.data);
      setDigestStatus(digestRes.data);
      setAnalytics(analyticsRes.data);
      setAllPosts(postsRes.data.posts || []);
      setAdInquiries(inquiriesRes.data);
      setCampaigns(campaignsRes.data);
    } catch (e) {
      if (e.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/');
      }
    }
    setLoading(false);
  }, [token, API, headers, navigate]);

  useEffect(() => {
    if (authChecked && user && token) fetchData();
  }, [authChecked, user, token, fetchData]);

  const handleApprove = async (slug) => {
    try {
      await axios.put(`${API}/categories/${slug}/approve`, {}, { headers: headers() });
      toast.success(`Topic "${slug}" approved!`);
      setPendingCats(prev => prev.filter(c => c.slug !== slug));
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (slug) => {
    try {
      await axios.delete(`${API}/categories/${slug}/reject`, { headers: headers() });
      toast.success(`Topic suggestion rejected`);
      setPendingCats(prev => prev.filter(c => c.slug !== slug));
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`${API}/admin/posts/${postId}`, { headers: headers() });
      toast.success('Post deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/admin/comments/${commentId}`, { headers: headers() });
      toast.success('Comment deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  const handleToggleAdmin = async (userId, currentlyAdmin) => {
    try {
      const res = await axios.put(`${API}/admin/users/${userId}/toggle-admin`, {}, { headers: headers() });
      toast.success(res.data.message);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: res.data.is_admin } : u));
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update admin status');
    }
  };

  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await axios.post(`${API}/admin/send-digest`, {}, { headers: headers() });
      toast.success(res.data.message);
      const digestRes = await axios.get(`${API}/admin/digest-status`, { headers: headers() });
      setDigestStatus(digestRes.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send digest');
    }
    setSendingDigest(false);
  };

  const handleToggleFeatured = async (postId) => {
    try {
      const res = await axios.put(`${API}/admin/posts/${postId}/feature`, {}, { headers: headers() });
      toast.success(res.data.message);
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, is_featured: res.data.is_featured } : p));
    } catch (e) {
      toast.error('Failed to toggle featured');
    }
  };

  const handleSetSponsor = async (postId, sponsorData) => {
    try {
      const res = await axios.put(`${API}/admin/posts/${postId}/sponsor`, sponsorData, { headers: headers() });
      toast.success(res.data.message);
      setAllPosts(prev => prev.map(p => p.id === postId ? { ...p, is_sponsored: res.data.is_sponsored, ...sponsorData } : p));
    } catch (e) {
      toast.error('Failed to update sponsor');
    }
  };

  const handleInquiryStatus = async (inquiryId, status) => {
    try {
      await axios.put(`${API}/admin/ad-inquiries/${inquiryId}/status`, { status }, { headers: headers() });
      toast.success(`Inquiry marked as ${status}`);
      setAdInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status } : i));
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" data-testid="admin-no-access">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="font-heading font-bold text-xl">Admin Access Required</h2>
        <p className="text-brand-grey text-sm">You don't have permission to view this page.</p>
        <Button onClick={() => navigate('/')} className="rounded-full" data-testid="admin-go-home">Go Home</Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'featured', label: `Featured & Sponsored`, icon: <Star className="w-4 h-4" /> },
    { id: 'inquiries', label: `Inquiries ${adInquiries.filter(i => i.status === 'new').length > 0 ? `(${adInquiries.filter(i => i.status === 'new').length})` : ''}`, icon: <Megaphone className="w-4 h-4" /> },
    { id: 'moderation', label: `Moderation ${pendingCats.length > 0 ? `(${pendingCats.length})` : ''}`, icon: <Shield className="w-4 h-4" /> },
    { id: 'newsletter', label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'posts', label: 'Recent Posts', icon: <FileText className="w-4 h-4" /> },
    { id: 'comments', label: 'Recent Comments', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8]/50" data-testid="admin-page">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-[#1A1A1A] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl text-[#1A1A1A]" data-testid="admin-heading">Admin Dashboard</h1>
                <p className="text-xs text-brand-grey">Moderate content, manage topics, and monitor activity</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={fetchData} className="rounded-full" data-testid="admin-refresh">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto" data-testid="admin-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1A1A1A] text-white' : 'text-brand-grey hover:text-[#1A1A1A] hover:bg-[#F4F4F5]'}`}
                data-testid={`admin-tab-${tab.id}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6" data-testid="admin-overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<FileText className="w-5 h-5" />} value={stats.total_posts} label="Total Posts" color="#3B82F6" />
              <StatCard icon={<MessageCircle className="w-5 h-5" />} value={stats.total_comments} label="Total Comments" color="#22C55E" />
              <StatCard icon={<Users className="w-5 h-5" />} value={stats.total_users} label="Registered Users" color="#A855F7" />
              <StatCard icon={<Globe className="w-5 h-5" />} value={stats.countries_represented} label="Countries" color="#F97316" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Tag className="w-5 h-5" />} value={stats.approved_categories} label="Active Topics" color="#14B8A6" />
              <StatCard icon={<Clock className="w-5 h-5" />} value={stats.pending_categories} label="Pending Topics" color="#D97706" />
              <StatCard icon={<AlertTriangle className="w-5 h-5" />} value={stats.guest_posts} label="Guest Posts" color="#EF4444" />
              <StatCard icon={<Shield className="w-5 h-5" />} value={users.filter(u => u.is_admin).length} label="Admins" color="#6366F1" />
            </div>
          </div>
        )}


        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && campaigns && (
          <div className="space-y-6" data-testid="admin-campaigns">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Ad Campaign Analytics</h2>
            <p className="text-sm text-brand-grey">Revenue, post performance, and advertiser pipeline at a glance.</p>

            {/* Revenue + Pipeline Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<DollarSign className="w-5 h-5" />} value={`$${campaigns.revenue.total.toLocaleString()}`} label="Total Revenue" color="#2D8B7A" />
              <StatCard icon={<Check className="w-5 h-5" />} value={campaigns.revenue.paid_count} label="Paid Bookings" color="#3D6B8E" />
              <StatCard icon={<Clock className="w-5 h-5" />} value={campaigns.revenue.pending_count} label="Pending Payments" color="#C4942A" />
              <StatCard icon={<Megaphone className="w-5 h-5" />} value={campaigns.inquiry_pipeline.new + campaigns.inquiry_pipeline.contacted + campaigns.inquiry_pipeline.closed} label="Total Inquiries" color="#7B5E8D" />
            </div>

            {/* Inquiry Pipeline */}
            <div className="bg-white border border-[#E5E5E5] p-5">
              <h3 className="font-heading font-bold text-base text-[#1A1A1A] mb-4">Inquiry Pipeline</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'New', count: campaigns.inquiry_pipeline.new, color: '#C4942A', bg: '#FFF8E1' },
                  { label: 'Contacted', count: campaigns.inquiry_pipeline.contacted, color: '#3D6B8E', bg: '#E0F0FA' },
                  { label: 'Closed', count: campaigns.inquiry_pipeline.closed, color: '#2D8B7A', bg: '#E0F5EC' },
                ].map(stage => (
                  <div key={stage.label} className="text-center p-4 border" style={{ borderColor: `${stage.color}30`, background: stage.bg }} data-testid={`pipeline-${stage.label.toLowerCase()}`}>
                    <div className="font-heading font-black text-2xl" style={{ color: stage.color }}>{stage.count}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-grey mt-1">{stage.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Post Performance */}
            <div className="bg-white border border-[#E5E5E5]">
              <div className="p-4 border-b border-[#F4F4F5] flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-[#1A1A1A]">Featured Post Performance</h3>
                <div className="flex items-center gap-4 text-xs text-brand-grey">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {campaigns.featured.total_views} views</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {campaigns.featured.total_likes} likes</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {campaigns.featured.total_comments} comments</span>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {campaigns.featured.posts.length > 0 ? campaigns.featured.posts.map(post => (
                  <div key={post.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#F4F4F5] last:border-0 hover:bg-[#FDFCF8]" data-testid={`campaign-post-${post.id}`}>
                    <div className="flex-1 min-w-0">
                      <Link to={`/post/${post.id}`} className="text-sm font-medium text-[#1A1A1A] hover:underline no-underline line-clamp-1">
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{post.author}</span>
                        <Badge variant="secondary" className="text-xs py-0 h-5">{post.category.replace(/-/g, ' ')}</Badge>
                        {post.is_sponsored && <Badge className="text-xs bg-[#C4942A]/15 text-[#C4942A] border-0 py-0 h-5">Sponsored · {post.sponsor_name}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-brand-grey flex-shrink-0">
                      <span className="flex items-center gap-1 font-medium"><Eye className="w-3 h-3 text-[#3D6B8E]" /> {post.views}</span>
                      <span className="flex items-center gap-1 font-medium"><Heart className="w-3 h-3 text-[#C2544D]" /> {post.likes}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-sm text-brand-grey">No featured posts yet. Feature posts from the "Featured & Sponsored" tab.</div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border border-[#E5E5E5]">
              <div className="p-4 border-b border-[#F4F4F5]">
                <h3 className="font-heading font-bold text-base text-[#1A1A1A]">Recent Transactions</h3>
              </div>
              {campaigns.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F4F4F5] text-left">
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Booking</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Advertiser</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Package</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Amount</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Status</th>
                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.recent_transactions.map(tx => (
                        <tr key={tx.id} className="border-b border-[#F4F4F5] last:border-0" data-testid={`tx-${tx.booking_id}`}>
                          <td className="px-4 py-2.5 font-mono text-xs font-bold">{tx.booking_id}</td>
                          <td className="px-4 py-2.5">{tx.advertiser}</td>
                          <td className="px-4 py-2.5 text-xs text-brand-grey capitalize">{tx.ad_size} · {tx.frequency.replace('-', ' ')} · {tx.placement}</td>
                          <td className="px-4 py-2.5 font-bold">${tx.total_price.toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <Badge className={`text-xs border-0 py-0 h-5 ${
                              tx.payment_status === 'paid' ? 'bg-[#2D8B7A]/15 text-[#2D8B7A]' :
                              tx.payment_status === 'pending' ? 'bg-[#C4942A]/15 text-[#C4942A]' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {tx.payment_status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-brand-grey">No transactions yet. Advertisers can book through the Advertise page.</div>
              )}
            </div>

            {/* GA4 Link */}
            <div className="border border-[#3D6B8E]/20 p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #E0F0FA 0%, #FDFCF8 100%)' }}>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#3D6B8E]" /> Google Analytics (GA4)</p>
                <p className="text-xs text-brand-grey mt-0.5">View detailed traffic, page views, and user behavior in your GA4 dashboard.</p>
              </div>
              <a
                href="https://analytics.google.com/analytics/web/#/p/G-TQ6RDMFSPJ"
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button variant="outline" size="sm" className="rounded-full text-xs h-8" data-testid="ga4-link">
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Open GA4
                </Button>
              </a>
            </div>
          </div>
        )}


        {/* Featured & Sponsored Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6" data-testid="admin-featured">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Featured & Sponsored Posts</h2>
            <p className="text-sm text-brand-grey">Featured posts appear in the homepage carousel. Sponsored posts display a sponsor badge and branding.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <StatCard icon={<Star className="w-5 h-5" />} value={allPosts.filter(p => p.is_featured).length} label="Featured Posts" color="#C4942A" />
              <StatCard icon={<Megaphone className="w-5 h-5" />} value={allPosts.filter(p => p.is_sponsored).length} label="Sponsored Posts" color="#C2544D" />
              <StatCard icon={<FileText className="w-5 h-5" />} value={adInquiries.filter(i => i.status === 'new').length} label="New Inquiries" color="#3D6B8E" />
            </div>

            <div className="bg-white rounded-none border border-[#E5E5E5]">
              <div className="p-4 border-b border-[#F4F4F5]">
                <h3 className="font-heading font-bold text-base text-[#1A1A1A]">All Posts</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {allPosts.filter(p => !p.title.startsWith('TEST')).map(post => (
                  <div key={post.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#F4F4F5] last:border-0 hover:bg-[#FDFCF8]" data-testid={`admin-feat-post-${post.id}`}>
                    <div className="flex-1 min-w-0">
                      <Link to={`/post/${post.id}`} className="text-sm font-medium text-[#1A1A1A] hover:underline no-underline line-clamp-1">
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>{post.author_name}</span>
                        <Badge variant="secondary" className="text-xs py-0 h-5">{post.category_slug.replace(/-/g, ' ')}</Badge>
                        {post.is_featured && <Badge className="text-xs bg-[#C4942A]/15 text-[#C4942A] border-0 py-0 h-5">Featured</Badge>}
                        {post.is_sponsored && <Badge className="text-xs bg-[#C2544D]/15 text-[#C2544D] border-0 py-0 h-5">Sponsored · {post.sponsor_name}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant={post.is_featured ? "default" : "outline"}
                        onClick={() => handleToggleFeatured(post.id)}
                        className={`h-7 text-xs rounded-full ${post.is_featured ? 'bg-[#C4942A] hover:bg-[#A87E22] text-white' : 'border-[#E5E5E5]'}`}
                        data-testid={`toggle-feat-${post.id}`}
                      >
                        <Star className="w-3 h-3 mr-1" /> {post.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                      {!post.is_sponsored ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const name = prompt('Sponsor company name:');
                            if (name) {
                              const url = prompt('Sponsor website URL (optional):');
                              handleSetSponsor(post.id, { sponsor_name: name, sponsor_url: url || '' });
                            }
                          }}
                          className="h-7 text-xs rounded-full border-[#E5E5E5]"
                          data-testid={`set-sponsor-${post.id}`}
                        >
                          <Megaphone className="w-3 h-3 mr-1" /> Sponsor
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetSponsor(post.id, { remove: true })}
                          className="h-7 text-xs rounded-full border-red-200 text-red-600 hover:bg-red-50"
                          data-testid={`remove-sponsor-${post.id}`}
                        >
                          <X className="w-3 h-3 mr-1" /> Remove Sponsor
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ad Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6" data-testid="admin-inquiries">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Advertiser Inquiries</h2>
            {adInquiries.length > 0 ? (
              <div className="space-y-4">
                {adInquiries.map(inq => (
                  <div key={inq.id} className={`bg-white rounded-none border p-5 ${inq.status === 'new' ? 'border-[#C4942A]/40' : 'border-[#E5E5E5]'}`} data-testid={`inquiry-${inq.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-heading font-bold text-base text-[#1A1A1A]">{inq.company_name}</h4>
                          <Badge className={`text-xs border-0 py-0 h-5 ${
                            inq.status === 'new' ? 'bg-[#C4942A]/15 text-[#C4942A]' :
                            inq.status === 'contacted' ? 'bg-[#3D6B8E]/15 text-[#3D6B8E]' :
                            inq.status === 'closed' ? 'bg-[#2D8B7A]/15 text-[#2D8B7A]' :
                            'bg-[#F4F4F5] text-brand-grey'
                          }`}>
                            {inq.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-brand-grey space-y-1 mb-3">
                          <p><strong>Contact:</strong> {inq.contact_name} — {inq.email}</p>
                          {inq.website && <p><strong>Website:</strong> <a href={inq.website} target="_blank" rel="noopener noreferrer" className="text-[#3D6B8E] hover:underline">{inq.website}</a></p>}
                          {inq.budget_range && <p><strong>Budget:</strong> {inq.budget_range}</p>}
                          {inq.preferred_categories?.length > 0 && <p><strong>Categories:</strong> {inq.preferred_categories.join(', ')}</p>}
                          <p className="text-xs text-gray-400">{new Date(inq.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm text-[#404040] leading-relaxed bg-[#FDFCF8] p-3 border border-[#E5E5E5]">{inq.message}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {inq.status === 'new' && (
                          <Button size="sm" onClick={() => handleInquiryStatus(inq.id, 'contacted')} className="bg-[#3D6B8E] text-white hover:bg-[#2D5B7E] h-7 text-xs rounded-full" data-testid={`contact-inquiry-${inq.id}`}>
                            Contacted
                          </Button>
                        )}
                        {inq.status !== 'closed' && (
                          <Button size="sm" variant="outline" onClick={() => handleInquiryStatus(inq.id, 'closed')} className="h-7 text-xs rounded-full border-[#E5E5E5]" data-testid={`close-inquiry-${inq.id}`}>
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-10 text-center">
                <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-brand-grey font-medium">No advertiser inquiries yet</p>
                <p className="text-xs text-gray-400 mt-1">When advertisers submit inquiries through the Advertise page, they'll appear here.</p>
              </div>
            )}
          </div>
        )}


        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-4" data-testid="admin-moderation">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Pending Topic Suggestions</h2>
            {pendingCats.length > 0 ? (
              <div className="space-y-3">
                {pendingCats.map(cat => (
                  <PendingCategoryCard key={cat.slug} cat={cat} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-10 text-center" data-testid="no-pending">
                <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-brand-grey font-medium">All clear! No pending topic suggestions.</p>
                <p className="text-xs text-gray-400 mt-1">User-suggested topics will appear here for your review.</p>
              </div>
            )}
          </div>
        )}

        {/* Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <div className="space-y-6" data-testid="admin-newsletter">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Weekly Digest Management</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Mail className="w-5 h-5" />} value={digestStatus?.active_subscribers || 0} label="Newsletter Subs" color="#3B82F6" />
              <StatCard icon={<Users className="w-5 h-5" />} value={digestStatus?.registered_users || 0} label="Registered Users" color="#22C55E" />
              <StatCard icon={<Send className="w-5 h-5" />} value={digestStatus?.total_audience || 0} label="Total Audience" color="#A855F7" />
              <StatCard icon={<FileText className="w-5 h-5" />} value={digestStatus?.total_digests_sent || 0} label="Digests Sent" color="#F97316" />
            </div>

            {/* Schedule & Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-[#1A1A1A]" />
                  <h3 className="font-heading font-bold text-base text-[#1A1A1A]">Schedule</h3>
                </div>
                <p className="text-sm text-brand-grey mb-2">Automated digest runs <strong>every Monday at 9:00 AM UTC</strong>.</p>
                <p className="text-xs text-gray-400">Includes registered users + newsletter subscribers. Top 5 posts from the past week are featured.</p>
              </div>

              <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="w-5 h-5 text-green-600" />
                  <h3 className="font-heading font-bold text-base text-[#1A1A1A]">Manual Send</h3>
                </div>
                <p className="text-sm text-brand-grey mb-4">Trigger a digest now to all subscribers. This will send the top posts from the past 7 days.</p>
                <Button
                  onClick={handleSendDigest}
                  disabled={sendingDigest}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full"
                  data-testid="send-digest-btn"
                >
                  {sendingDigest ? (
                    <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-1.5" /> Send Digest Now</>
                  )}
                </Button>
              </div>
            </div>

            {/* Recent Digest Logs */}
            {digestStatus?.recent_logs?.length > 0 && (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
                <h3 className="font-heading font-bold text-base text-[#1A1A1A] mb-4">Recent Digest History</h3>
                <div className="space-y-3">
                  {digestStatus.recent_logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 py-2 border-b border-[#F4F4F5] last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.status === 'sent' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {log.status === 'sent' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1A1A1A]">
                          {log.status === 'sent' ? `Sent to ${log.recipients} recipients` : 'Skipped'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(log.sent_at).toLocaleString()} — {log.posts_included} posts included
                          {log.errors > 0 && <span className="text-red-500 ml-2">({log.errors} errors)</span>}
                          {log.reason && <span className="ml-2">({log.reason})</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Digest Info */}
            {!digestStatus?.recent_logs?.length && (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-10 text-center">
                <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-brand-grey font-medium">No digests sent yet</p>
                <p className="text-xs text-gray-400 mt-1">The first automated digest will go out next Monday, or you can trigger one manually above.</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6" data-testid="admin-analytics">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">Email Analytics</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Mail className="w-5 h-5" />} value={`${analytics.open_rate}%`} label="Open Rate" color="#22C55E" />
              <StatCard icon={<MousePointerClick className="w-5 h-5" />} value={`${analytics.click_rate}%`} label="Click Rate" color="#3B82F6" />
              <StatCard icon={<Eye className="w-5 h-5" />} value={analytics.unique_opens} label="Unique Opens" color="#A855F7" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} value={analytics.unique_clicks} label="Unique Clicks" color="#F97316" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Send className="w-5 h-5" />} value={analytics.total_digests_sent} label="Digests Sent" color="#14B8A6" />
              <StatCard icon={<Users className="w-5 h-5" />} value={analytics.total_recipients} label="Total Sent Emails" color="#6366F1" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} value={analytics.subscriber_growth_30d} label="New Subs (30d)" color="#22C55E" />
              <StatCard icon={<Mail className="w-5 h-5" />} value={analytics.active_subscribers} label="Active Subs" color="#3B82F6" />
            </div>

            {/* Per-Digest Breakdown */}
            {analytics.digest_breakdown?.length > 0 && (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-6">
                <h3 className="font-heading font-bold text-base text-[#1A1A1A] mb-4">Digest Performance History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E5]">
                        <th className="text-left py-2 px-3 text-brand-grey font-medium">Date</th>
                        <th className="text-center py-2 px-3 text-brand-grey font-medium">Recipients</th>
                        <th className="text-center py-2 px-3 text-brand-grey font-medium">Opens</th>
                        <th className="text-center py-2 px-3 text-brand-grey font-medium">Open Rate</th>
                        <th className="text-center py-2 px-3 text-brand-grey font-medium">Clicks</th>
                        <th className="text-center py-2 px-3 text-brand-grey font-medium">Click Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.digest_breakdown.map((d, i) => (
                        <tr key={i} className="border-b border-[#F4F4F5] last:border-0">
                          <td className="py-2.5 px-3 text-gray-700">{new Date(d.date).toLocaleDateString()}</td>
                          <td className="py-2.5 px-3 text-center text-gray-700">{d.recipients}</td>
                          <td className="py-2.5 px-3 text-center text-gray-700">{d.opens}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.open_rate > 20 ? 'bg-green-100 text-green-700' : d.open_rate > 10 ? 'bg-amber-100 text-amber-700' : 'bg-[#F4F4F5] text-brand-grey'}`}>
                              {d.open_rate}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-700">{d.clicks}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.click_rate > 5 ? 'bg-green-100 text-green-700' : d.click_rate > 2 ? 'bg-amber-100 text-amber-700' : 'bg-[#F4F4F5] text-brand-grey'}`}>
                              {d.click_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {analytics.digest_breakdown?.length === 0 && (
              <div className="bg-white rounded-none border border-[#E5E5E5] p-10 text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-brand-grey font-medium">No digest data yet</p>
                <p className="text-xs text-gray-400 mt-1">Analytics will appear here after digests are sent and recipients interact with them.</p>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && stats && (
          <div data-testid="admin-posts">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A] mb-4">Recent Posts</h2>
            <div className="bg-white rounded-none border border-[#E5E5E5] p-4">
              {stats.recent_posts.map(post => (
                <RecentPostRow key={post.id} post={post} onDelete={handleDeletePost} />
              ))}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && stats && (
          <div data-testid="admin-comments">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A] mb-4">Recent Comments</h2>
            <div className="bg-white rounded-none border border-[#E5E5E5] p-4">
              {stats.recent_comments.length > 0 ? (
                stats.recent_comments.map(comment => (
                  <RecentCommentRow key={comment.id} comment={comment} onDelete={handleDeleteComment} />
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">No comments yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div data-testid="admin-users">
            <h2 className="font-heading font-bold text-lg text-[#1A1A1A] mb-4">Registered Users ({users.length})</h2>
            <div className="bg-white rounded-none border border-[#E5E5E5] p-4">
              {users.map(u => (
                <UserRow key={u.id} u={u} currentUserId={user.id} onToggleAdmin={handleToggleAdmin} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
