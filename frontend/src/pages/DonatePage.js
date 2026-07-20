import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HeartHandshake, ArrowRight, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const DEFAULT_PRESETS = [1, 5, 10, 15, 20];

export default function DonatePage() {
  const { API } = useApp();
  const [status, setStatus] = useState({ enabled: false, presets: DEFAULT_PRESETS, currency: 'usd' });
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/payments/donations/status`)
      .then((res) => {
        setStatus(res.data);
        if (res.data.presets?.length) setAmount(res.data.presets[1] || res.data.presets[0]);
      })
      .catch(() => {});
  }, [API]);

  const selectedAmount = Number(customAmount || amount);

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!selectedAmount || selectedAmount < 1) {
      toast.error('Donation amount must be at least $1.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/payments/donations/checkout`, {
        amount: selectedAmount,
        donor_name: donorName.trim() || null,
        email: email.trim() || null,
        origin_url: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Donation checkout is not available yet.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen px-6 md:px-12 py-16" data-testid="donate-page">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center rounded-full bg-[#C42838]/10 text-[#A01E2C]">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <p className="system-label text-xs font-bold uppercase tracking-[0.28em] mb-4 text-[#A01E2C]">// Support the Forum</p>
          <h1 className="font-heading font-black text-4xl md:text-6xl tracking-tighter text-[#1A2A3C] mb-5">
            Help keep Blogs 4 Blocks moving.
          </h1>
          <p className="text-base leading-relaxed text-[#4A5A70]">
            Donations help support the community space, moderation, and future improvements for marketers sharing real regional insight.
          </p>
        </div>

        {!status.enabled && (
          <div className="mb-6 flex gap-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>Donations are ready in the app, but payment keys still need to be configured before checkout can go live.</p>
          </div>
        )}

        <form onSubmit={handleDonate} className="bg-white/80 border border-white p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <Label className="system-label text-xs font-bold uppercase tracking-wider text-brand-grey">Choose an amount</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              {(status.presets || DEFAULT_PRESETS).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setAmount(preset); setCustomAmount(''); }}
                  className={`system-label h-12 border text-sm font-bold ${selectedAmount === preset && !customAmount ? 'bg-[#A01E2C] text-white border-[#A01E2C]' : 'bg-white text-[#1A2A3C] border-[#D8E2F0]'}`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="custom-donation" className="system-label text-xs font-bold uppercase tracking-wider text-brand-grey">Custom amount</Label>
            <Input
              id="custom-donation"
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter another amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="mt-2 rounded-none h-12"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="donor-name" className="system-label text-xs font-bold uppercase tracking-wider text-brand-grey">Name optional</Label>
              <Input id="donor-name" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Your name" className="mt-2 rounded-none h-12" />
            </div>
            <div>
              <Label htmlFor="donor-email" className="system-label text-xs font-bold uppercase tracking-wider text-brand-grey">Email optional</Label>
              <Input id="donor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 rounded-none h-12" />
            </div>
          </div>

          <Button type="submit" disabled={loading || !status.enabled} className="w-full rounded-none h-12 text-xs font-bold uppercase tracking-widest text-white bg-[#A01E2C] hover:bg-[#7E1420]">
            {loading ? 'Opening checkout...' : `Donate $${selectedAmount || 0}`}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
}
