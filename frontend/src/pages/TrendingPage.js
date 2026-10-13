import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import BlogCard from '../components/BlogCard';
import { Flame, PenLine, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const CENTURY_GOTHIC = { fontFamily: "'Century Gothic', 'Avenir Next', 'Montserrat', sans-serif", fontWeight: 900 };

export default function TrendingPage() {
  const { API } = useApp();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/posts/popular/list?limit=24`)
      .then(res => setPosts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API]);

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
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-4 h-4" style={{ color: '#C04030' }} />
              <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ ...MONO, color: '#0A7A6A' }}>
                // Most Engaged
              </p>
            </div>
            <h1
              className="text-4xl md:text-5xl uppercase leading-tight mb-4"
              style={{ ...CENTURY_GOTHIC, color: '#B00018' }}
            >
              Trending Now
            </h1>
            <p className="text-base md:text-lg max-w-2xl" style={{ color: '#2A3C50' }}>
              The most-read, most-liked, and most-discussed strategies from the Blogs 4 Blocks community — sorted by the crowd, not the algorithm.
            </p>
          </motion.div>

          <motion.div
            className="flex gap-4 mt-8 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              onClick={() => navigate('/write')}
              className="rounded-none font-bold px-6 py-2 h-auto text-xs uppercase tracking-widest text-white"
              style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 48%, #7E1420 100%)' }}
            >
              <PenLine className="w-4 h-4 mr-2" /> Add Your Voice
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/discussions')}
              className="rounded-none font-bold px-6 py-2 h-auto text-xs uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(30,50,80,0.24)', color: '#1E3050', backdropFilter: 'blur(8px)' }}
            >
              <Globe className="w-4 h-4 mr-2" /> All Discussions
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Trending grid with float animation ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#C04030] rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-32">
              <p className="text-lg font-bold" style={{ color: '#1A2A3C' }}>No trending posts yet.</p>
              <p className="text-sm mt-2" style={{ color: '#4A5A70' }}>Start contributing — your post could be the first to trend.</p>
              <Button
                onClick={() => navigate('/write')}
                className="mt-6 rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest text-white"
                style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)' }}
              >
                <PenLine className="w-4 h-4 mr-2" /> Write Now
              </Button>
            </div>
          ) : (
            <>
              {/* Top pick — larger feature card */}
              {posts[0] && (
                <motion.div
                  className="mb-10 float-card-wrapper"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <div
                    className="p-6 md:p-10 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.72)',
                      backdropFilter: 'blur(14px)',
                      border: '2px solid #C04030',
                      boxShadow: '0 4px 28px rgba(192,64,48,0.12)',
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3" style={{ ...MONO, color: '#C04030' }}>
                      🔥 #1 Trending
                    </p>
                    <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2" style={{ color: '#1A2A3C' }}>
                      {posts[0].title}
                    </h2>
                    <p className="text-sm leading-relaxed mb-4 max-w-3xl" style={{ color: '#4A5A70' }}>
                      {posts[0].excerpt}
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: '#0A7A6A' }}>
                        {posts[0].author_name} · {posts[0].author_city}, {posts[0].author_country}
                      </span>
                      <Button
                        onClick={() => navigate(`/post/${posts[0].id}`)}
                        className="rounded-none font-bold px-6 py-2 h-auto text-xs uppercase tracking-widest text-white"
                        style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)' }}
                      >
                        Read It <span className="ml-1">→</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Rest of trending grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(1).map((post, i) => (
                  <div key={post.id} className="float-card-wrapper">
                    <BlogCard post={post} index={i} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
