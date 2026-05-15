import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Megaphone, Users, Globe, FileText, Mail, TrendingUp, Check, ArrowRight, BarChart3, Target, Zap, CreditCard, ChevronRight, Maximize2, LayoutGrid, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AD_SIZES = [
  { id: 'small', label: 'Small', desc: 'Sidebar badge or in-feed card', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'medium', label: 'Medium', desc: 'Featured blog card position', icon: <Maximize2 className="w-5 h-5" /> },
  { id: 'large', label: 'Large', desc: 'Homepage carousel + newsletter', icon: <Crown className="w-5 h-5" /> },
];

const FREQUENCIES = [
  { id: '1-run', label: '1 Run', desc: 'Single placement' },
  { id: '4-runs', label: '4 Runs', desc: 'Monthly cycle' },
  { id: '8-runs', label: '8 Runs', desc: 'Best value' },
];

const PLACEMENTS = [
  { id: 'standard', label: 'Standard', desc: 'Regular rotation', mult: '1x' },
  { id: 'premium', label: 'Premium', desc: 'Priority placement', mult: '1.25x' },
  { id: 'top-tier', label: 'Top Tier', desc: 'Prime real estate', mult: '1.5x' },
];

export default function AdvertisePage() {
  const { categories, API } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [rateCard, setRateCard] = useState(null);
  const [step, setStep] = useState('pricing');
  const [processing, setProcessing] = useState(false);

  // Pricing selections
  const [adSize, setAdSize] = useState('medium');
  const [frequency, setFrequency] = useState('4-runs');
  const [placement, setPlacement] = useState('standard');

  // Contact form
  const [form, setForm] = useState({
    advertiser: '',
    contact_name: '',
    email: '',
    phone: '',
    campaign_name: '',
  });

  useEffect(() => {
    axios.get(`${API}/advertise/stats`).then(res => setStats(res.data)).catch(() => {});
    axios.get(`${API}/payments/rate-card`).then(res => setRateCard(res.data)).catch(() => {});
  }, [API]);

  const getBasePrice = () => {
    if (!rateCard) return 0;
    const match = rateCard.prices.find(p => p.ad_size === adSize && p.frequency === frequency);
    return match ? match.base_price : 0;
  };

  const getMultiplier = () => {
    if (!rateCard) return 1;
    const match = rateCard.multipliers.find(m => m.placement === placement);
    return match ? match.multiplier : 1;
  };

  const basePrice = getBasePrice();
  const multiplier = getMultiplier();
  const total = Math.round(basePrice * multiplier * 100) / 100;

  const handleCheckout = async () => {
    if (!form.advertiser || !form.contact_name || !form.email) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setProcessing(true);
    try {
      const res = await axios.post(`${API}/payments/checkout`, {
        ad_size: adSize,
        frequency: frequency,
        placement: placement,
        advertiser: form.advertiser,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone,
        campaign_name: form.campaign_name,
        origin_url: window.location.origin,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen" data-testid="advertise-page">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E5E5E5]">
        <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, #F5DFA0 0%, #FFF8E1 40%, #E0F0FA 80%, #FDFCF8 100%)' }} />
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <Megaphone className="w-5 h-5 text-[#C4942A]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey">Partner With Us</span>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter text-[#1A1A1A] mb-5 leading-[0.95]" data-testid="advertise-title">
              Reach Marketing Professionals Worldwide
            </h1>
            <p className="text-lg text-[#555] max-w-2xl mx-auto leading-relaxed mb-8">
              Blogs 4 Blocks connects you directly with marketing decision-makers around the world. Sponsored content that feels native, not intrusive.
            </p>
            <Button
              onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#C4942A] text-white hover:bg-[#A87E22] rounded-none font-bold px-8 py-3 h-auto text-xs uppercase tracking-widest transition-colors"
              data-testid="advertise-cta"
            >
              View Pricing <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Audience stats */}
      {stats && (
        <section className="py-14 md:py-18 border-b border-[#E5E5E5]">
          <div className="max-w-5xl mx-auto px-6 md:px-12">
            <div className="text-center mb-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-2">Your Audience</p>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-[#1A1A1A] tracking-tight" data-testid="audience-heading">A Growing Global Community</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: <FileText className="w-5 h-5" />, value: stats.total_posts, label: 'Published Posts', color: '#C2544D' },
                { icon: <Users className="w-5 h-5" />, value: stats.total_users, label: 'Contributors', color: '#3D6B8E' },
                { icon: <Globe className="w-5 h-5" />, value: '5', label: 'Continents', color: '#2D8B7A' },
                { icon: <BarChart3 className="w-5 h-5" />, value: stats.total_comments, label: 'Discussions', color: '#7B5E8D' },
                { icon: <Mail className="w-5 h-5" />, value: stats.newsletter_subscribers, label: 'Newsletter Subs', color: '#C4942A' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="p-5 border border-[#E5E5E5] text-center bg-white" data-testid={`audience-stat-${i}`}>
                  <span className="block mb-2 flex justify-center" style={{ color: stat.color }}>{stat.icon}</span>
                  <div className="font-heading font-black text-2xl text-[#1A1A1A]">{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-grey mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How Sponsorship Works */}
      <section className="py-14 md:py-18 border-b border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-2">Advertising Options</p>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-[#1A1A1A] tracking-tight">How Sponsorship Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Target className="w-6 h-6" />, title: 'Sponsored Posts', desc: 'Your branded content published as a native post within your chosen marketing category. Includes a "Sponsored" badge and your company branding.', color: '#C4942A' },
              { icon: <Zap className="w-6 h-6" />, title: 'Featured Placement', desc: 'Your sponsored post featured in the homepage carousel, visible to every visitor. Premium real estate with category-themed visuals.', color: '#C2544D' },
              { icon: <TrendingUp className="w-6 h-6" />, title: 'Newsletter Inclusion', desc: 'Your content included in our weekly digest email, reaching our entire subscriber base plus all registered users every Monday.', color: '#2D8B7A' },
            ].map((offer, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative border border-[#E5E5E5] p-8 bg-white overflow-hidden" data-testid={`offer-card-${i}`}>
                <div className="h-[3px] w-full absolute top-0 left-0" style={{ background: `linear-gradient(90deg, ${offer.color}, ${offer.color}44)` }} />
                <span className="block mb-4" style={{ color: offer.color }}>{offer.icon}</span>
                <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-2">{offer.title}</h3>
                <p className="text-sm text-brand-grey leading-relaxed">{offer.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING & CHECKOUT ─── */}
      <section id="pricing-section" className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey mb-2">Transparent Pricing</p>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-[#1A1A1A] tracking-tight" data-testid="pricing-heading">Build Your Campaign</h2>
            <p className="text-sm text-brand-grey mt-2">Select your ad size, frequency, and placement. Price calculates automatically.</p>
          </div>

          {step === 'pricing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Rate Card Table */}
              <div className="bg-white border border-[#E5E5E5] overflow-hidden">
                <div className="p-4 border-b border-[#F4F4F5] bg-[#FDFCF8]">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-[#1A1A1A]">Rate Card</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="rate-card-table">
                    <thead>
                      <tr className="border-b border-[#F4F4F5]">
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-grey">Ad Size</th>
                        <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-grey">1 Run</th>
                        <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-grey">4 Runs</th>
                        <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-grey">8 Runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['small', 'medium', 'large'].map(size => (
                        <tr key={size} className="border-b border-[#F4F4F5] last:border-0">
                          <td className="px-4 py-3 font-medium text-[#1A1A1A] capitalize">{size}</td>
                          {['1-run', '4-runs', '8-runs'].map(freq => {
                            const match = rateCard?.prices.find(p => p.ad_size === size && p.frequency === freq);
                            const isSelected = adSize === size && frequency === freq;
                            return (
                              <td key={freq} className="text-center px-4 py-3">
                                <button
                                  onClick={() => { setAdSize(size); setFrequency(freq); }}
                                  className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                                    isSelected
                                      ? 'bg-[#1A1A1A] text-white shadow-sm'
                                      : 'text-[#555] hover:bg-[#F4F4F5]'
                                  }`}
                                  data-testid={`price-${size}-${freq}`}
                                >
                                  ${match ? match.base_price.toLocaleString() : '—'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ad Size Selection */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-3 block">1. Ad Size</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {AD_SIZES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setAdSize(s.id)}
                      className={`flex items-start gap-3 p-4 border text-left transition-all ${
                        adSize === s.id ? 'border-[#1A1A1A] bg-[#FDFCF8]' : 'border-[#E5E5E5] bg-white hover:border-[#999]'
                      }`}
                      data-testid={`size-${s.id}`}
                    >
                      <span className={adSize === s.id ? 'text-[#C4942A]' : 'text-brand-grey'}>{s.icon}</span>
                      <div>
                        <div className="font-heading font-bold text-sm text-[#1A1A1A]">{s.label}</div>
                        <div className="text-xs text-brand-grey">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency Selection */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-3 block">2. Frequency</Label>
                <div className="grid grid-cols-3 gap-3">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFrequency(f.id)}
                      className={`p-4 border text-center transition-all ${
                        frequency === f.id ? 'border-[#1A1A1A] bg-[#FDFCF8]' : 'border-[#E5E5E5] bg-white hover:border-[#999]'
                      }`}
                      data-testid={`freq-${f.id}`}
                    >
                      <div className="font-heading font-bold text-sm text-[#1A1A1A]">{f.label}</div>
                      <div className="text-xs text-brand-grey">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Placement Selection */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-3 block">3. Placement</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PLACEMENTS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPlacement(p.id)}
                      className={`p-4 border text-left transition-all ${
                        placement === p.id ? 'border-[#1A1A1A] bg-[#FDFCF8]' : 'border-[#E5E5E5] bg-white hover:border-[#999]'
                      }`}
                      data-testid={`placement-${p.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-heading font-bold text-sm text-[#1A1A1A]">{p.label}</div>
                        <span className="text-xs font-bold text-[#C4942A]">{p.mult}</span>
                      </div>
                      <div className="text-xs text-brand-grey mt-1">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="border border-[#1A1A1A] bg-[#FDFCF8] p-6" data-testid="price-summary">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-1">Your Total</p>
                    <p className="font-heading font-black text-4xl text-[#1A1A1A]" data-testid="total-price">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right text-xs text-brand-grey space-y-0.5">
                    <p><span className="capitalize">{adSize}</span> ad · {frequency.replace('-', ' ')}</p>
                    <p><span className="capitalize">{placement}</span> placement ({multiplier}x)</p>
                    {multiplier > 1 && <p className="text-[10px]">Base: ${basePrice.toLocaleString()} x {multiplier}</p>}
                  </div>
                </div>
                <Button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-[#C4942A] text-white hover:bg-[#A87E22] rounded-none font-bold py-3 h-auto text-xs uppercase tracking-widest transition-colors"
                  data-testid="proceed-checkout"
                >
                  Continue to Checkout <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── CHECKOUT FORM ─── */}
          {step === 'checkout' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <button
                onClick={() => setStep('pricing')}
                className="text-sm text-brand-grey hover:text-[#1A1A1A] flex items-center gap-1 transition-colors"
                data-testid="back-to-pricing"
              >
                <ArrowRight className="w-3 h-3 rotate-180" /> Back to pricing
              </button>

              {/* Order summary bar */}
              <div className="flex items-center justify-between border border-[#E5E5E5] bg-white p-4">
                <div className="text-sm">
                  <span className="font-bold text-[#1A1A1A] capitalize">{adSize}</span>
                  <span className="text-brand-grey mx-2">·</span>
                  <span className="text-brand-grey">{frequency.replace('-', ' ')}</span>
                  <span className="text-brand-grey mx-2">·</span>
                  <span className="text-brand-grey capitalize">{placement}</span>
                </div>
                <div className="font-heading font-black text-xl text-[#1A1A1A]" data-testid="checkout-total">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }} className="border border-[#E5E5E5] bg-white p-8 md:p-10 space-y-6" data-testid="checkout-form">
                <h3 className="font-heading font-bold text-lg text-[#1A1A1A]">Advertiser Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-2 block">Company / Brand *</Label>
                    <Input value={form.advertiser} onChange={e => setForm(p => ({ ...p, advertiser: e.target.value }))} required className="rounded-none border-[#E5E5E5] focus:border-[#1A1A1A] h-11" data-testid="checkout-advertiser" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-2 block">Contact Name *</Label>
                    <Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} required className="rounded-none border-[#E5E5E5] focus:border-[#1A1A1A] h-11" data-testid="checkout-contact" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-2 block">Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required className="rounded-none border-[#E5E5E5] focus:border-[#1A1A1A] h-11" data-testid="checkout-email" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-2 block">Phone</Label>
                    <Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="rounded-none border-[#E5E5E5] focus:border-[#1A1A1A] h-11" data-testid="checkout-phone" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-widest text-brand-grey mb-2 block">Campaign Name</Label>
                  <Input value={form.campaign_name} onChange={e => setForm(p => ({ ...p, campaign_name: e.target.value }))} placeholder="e.g., Spring 2026 Product Launch" className="rounded-none border-[#E5E5E5] focus:border-[#1A1A1A] h-11" data-testid="checkout-campaign" />
                </div>

                <div className="border-t border-[#E5E5E5] pt-6">
                  <div className="flex items-center gap-2 mb-4 text-xs text-brand-grey">
                    <CreditCard className="w-4 h-4" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold py-3.5 h-auto text-xs uppercase tracking-widest transition-colors"
                    data-testid="pay-now-btn"
                  >
                    {processing ? 'Redirecting to Stripe...' : `Pay $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} — Secure Checkout`}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
