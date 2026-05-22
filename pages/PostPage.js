import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { useApp } from '../context/AppContext';
import CommentSection from '../components/CommentSection';
import { ArrowLeft, Heart, Eye, MapPin, Clock, Tag, Timer, Pencil, Trash2, Facebook, Twitter, Linkedin, Link2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import BlogCard from '../components/BlogCard';
import { toast } from 'sonner';

export default function PostPage() {
  const { id } = useParams();
  const { API, token, user } = useApp();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/posts/${id}`);
      setPost(res.data);
      axios.get(`${API}/posts/${id}/related`).then(r => setRelated(r.data)).catch(() => {});
      if (token) {
        axios.get(`${API}/posts/${id}/liked`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => setLiked(r.data.liked))
          .catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [API, id, token]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/posts/${id}/like`, {}, { headers });
      setPost(prev => ({ ...prev, likes: res.data.likes }));
      setLiked(res.data.liked);
      toast.success(res.data.liked ? 'Thanks for the love!' : 'Like removed');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Post deleted');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
    setDeleting(false);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const handleShare = (platform) => {
    const urls = {
      copy: () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); },
      twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
      facebook: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
      linkedin: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank'),
    };
    urls[platform]?.();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#E5E5E5] border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" data-testid="post-not-found">
        <p className="text-brand-grey text-lg">Post not found</p>
        <Link to="/" className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] no-underline">Back to Home</Link>
      </div>
    );
  }

  const isAuthor = user && post.author_id === user.id;
  const isCoAuthor = user && post.co_authors?.some(ca => ca.id === user.id);
  const isAdmin = user?.is_admin;
  const canEdit = isAuthor || isCoAuthor || isAdmin;

  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="font-heading font-bold text-xl mt-6 mb-3 text-[#1A1A1A]">{line.replace(/\*\*/g, '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 text-[#404040] leading-relaxed">{renderInlineFormatting(line.substring(2))}</li>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <li key={i} className="ml-4 text-[#404040] leading-relaxed list-decimal">{renderInlineFormatting(line.replace(/^\d+\.\s/, ''))}</li>;
      }
      if (line.startsWith('| ')) {
        return <p key={i} className="text-sm text-brand-grey font-mono bg-[#F4F4F5] px-3 py-1">{line}</p>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-[#404040] leading-relaxed mb-2">{renderInlineFormatting(line)}</p>;
    });
  };

  const renderInlineFormatting = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[#1A1A1A]">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
  };


  const sanitizeHtml = (html) => DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });

  const isHtmlContent = (content) => {
    return content && (content.includes('<p>') || content.includes('<h') || content.includes('<ul>') || content.includes('<ol>') || content.includes('<blockquote>'));
  };

  return (
    <div className="min-h-screen" data-testid="post-page">
      {/* Header bar */}
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link to={`/category/${post.category_slug}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-grey hover:text-[#1A1A1A] no-underline transition-colors" data-testid="post-back-link">
            <ArrowLeft className="w-3.5 h-3.5" /> {post.category_slug.replace(/-/g, ' ')}
          </Link>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/write?edit=${post.id}`)}
                  className="rounded-none border-[#E5E5E5] h-8"
                  data-testid="post-edit-btn"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-none border-[#E5E5E5] text-brand-red hover:text-brand-red hover:bg-brand-red/5 h-8"
                  data-testid="post-delete-btn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              className={`rounded-none h-8 transition-colors ${liked ? 'bg-brand-red text-white border-brand-red' : 'border-[#E5E5E5]'}`}
              data-testid="post-like-btn"
            >
              <Heart className={`w-3.5 h-3.5 mr-1.5 ${liked ? 'fill-current' : ''}`} />
              {post.likes || 0}
            </Button>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20">
        {/* Category */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-grey" data-testid="post-category-badge">
            {post.category_slug.replace(/-/g, ' ')}
          </span>
          {post.subcategory && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-grey border-l border-[#E5E5E5] pl-3" data-testid="post-subcategory-badge">
              {post.subcategory.replace(/-/g, ' ')}
            </span>
          )}
          {post.is_sponsored && (
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-[#C4942A]/15 text-[#C4942A]" data-testid="post-sponsored-badge">
              Sponsored
            </span>
          )}
        </div>

        {/* Sponsor branding bar */}
        {post.is_sponsored && post.sponsor_name && (
          <div className="flex items-center gap-3 mb-6 p-4 border border-[#C4942A]/20" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FDFCF8 100%)' }} data-testid="post-sponsor-bar">
            <span className="text-xs text-brand-grey font-medium">Presented by</span>
            {post.sponsor_url ? (
              <a href={post.sponsor_url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm text-[#C4942A] hover:underline no-underline">
                {post.sponsor_name}
              </a>
            ) : (
              <span className="font-bold text-sm text-[#C4942A]">{post.sponsor_name}</span>
            )}
          </div>
        )}

        {/* Title */}
        <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-[#1A1A1A] mb-8 leading-tight" data-testid="post-title">
          {post.title}
        </h1>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="overflow-hidden mb-10 border border-[#E5E5E5]" data-testid="post-cover-image">
            <img
              src={`${process.env.REACT_APP_BACKEND_URL}${post.cover_image}`}
              alt={post.title}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* Author + meta */}
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-[#E5E5E5]">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold bg-[#1A1A1A]">
            {post.author_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[#1A1A1A]">{post.author_name}</p>
              {post.co_authors?.length > 0 && (
                <span className="text-sm text-brand-grey">
                  &amp; {post.co_authors.map(ca => ca.name).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-grey">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{post.author_city}, {post.author_country}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm text-brand-grey">
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.views}</span>
            <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{post.likes}</span>
          </div>
        </div>

        {/* Content */}
        <div className="blog-content text-base md:text-lg" data-testid="post-content">
          {isHtmlContent(post.content) ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
          ) : (
            renderContent(post.content)
          )}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex items-center gap-2 mt-12 pt-8 border-t border-[#E5E5E5] flex-wrap" data-testid="post-tags">
            <Tag className="w-4 h-4 text-brand-grey" />
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] font-bold uppercase tracking-widest rounded-none">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Social Sharing */}
        <div className="mt-8 pt-8 border-t border-[#E5E5E5]" data-testid="post-social-share">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-4">Share this post</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="rounded-none border-[#E5E5E5] gap-2 hover:border-[#1A1A1A] text-xs" data-testid="share-twitter">
              <Twitter className="w-3.5 h-3.5" /> Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')} className="rounded-none border-[#E5E5E5] gap-2 hover:border-[#1A1A1A] text-xs" data-testid="share-linkedin">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('facebook')} className="rounded-none border-[#E5E5E5] gap-2 hover:border-[#1A1A1A] text-xs" data-testid="share-facebook">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="rounded-none border-[#E5E5E5] gap-2 hover:border-[#1A1A1A] text-xs" data-testid="share-copy">
              <Link2 className="w-3.5 h-3.5" /> Copy
            </Button>
          </div>
        </div>

        {/* Guest post expiration notice */}
        {post.is_guest && post.expires_at && (
          (() => {
            const daysLeft = Math.ceil((new Date(post.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
            const isExpired = post.is_expired || daysLeft <= 0;
            return (
              <div className={`mt-8 border p-5 text-sm flex items-start gap-3 ${isExpired ? 'bg-brand-red/5 border-brand-red/20 text-brand-red' : daysLeft <= 7 ? 'bg-brand-yellow/10 border-brand-yellow/30 text-[#92400E]' : 'bg-brand-yellow/5 border-brand-yellow/20 text-[#92400E]'}`} data-testid="post-guest-notice">
                <Timer className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  {isExpired ? (
                    <p className="font-medium">This guest post has expired and is no longer publicly listed.</p>
                  ) : (
                    <p>This is a guest post. It will expire on <strong>{new Date(post.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> ({daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining). Register an account to post permanently!</p>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* Comment Section */}
        <div className="mt-16 pt-10 border-t border-[#E5E5E5]">
          <CommentSection postId={post.id} />
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#E5E5E5]" data-testid="related-posts-section">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-3">Related</p>
            <h2 className="font-heading font-bold text-2xl text-[#1A1A1A] mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r, i) => (
                <BlogCard key={r.id} post={r} index={i} />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
