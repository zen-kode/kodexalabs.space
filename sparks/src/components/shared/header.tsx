'use client';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { Bell, PanelLeft, PanelLeftClose, PanelRight, PanelRightClose } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const { toggleSidebar, open } = useSidebar();
  const handleLogout = () => {
    localStorage.removeItem('sparks_auth_token');
    router.push('/login');
  };
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                <PanelLeft />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
             <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar}>
                {open ? <PanelLeftClose /> : <PanelLeft />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User" data-ai-hint="user avatar" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
