import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Application = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    city: "",
    occupation: "",
    email: "",
    instagram: "",
    phone: "",
    acceptRules: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptRules) {
      toast.error("Lütfen topluluk kurallarını kabul edin");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('applications')
      .insert([{
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        message: `Yaş: ${formData.age}\nŞehir: ${formData.city}\nMeslek: ${formData.occupation}\nInstagram: ${formData.instagram}\nEmail: ${formData.email}`,
      }]);

    if (error) {
      toast.error("Başvuru gönderilemedi");
      setIsSubmitting(false);
    } else {
      toast.success("Başvurunuz alındı!", {
        description: "En kısa sürede size geri dönüş yapacağız.",
      });
      
      setFormData({
        firstName: "",
        lastName: "",
        age: "",
        city: "",
        occupation: "",
        email: "",
        instagram: "",
        phone: "",
        acceptRules: false,
      });
      
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">Başvuru</Badge>
              <h1 className="text-5xl font-bold mb-6">Ekibimize Katıl</h1>
              <p className="text-xl text-muted-foreground">
                Havacılığa tutkuluysan, seni aramızda görmek isteriz
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Başvuru Formu</CardTitle>
                  <CardDescription>
                    Tüm alanları doldurarak başvurunuzu tamamlayın. Başvurular 7 gün içinde değerlendirilir.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Adınız *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Adınız"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyadınız *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Soyadınız"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Yaşınız *</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleChange}
                          required
                          placeholder="18"
                          min="16"
                          max="99"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">İkamet Ettiğiniz Şehir *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          placeholder="İstanbul"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">Mesleğiniz (Öğrenciyseniz "Öğrenci" Yazınız) *</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        required
                        placeholder="Mesleğiniz"
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
                      <Label htmlFor="instagram">Instagram Hesabınız (Başına "@" Koyunuz) *</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        required
                        placeholder="@kullaniciadi"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon Numaranız *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="0555 555 55 55"
                      />
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="acceptRules"
                        checked={formData.acceptRules}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, acceptRules: checked as boolean })
                        }
                      />
                      <Label htmlFor="acceptRules" className="text-sm cursor-pointer leading-relaxed">
                        Topluluk kurallarını, güvenlik ve etik ilkelerini okudum ve kabul ediyorum. *
                      </Label>
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
                          Başvuruyu Gönder
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6 bg-accent/10 border-accent/30">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong>Not:</strong> Başvurular değerlendirildikten sonra e-posta yoluyla 
                    size geri dönüş yapılacaktır. Lütfen spam klasörünüzü de kontrol etmeyi unutmayın.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Application;
