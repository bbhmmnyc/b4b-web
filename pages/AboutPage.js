import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Globe, Users, PenLine, Heart, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function AboutPage() {
  const { stats } = useApp();

  return (
    <div className="min-h-screen" data-testid="about-page">
      {/* Hero */}
      <section className="py-20 md:py-32 border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-grey mb-6">Our Story</p>
          <h1 className="font-heading font-light text-5xl md:text-7xl tracking-tighter mb-6 text-[#1A1A1A]" data-testid="about-title">
            About <span className="font-black">Blogs4Blocks</span>
          </h1>
          <p className="text-lg text-brand-grey max-w-xl mx-auto leading-relaxed">
            Born in the blocks of New York City, built for marketing professionals across every block on every continent.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-32 border-t border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-4">Why We Exist</p>
              <h2 className="font-heading font-bold text-3xl tracking-tight text-[#1A1A1A] mb-6">The Mission</h2>
              <p className="text-brand-grey leading-relaxed mb-4">
                Marketing doesn't work the same everywhere. What drives conversions in Tokyo might fall flat in Sao Paulo. What goes viral in Lagos might confuse audiences in Stockholm.
              </p>
              <p className="text-brand-grey leading-relaxed mb-4">
                <strong className="text-[#1A1A1A]">Blogs 4 Blocks</strong> exists to bridge that gap. We're an open forum where marketing professionals from every corner of the world share what actually works in their markets.
              </p>
              <p className="text-brand-grey leading-relaxed">
                No gatekeeping. No paywalls. Just real marketers helping real marketers, block by block, city by city.
              </p>
            </div>
            <div className="space-y-px bg-[#E5E5E5]">
              {[
                { icon: <Globe className="w-5 h-5" />, title: 'Global Perspectives', desc: 'Insights from marketing pros on every continent' },
                { icon: <Users className="w-5 h-5" />, title: 'Open Forum', desc: 'Anyone can contribute — registered or as a guest' },
                { icon: <PenLine className="w-5 h-5" />, title: 'Real Strategies', desc: 'Not theory — practical tactics that work in the field' },
                { icon: <Heart className="w-5 h-5" />, title: 'Community First', desc: 'Built by marketers, for marketers' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-6 bg-white" data-testid={`about-value-${i}`}>
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-brand-grey">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#1A1A1A]">{item.title}</h3>
                    <p className="text-sm text-brand-grey">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-32 border-t border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-3">Getting Started</p>
            <h2 className="font-heading font-bold text-3xl tracking-tight text-[#1A1A1A]" data-testid="how-it-works-heading">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#E5E5E5]">
            {[
              { step: '01', title: 'Explore Topics', desc: 'Browse categories from Social Media Marketing to Consumer Behavior. Find discussions relevant to your market.' },
              { step: '02', title: 'Share Your Insight', desc: 'Write a post about what works in your market. Share data, case studies, or hard-earned wisdom.' },
              { step: '03', title: 'Join the Discussion', desc: 'Comment on posts, like great insights, and connect with marketers facing similar challenges worldwide.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#FDFCF8] p-8 text-center" data-testid={`how-step-${i}`}>
                <div className="font-heading font-black text-4xl text-brand-yellow mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-sm text-brand-grey leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="py-20 md:py-32 border-t border-[#E5E5E5]">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-3">By the Numbers</p>
            <h2 className="font-heading font-bold text-3xl tracking-tight text-[#1A1A1A] mb-12" data-testid="about-stats-heading">
              The Community So Far
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E5E5E5]">
              {[
                { value: stats.total_posts, label: 'Posts Published' },
                { value: stats.total_comments, label: 'Discussions' },
                { value: stats.total_users || 0, label: 'Contributors' },
                { value: stats.total_countries || 0, label: 'Countries' },
              ].map((stat, i) => (
                <div key={i} className="p-8 bg-white" data-testid={`about-stat-${i}`}>
                  <div className="font-heading font-black text-4xl mb-1 text-[#1A1A1A]">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-grey">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 md:py-32 bg-[#1A1A1A] text-white">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#666]">
            <MapPin className="w-3.5 h-3.5" /> Based in New York City
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight mb-6" data-testid="about-cta-heading">
            Ready to Share Your Perspective?
          </h2>
          <p className="text-[#999] max-w-lg mx-auto mb-10 leading-relaxed">
            Whether you have a full case study or a quick insight — every contribution makes the global marketing community stronger.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/write">
              <Button className="bg-white text-[#1A1A1A] hover:bg-brand-yellow rounded-none font-bold px-8 py-3 h-auto uppercase tracking-widest text-xs transition-colors" data-testid="about-write-btn">
                <PenLine className="w-4 h-4 mr-2" /> Write a Post
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="border border-[#555] text-[#999] hover:bg-white hover:text-[#1A1A1A] rounded-none font-bold px-8 py-3 h-auto uppercase tracking-widest text-xs transition-colors" data-testid="about-join-btn">
                Join the Community <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
