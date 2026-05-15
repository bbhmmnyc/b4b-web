import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Check, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  const { API } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const polled = useRef(false);

  useEffect(() => {
    if (!sessionId || polled.current) return;
    polled.current = true;

    let attempts = 0;
    const maxAttempts = 6;
    const pollInterval = 2000;

    const poll = async () => {
      try {
        const res = await axios.get(`${API}/payments/status/${sessionId}`);
        setPaymentData(res.data);
        if (res.data.payment_status === 'paid') {
          setStatus('success');
          return;
        }
        if (res.data.status === 'expired') {
          setStatus('expired');
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          setStatus('timeout');
        }
      } catch {
        setStatus('error');
      }
    };
    poll();
  }, [sessionId, API]);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-[#C2544D] mx-auto mb-4" />
          <h1 className="font-heading font-bold text-xl text-[#1A1A1A] mb-2">Invalid Session</h1>
          <p className="text-sm text-brand-grey mb-6">No payment session found.</p>
          <Button onClick={() => navigate('/advertise')} className="bg-[#1A1A1A] text-white rounded-none font-bold text-xs uppercase tracking-widest px-6 py-2.5 h-auto">
            Back to Advertise
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" data-testid="payment-success-page">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div data-testid="payment-loading">
            <Clock className="w-12 h-12 text-[#C4942A] mx-auto mb-4 animate-pulse" />
            <h1 className="font-heading font-bold text-xl text-[#1A1A1A] mb-2">Processing Payment</h1>
            <p className="text-sm text-brand-grey">Verifying your payment with Stripe...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="border border-[#2D8B7A]/30 p-10" style={{ background: 'linear-gradient(135deg, #E0F5EC 0%, #FDFCF8 100%)' }} data-testid="payment-success">
            <Check className="w-14 h-14 text-[#2D8B7A] mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-[#1A1A1A] mb-2">Payment Successful!</h1>
            <p className="text-sm text-brand-grey mb-2">Thank you for your ad booking.</p>
            {paymentData?.metadata?.booking_id && (
              <p className="text-xs text-brand-grey mb-6">Booking ID: <span className="font-bold text-[#1A1A1A]">{paymentData.metadata.booking_id}</span></p>
            )}
            {paymentData?.amount_total && (
              <p className="text-lg font-heading font-black text-[#2D8B7A] mb-6">
                ${(paymentData.amount_total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
            <p className="text-xs text-brand-grey mb-6">Our team will reach out within 48 hours to set up your campaign. A confirmation has been sent to your email.</p>
            <Button onClick={() => navigate('/')} className="bg-[#2D8B7A] text-white hover:bg-[#247062] rounded-none font-bold text-xs uppercase tracking-widest px-6 py-2.5 h-auto">
              Back to Home <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {(status === 'error' || status === 'timeout' || status === 'expired') && (
          <div className="border border-[#C2544D]/30 p-10" style={{ background: 'linear-gradient(135deg, #FDE8E5 0%, #FDFCF8 100%)' }} data-testid="payment-error">
            <XCircle className="w-14 h-14 text-[#C2544D] mx-auto mb-4" />
            <h1 className="font-heading font-bold text-xl text-[#1A1A1A] mb-2">
              {status === 'expired' ? 'Session Expired' : 'Payment Verification Issue'}
            </h1>
            <p className="text-sm text-brand-grey mb-6">
              {status === 'expired'
                ? 'This payment session has expired. Please try again.'
                : 'We couldn\'t verify your payment status. If you were charged, please contact us and we\'ll sort it out.'}
            </p>
            <Button onClick={() => navigate('/advertise')} className="bg-[#C2544D] text-white hover:bg-[#A0443E] rounded-none font-bold text-xs uppercase tracking-widest px-6 py-2.5 h-auto">
              Try Again
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
