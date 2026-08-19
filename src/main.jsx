import React from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initAnalytics } from './lib/analytics.js';

import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/route.css';
import './styles/theme.css';
import './styles/print.css';

initAnalytics();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Vercel's own pageview/visitor analytics — separate from the GA4
        funnel above. It only reports real data when served from a Vercel
        deployment; locally and on other hosts it's inert by design. */}
    <Analytics />
  </React.StrictMode>
);
