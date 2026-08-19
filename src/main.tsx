import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Developer Diagnostic Utilities for Browser Console
declare global {
  interface Window {
    checkServerSupabaseEnv: () => Promise<void>;
    checkServerHealth: () => Promise<void>;
  }
}

if (typeof window !== 'undefined') {
  window.checkServerSupabaseEnv = async () => {
    try {
      console.log('%c🔍 Checking Server Environment & Supabase Credentials...', 'color: #3b82f6; font-weight: bold;');
      const res = await fetch('/api/diagnostics/supabase');
      const data = await res.json();
      console.log('%c📊 Server Environment Report:', 'color: #10b981; font-weight: bold;', data);
      console.table({
        'SUPABASE_URL': {
          Available: data.supabaseUrl?.isAvailable ? '✅ YES' : '❌ NO',
          Source: data.supabaseUrl?.sourceVar || 'None',
          FormatValid: data.supabaseUrl?.isValidFormat ? '✅ YES' : '❌ NO',
          ProjectRef: data.supabaseUrl?.projectRef || 'N/A'
        },
        'SUPABASE_SERVICE_ROLE_KEY': {
          Available: data.supabaseServiceRoleKey?.isAvailable ? '✅ YES' : '❌ NO',
          Source: data.supabaseServiceRoleKey?.sourceVar || 'None',
          IsJwt: data.supabaseServiceRoleKey?.isJwtFormat ? '✅ YES' : '❌ NO',
          DecodedRole: data.supabaseServiceRoleKey?.decodedRole || 'N/A'
        },
        'Overall Status': {
          Available: data.overallStatus,
          Source: data.summaryMessage,
          FormatValid: data.runtime?.isVercel ? 'Vercel Runtime' : 'Node Runtime',
          ProjectRef: data.timestamp
        }
      });
    } catch (err) {
      console.error('Failed to query server diagnostics:', err);
    }
  };

  window.checkServerHealth = async () => {
    try {
      const res = await fetch('/api/supabase/health');
      const data = await res.json();
      console.log('%c🏥 Supabase Connection Health:', 'color: #3b82f6; font-weight: bold;', data);
    } catch (err) {
      console.error('Failed to query Supabase health:', err);
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
