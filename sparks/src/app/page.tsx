"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Logo from '@/components/shared/logo';

const wittyMessages = [
  "Igniting creative sparks...",
  "Brewing fresh ideas...",
  "Assembling genius...",
  "Polishing pixels to perfection...",
  "Reticulating splines...",
  "Warming up the AI's imagination...",
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [message, setMessage] = useState(wittyMessages[0]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

   useEffect(() => {
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % wittyMessages.length;
      setMessage(wittyMessages[messageIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
       <Logo className="h-16 w-16 mb-4" />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground transition-all duration-300">{message}</p>
    </div>
  );
}
