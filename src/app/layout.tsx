import type { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { GlobalShellControls } from "@/components/global-shell-controls";
import { PwaRegister } from "@/components/pwa-register";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

// ─── SEO & Metadata ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Chatzi — موظف استقبال ذكي 24/7",
    template: "%s | Chatzi",
  },
  description:
    "منصة Chatzi للمحادثات الذكية متعددة القنوات — WhatsApp، Telegram، Facebook، وأكثر. مدعوم بالذكاء الاصطناعي.",
  robots: { index: false, follow: false }, // Private SaaS — no public indexing
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chatzi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#21064F" },
  ],
};

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="transition-colors duration-fast">
      <head>
        {/*
         * Google Fonts preconnect — critical for performance.
         * Cairo is loaded in globals.css and used across Arabic + Latin UI.
         */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var themeMode = theme || 'system';
                  document.documentElement.dataset.theme = themeMode;
                  if (themeMode === 'dark' || (themeMode === 'system' && systemDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Also set dynamic lang/dir from localStorage to prevent flash of wrong layout
                  var locale = localStorage.getItem('locale') || 'en';
                  document.documentElement.lang = locale;
                  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var recoveryKey = 'chatzi:chunk-recovery';

                function clearRuntimeCaches() {
                  var tasks = [];

                  if ('serviceWorker' in navigator) {
                    tasks.push(
                      navigator.serviceWorker
                        .getRegistrations()
                        .then(function(registrations) {
                          return Promise.all(registrations.map(function(registration) {
                            return registration.unregister();
                          }));
                        })
                    );
                  }

                  if ('caches' in window) {
                    tasks.push(
                      caches.keys().then(function(keys) {
                        return Promise.all(keys.map(function(key) {
                          return caches.delete(key);
                        }));
                      })
                    );
                  }

                  return Promise.all(tasks);
                }

                function recoverFromChunkError() {
                  try {
                    if (sessionStorage.getItem(recoveryKey) === '1') return;
                    sessionStorage.setItem(recoveryKey, '1');
                  } catch (error) {
                    return;
                  }

                  clearRuntimeCaches().finally(function() {
                    window.location.reload();
                  });
                }

                function isChunkMessage(message) {
                  return /ChunkLoadError|Loading chunk [\\w-]+ failed/i.test(String(message || ''));
                }

                window.addEventListener('error', function(event) {
                  var target = event && event.target;
                  var src = target && target.src;
                  var message = event && (event.message || (event.error && event.error.message));

                  if ((src && src.indexOf('/_next/static/chunks/') !== -1) || isChunkMessage(message)) {
                    recoverFromChunkError();
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event && event.reason;
                  var message = reason && (reason.message || reason.toString());

                  if (isChunkMessage(message)) {
                    recoverFromChunkError();
                  }
                });

                window.addEventListener('load', function() {
                  window.setTimeout(function() {
                    try {
                      sessionStorage.removeItem(recoveryKey);
                    } catch (error) {}
                  }, 5000);
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        <NextTopLoader color="#6119E6" height={3} showSpinner={false} />
        <I18nProvider initialLocale={locale}>
          <ThemeProvider>
            {children}
            <PwaRegister />
            <GlobalShellControls />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
