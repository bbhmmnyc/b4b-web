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
      className="relative border-b border-[#E5E5E5] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid="featured-carousel"
    >
      {/* Background gradient based on current post category */}
      <div
        className="absolute inset-0 opacity-30 transition-all duration-700"
        style={{ background: `linear-gradient(135deg, ${catColor.cardFrom} 0%, ${catColor.cardTo} 60%, #FDFCF8 100%)` }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: catColor.base }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey">
              Featured & Sponsored
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-grey font-medium">
              {current + 1} / {posts.length}
            </span>
            <button
              onClick={prev}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] hover:border-[#1A1A1A] transition-colors bg-white/80"
              data-testid="carousel-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] hover:border-[#1A1A1A] transition-colors bg-white/80"
              data-testid="carousel-next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Text content — 3 cols */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
                style={{ color: catColor.base, backgroundColor: `${catColor.base}18` }}
              >
                {post.category_slug.replace(/-/g, ' ')}
              </span>
              {post.is_sponsored && (
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-[#C4942A]/15 text-[#C4942A]" data-testid="sponsored-badge">
                  Sponsored
                </span>
              )}
              {!post.is_sponsored && (
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-[#2D8B7A]/15 text-[#2D8B7A]">
                  Featured
                </span>
              )}
            </div>

            <Link to={`/post/${post.id}`} className="no-underline group">
              <h2
                className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl text-[#1A1A1A] mb-4 leading-tight tracking-tight group-hover:text-[#333] transition-colors"
                data-testid="featured-title"
              >
                {post.title}
              </h2>
            </Link>

            <p className="text-base text-[#555] leading-relaxed mb-5 line-clamp-2 max-w-2xl">
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
                  <p className="text-sm font-semibold text-[#1A1A1A]">{post.author_name}</p>
                  <p className="text-[10px] text-brand-grey flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {post.author_city}, {post.author_country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-brand-grey">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" style={{ color: catColor.base }} /> {post.likes || 0}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
              </div>
            </div>

            {/* Sponsor branding */}
            {post.is_sponsored && post.sponsor_name && (
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-grey" data-testid="sponsor-info">
                <span className="font-medium">Presented by</span>
                {post.sponsor_url ? (
                  <a
                    href={post.sponsor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#C4942A] hover:underline flex items-center gap-1"
                  >
                    {post.sponsor_name} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-bold text-[#C4942A]">{post.sponsor_name}</span>
                )}
              </div>
            )}
          </div>

          {/* Visual card — 2 cols */}
          <div className="lg:col-span-2">
            <Link to={`/post/${post.id}`} className="no-underline block group">
              <div
                className="relative rounded-xl overflow-hidden p-6 min-h-[200px] flex flex-col justify-end transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                style={{
                  background: `linear-gradient(145deg, ${catColor.cardFrom} 0%, ${catColor.cardTo} 100%)`,
                  border: `1.5px solid ${catColor.cardFrom}`,
                }}
                data-testid="featured-card"
              >
                {post.cover_image && (
                  <img
                    src={`${process.env.REACT_APP_BACKEND_URL}${post.cover_image}`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                )}
                <div className="relative">
                  <span className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: catColor.base }}>
                    Read Full Post
                  </span>
                  <h3 className="font-heading font-bold text-lg leading-snug" style={{ color: '#1A4040' }}>
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
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-1.5' : 'w-1.5 h-1.5 opacity-40 hover:opacity-70'}`}
              style={{ backgroundColor: i === current ? catColor.base : '#999' }}
              data-testid={`carousel-dot-${i}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
