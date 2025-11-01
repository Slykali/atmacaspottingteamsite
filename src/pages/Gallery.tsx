import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GalleryImage from "@/components/GalleryImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import gallery1 from "@/assets/gallery/gallery-1.jpg";
import gallery2 from "@/assets/gallery/gallery-2.jpg";
import gallery3 from "@/assets/gallery/gallery-3.jpg";
import gallery4 from "@/assets/gallery/gallery-4.jpg";

interface GalleryImageType {
  id: string;
  src: string;
  alt: string;
  tags: string[];
  location: string | null;
  date: string | null;
  photographer: string | null;
  likes_count?: number;
  user_id?: string;
  status?: string;
  views?: number;
  created_at?: string;
  updated_at?: string;
}

const Gallery = () => {
  const { user } = useAuth();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryImageType[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      // If no data from Supabase, use local gallery photos
      if (data && data.length > 0) {
        setGallery(data);
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
        setGallery(localPhotos);
      }
    };

    fetchGallery();
  }, []);

  // Get all unique tags
  const allTags = Array.from(
    new Set(gallery.flatMap((image) => image.tags))
  ).sort();

  // Filter images by selected tag
  const filteredGallery = selectedTag
    ? gallery.filter((image) => image.tags.includes(selectedTag))
    : gallery;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">Galeri</Badge>
              <h1 className="text-5xl font-bold mb-6">Fotoğraf Galerisi</h1>
              <p className="text-xl text-muted-foreground">
                Üyelerimizin çektiği muhteşem uçak fotoğrafları
              </p>
              <p className="text-lg text-primary font-semibold mt-2">
                📸 {gallery.length} Fotoğraf
              </p>
              {user && (
                <div className="mt-6">
                  <Link to="/upload-photo">
                    <Button size="lg">
                      <Plus className="mr-2 h-5 w-5" />
                      Fotoğraf Ekle
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Tag Filters */}
            <div className="mb-8 flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                Tümü
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGallery.map((image) => (
                <GalleryImage key={image.id} {...image} />
              ))}
            </div>

            {filteredGallery.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {selectedTag ? 'Bu kategoride henüz fotoğraf bulunmuyor.' : 'Henüz fotoğraf bulunmuyor.'}
                </p>
              </div>
            )}

            {/* Photo Submission Note */}
            {filteredGallery.length > 0 && (
              <div className="mt-12 text-center">
                <div className="inline-block p-6 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    📸 Fotoğraflarınızı galeride görmek ister misiniz?
                  </p>
                  <p className="text-sm font-medium text-foreground mb-4">
                    Fotoğraflarınızı bizimle paylaşmak için bizimle iletişime geçin!
                  </p>
                  <Link to="/iletisim">
                    <Button variant="outline" size="sm">
                      İletişim
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;