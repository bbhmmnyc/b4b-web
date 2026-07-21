import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Menu, X, PenLine, LogIn, LogOut, User, ChevronDown, Shield, HeartHandshake } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getCategoryColor } from '../utils/colors';
import LanguageSelector from './LanguageSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';

export default function Navbar() {
  const { user, logout, categories, t } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(216,226,240,0.90)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderColor: 'rgba(255,255,255,0.82)',
        boxShadow: '0 1px 0 rgba(130,150,185,0.20), inset 0 1px 0 rgba(255,255,255,0.92)',
      }}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center no-underline shrink-0" data-testid="nav-logo">
            <img
              src="/b4b-logo.png"
              alt="Blogs 4 Blocks"
              className="h-8 md:h-10 w-auto"
              style={{ maxWidth: '190px', objectFit: 'contain' }}
            />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 text-xs font-bold uppercase tracking-widest no-underline transition-colors ${isActive('/') ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              data-testid="nav-home"
            >
              {t('home')}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${location.pathname.startsWith('/category') ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  data-testid="nav-categories-dropdown"
                >
                  {t('topics')} <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-64 rounded-lg"
                style={{
                  background: 'rgba(218,228,242,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.82)',
                  boxShadow: '0 8px 32px rgba(20,40,80,0.12)',
                }}
              >
                <DropdownMenuItem
                  onClick={() => navigate('/topics')}
                  data-testid="nav-all-topics"
                  className="rounded-md mx-1 my-0.5 cursor-pointer font-semibold text-slate-800"
                >
                  {t('viewAllTopics')}
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ backgroundColor: 'rgba(30,50,80,0.10)' }} />
                {categories.map(cat => {
                  const cc = getCategoryColor(cat.slug);
                  return (
                    <DropdownMenuItem
                      key={cat.slug}
                      onClick={() => navigate(cat.slug === 'careers' ? '/careers' : `/category/${cat.slug}`)}
                      data-testid={`nav-cat-${cat.slug}`}
                      className="rounded-md mx-1 my-0.5 cursor-pointer"
                      style={{ borderLeft: `2px solid ${cc.base}` }}
                    >
                      <span className="w-2 h-2 rounded-full mr-2.5 flex-shrink-0" style={{ backgroundColor: cc.base }} />
                      <span className="font-medium text-sm text-slate-700">{cat.name}</span>
                      <span className="ml-auto text-xs text-slate-400 font-mono">{cat.post_count}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/about"
              className={`px-3 py-2 text-xs font-bold uppercase tracking-widest no-underline transition-colors ${isActive('/about') ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              data-testid="nav-about"
            >
              {t('about')}
            </Link>

            <Link
              to="/advertise"
              className={`px-3 py-2 text-xs font-bold uppercase tracking-widest no-underline transition-colors ${isActive('/advertise') ? 'text-amber-700' : 'text-slate-600 hover:text-amber-700'
                }`}
              data-testid="nav-advertise"
            >
              {t('advertise')}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector compact />

            <Button
              variant="outline"
              onClick={() => navigate('/donate')}
              className="rounded-none h-9 px-4 uppercase tracking-widest text-[11px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.58)',
                border: '1px solid rgba(160,30,44,0.24)',
                color: '#A01E2C',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.58)'; }}
              data-testid="nav-donate-btn"
            >
              <HeartHandshake className="w-3.5 h-3.5 mr-2" />
              {t('donate')}
            </Button>

            <Button
              onClick={() => navigate('/write')}
              className="rounded-none h-9 px-4 uppercase tracking-widest text-[11px] font-bold text-white"
              style={{
                background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 48%, #7E1420 100%)',
                boxShadow: '0 2px 14px rgba(160,30,44,0.35), inset 0 1px 0 rgba(255,255,255,0.22)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 5px 22px rgba(160,30,44,0.55), inset 0 1px 0 rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 14px rgba(160,30,44,0.35), inset 0 1px 0 rgba(255,255,255,0.22)'; }}
              data-testid="nav-write-btn"
            >
              <PenLine className="w-3.5 h-3.5 mr-2" />
              {t('write')}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-2 transition-all"
                    style={{ border: '1px solid rgba(30,50,80,0.18)', background: 'rgba(255,255,255,0.55)', borderRadius: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.80)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; }}
                    data-testid="nav-user-menu"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(10,120,106,0.14)', border: '1px solid rgba(10,120,106,0.32)', color: '#0A7A6A' }}
                    >
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-lg"
                  style={{
                    background: 'rgba(218,228,242,0.97)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.82)',
                    boxShadow: '0 8px 32px rgba(20,40,80,0.12)',
                  }}
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator style={{ backgroundColor: 'rgba(30,50,80,0.10)' }} />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="text-slate-700 cursor-pointer" data-testid="nav-profile-btn">
                    <User className="w-4 h-4 mr-2" /> {t('myDashboard')}
                  </DropdownMenuItem>
                  {user.is_admin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="text-slate-700 cursor-pointer" data-testid="nav-admin-btn">
                      <Shield className="w-4 h-4 mr-2" /> {t('adminPanel')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator style={{ backgroundColor: 'rgba(30,50,80,0.10)' }} />
                  <DropdownMenuItem
                    onClick={() => { logout(); navigate('/'); }}
                    className="text-slate-700 cursor-pointer"
                    data-testid="nav-logout-btn"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                className="rounded-none h-9 px-4 uppercase tracking-widest text-[11px] font-bold"
                style={{
                  background: 'rgba(255,255,255,0.58)',
                  border: '1px solid rgba(30,50,80,0.22)',
                  color: '#1E3050',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.88)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.58)'; }}
                data-testid="nav-login-btn"
              >
                <LogIn className="w-3.5 h-3.5 mr-2" />
                {t('signIn')}
              </Button>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="nav-mobile-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden py-6 animate-fade-in-up"
            style={{ borderTop: '1px solid rgba(30,50,80,0.10)' }}
            data-testid="nav-mobile-menu"
          >
            <div className="flex flex-col gap-1">
              <div className="px-1"><LanguageSelector /></div>
              <Link to="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-teal-700 no-underline transition-colors">{t('home')}</Link>
              <Link to="/topics" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-teal-700 no-underline transition-colors">{t('topics')}</Link>
              <Link to="/about" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-teal-700 no-underline transition-colors">{t('about')}</Link>
              <Link to="/advertise" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-amber-800 no-underline transition-colors">{t('advertise')}</Link>
              <Link to="/donate" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-red-700 hover:text-red-800 no-underline transition-colors">{t('donate')}</Link>
              {user && <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 hover:text-teal-700 no-underline transition-colors">{t('myDashboard')}</Link>}
              {user?.is_admin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 no-underline transition-colors">
                  <Shield className="w-4 h-4" /> {t('adminPanel')}
                </Link>
              )}
              <div className="mt-4 pt-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(30,50,80,0.10)' }}>
                <Button
                  onClick={() => { navigate('/write'); setMobileOpen(false); }}
                  className="rounded-none font-bold uppercase tracking-widest text-xs text-white"
                  style={{ background: 'linear-gradient(155deg, #C42838 0%, #A01E2C 50%, #7E1420 100%)', boxShadow: '0 2px 10px rgba(160,30,44,0.32)' }}
                >
                  <PenLine className="w-3.5 h-3.5 mr-2" /> {t('writePost')}
                </Button>
                {!user && (
                  <Button
                    variant="outline"
                    onClick={() => { navigate('/auth'); setMobileOpen(false); }}
                    className="rounded-none uppercase tracking-widest text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(30,50,80,0.22)', color: '#1E3050' }}
                  >
                    <LogIn className="w-3.5 h-3.5 mr-2" /> {t('signIn')}
                  </Button>
                )}
                {user && (
                  <Button
                    variant="outline"
                    onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                    className="rounded-none uppercase tracking-widest text-xs font-bold"
                    style={{ background: 'transparent', border: '1px solid rgba(30,50,80,0.14)', color: '#4A5A70' }}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" /> {t('signOut')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
