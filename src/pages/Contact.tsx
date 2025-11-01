import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Instagram, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [social, setSocial] = useState({ instagram: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'social');
      
      data?.forEach((setting) => {
        if (setting.key === 'social') {
          const socialData = setting.value as { instagram?: string };
          setSocial({ instagram: socialData?.instagram || '' });
        }
      });
      
      // Fallback to site.json if no data from Supabase
      if (!data || data.length === 0) {
        const siteData = await import('../../contents/site.json');
        setSocial({ instagram: siteData.default.social.instagram || '' });
      }
    };
    fetchSettings();

    // Load form data from localStorage if available
    const savedFormData = localStorage.getItem('contactFormData');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Supabase suggestions table
      console.log('🚀 Form gönderiliyor...', { name: formData.name, email: formData.email });
      
      const { data, error } = await supabase
        .from('suggestions')
        .insert([{
          name: formData.name,
          email: formData.email,
          suggestion: formData.message,
          announcement_id: null, // Contact form doesn't need announcement_id
        }])
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('📋 Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        
        // Check if it's an RLS policy error
        if (error.code === '42501' || 
            error.code === 'PGRST301' ||
            error.message.includes('permission denied') || 
            error.message.includes('policy') ||
            error.message.includes('new row violates row-level security')) {
          
          console.error('🔒 RLS POLICY HATASI TESPİT EDİLDİ!');
          console.error('📝 Yapılması gerekenler:');
          console.error('1. Supabase Dashboard -> SQL Editor\'a gidin');
          console.error('2. Aşağıdaki SQL\'i çalıştırın:');
          console.error(`
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert to suggestions" ON public.suggestions;

CREATE POLICY "Allow anonymous insert to suggestions"
ON public.suggestions
FOR INSERT
TO anon
WITH CHECK (true);
          `);
          
          throw new Error(
            'Erişim izni hatası: Supabase Dashboard -> Table Editor -> suggestions -> Policies -> New Policy\n' +
            'Policy Name: "Allow anonymous insert to suggestions"\n' +
            'Operation: INSERT, Role: anon, WITH CHECK: true\n\n' +
            'Veya SQL Editor\'da:\n' +
            'ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;\n' +
            'CREATE POLICY "Allow anonymous insert to suggestions" ON public.suggestions FOR INSERT TO anon WITH CHECK (true);'
          );
        }
        
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert');
        throw new Error('Veritabanına kayıt başarısız');
      }

      console.log('Contact form submitted successfully:', data);

      // Clear localStorage after successful submission
      localStorage.removeItem('contactFormData');
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        message: "",
      });

      toast.success("Mesajınız başarıyla gönderildi!", {
        description: "En kısa sürede size geri dönüş yapacağız.",
      });
    } catch (error) {
      console.error('Contact form error:', error);
      let errorMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast.error("Mesaj gönderilemedi", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
    // Save to localStorage
    localStorage.setItem('contactFormData', JSON.stringify(newFormData));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">İletişim</Badge>
              <h1 className="text-5xl font-bold mb-6">Bize Ulaşın</h1>
              <p className="text-xl text-muted-foreground">
                Sorularınız, önerileriniz veya işbirliği teklifleriniz için
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card>
                <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-6">Bize Ulaşın</h2>
                  <p className="text-muted-foreground mb-6">
                    Sorularınız, önerileriniz veya işbirliği teklifleriniz için bizimle iletişime geçebilirsiniz.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresiniz *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="ornek@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mesajınız *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Mesajınızı buraya yazın..."
                        rows={6}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Gönderiliyor..."
                      ) : (
                        <>
                          Mesaj Gönder
                          <Mail className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-6">İletişim Bilgileri</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">E-posta</div>
                          <div className="text-sm text-muted-foreground">Yukarıdaki formu kullanarak bize ulaşın</div>
                        </div>
                      </div>
                      
                      {social.instagram && (
                        <a
                          href={social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                            <Instagram className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">Instagram</div>
                            <div className="text-sm text-muted-foreground">Instagram'dan da bize ulaşabilirsiniz</div>
                          </div>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-accent/10 border-accent/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Yanıt Süresi:</strong> Instagram mesajlarınıza genellikle 24-48 saat içinde 
                      yanıt vermeye çalışıyoruz.
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

export default Contact;
