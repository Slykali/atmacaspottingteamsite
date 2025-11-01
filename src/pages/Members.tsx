import React, { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MemberCard from "@/components/MemberCard";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) {
        // Transform data to match MemberCard props
        const transformedData = data.map(member => ({
          ...member,
          social: member.instagram ? { instagram: member.instagram } : undefined
        }));
        setMembers(transformedData);
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {members.map((member) => (
                  <MemberCard key={member.id} {...member} />
                ))}
              </div>
              {members.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Henüz ekip üyesi bulunmuyor.</p>
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