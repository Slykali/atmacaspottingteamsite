import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { supabase } from "./integrations/supabase/client";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import Gallery from "./pages/Gallery";
import Members from "./pages/Members";
import Application from "./pages/Application";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import UploadPhoto from "./pages/UploadPhoto";
import Maintenance from "./pages/Maintenance";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSuggestions from "./pages/admin/AdminSuggestions";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import ChatWidget from "./components/ChatWidget";
import UpdateModal from "./components/UpdateModal";
import Messages from "./pages/Messages";

// Note: React Query temporarily removed to resolve runtime error

function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance')
      .single();

    if (data?.value) {
      const maintenance = data.value as { enabled?: boolean };
      setMaintenanceMode(maintenance.enabled || false);
    } else {
      setMaintenanceMode(false);
    }
  };

  if (maintenanceMode === null) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  if (maintenanceMode) {
    return <Maintenance />;
  }

  return <>{children}</>;
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Admin routes - not affected by maintenance */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="members" element={<AdminMembers />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="suggestions" element={<AdminSuggestions />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="activity-logs" element={<AdminActivityLogs />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
          
          {/* Public routes - affected by maintenance */}
          <Route
            path="/*"
            element={
              <MaintenanceWrapper>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/hakkinda" element={<About />} />
                  <Route path="/duyurular" element={<Announcements />} />
                  <Route path="/duyurular/:slug" element={<AnnouncementDetail />} />
                  <Route path="/galeri" element={<Gallery />} />
                  <Route path="/upload-photo" element={<UploadPhoto />} />
                  <Route path="/aktifler" element={<Members />} />
                  <Route path="/basvuru" element={<Application />} />
                  <Route path="/iletisim" element={<Contact />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/mesajlar" element={<Messages />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MaintenanceWrapper>
            }
          />
        </Routes>
        
        {/* Chat Widget - Tüm sayfalarda görünür */}
        <ChatWidget />
        
        {/* Update Modal - Sadece yeni versiyonda gösterilir */}
        <UpdateModal />
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
