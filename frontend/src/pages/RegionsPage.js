import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Globe2, MapPin, Users, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function RegionsPage() {
  const { API, t } = useApp();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/regions?limit=100`)
      .then(res => setRegions(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [API]);

  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="regions-page">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#0A7A6A]">// {t('regions')}</p>
          <h1 className="font-heading font-black text-4xl md:text-6xl tracking-tighter text-[#1A2A3C] mb-5">
            Explore marketing conversations by city and market.
          </h1>
          <p className="text-base leading-relaxed text-[#4A5A70]">
            Regional cards are built from published posts, pairing each city with the discipline showing up most in that market.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-44 bg-white/50 animate-pulse border border-white" />)}
          </div>
        ) : regions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regions.map((region) => (
              <Link
                key={`${region.city}-${region.country}`}
                to={`/category/all?search=${encodeURIComponent(region.city)}`}
                className="group block no-underline bg-white/80 border border-white p-6 hover:-translate-y-1 transition-all"
                data-testid={`region-card-${region.city.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#0A7A6A]/10 text-[#0A7A6A]">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#0A7A6A] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="font-heading font-black text-2xl text-[#1A2A3C] mb-2">
                  {region.city}
                </h2>
                <p className="system-label text-sm font-bold uppercase tracking-widest text-[#0A7A6A] mb-4">
                  {region.top_category_name}
                </p>
                <div className="space-y-2 text-sm text-[#4A5A70]">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {region.country || 'Global'}</p>
                  <p className="flex items-center gap-2"><FileText className="w-4 h-4" /> {region.post_count} {region.post_count === 1 ? 'post' : 'posts'}</p>
                  <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {region.contributor_count} {region.contributor_count === 1 ? 'contributor' : 'contributors'}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 border border-white p-10 text-center">
            <Globe2 className="w-10 h-10 mx-auto mb-3 text-[#0A7A6A]" />
            <p className="text-[#4A5A70]">Regional pages will appear as posts are published from different cities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
