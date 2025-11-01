import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Calendar, Camera, Plane } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementCard from "@/components/AnnouncementCard";
import GalleryImage from "@/components/GalleryImage";
import { SEO } from "@/components/SEO";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/JsonLd";
import siteData from "../../contents/site.json";
import heroImage from "@/assets/hero-aircraft.jpg";
import { supabase } from "@/integrations/supabase/client";
import gallery1 from "@/assets/gallery/gallery-1.jpg";
import gallery2 from "@/assets/gallery/gallery-2.jpg";
import gallery3 from "@/assets/gallery/gallery-3.jpg";
import gallery4 from "@/assets/gallery/gallery-4.jpg";

interface Announcement {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
}

interface GalleryImageType {
  id: string;
  src: string;
  alt: string;
  tags: string[];
  location: string | null;
  date: string | null;
  photographer: string | null;
  likes_count?: number;
}

const Index = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gallery, setGallery] = useState<GalleryImageType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false })
        .limit(3);

      const { data: galleryData } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);

      if (announcementsData) setAnnouncements(announcementsData);
      
      // If no data from Supabase, use local gallery photos
      if (galleryData && galleryData.length > 0) {
        setGallery(galleryData);
      } else {
        // Local fallback photos
        const localPhotos: GalleryImageType[] = [
          {
            id: 'local-1',
            src: gallery1,
            alt: 'AJET AİRBUS A321 Sabiha-Antalya iniş',
            tags: ['AJET', 'Airbus A321', 'İniş', 'Sabiha', 'Antalya'],
            location: 'Antalya Havalimanı',
            date: '2024-01-15',
            photographer: 'Atmaca Spotting Team'
          },
          {
            id: 'local-2',
            src: gallery2,
            alt: 'THY 737 MAX İstanbul Havalimanı-Antalya iniş',
            tags: ['THY', 'Boeing 737 MAX', 'İniş', 'İstanbul Havalimanı', 'Antalya'],
            location: 'Antalya Havalimanı',
            date: '2024-02-20',
            photographer: 'Atmaca Spotting Team'
          },
          {
            id: 'local-3',
            src: gallery3,
            alt: 'Airbus A330 Londra-Antalya park alanı',
            tags: ['Airbus A330', 'Park', 'Londra', 'Antalya'],
            location: 'Antalya Havalimanı',
            date: '2024-03-10',
            photographer: 'Atmaca Spotting Team'
          },
          {
            id: 'local-4',
            src: gallery4,
            alt: 'IRAERO SU100 Moskova-Antalya iniş',
            tags: ['IRAERO', 'SU100', 'İniş', 'Moskova', 'Antalya'],
            location: 'Antalya Havalimanı',
            date: '2024-04-05',
            photographer: 'Atmaca Spotting Team'
          }
        ];
        setGallery(localPhotos.slice(0, 6));
      }
    };

    fetchData();
  }, []);

  const latestAnnouncements = announcements;
  const galleryPreview = gallery;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Atmaca Spotting Team - Havacılık Fotoğrafçılığı Topluluğu"
        description="Türkiye'nin önde gelen havacılık spotting topluluğu. Uçak fotoğrafçılığı, spotting etkinlikleri ve havacılık tutkusu."
      />
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Aircraft hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1E90FF]/80 via-[#1E90FF]/60 to-primary/80" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
            {siteData.siteName}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            {siteData.slogan}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hakkinda">
              <Button size="lg" variant="secondary" className="text-lg gap-2">
                Grubu Tanı
                <Plane className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/basvuru">
              <Button size="lg" variant="outline" className="text-lg gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30">
                Uçuşa Hazır Mısın?
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* About Section */}
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 animate-fade-in">
                <Badge variant="secondary" className="mb-4">Hakkımızda</Badge>
                <h2 className="text-4xl font-bold mb-6">
                  Havacılık Tutkunlarının Evi
                </h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center animate-scale-in">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Güçlü Topluluk</h3>
                  <p className="text-muted-foreground text-sm">
                    200+ aktif üye ile Türkiye'nin en büyük spotter topluluğu
                  </p>
                </div>
                
                <div className="text-center animate-scale-in" style={{ animationDelay: "0.1s" }}>
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Düzenli Etkinlikler</h3>
                  <p className="text-muted-foreground text-sm">
                    Aylık spotting gezileri ve özel eğitim atölyeleri
                  </p>
                </div>
                
                <div className="text-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground mb-4">
                    <Camera className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Paylaşım Platformu</h3>
                  <p className="text-muted-foreground text-sm">
                    5000+ fotoğraf arşivi ve bilgi paylaşım kanalları
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg p-8 shadow-card">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {siteData.about.short}
                </p>
                <div className="mt-6 text-center">
                  <Link to="/hakkinda">
                    <Button variant="outline" className="gap-2">
                      Daha Fazla Bilgi
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Announcements */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Duyurular</Badge>
              <h2 className="text-4xl font-bold mb-4">Son Haberler</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Topluluğumuzdan en güncel duyuru ve etkinlikler
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {latestAnnouncements.map((announcement) => (
                <AnnouncementCard key={announcement.slug} {...announcement} />
              ))}
            </div>

            <div className="text-center">
              <Link to="/duyurular">
                <Button variant="outline" size="lg" className="gap-2">
                  Tüm Duyurular
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Gallery Preview */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Galeri</Badge>
              <h2 className="text-4xl font-bold mb-4">Fotoğraf Galerisi</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Üyelerimizin çektiği muhteşem uçak fotoğrafları
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {galleryPreview.map((image, index) => (
                <GalleryImage key={index} {...image} />
              ))}
            </div>

            <div className="text-center">
              <Link to="/galeri">
                <Button size="lg" className="gap-2">
                  Tüm Galeri
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Photo Submission Note */}
            {galleryPreview.length > 0 && (
              <div className="mt-8 text-center">
                <div className="inline-block p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    📸 Fotoğraflarınızı galeride görmek ister misiniz?
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Fotoğraflarınızı bizimle paylaşmak için{' '}
                    <Link to="/iletisim" className="text-primary hover:underline font-semibold">
                      bizimle iletişime geçin
                    </Link>
                    !
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 gradient-hero text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 Q25,40 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold mb-6">
              Uçuşa Hazır Mısın?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Gökyüzüne tutkulu bir toplulukla tanış. Spot'la bizimle, göklerde iz peşinde ol.
            </p>
            <Link to="/basvuru">
              <Button size="lg" variant="secondary" className="text-lg gap-2 aircraft-glow">
                Topluluğa Katıl
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
