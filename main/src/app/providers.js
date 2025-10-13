// FILE: src/app/providers.js
'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TimezoneProvider } from './context/TimezoneContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <TimezoneProvider>
        <ToastProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            storageKey="sellinginfinity-theme"
            themes={["light", "dark", "system"]}
            forcedTheme={undefined}
          >
            {children}
          </ThemeProvider>
        </ToastProvider>
      </TimezoneProvider>
    </AuthProvider>
  );
}
