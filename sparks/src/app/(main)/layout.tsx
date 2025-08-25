'use client';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import MainSidebar from '@/components/shared/main-sidebar';
import Header from '@/components/shared/header';
import { AuthProvider } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuth, setIsAuth] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Temporarily bypass authentication for debugging
    const isAuthenticated = true; // localStorage.getItem('sparks_auth_token') === 'true';
    setIsAuth(isAuthenticated);
    // if (!isAuthenticated) {
    //   router.replace('/login');
    // }
     const compactMode = localStorage.getItem('compact-mode') === 'true';
    if (compactMode) {
      document.body.classList.add('compact');
    }
  }, [router]);

  if (isAuth === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <MainSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 compact:p-3 compact:md:p-4 compact:lg:p-6 transition-all">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
