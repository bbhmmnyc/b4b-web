import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Briefcase, Brain, Cpu, Globe, Key, Megaphone, Monitor, Palette, Share2, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryColor } from '../utils/colors';

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

export default function TopicsPage() {
  const { categories } = useApp();

  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="topics-page">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#0A7A6A]">// Topics</p>
          <h1 className="font-heading font-black text-4xl md:text-6xl tracking-tighter text-[#1A2A3C] mb-5">
            Find the marketing conversation that matches your market.
          </h1>
          <p className="text-base leading-relaxed text-[#4A5A70]">
            Each topic is a doorway into local, regional, national, and global marketing perspectives from people doing the work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const color = getCategoryColor(cat.slug);
            return (
              <Link
                key={cat.slug}
                to={cat.slug === 'careers' ? '/careers' : `/category/${cat.slug}`}
                className="group block no-underline rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                data-testid={`topics-card-${cat.slug}`}
              >
                <div
                  className="h-full min-h-[190px] p-6 flex flex-col justify-between rounded-xl"
                  style={{
                    background: `linear-gradient(145deg, ${color.cardFrom} 0%, ${color.cardTo} 100%)`,
                    border: `1.5px solid ${color.cardFrom}`,
                    borderLeft: `5px solid ${color.base}`,
                    boxShadow: '0 4px 16px rgba(20,40,80,0.10)',
                  }}
                >
                  <div>
                    <div className="w-10 h-10 flex items-center justify-center mb-5 rounded-full" style={{ color: color.base, background: 'rgba(255,255,255,0.55)' }}>
                      {CATEGORY_ICONS[cat.slug] || <BarChart3 className="w-5 h-5" />}
                    </div>
                    <h2 className="font-heading font-bold text-xl mb-2 text-[#07111F]">{cat.name}</h2>
                    <p className="text-sm leading-relaxed text-[#10253A]">{cat.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <span className="system-label text-[10px] font-bold uppercase tracking-widest" style={{ color: color.base }}>
                      {cat.post_count || 0} posts
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: color.base }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
