import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, ExternalLink, MapPin, Heart, Eye } from 'lucide-react';
import { getCategoryColor } from '../utils/colors';

export default function FeaturedCarousel({ posts }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % posts.length);
  }, [posts.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    if (paused || posts.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, posts.length]);

  if (!posts || posts.length === 0) return null;

  const post = posts[current];
  const catColor = getCategoryColor(post.category_slug);

  return (
    <section
      className="relative overflow-hidden"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid="featured-carousel"
    >
      {/* Background: dark with a very subtle category color bleed */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, ${catColor.base}12 0%, transparent 60%), #080C14`,
        }}
      />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5" style={{ color: catColor.base }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Featured &amp; Sponsored
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs text-slate-600 font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {String(current + 1).padStart(2, '0')} / {String(posts.length).padStart(2, '0')}
            </span>
            <button
              onClick={prev}
              className="w-8 h-8 flex items-center justify-center transition-all text-slate-400 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
              data-testid="carousel-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="w-8 h-8 flex items-center justify-center transition-all text-slate-400 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
              data-testid="carousel-next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Text — 3 cols */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
                style={{ color: catColor.base, backgroundColor: `${catColor.base}18`, border: `1px solid ${catColor.base}30` }}
              >
                {post.category_slug.replace(/-/g, ' ')}
              </span>
              {post.is_sponsored && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
                  style={{ color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                  data-testid="sponsored-badge"
                >
                  Sponsored
                </span>
              )}
              {!post.is_sponsored && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
                  style={{ color: '#14B8A6', backgroundColor: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}
                >
                  Featured
                </span>
              )}
            </div>

            <Link to={`/post/${post.id}`} className="no-underline group">
              <h2
                className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl mb-4 leading-tight tracking-tight transition-colors"
                style={{ color: '#F1F5F9' }}
                data-testid="featured-title"
              >
                {post.title}
              </h2>
            </Link>

            <p className="text-base leading-relaxed mb-5 line-clamp-2 max-w-2xl" style={{ color: '#64748B' }}>
              {post.excerpt}
            </p>

            {/* Author + stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: catColor.base }}
                >
                  {post.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">{post.author_name}</p>
                  <p className="text-[10px] text-slate-600 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {post.author_city}, {post.author_country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" style={{ color: catColor.base }} /> {post.likes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {post.views || 0}
                </span>
              </div>
            </div>

            {/* Sponsor branding */}
            {post.is_sponsored && post.sponsor_name && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-600" data-testid="sponsor-info">
                <span className="font-medium">Presented by</span>
                {post.sponsor_url ? (
                  <a
                    href={post.sponsor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:underline flex items-center gap-1"
                    style={{ color: '#F59E0B' }}
                  >
                    {post.sponsor_name} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-bold" style={{ color: '#F59E0B' }}>{post.sponsor_name}</span>
                )}
              </div>
            )}
          </div>

          {/* Visual card — 2 cols */}
          <div className="lg:col-span-2">
            <Link to={`/post/${post.id}`} className="no-underline block group">
              <div
                className="relative rounded-xl overflow-hidden p-6 min-h-[200px] flex flex-col justify-end transition-all duration-300 group-hover:-translate-y-1"
                style={{
                  background: `linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderLeft: `2px solid ${catColor.base}`,
                  boxShadow: `0 0 30px ${catColor.base}18`,
                }}
                data-testid="featured-card"
              >
                {post.cover_image && (
                  <img
                    src={`${process.env.REACT_APP_BACKEND_URL}${post.cover_image}`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                  />
                )}
                <div className="relative">
                  <span
                    className="text-xs font-bold uppercase tracking-widest mb-2 block"
                    style={{ color: catColor.base, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Read Full Post →
                  </span>
                  <h3 className="font-heading font-bold text-lg leading-snug text-slate-200">
                    {post.title}
                  </h3>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-8" data-testid="carousel-dots">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? '1.5rem' : '6px',
                height: '6px',
                backgroundColor: i === current ? catColor.base : 'rgba(255,255,255,0.2)',
                opacity: i === current ? 1 : 0.5,
              }}
              data-testid={`carousel-dot-${i}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
