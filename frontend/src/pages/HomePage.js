import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import BlogCard from '../components/BlogCard';
import FeaturedCarousel from '../components/FeaturedCarousel';
import { ArrowRight, Globe, Users, PenLine, TrendingUp, Search, Flame, Mail, Check, Megaphone, BarChart3, Share2, Brain, Palette, Wrench, Monitor, Cpu, Key, Briefcase, FileText, UserPlus, Edit3, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getCategoryColor, TITLE_COLORS } from '../utils/colors';

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

export default function HomePage() {
  const { categories, stats, API } = useApp();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    axios.get(`${API}/posts?limit=6`).then(res => setPosts(res.data.posts)).catch(() => {});
    axios.get(`${API}/posts/popular/list?limit=4`).then(res => setPopularPosts(res.data)).catch(() => {});
    axios.get(`${API}/posts/featured/list?limit=8`).then(res => setFeaturedPosts(res.data)).catch(() => {});
  }, [API]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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

  // Render the colorful title
  const titleText = 'Blogs4Blocks';
  const renderColorTitle = () => (
    <span>
      {titleText.split('').map((char, i) => (
        <span key={i} style={{ color: TITLE_COLORS[i % TITLE_COLORS.length] }}>
          {char}
        </span>
      ))}
    </span>
  );

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5]" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-28">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left: Text content */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex-1 text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-grey mb-6" data-testid="hero-eyebrow">
                Marketing Insights from Every Block
              </p>

              {/* Title — muted colorful letters */}
              <h1 className="font-heading font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter mb-8 leading-[0.9]" data-testid="hero-title">
                {renderColorTitle()}
              </h1>

              <p className="text-lg md:text-xl text-[#555] mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                A global open forum where marketing professionals share strategies, insights, and real-world experiences from every corner of the world.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mb-10 mx-auto lg:mx-0" data-testid="hero-search-form">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-grey" />
                  <Input placeholder="Search marketing topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 bg-white border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12 text-sm" data-testid="hero-search-input" />
                </div>
                <Button type="submit" className="bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none h-12 px-6 text-xs font-bold uppercase tracking-widest transition-colors" data-testid="hero-search-btn">
                  Search
                </Button>
              </form>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button onClick={() => navigate('/write')} className="bg-[#C2544D] text-white hover:bg-[#A8443E] rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest transition-colors" data-testid="hero-write-btn">
                  <PenLine className="w-4 h-4 mr-2" />
                  Share Your Strategy
                </Button>
                <Button variant="outline" onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })} className="bg-transparent text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest transition-colors" data-testid="hero-explore-btn">
                  Explore Topics
                </Button>
              </div>
            </motion.div>

            {/* Right: Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex-shrink-0 w-64 sm:w-80 md:w-96 lg:w-[420px]"
            >
              <img
                src="/b4b-logo.png"
                alt="Blogs 4 Blocks"
                className="w-full h-auto drop-shadow-xl"
                data-testid="hero-logo"
              />
            </motion.div>
          </div>

          {/* Stats strip */}
          {stats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-[#E5E5E5]/60 justify-center lg:justify-start">
              {[
                { icon: <TrendingUp className="w-4 h-4" />, value: stats.total_posts, label: 'Posts', color: '#C4942A' },
                { icon: <Users className="w-4 h-4" />, value: stats.total_users || 0, label: 'Contributors', color: '#3D6B8E' },
                { icon: <Globe className="w-4 h-4" />, value: stats.total_countries || 0, label: 'Countries', color: '#2D8B7A' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <span className="font-heading font-black text-2xl text-[#1A1A1A]">{stat.value}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-grey">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* FEATURED CAROUSEL */}
      {featuredPosts.length > 0 && <FeaturedCarousel posts={featuredPosts} />}

      {/* CATEGORIES SECTION */}
      <section id="categories" className="py-20 md:py-28" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-grey mb-3">Explore</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight text-[#1A1A1A]" data-testid="categories-heading">
              Marketing Topics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="categories-grid">
            {categories.map((cat, i) => {
              const color = getCategoryColor(cat.slug);
              return (
                <motion.div key={cat.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="relative block overflow-hidden no-underline group transition-all duration-300 hover:-translate-y-1 hover:shadow-md rounded-xl"
                    data-testid={`category-card-${cat.slug}`}
                  >
                    <div
                      className="relative p-5 min-h-[150px] flex flex-col justify-between rounded-xl overflow-hidden"
                      style={{
                        background: `linear-gradient(145deg, ${color.cardFrom} 0%, ${color.cardTo} 100%)`,
                        border: `1.5px solid ${color.cardFrom}`,
                      }}
                    >
                      <div>
                        <span className="mb-3 block transition-colors" style={{ color: color.base }}>
                          {CATEGORY_ICONS[cat.slug] || <BarChart3 className="w-5 h-5" />}
                        </span>
                        <h3 className="font-heading font-bold text-base mb-1 group-hover:translate-x-0.5 transition-transform" style={{ color: '#1A4040' }}>
                          {cat.name}
                        </h3>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#3A5A5A' }}>{cat.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: color.base }}>
                          {cat.post_count} posts
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: color.base }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LATEST POSTS */}
      <section className="py-20 md:py-28 border-t border-[#E5E5E5]" data-testid="latest-posts-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-grey mb-3">Fresh Perspectives</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight text-[#1A1A1A]" data-testid="latest-heading">
                Latest Discussions
              </h2>
            </div>
            <Link to="/category/all" className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C2544D] hover:text-[#A8443E] no-underline transition-colors" data-testid="view-all-posts">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="posts-grid">
            {posts.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>

          <div className="sm:hidden mt-10 text-center">
            <Link to="/category/all" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C2544D] no-underline" data-testid="view-all-posts-mobile">
              View All Posts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* POPULAR POSTS */}
      {popularPosts.length > 0 && (
        <section className="py-20 md:py-28 border-t border-[#E5E5E5]" data-testid="popular-posts-section">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-5 h-5 text-[#C2544D]" />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-grey">Most Engaged</p>
              </div>
              <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight text-[#1A1A1A]" data-testid="popular-heading">
                Trending Now
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="popular-posts-grid">
              {popularPosts.map((post, i) => (
                <BlogCard key={post.id} post={post} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW-TO CARD + STATS */}
      <section className="py-20 md:py-28 border-t border-[#E5E5E5]" data-testid="howto-stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* How-to Card */}
            <div className="relative overflow-hidden border border-[#E5E5E5]" style={{ background: 'linear-gradient(45deg, transparent 50%, #2D8B7A12 100%), #FFFFFF' }} data-testid="howto-card">
              <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #2D8B7A, #2D8B7A44)' }} />
              <div className="p-8 md:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2D8B7A] mb-4">Getting Started</p>
                <h3 className="font-heading font-bold text-2xl text-[#1A1A1A] mb-6">
                  How to Share a Post
                </h3>
                <div className="space-y-5">
                  {[
                    { step: '01', icon: <UserPlus className="w-4 h-4" />, title: 'Create an account (or post as guest)', desc: 'Sign up for a free account or skip and post as a guest — your choice. Guest posts stay live for 30 days.' },
                    { step: '02', icon: <Edit3 className="w-4 h-4" />, title: 'Click "Write" and pick a topic', desc: 'Choose a marketing category that fits, add a title, and use our editor to write your post. Add images, formatting, and tags.' },
                    { step: '03', icon: <Send className="w-4 h-4" />, title: 'Hit "Publish" and join the conversation', desc: 'Your post goes live immediately. Readers can like, comment, and share. You\'ll get notified about engagement.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4" data-testid={`howto-step-${i}`}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#2D8B7A' }}>
                        {item.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#2D8B7A]">{item.icon}</span>
                          <h4 className="font-heading font-bold text-sm text-[#1A1A1A]">{item.title}</h4>
                        </div>
                        <p className="text-xs text-brand-grey leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => navigate('/write')} className="mt-8 bg-[#2D8B7A] text-white hover:bg-[#247062] rounded-none font-bold px-6 py-2.5 h-auto text-xs uppercase tracking-widest transition-colors" data-testid="howto-write-btn">
                  <PenLine className="w-4 h-4 mr-2" /> Start Writing Now
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at bottom left, #2D8B7A12 0%, transparent 70%)' }} />
            </div>

            {/* Analytics / Community Stats Card */}
            <div className="relative overflow-hidden border border-[#E5E5E5]" style={{ background: 'linear-gradient(45deg, transparent 50%, #3D6B8E12 100%), #FFFFFF' }} data-testid="analytics-card">
              <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #3D6B8E, #3D6B8E44)' }} />
              <div className="p-8 md:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#3D6B8E] mb-4">Community Pulse</p>
                <h3 className="font-heading font-bold text-2xl text-[#1A1A1A] mb-8">
                  By the Numbers
                </h3>
                {stats && (
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { value: stats.total_posts, label: 'Published Posts', icon: <FileText className="w-5 h-5" />, color: '#C4942A' },
                      { value: stats.total_comments, label: 'Discussions', icon: <Mail className="w-5 h-5" />, color: '#B4687A' },
                      { value: stats.total_users || 0, label: 'Contributors', icon: <Users className="w-5 h-5" />, color: '#3D6B8E' },
                      { value: stats.total_countries || 0, label: 'Countries', icon: <Globe className="w-5 h-5" />, color: '#2D8B7A' },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="p-5 border border-[#E5E5E5] relative overflow-hidden"
                        style={{ background: `linear-gradient(45deg, transparent 60%, ${stat.color}10 100%)` }}
                        data-testid={`stat-card-${i}`}
                      >
                        <span style={{ color: stat.color }} className="mb-3 block">{stat.icon}</span>
                        <div className="font-heading font-black text-3xl text-[#1A1A1A] mb-1">{stat.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-grey">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => navigate('/about')} className="rounded-none border-[#3D6B8E] text-[#3D6B8E] hover:bg-[#3D6B8E] hover:text-white font-bold text-xs uppercase tracking-widest transition-colors" data-testid="stats-about-btn">
                    About Our Community
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/auth')} className="rounded-none border-[#E5E5E5] text-[#1A1A1A] hover:border-[#1A1A1A] font-bold text-xs uppercase tracking-widest transition-colors" data-testid="stats-join-btn">
                    Join In
                  </Button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at bottom left, #3D6B8E12 0%, transparent 70%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="py-20 md:py-28 border-t border-[#E5E5E5]" data-testid="newsletter-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-[#1A1A1A] p-10 md:p-16 relative overflow-hidden">
            {/* Subtle colored gradient in corner */}
            <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle at bottom left, #C2544D20 0%, transparent 60%)' }} />
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, #3D6B8E15 0%, transparent 60%)' }} />

            <div className="relative max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#C4942A] mb-6">Weekly Digest</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4 tracking-tight leading-tight" data-testid="newsletter-heading">
                Get the best marketing insights delivered weekly
              </h2>
              <p className="text-[#999] text-sm leading-relaxed mb-8">
                Join the community. Every Monday, we curate the top posts, trending topics, and fresh perspectives from marketing professionals worldwide.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-[#2D8B7A] font-semibold text-sm" data-testid="newsletter-success">
                  <Check className="w-5 h-5" /> You're subscribed! Check your inbox on Monday.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md" data-testid="newsletter-form">
                  <Input type="email" placeholder="your@email.com" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required className="bg-white/10 border-[#333] text-white placeholder:text-[#666] rounded-none h-12 text-sm focus:border-[#C4942A]" data-testid="newsletter-email-input" />
                  <Button type="submit" disabled={subscribing} className="bg-[#C4942A] text-white hover:bg-[#A87E22] rounded-none h-12 px-6 font-bold uppercase tracking-widest text-xs transition-colors" data-testid="newsletter-submit-btn">
                    {subscribing ? '...' : 'Subscribe'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 md:py-28 border-t border-[#E5E5E5]" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-grey mb-6">Join the Conversation</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-[#1A1A1A] mb-6 tracking-tight" data-testid="cta-heading">
              Your Market. Your Insights. Your Voice.
            </h2>
            <p className="text-base text-brand-grey max-w-lg mx-auto mb-10 leading-relaxed">
              Whether you're a seasoned CMO in London or a startup marketer in Nairobi — your perspective matters.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => navigate('/write')} className="bg-[#C2544D] text-white hover:bg-[#A8443E] rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest transition-colors" data-testid="cta-write-btn">
                <PenLine className="w-4 h-4 mr-2" />
                Write Your First Post
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest transition-colors" data-testid="cta-join-btn">
                Join the Community
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
