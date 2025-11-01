import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Target, Users, CheckCircle, Heart, Compass, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import siteData from "../../contents/site.json";

const About = () => {
  const [about, setAbout] = useState({ short: '', mission: '' });

  useEffect(() => {
    const fetchAbout = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'about')
        .single();
      
      if (data) setAbout(data.value as any);
    };
    fetchAbout();
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 gradient-hero text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">Hakkımızda</Badge>
              <h1 className="text-5xl font-bold mb-6">{siteData.siteName}</h1>
              <p className="text-xl text-white/90 italic mb-4">
                "Biz gökyüzüne tutkulu bir topluluğuz. Her uçuşta, her inişte, bir hikaye yakalarız."
              </p>
              <p className="text-lg text-white/80">
                {siteData.description}
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Misyonumuz</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {about.mission || siteData.about.mission}
                  </p>
                </div>
              </div>

              <Card className="bg-card/50">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Sivil ve askeri hava araçlarının fotoğraflanması yönünde çalışmalar yürüten ekibimiz, 
                    havacılık fotoğrafçılığının yaygınlaşmasına katkı sağlamayı hedeflemektedir.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Atmaca Spotting Team, ortak ilgi alanlarına sahip havacılık fotoğrafçılarını aynı çatı 
                    altında toplayarak, fotoğrafları aracılığıyla havacılığın gelişimine katkıda bulunmaya 
                    devam etmektedir.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Ethics & Rules */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Güvenlik & Etik Kurallarımız</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Topluluğumuz, sorumlu ve etik spotting ilkelerine bağlıdır. 
                    Tüm üyelerimiz aşağıdaki kurallara uymayı taahhüt eder:
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {siteData.about.ethics.map((rule, index) => (
                  <Card key={index} className="hover-lift">
                    <CardContent className="flex items-start gap-3 pt-6">
                      <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{rule}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 bg-accent/10 border-accent/30">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong>Önemli Not:</strong> Havaalanı güvenlik kurallarına uyulmaması, 
                    yasak alanlara girilmesi veya diğer etik ihlaller durumunda üyelik iptal edilebilir. 
                    Güvenlik ve etik, topluluğumuzun temel değerleridir.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="secondary" className="mb-4 crew-badge">Değerlerimiz</Badge>
                <h2 className="text-3xl font-bold mb-4">Bizi Biz Yapan Değerler</h2>
                <p className="text-lg text-muted-foreground">
                  Topluluğumuzun temel taşları
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover-lift text-center group">
                  <CardContent className="pt-8 pb-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4 group-hover:scale-110 transition-transform">
                      <Shield className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Güvenlik</h3>
                    <p className="text-sm text-muted-foreground">
                      Her şeyden önce güvenlik. Kendimizin ve çevremizin emniyeti bizim için önceliktir.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift text-center group">
                  <CardContent className="pt-8 pb-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4 group-hover:scale-110 transition-transform">
                      <Heart className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Saygı</h3>
                    <p className="text-sm text-muted-foreground">
                      Diğer spotterlar, havacılık personeli ve çevreye karşı derin saygı gösteririz.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-lift text-center group">
                  <CardContent className="pt-8 pb-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4 group-hover:scale-110 transition-transform">
                      <Compass className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Paylaşım</h3>
                    <p className="text-sm text-muted-foreground">
                      Bilgi, deneyim ve tutkumuzu tüm üyelerimizle cömertçe paylaşırız.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Organization */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4">Organizasyon Yapısı</h2>
                  <p className="text-lg text-muted-foreground">
                    Topluluğumuz, farklı sorumluluk alanlarında uzmanlaşmış ekip üyelerinden oluşur.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-2">Yönetim Ekibi</h3>
                    <p className="text-sm text-muted-foreground">
                      Topluluğun genel yönetimi, stratejik kararlar ve üye ilişkileri
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-2">Etkinlik Koordinatörleri</h3>
                    <p className="text-sm text-muted-foreground">
                      Spotting gezileri, atölyeler ve sosyal etkinliklerin planlanması
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-2">Teknik Danışmanlar</h3>
                    <p className="text-sm text-muted-foreground">
                      Ekipman, fotoğraf teknikleri ve havacılık konularında rehberlik
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-2">Medya & İletişim</h3>
                    <p className="text-sm text-muted-foreground">
                      Sosyal medya yönetimi, içerik üretimi ve dış iletişim
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
