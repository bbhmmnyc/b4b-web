import React, { Suspense, lazy } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstallPrompt from './components/InstallPrompt';
import CityBackground from './components/CityBackground';
import HomePage from './pages/HomePage';

const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const PostPage = lazy(() => import('./pages/PostPage'));
const WritePage = lazy(() => import('./pages/WritePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminSetupPage = lazy(() => import('./pages/AdminSetupPage'));
const HostingGuidePage = lazy(() => import('./pages/HostingGuidePage'));
const AdvertisePage = lazy(() => import('./pages/AdvertisePage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));

function PageLoader() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center" data-testid="page-loader">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="flex flex-col min-h-screen font-body noise-overlay">
          <CityBackground />
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="/write" element={<WritePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin-setup" element={<AdminSetupPage />} />
                <Route path="/deployment-guide" element={<HostingGuidePage />} />
                <Route path="/hosting-guide" element={<HostingGuidePage />} />
                <Route path="/advertise" element={<AdvertisePage />} />
                <Route path="/payment-success" element={<PaymentSuccessPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        <Toaster position="bottom-right" richColors />
        <InstallPrompt />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
