import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, MapPin, Clock, ArrowRight, Timer } from 'lucide-react';
import { getCategoryColor } from '../utils/colors';

export default function BlogCard({ post, index = 0 }) {
  const timeAgo = getTimeAgo(post.created_at);
  const daysLeft = post.expires_at ? getDaysLeft(post.expires_at) : null;
  const catColor = getCategoryColor(post.category_slug);

  return (
    <Link
      to={`/post/${post.id}`}
      className="group relative overflow-hidden no-underline block transition-all duration-500 hover:-translate-y-1 hover:shadow-lg rounded-xl"
      style={{ animationDelay: `${index * 80}ms` }}
      data-testid={`blog-card-${post.id}`}
    >
      <div
        className="relative h-full flex flex-col rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${catColor.cardFrom} 0%, ${catColor.cardTo} 100%)`,
          border: `1.5px solid ${catColor.cardFrom}`,
        }}
      >
        {/* Cover image (if present) */}
        {post.cover_image && (
          <div className="relative h-36 overflow-hidden">
            <img
              src={`${process.env.REACT_APP_BACKEND_URL}${post.cover_image}`}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}

        <div className="p-5 flex flex-col flex-1">
          {/* Category + expiry */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
              style={{ color: catColor.base, backgroundColor: `${catColor.base}18` }}
              data-testid={`blog-card-category-${post.id}`}
            >
              {post.category_slug.replace(/-/g, ' ')}
            </span>
            {post.is_guest && daysLeft !== null && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${daysLeft <= 7 ? 'text-[#C2544D] bg-[#C2544D]/10' : 'text-brand-grey bg-white/50'}`}
                data-testid={`blog-card-expiry-${post.id}`}
              >
                <Timer className="w-3 h-3 mr-1 inline" />
                {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
              </span>
            )}
            {post.is_sponsored && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-[#C4942A] bg-[#C4942A]/12"
                data-testid={`blog-card-sponsored-${post.id}`}
              >
                Sponsored
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-heading font-bold text-lg mb-2 leading-snug line-clamp-2 transition-colors"
            style={{ color: '#1A4040' }}
            data-testid={`blog-card-title-${post.id}`}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: '#3A5A5A' }}>
            {post.excerpt}
          </p>

          {/* Author row */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: catColor.base }}
            >
              {post.author_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#1A4040' }}>{post.author_name}</p>
              <div className="flex items-center gap-1 text-[10px]" style={{ color: '#5A7A7A' }}>
                <MapPin className="w-2.5 h-2.5" />
                <span>{post.author_city}, {post.author_country}</span>
              </div>
            </div>
          </div>

          {/* Bottom stats bar */}
          <div
            className="flex items-center justify-between pt-3 mt-auto"
            style={{ borderTop: `1px solid ${catColor.base}15` }}
          >
            <div className="flex items-center gap-3 text-[10px]" style={{ color: '#5A7A7A' }}>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" style={{ color: catColor.base }} />{post.likes || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />{post.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{timeAgo}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: catColor.base }}>
              Read <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDaysLeft(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
  return diff;
}
