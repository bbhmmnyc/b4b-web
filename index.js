import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        if (process.env.NODE_ENV !== 'production') console.info('B4B Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') console.warn('B4B Service Worker registration failed:', error);
      });
  });
}
