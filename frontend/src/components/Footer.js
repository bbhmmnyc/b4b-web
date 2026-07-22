import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { MapPin, Mail, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import LanguageSelector from './LanguageSelector';
import { toast } from 'sonner';

export default function Footer() {
  const { categories, stats, API, t } = useApp();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      await axios.post(`${API}/newsletter/subscribe`, { email: email.trim() });
      setSubscribed(true);
      toast.success('Subscribed to weekly digest!');
    } catch (err) {
      toast.error('Failed to subscribe');
    }
    setSubscribing(false);
  };

  return (
    <footer className="bg-[#1A1A1A] text-white mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <span className="font-heading font-black text-xl tracking-tight">
                <span className="text-[#C2544D]">B</span><span className="text-[#BF6B3A]">L</span><span className="text-[#C4942A]">O</span><span className="text-[#5C8A6E]">G</span><span className="text-[#2D8B7A]">S</span><span className="text-[#3D6B8E]">4</span><span className="text-[#4A6FA5]">B</span><span className="text-[#7B5E8D]">L</span><span className="text-[#B4687A]">O</span><span className="text-[#C2544D]">C</span><span className="text-[#A67C52]">K</span><span className="text-[#6B8E5C]">S</span>
              </span>
            </div>
            <p className="text-[#999] text-sm leading-relaxed mb-6">
              {t('footerMission')}
            </p>
            <div className="flex items-center gap-2 text-[#666] text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('basedInNyc')}</span>
            </div>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#666] mb-6">{t('topics')}</h4>
            <div className="flex flex-col gap-3">
              {categories.slice(0, 7).map(cat => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="text-sm text-[#999] hover:text-white transition-colors no-underline"
                  data-testid={`footer-cat-${cat.slug}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#666] mb-6">{t('quickLinks')}</h4>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-home">{t('home')}</Link>
              <Link to="/topics" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-topics">{t('topics')}</Link>
              <Link to="/regions" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-regions">{t('regions')}</Link>
              <Link to="/write" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-write">{t('writePost')}</Link>
              <Link to="/about" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-about">{t('about')}</Link>
              <Link to="/auth" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-auth">{t('signInRegister')}</Link>
              <Link to="/advertise" className="text-sm text-[#C4942A] hover:text-white transition-colors no-underline font-medium" data-testid="footer-advertise">{t('advertiseWithUs')}</Link>
              <Link to="/donate" className="text-sm text-[#C2544D] hover:text-white transition-colors no-underline font-medium" data-testid="footer-donate">{t('donate')}</Link>
              <Link to="/terms-and-conditions" className="text-sm text-[#999] hover:text-white transition-colors no-underline" data-testid="footer-terms">{t('terms')}</Link>
              <div className="pt-2 -ml-3 text-[#999]">
                <LanguageSelector />
              </div>
            </div>
          </div>

          {/* Newsletter + Stats */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#666] mb-6">{t('weeklyDigest')}</h4>
            {subscribed ? (
              <div className="flex items-center gap-2 text-brand-green text-sm font-medium mb-6" data-testid="footer-subscribed">
                <Check className="w-4 h-4" /> {t('subscribed')}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mb-6" data-testid="footer-newsletter-form">
                <p className="text-xs text-[#666] mb-3">{t('subscribeHint')}</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-[#333] text-white placeholder:text-[#555] rounded-none h-9 text-xs focus:border-brand-yellow"
                    data-testid="footer-newsletter-email"
                  />
                  <Button type="submit" disabled={subscribing} size="sm" className="bg-brand-yellow text-[#1A1A1A] hover:bg-[#E5B800] rounded-none text-xs px-3 font-bold" data-testid="footer-newsletter-btn">
                    <Mail className="w-3 h-3" />
                  </Button>
                </div>
              </form>
            )}
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-heading font-black text-white">{stats.total_posts}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#666]">{t('posts')}</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-black text-white">{stats.total_comments}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#666]">{t('comments')}</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-black text-white">{stats.total_users || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#666]">{t('contributors')}</div>
                </div>
                <div>
                  <div className="text-2xl font-heading font-black text-white">{stats.total_countries || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#666]">{t('countries')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#333] mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#666]">
            &copy; {new Date().getFullYear()} Blogs 4 Blocks. NYC.
          </p>
          <p className="text-xs text-[#555]">
            {t('footerTagline')}
          </p>
        </div>
      </div>
    </footer>
  );
}
