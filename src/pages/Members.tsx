import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MemberCard from "@/components/MemberCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  social?: {
    instagram?: string;
  };
  instagram: string | null;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (fetchError) {
          console.error('Üyeler yükleme hatası:', fetchError);
          setError(fetchError.message);
          toast.error('Üyeler yüklenemedi: ' + fetchError.message);
        } else if (data) {
          // Transform data to match MemberCard props
          const transformedData = data.map(member => ({
            ...member,
            social: member.instagram ? { instagram: member.instagram } : undefined
          }));
          setMembers(transformedData);
          console.log('Üyeler başarıyla yüklendi:', transformedData.length);
        } else {
          setMembers([]);
        }
      } catch (err) {
        console.error('Fetch hatası:', err);
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
        setError(errorMessage);
        toast.error('Üyeler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">Ekibimiz</Badge>
              <h1 className="text-5xl font-bold mb-6">Bu Ayın En Aktif Spotter'ları</h1>
              <p className="text-xl text-muted-foreground">
                Topluluğumuzun kalbi olan aktif üyelerimizle tanışın
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Üyeler yükleniyor...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">Üyeler yüklenirken bir hata oluştu: {error}</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                  >
                    Sayfayı Yenile
                  </Button>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-2">Henüz ekip üyesi bulunmuyor.</p>
                  <p className="text-sm text-muted-foreground">
                    Admin panelinden yeni üye ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {members.map((member) => (
                    <MemberCard key={member.id} {...member} />
                  ))}
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

export default Members;