import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import BlogCard from '../components/BlogCard';
import { ArrowRight, Globe, PenLine, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const CENTURY_GOTHIC = { fontFamily: "'Century Gothic', 'Avenir Next', 'Montserrat', sans-serif", fontWeight: 900 };

const PAGE_SIZE = 12;

export default function DiscussionsPage() {
  const { API } = useApp();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(async (pageNum = 1, search = '') => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE };
      if (search) params.search = search;
      const res = await axios.get(`${API}/posts`, { params });
      const incoming = res.data.posts || [];
      if (pageNum === 1) {
        setPosts(incoming);
      } else {
        setPosts(prev => [...prev, ...incoming]);
      }
      setHasMore(incoming.length === PAGE_SIZE);
    } catch {
      // silent fail — existing posts stay visible
    }
    setLoading(false);
  }, [API]);

  useEffect(() => {
    fetchPosts(1, '');
  }, [fetchPosts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts(1, searchQuery.trim());
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, searchQuery.trim());
  };

  return (
    <div className="min-h-screen">

      {/* ── Page header ── */}
      <section
        className="relative overflow-hidden py-16 md:py-24"
        style={{ borderBottom: '1px solid rgba(30,50,80,0.10)' }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.28em] mb-3" style={{ ...MONO, color: '#0A7A6A' }}>
              // Latest Contributions
            </p>
            <h1
              className="text-4xl md:text-5xl uppercase leading-tight mb-4"
              style={{ ...CENTURY_GOTHIC, color: '#003F9E' }}
            >
              Global Discussions
            </h1>
            <p className="text-base md:text-lg max-w-2xl" style={{ color: '#2A3C50' }}>
              Real strategies and honest insights from marketing professionals across every market, discipline, and timezone.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            className="flex gap-3 max-w-xl mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6A7A90' }} />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 rounded-none h-12 text-sm border-0"
                style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(30,50,80,0.8)', color: '#1A2A3C', backdropFilter: 'blur(8px)' }}
              />
            </div>
            <Button
              type="submit"
              className="rounded-none h-12 px-6 text-xs font-bold uppercase tracking-widest text-white"
              style={{ background: 'linear-gradient(155deg, #0A8A78 0%, #077060 50%, #055048 100%)' }}
            >
              Search
            </Button>
          </motion.form>

          {/* Quick CTAs */}
          <motion.div
            className="flex gap-4 mt-6 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <Button
              onClick={() => navigate('/write')}
              className="rounded-none font-bold px-6 py-2 h-auto text-xs uppercase tracking-widest text-white"
              style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 48%, #7E1420 100%)' }}
            >
              <PenLine className="w-4 h-4 mr-2" /> Share Your Strategy
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/category/all')}
              className="rounded-none font-bold px-6 py-2 h-auto text-xs uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(30,50,80,0.24)', color: '#1E3050', backdropFilter: 'blur(8px)' }}
            >
              <Globe className="w-4 h-4 mr-2" /> Browse by Topic
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Posts grid with float animation ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {loading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A7A6A] rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-lg font-bold" style={{ color: '#1A2A3C' }}>No discussions found.</p>
              <p className="text-sm mt-2" style={{ color: '#4A5A70' }}>Try a different search or be the first to contribute.</p>
              <Button
                onClick={() => navigate('/write')}
                className="mt-6 rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest text-white"
                style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)' }}
              >
                <PenLine className="w-4 h-4 mr-2" /> Write First
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, i) => (
                  <div key={post.id} className="float-card-wrapper">
                    <BlogCard post={post} index={i} />
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    className="rounded-none font-bold px-10 py-3 h-auto text-xs uppercase tracking-widest"
                    style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(30,50,80,0.28)', color: '#1E3050' }}
                  >
                    {loading ? 'Loading...' : (
                      <><ArrowRight className="w-4 h-4 mr-2 rotate-90" /> Load More</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

    </div>
  );
}
