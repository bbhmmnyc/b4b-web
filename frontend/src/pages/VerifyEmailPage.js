import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Check, XCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';

export default function VerifyEmailPage() {
  const { API } = useApp();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token was found.');
      return;
    }

    axios.get(`${API}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Your email has been verified.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'This verification link is invalid or expired.');
      });
  }, [API, token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16" data-testid="verify-email-page">
      <div className="max-w-md w-full text-center bg-white/85 border border-white p-10">
        {status === 'loading' && <Clock className="w-12 h-12 mx-auto mb-4 text-[#C4942A] animate-pulse" />}
        {status === 'success' && <Check className="w-12 h-12 mx-auto mb-4 text-[#0A7A6A]" />}
        {status === 'error' && <XCircle className="w-12 h-12 mx-auto mb-4 text-[#A01E2C]" />}
        <h1 className="font-heading font-bold text-2xl text-[#1A2A3C] mb-3">
          {status === 'loading' ? 'Verifying your email...' : status === 'success' ? 'Email verified' : 'Verification issue'}
        </h1>
        <p className="text-sm leading-relaxed text-[#4A5A70] mb-6">{message || 'Please wait while we verify your account.'}</p>
        <Button asChild className="rounded-none h-11 px-6 text-xs font-bold uppercase tracking-widest bg-[#1A1A1A] text-white hover:bg-[#333]">
          <Link to="/auth">{status === 'success' ? 'Sign In' : 'Back to Sign In'}</Link>
        </Button>
      </div>
    </div>
  );
}
