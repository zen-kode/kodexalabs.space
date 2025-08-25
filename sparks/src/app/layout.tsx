import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/contexts/theme-context';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';


export const metadata: Metadata = {
  title: 'Sparks',
  description: 'The Ultimate AI Prompt Engineering Toolkit',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable)} suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          'bg-background text-foreground'
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsProvider>
              {children}
              <Toaster />
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
