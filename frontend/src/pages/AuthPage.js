import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export default function AuthPage() {
  const { login, register, user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', city: '', country: '' });

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.detail || 'Invalid email or password');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regForm.name || !regForm.email || !regForm.password || !regForm.city) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await register(regForm);
      toast.success('Welcome to Blogs 4 Blocks!');
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-grey mb-4">Welcome</p>
          <h1 className="font-heading font-bold text-3xl tracking-tight text-[#1A1A1A] mb-2" data-testid="auth-heading">
            Join the Conversation
          </h1>
          <p className="text-sm text-brand-grey">
            Sign in or create an account to contribute and stay informed.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E5] p-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8 rounded-none" data-testid="auth-tabs">
              <TabsTrigger value="login" className="rounded-none text-xs font-bold uppercase tracking-widest" data-testid="auth-login-tab">
                <LogIn className="w-3.5 h-3.5 mr-2" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-none text-xs font-bold uppercase tracking-widest" data-testid="auth-register-tab">
                <UserPlus className="w-3.5 h-3.5 mr-2" /> Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5" data-testid="login-form">
                <div>
                  <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                    data-testid="login-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                    data-testid="login-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold h-12 uppercase tracking-widest text-xs transition-colors"
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-5" data-testid="register-form">
                <div>
                  <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Full Name *</Label>
                  <Input
                    id="reg-name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={regForm.name}
                    onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                    data-testid="register-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Email *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                    data-testid="register-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Password *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Choose a strong password"
                    value={regForm.password}
                    onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                    data-testid="register-password-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reg-city" className="text-xs font-bold uppercase tracking-wider text-brand-grey">City *</Label>
                    <Input
                      id="reg-city"
                      placeholder="Your city"
                      value={regForm.city}
                      onChange={(e) => setRegForm(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                      data-testid="register-city-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-country" className="text-xs font-bold uppercase tracking-wider text-brand-grey">Country</Label>
                    <Input
                      id="reg-country"
                      placeholder="Your country"
                      value={regForm.country}
                      onChange={(e) => setRegForm(prev => ({ ...prev, country: e.target.value }))}
                      className="mt-2 border border-[#E5E5E5] focus:border-[#1A1A1A] rounded-none h-12"
                      data-testid="register-country-input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1A1A1A] text-white hover:bg-[#333] rounded-none font-bold h-12 uppercase tracking-widest text-xs transition-colors"
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-5 border border-brand-red/30 bg-brand-red/5 p-3 text-sm text-brand-red" data-testid="auth-error">
              {error}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-brand-grey mt-8">
          You can also post as a guest without an account. Guest posts are active for 30 days.
        </p>
      </div>
    </div>
  );
}
