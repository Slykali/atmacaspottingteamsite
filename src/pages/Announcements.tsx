import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementCard from "@/components/AnnouncementCard";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false });
      
      if (data) {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4">Duyurular</Badge>
              <h1 className="text-5xl font-bold mb-6">Haberler & Etkinlikler</h1>
              <p className="text-xl text-muted-foreground mb-4">
                Topluluğumuzdan tüm duyuru, etkinlik ve haberler
              </p>
              <p className="text-sm text-muted-foreground">
                Her duyuru için öneri ve görüşlerinizi bildirebilirsiniz
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                  <AnnouncementCard key={announcement.slug} {...announcement} />
                ))}
              </div>
              {announcements.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Henüz duyuru bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Announcements;