import { BACKEND_URL } from '@/config';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_LANGUAGE, translateUi } from '../i18n';

const API = `${BACKEND_URL || ''}/api`;

const storage = {
  getToken: () => {
    try {
      return localStorage.getItem('b4b_token');
    } catch {
      return null;
    }
  },
  setToken: (token) => {
    try {
      localStorage.setItem('b4b_token', token);
    } catch {}
  },
  clearToken: () => {
    try {
      localStorage.removeItem('b4b_token');
    } catch {}
  },
  getLanguage: () => {
    try {
      return localStorage.getItem('b4b_language') || DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  },
  setLanguage: (language) => {
    try {
      localStorage.setItem('b4b_language', language);
    } catch {}
  },
};


const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storage.getToken());
  const [language, setLanguageState] = useState(storage.getLanguage());
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [stats, setStats] = useState(null);

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(nextLanguage);
    storage.setLanguage(nextLanguage);
  }, []);

  const t = useCallback((key) => translateUi(language, key), [language]);

  const authHeaders = useCallback(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    storage.setToken(res.data.token);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await axios.post(`${API}/auth/register`, data);
    setToken(res.data.token);
    setUser(res.data.user);
    storage.setToken(res.data.token);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.clearToken();
  }, []);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUser(res.data))
        .catch(() => { setToken(null); storage.clearToken(); });
    }
  }, [token]);

  useEffect(() => {
    axios.get(`${API}/categories`).then(res => setCategories(res.data)).catch(() => {});
    axios.get(`${API}/regions?limit=8`).then(res => setRegions(res.data)).catch(() => {});
    axios.get(`${API}/stats`).then(res => setStats(res.data)).catch(() => {});
  }, []);

  const value = {
    user, token, categories, regions, stats, language,
    setLanguage, t,
    login, register, logout, authHeaders,
    API
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
