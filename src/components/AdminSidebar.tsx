import React from 'react';
import { LayoutDashboard, Image, Users, FileText, LogOut, Settings, Mail, MessageSquare, Code } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import atmacaLogo from '@/assets/atmaca-logo.jpg';

const items = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Kullanıcılar', url: '/admin/users', icon: Users },
  { title: 'Duyurular', url: '/admin/announcements', icon: FileText },
  { title: 'Galeri', url: '/admin/gallery', icon: Image },
  { title: 'Ekip Üyeleri', url: '/admin/members', icon: Users },
  { title: 'Başvurular', url: '/admin/applications', icon: Mail },
  { title: 'Öneriler', url: '/admin/suggestions', icon: MessageSquare },
  { title: 'Developer Panel', url: '/admin/developer', icon: Code },
  { title: 'Ayarlar', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { signOut } = useAuth();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={atmacaLogo} alt="Atmaca Logo" className="w-8 h-8 rounded bg-[#FFD700] p-1" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button onClick={signOut} variant="outline" className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Çıkış Yap
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}