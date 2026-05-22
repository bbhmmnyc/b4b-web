import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Key, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminSetupPage() {
  const { user, token, API } = useApp();
  const navigate = useNavigate();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error('Please enter the admin setup key');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/self-promote`, { secret_key: secretKey }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      setSuccess(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid setup key');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" data-testid="admin-setup-no-auth">
        <Shield className="w-12 h-12 text-gray-400" />
        <h2 className="font-heading font-bold text-xl text-[#1A1A1A]">Sign in Required</h2>
        <p className="text-brand-grey text-sm text-center">You need to be signed in to set up an admin account.</p>
        <Button onClick={() => navigate('/auth')} className="rounded-none bg-[#1A1A1A] text-white hover:bg-[#333] uppercase tracking-widest text-xs font-bold" data-testid="admin-setup-signin-btn">
          Sign In First
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" data-testid="admin-setup-success">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="font-heading font-bold text-2xl text-[#1A1A1A]">You're an Admin!</h2>
        <p className="text-brand-grey text-sm text-center max-w-md">
          Your account has been upgraded. Refresh or navigate to the admin panel to start managing the site.
        </p>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => window.location.href = '/admin'} className="rounded-none bg-[#1A1A1A] text-white hover:bg-[#333] uppercase tracking-widest text-xs font-bold" data-testid="admin-setup-go-admin">
            <Shield className="w-4 h-4 mr-1.5" /> Go to Admin Panel
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="rounded-none border-[#E5E5E5] uppercase tracking-widest text-xs font-bold" data-testid="admin-setup-go-home">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" data-testid="admin-setup-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-none bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-3xl tracking-tight text-[#1A1A1A] mb-2" data-testid="admin-setup-heading">
            Admin Setup
          </h1>
          <p className="text-sm text-brand-grey max-w-xs mx-auto">
            Enter the admin setup key to promote your account ({user.email}) to administrator.
          </p>
        </div>

        <div className="bg-white rounded-none border border-[#E5E5E5] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="admin-setup-form">
            <div>
              <Label htmlFor="setup-key">Admin Setup Key</Label>
              <Input
                id="setup-key"
                type="password"
                autoComplete="off"
                placeholder="Enter the setup key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="mt-1 border-2 border-[#E5E5E5] focus:border-black rounded-none"
                data-testid="admin-setup-key-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold uppercase tracking-widest text-xs transition-colors"
              data-testid="admin-setup-submit-btn"
            >
              {loading ? 'Verifying...' : 'Activate Admin Access'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          The setup key is configured in your server environment. Check your .env file for ADMIN_SETUP_KEY.
        </p>
      </div>
    </div>
  );
}
