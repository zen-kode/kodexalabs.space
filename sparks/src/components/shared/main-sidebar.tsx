'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import Logo from './logo';
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  Settings,
  LogOut,
  LifeBuoy,
  MessageSquareWarning,
  Folder,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ExtendedUser, createExtendedUser, canAccessAdminPanel } from '@/lib/auth-roles';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/playground',
    label: 'Playground',
    icon: FlaskConical,
  },
  {
    href: '/library',
    label: 'My Library',
    icon: Folder,
  },
  {
    href: '/community',
    label: 'Community',
    icon: Users,
  },
];

const bottomMenuItems = [
    {
        href: '/whats-new',
        label: 'What\'s New',
        icon: LifeBuoy,
    },
    {
        href: '/status',
        label: 'Status',
        icon: MessageSquareWarning,
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
    }
]

export default function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [extendedUser, setExtendedUser] = useState<ExtendedUser | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    if (user) {
      const extended = createExtendedUser(user);
      setExtendedUser(extended);
      setShowAdminPanel(canAccessAdminPanel(extended));
    } else {
      setExtendedUser(null);
      setShowAdminPanel(false);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('sparks_auth_token');
    router.push('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          <SidebarMenuItem className='mb-4'>
            <SidebarMenuButton onClick={() => router.push('/dashboard')} tooltip='Sparks' size="lg" className="justify-center h-12 w-12">
              <Logo className="h-8 w-8 p-0 bg-transparent text-primary" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                onClick={() => router.push(item.href)}
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
                className="justify-center"
                 size="lg"
              >
                <item.icon />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-2">
        <SidebarMenu>
            {/* Admin Panel (only for authorized users) */}
            {showAdminPanel && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => router.push('/admin')}
                    isActive={pathname.startsWith('/admin')}
                    tooltip="Admin Panel"
                    className="justify-center"
                    size="lg"
                  >
                    <Shield />
                    <span className="group-data-[collapsible=icon]:hidden">Admin Panel</span>
                    <Badge variant="secondary" className="ml-auto text-xs capitalize group-data-[collapsible=icon]:hidden">
                      {extendedUser?.role}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarSeparator className="my-1" />
              </>
            )}
            
            {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    onClick={() => router.push(item.href)}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                    className="justify-center"
                    size="lg"
                >
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            <SidebarSeparator className="my-1" />
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Log Out" className="justify-center" size="lg">
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
