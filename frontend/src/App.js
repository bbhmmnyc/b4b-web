import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Toaster } from './components/ui/sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstallPrompt from './components/InstallPrompt';
import CityBackground from './components/CityBackground';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import PostPage from './pages/PostPage';
import WritePage from './pages/WritePage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminSetupPage from './pages/AdminSetupPage';
import HostingGuidePage from './pages/HostingGuidePage';
import AdvertisePage from './pages/AdvertisePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="flex flex-col min-h-screen font-body noise-overlay">
          <CityBackground />
          <Navbar />
          <main className="flex-1">
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
