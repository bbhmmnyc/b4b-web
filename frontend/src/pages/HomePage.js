cat > /var/www / blogs4blocks / frontend / src / pages / HomePage.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import BlogCard from '../components/BlogCard';
import { ArrowRight, Globe, Users, PenLine, TrendingUp, Search, Flame, Mail, Check, Megaphone, BarChart3, Share2, Brain, Palette, Wrench, Monitor, Cpu, Key, Briefcase, FileText, UserPlus, Edit3, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getCategoryColor } from '../utils/colors';

const CATEGORY_ICONS = {
  'social-media': <Megaphone className="w-5 h-5" />,
  'seo-sem': <BarChart3 className="w-5 h-5" />,
  'influencer-marketing': <Share2 className="w-5 h-5" />,
  'integrated-marketing': <Globe className="w-5 h-5" />,
  'consumer-behavior': <Brain className="w-5 h-5" />,
  'branding': <Palette className="w-5 h-5" />,
  'marketing-tools': <Wrench className="w-5 h-5" />,
  'digital-marketing': <Monitor className="w-5 h-5" />,
  'marketing-and-ai': <Cpu className="w-5 h-5" />,
  'keywords': <Key className="w-5 h-5" />,
  'careers': <Briefcase className="w-5 h-5" />,
};

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

