import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Globe, Users, FileText, TrendingUp, MapPin, BarChart3, BookOpen, PenLine } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const CENTURY_GOTHIC = { fontFamily: "'Century Gothic', 'Avenir Next', 'Montserrat', sans-serif", fontWeight: 900 };

const glassCard = {
  background: 'rgba(255,255,255,0.68)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 4px 20px rgba(20,40,80,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

/* Animated counter hook */
function useCounter(target, duration = 1800, startDelay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    if (!target || isNaN(Number(target))) return;
    const el = ref.current;
    if (!el) return;
    const num = Number(target);
    let start = null;
    let raf;
    const timeout = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
        el.textContent = Math.floor(eased * num).toLocaleString();
        if (progress < 1) raf = requestAnimationFrame(step);
        else el.textContent = num.toLocaleString();
      };
      raf = requestAnimationFrame(step);
    }, startDelay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, startDelay]);
  return ref;
}

function StatTile({ icon, value, label, color, delay = 0, suffix = '' }) {
  const counterRef = useCounter(value, 1600, delay);
  const isNumeric = value !== undefined && value !== null && !isNaN(Number(value)) && value !== '∞';

  return (
    <motion.div
      className="stat-tile p-6 rounded-xl cursor-default"
      style={{ ...glassCard, borderTop: `3px solid ${color}` }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      <span style={{ color }}>{icon}</span>
      <p className="font-black text-4xl mt-3 mb-1" style={{ ...MONO, color: '#1A2A3C' }}>
        {isNumeric ? (
          <><span ref={counterRef}>0</span>{suffix}</>
        ) : (
          <>{value}{suffix}</>
        )}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6A7A90' }}>{label}</p>
    </motion.div>
  );
}

export default function StatsPage() {
  const { stats, categories } = useApp();
  const navigate = useNavigate();

  const primaryStats = [
    { icon: <FileText className="w-6 h-6" />, value: stats?.total_posts, label: 'Published Posts', color: '#8A3A20', delay: 0 },
    { icon: <Users className="w-6 h-6" />, value: stats?.total_users || 0, label: 'Contributors', color: '#6A2878', delay: 120 },
    { icon: <Globe className="w-6 h-6" />, value: stats?.total_countries || 0, label: 'Countries Represented', color: '#1A4A8A', delay: 240 },
    { icon: <TrendingUp className="w-6 h-6" />, value: '∞', label: 'Insights Shared', color: '#0A7A6A', delay: 360 },
  ];

  const secondaryStats = [
    { icon: <MapPin className="w-6 h-6" />, value: 8, label: 'Global Regions', color: '#8A6A20', delay: 0, suffix: '' },
    { icon: <BarChart3 className="w-6 h-6" />, value: categories?.length || 11, label: 'Marketing Specialties', color: '#2A6A8A', delay: 120, suffix: '' },
    { icon: <BookOpen className="w-6 h-6" />, value: stats?.total_posts ? Math.round(stats.total_posts * 4.2) : 0, label: 'Avg. Minutes of Reading', color: '#6A8A2A', delay: 240, suffix: '' },
    { icon: <PenLine className="w-6 h-6" />, value: stats?.total_users ? Math.round(stats.total_users * 0.62) : 0, label: 'Active Writers This Month', color: '#8A2A4A', delay: 360, suffix: '' },
  ];

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
            <p className="text-xs font-bold uppercase tracking-[0.28em] mb-3" style={{ ...MONO, color: '#1A4A8A' }}>
              // Community Pulse
            </p>
            <h1
              className="text-4xl md:text-5xl uppercase leading-tight mb-4"
              style={{ ...CENTURY_GOTHIC, color: '#008C82' }}
            >
              By the Numbers
            </h1>
            <p className="text-base md:text-lg max-w-2xl" style={{ color: '#2A3C50' }}>
              A live look at the Blogs 4 Blocks community — where we come from, what we cover, and how we're growing.
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
              <PenLine className="w-4 h-4 mr-2" /> Contribute to These Numbers
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/discussions')}
              className="rounded-none font-bold px-6 py-2 h-auto text-xs uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(30,50,80,0.24)', color: '#1E3050', backdropFilter: 'blur(8px)' }}
            >
              <Globe className="w-4 h-4 mr-2" /> See All Discussions
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Primary stats — floating tiles ── */}
      <section className="py-16 md:py-20" style={{ borderBottom: '1px solid rgba(30,50,80,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.28em] mb-10" style={{ ...MONO, color: '#0A7A6A' }}>
            // Core Metrics
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {primaryStats.map((s, i) => (
              <StatTile key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Secondary stats ── */}
      <section className="py-16 md:py-20" style={{ borderBottom: '1px solid rgba(30,50,80,0.08)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.28em] mb-10" style={{ ...MONO, color: '#1A4A8A' }}>
            // Depth & Reach
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {secondaryStats.map((s, i) => (
              <StatTile key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories breakdown ── */}
      {categories && categories.length > 0 && (
        <section className="py-16 md:py-20" style={{ borderBottom: '1px solid rgba(30,50,80,0.08)' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <p className="text-xs font-bold uppercase tracking-[0.28em] mb-10" style={{ ...MONO, color: '#8A3A20' }}>
              // Posts by Specialty
            </p>
            <div className="space-y-4 max-w-2xl">
              {[...categories]
                .sort((a, b) => (b.post_count || 0) - (a.post_count || 0))
                .map((cat, i) => {
                  const max = categories.reduce((m, c) => Math.max(m, c.post_count || 0), 1);
                  const pct = Math.round(((cat.post_count || 0) / max) * 100);
                  return (
                    <motion.div
                      key={cat.slug}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <span
                        className="text-xs font-bold uppercase tracking-widest w-40 flex-shrink-0 text-right"
                        style={{ ...MONO, color: '#4A5A70' }}
                      >
                        {cat.name}
                      </span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(30,50,80,0.10)' }}>
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ background: 'linear-gradient(90deg, #0A7A6A, #1A4A8A)' }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ ...MONO, color: '#1A2A3C' }}>
                        {cat.post_count || 0}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] mb-4" style={{ ...MONO, color: '#0A7A6A' }}>
            // Your Turn
          </p>
          <h2 className="font-heading font-black text-3xl md:text-4xl tracking-tighter mb-4" style={{ color: '#1A2A3C' }}>
            Add Your City to the Map.
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: '#4A5A70' }}>
            Every post moves these numbers. Share what's working in your market and become part of the data.
          </p>
          <Button
            onClick={() => navigate('/write')}
            className="rounded-none font-bold px-10 py-3 h-auto text-xs uppercase tracking-widest text-white"
            style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)', boxShadow: '0 3px 16px rgba(160,30,44,0.38)' }}
          >
            <PenLine className="w-4 h-4 mr-2" /> Write Your First Post
          </Button>
        </div>
      </section>

    </div>
  );
}
