'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessengerButtonProps {
  recipientName?: string;
  message?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  customText?: string;
}

export default function MessengerButton({
  recipientName = 'Joel Ross',
  message = 'Hi! I wanted to reach out to you.',
  className,
  variant = 'default',
  size = 'default',
  showIcon = true,
  customText
}: MessengerButtonProps) {
  const handleMessengerClick = () => {
    // Facebook Messenger URL format
    // For web: https://m.me/USERNAME?text=MESSAGE
    // For mobile app: fb-messenger://user/USERNAME
    
    const encodedMessage = encodeURIComponent(message);
    
    // Try to determine if we should use the app or web version
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open the mobile app first
      const appUrl = `fb-messenger://user/${recipientName.replace(/\s+/g, '').toLowerCase()}`;
      const webUrl = `https://m.me/${recipientName.replace(/\s+/g, '').toLowerCase()}?text=${encodedMessage}`;
      
      // Create a temporary link to try opening the app
      const link = document.createElement('a');
      link.href = appUrl;
      link.click();
      
      // Fallback to web version after a short delay
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 1000);
    } else {
      // Desktop - open web version
      const webUrl = `https://m.me/${recipientName.replace(/\s+/g, '').toLowerCase()}?text=${encodedMessage}`;
      window.open(webUrl, '_blank');
    }
  };

  const buttonText = customText || `Message ${recipientName}`;

  return (
    <Button
      onClick={handleMessengerClick}
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200 hover:scale-105 active:scale-95',
        variant === 'default' && 'bg-blue-600 hover:bg-blue-700 text-white',
        className
      )}
    >
      {showIcon && (
        <MessageCircle className="w-4 h-4" />
      )}
      {buttonText}
      <Send className="w-3 h-3 ml-1 opacity-70" />
    </Button>
  );
}

// Alternative component for a more Facebook-styled button
export function FacebookMessengerButton({
  recipientName = 'Joel Ross',
  message = 'Hi! I wanted to reach out to you.',
  className
}: Pick<MessengerButtonProps, 'recipientName' | 'message' | 'className'>) {
  const handleMessengerClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const webUrl = `https://m.me/${recipientName.replace(/\s+/g, '').toLowerCase()}?text=${encodedMessage}`;
    window.open(webUrl, '_blank');
  };

  return (
    <button
      onClick={handleMessengerClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full',
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
        'text-white font-medium text-sm transition-all duration-200',
        'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.477 2 2 6.145 2 11.25c0 2.9 1.4 5.5 3.6 7.2V22l3.5-1.9c.9.2 1.9.4 2.9.4 5.523 0 10-4.145 10-9.25S17.523 2 12 2zm1 12.5l-2.5-2.7L6 14.5l5.5-5.8L14 11.4l4.5-2.7L13 14.5z"/>
      </svg>
      Message {recipientName}
    </button>
  );
}