const glassCard = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 4px 20px rgba(20,40,80,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

export default function HomePage() {
  const { categories, stats, API } = useApp();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    axios.get(`${API}/posts?limit=6`).then(res => setPosts(res.data.posts)).catch(() => { });
    axios.get(`${API}/posts/popular/list?limit=4`).then(res => setPopularPosts(res.data)).catch(() => { });
  }, [API]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      await axios.post(`${API}/newsletter/subscribe`, { email: newsletterEmail.trim() });
      setSubscribed(true);
      toast.success('You\'re subscribed to the weekly digest!');
    } catch (err) {
      toast.error('Failed to subscribe. Try again.');
    }
    setSubscribing(false);
  };

  return (
    <div className="min-h-screen" data-testid="home-page">

      <section className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(30,50,80,0.10)' }} data-testid="hero-section">
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-28">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex-1 text-center lg:text-left"
            >
              <img
                src="/b4b-logo.png"
                alt="Blogs 4 Blocks - Global Marketing Forum"
                className="w-full mb-6"
                style={{ maxWidth: "480px" }}
                data-testid="hero-title"
              />
              <p className="text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0"
                style={{ color: "#2A3A52" }}>
                A global open forum where marketing professionals share strategies, insights, and real-world experiences from every corner of the world.
              </p>
              <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mb-10 mx-auto lg:mx-0" data-testid="hero-search-form">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6A7A90" }} />
                  <Input
                    placeholder="Search marketing topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 rounded-none h-12 text-sm border-0"
                    style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(30,50,80,0.8)", color: "#1A2A3C", backdropFilter: "blur(8px)" }}
                    data-testid="hero-search-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="rounded-none h-12 px-6 text-xs font-bold uppercase tracking-widest text-white"
                  style={{ background: "linear-gradient(155deg, #0A8A78 0%, #077060 50%, #055048 100%)" }}
                  data-testid="hero-search-btn"
                >
                  Search
                </Button>
              </form>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate("/write")}
                  className="rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest text-white"
                  style={{ background: "linear-gradient(155deg, #C42838 0%, #A01E2C 48%, #7E1420 100%)" }}
                  data-testid="hero-write-btn"
                >
                  <PenLine className="w-4 h-4 mr-2" />
                  Share Your Strategy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest"
                  style={{ background: "rgba(255,255,255,0.62)", border: "1px solid rgba(30,50,80,0.24)", color: "#1E3050", backdropFilter: "blur(8px)" }}
                  data-testid="hero-explore-btn"
                >
                  Explore Topics
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex-shrink-0 w-56 sm:w-72 md:w-80 lg:w-[360px] flex flex-col items-center gap-4"
            >
              <p className="text-center text-sm font-bold uppercase tracking-wide"
                style={{ color: "#0A7A6A", lineHeight: "1.6" }}>
                Marketing insights from around the world.<br />
                From the people who work in them,<br />
                city by city, block by block.
              </p>
              <img
                src="/icon-512.png"
                alt="Global Marketing"
                className="w-full h-auto"
                style={{ transform: "scaleX(-1)", filter: "drop-shadow(0 8px 32px rgba(10,120,106,0.18))" }}
                data-testid="hero-logo"
              />
            </motion.div>          {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="flex flex-wrap gap-10 mt-16 pt-8 justify-center lg:justify-start"
                style={{ borderTop: '1px solid rgba(30,50,80,0.10)' }}
              >
                {[
                  { icon: <TrendingUp className="w-4 h-4" />, value: stats.total_posts, label: 'Posts', color: '#0A7A6A' },
                  { icon: <Users className="w-4 h-4" />, value: stats.total_users || 0, label: 'Contributors', color: '#1A4A8A' },
                  { icon: <Globe className="w-4 h-4" />, value: stats.total_countries || 0, label: 'Countries', color: '#8A3A20' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ color: stat.color }}>{stat.icon}</span>
                    <span className="font-black text-2xl" style={{ ...MONO, color: '#1A2A3C' }}>{stat.value}</span>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4A5A70' }}>{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
      </section>

      <section id="categories" className="py-20 md:py-28" style={{ borderBottom: '1px solid rgba(30,50,80,0.09)' }} data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ ...MONO, color: '#0A7A6A' }}>// Explore</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#1A2A3C' }} data-testid="categories-heading">Marketing Topics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="categories-grid">
            {categories.map((cat, i) => {
              const color = getCategoryColor(cat.slug);
              return (
                <motion.div key={cat.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}>
                  <Link to={`/category/${cat.slug}`} className="relative block overflow-hidden no-underline group transition-all duration-300 hover:-translate-y-1 rounded-xl" data-testid={`category-card-${cat.slug}`}>
                    <div
                      className="relative p-5 min-h-[150px] flex flex-col justify-between rounded-xl overflow-hidden transition-all duration-300"
                      style={{ ...glassCard, borderLeft: `2px solid ${color.base}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.82)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.68)'; }}
                    >
                      <div>
                        <span className="mb-3 block" style={{ color: color.base }}>{CATEGORY_ICONS[cat.slug] || <BarChart3 className="w-5 h-5" />}</span>
                        <h3 className="font-heading font-bold text-base mb-1" style={{ color: '#1A2A3C' }}>{cat.name}</h3>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#4A5A70' }}>{cat.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ ...MONO, color: color.base }}>{cat.post_count} posts</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" style={{ color: color.base }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ borderBottom: '1px solid rgba(30,50,80,0.09)' }} data-testid="latest-posts-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ ...MONO, color: '#0A7A6A' }}>// Fresh Perspectives</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#1A2A3C' }} data-testid="latest-heading">Latest Discussions</h2>
            </div>
            <Link to="/category/all" className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest no-underline" style={{ color: '#0A7A6A' }} data-testid="view-all-posts">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="posts-grid">
            {posts.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
          </div>
        </div>
      </section>

      {popularPosts.length > 0 && (
        <section className="py-20 md:py-28" style={{ borderBottom: '1px solid rgba(30,50,80,0.09)' }} data-testid="popular-posts-section">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-4 h-4" style={{ color: '#C04030' }} />
                <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ ...MONO, color: '#0A7A6A' }}>// Most Engaged</p>
              </div>
              <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight" style={{ color: '#1A2A3C' }} data-testid="popular-heading">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="popular-posts-grid">
              {popularPosts.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 md:py-28" style={{ borderBottom: '1px solid rgba(30,50,80,0.09)' }} data-testid="howto-stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative overflow-hidden" style={{ ...glassCard, borderTop: '2px solid #0A7A6A', borderRadius: 0 }} data-testid="howto-card">
              <div className="p-8 md:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4" style={{ ...MONO, color: '#0A7A6A' }}>// Getting Started</p>
                <h3 className="font-heading font-bold text-2xl mb-6" style={{ color: '#1A2A3C' }}>How to Share a Post</h3>
                <div className="space-y-5">
                  {[
                    { step: '01', icon: <UserPlus className="w-4 h-4" />, title: 'Create an account (or post as guest)', desc: 'Sign up for a free account or skip and post as a guest — Reminder account posts stick around longer than guests-your choice..' },
                    { step: '02', icon: <Edit3 className="w-4 h-4" />, title: 'Click "Write" and pick a topic', desc: 'Choose a marketing category that fits, add a title, and use our editor to write your post.' },
                    { step: '03', icon: <Send className="w-4 h-4" />, title: 'Hit "Publish" and join the conversation', desc: "Your post goes live immediately. Readers can like, comment, and share." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(10,120,106,0.10)', border: '1px solid rgba(10,120,106,0.22)', color: '#0A7A6A', ...MONO }}>{item.step}</div>
                      <div>
                        <p className="text-sm font-bold mb-1" style={{ color: '#1A2A3C' }}>{item.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#4A5A70' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => navigate('/write')} className="mt-8 rounded-none text-xs font-bold uppercase tracking-widest text-white" style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)', boxShadow: '0 2px 14px rgba(160,30,44,0.32)' }}>
                  <PenLine className="w-3.5 h-3.5 mr-2" /> Start Writing Now
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden" style={{ ...glassCard, borderTop: '2px solid #1A4A8A', borderRadius: 0 }} data-testid="stats-card">
              <div className="p-8 md:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4" style={{ ...MONO, color: '#1A4A8A' }}>// Community Pulse</p>
                <h3 className="font-heading font-bold text-2xl mb-6" style={{ color: '#1A2A3C' }}>By the Numbers</h3>
                {stats && (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: <FileText className="w-5 h-5" />, value: stats.total_posts, label: 'Published Posts', color: '#8A3A20' },
                      { icon: <Users className="w-5 h-5" />, value: stats.total_users || 0, label: 'Contributors', color: '#6A2878' },
                      { icon: <Globe className="w-5 h-5" />, value: stats.total_countries || 0, label: 'Countries', color: '#1A4A8A' },
                      { icon: <TrendingUp className="w-5 h-5" />, value: '∞', label: 'Insights Shared', color: '#0A7A6A' },
                    ].map((s, i) => (
                      <div key={i} className="p-4" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.88)', boxShadow: '0 2px 8px rgba(20,40,80,0.06)' }}>
                        <span style={{ color: s.color }}>{s.icon}</span>
                        <p className="font-black text-3xl mt-2 mb-1" style={{ ...MONO, color: '#1A2A3C' }}>{s.value}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6A7A90' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ borderBottom: '1px solid rgba(30,50,80,0.09)' }} data-testid="newsletter-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="relative overflow-hidden p-10 md:p-16" style={{ ...glassCard, borderRadius: 0 }}>
            <div className="relative max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.28em] mb-3" style={{ ...MONO, color: '#8A3A20' }}>// Weekly Digest</p>
              <h2 className="font-heading font-bold text-2xl md:text-3xl tracking-tight mb-3" style={{ color: '#1A2A3C' }}>Get the best marketing insights delivered weekly</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#4A5A70' }}>Every Monday — top posts, trending topics, and fresh perspectives from marketing professionals worldwide.</p>
              {subscribed ? (
                <div className="flex items-center gap-3 text-sm font-bold" style={{ color: '#0A7A6A' }}>
                  <Check className="w-5 h-5" /> You're subscribed — see you Monday!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md">
                  <Input type="email" placeholder="your@email.com" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} className="flex-1 rounded-none h-12 text-sm border-0" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(30,50,80,0.18)', color: '#1A2A3C' }} />
                  <Button type="submit" disabled={subscribing} className="rounded-none h-12 px-6 text-xs font-bold uppercase tracking-widest text-white" style={{ background: 'linear-gradient(155deg, #8A3A20 0%, #6A2810 50%, #501E08 100%)', boxShadow: '0 2px 12px rgba(138,58,32,0.30)' }}>
                    {subscribing ? <Mail className="w-4 h-4 animate-spin" /> : 'Subscribe'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] mb-4" style={{ ...MONO, color: '#0A7A6A' }}>// Join the Conversation</p>
          <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tighter mb-5" style={{ color: '#1A2A3C' }}>Your Market. Your Insights.<br />Your Voice.</h2>
          <p className="text-base leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: '#4A5A70' }}>Whether you're a seasoned CMO in London or a startup marketer in Nairobi — your perspective belongs here.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate('/write')} className="rounded-none font-bold px-10 py-3 h-auto text-xs uppercase tracking-widest text-white" style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)', boxShadow: '0 3px 16px rgba(160,30,44,0.38)' }}>
              <PenLine className="w-4 h-4 mr-2" /> Write Your First Post
            </Button>
            <Button variant="outline" onClick={() => navigate('/about')} className="rounded-none font-bold px-10 py-3 h-auto text-xs uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(30,50,80,0.24)', color: '#1E3050' }}>
              Join the Community
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
EOF
