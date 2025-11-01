import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";

const UploadPhoto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    alt: "",
    tags: "",
    location: "",
    date: "",
    photographer: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Dosya çok büyük",
          description: "Maksimum dosya boyutu 10MB olmalıdır.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Oturum gerekli",
        description: "Fotoğraf yüklemek için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Fotoğraf seçin",
        description: "Lütfen yüklenecek bir fotoğraf seçin.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Insert into database
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          src: publicUrl,
          alt: formData.alt,
          tags: tagsArray,
          location: formData.location || null,
          date: formData.date || null,
          photographer: formData.photographer || null,
          user_id: user.id,
          status: 'pending', // Will be reviewed by admin
        });

      if (dbError) throw dbError;

      toast({
        title: "Başarılı!",
        description: "Fotoğrafınız yüklendi ve inceleme bekliyor. Onaylandığında galeride görünecektir.",
      });

      navigate('/gallery');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Yükleme hatası",
        description: error.message || "Fotoğraf yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Giriş Gerekli</CardTitle>
              <CardDescription>
                Fotoğraf yüklemek için giriş yapmalısınız.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Giriş Yap
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">
                <Upload className="mr-2 h-4 w-4" />
                Yükle
              </Badge>
              <h1 className="text-5xl font-bold mb-6">Fotoğraf Yükle</h1>
              <p className="text-xl text-muted-foreground">
                Çektiğin harika uçak fotoğraflarını topluluğumuzla paylaş
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Yeni Fotoğraf</CardTitle>
                  <CardDescription>
                    Fotoğrafın admin onayından sonra galeride görünecektir.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="file">Fotoğraf *</Label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file"
                          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          {preview ? (
                            <img
                              src={preview}
                              alt="Preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Tıkla</span> veya sürükle bırak
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG veya WEBP (Maks. 10MB)
                              </p>
                            </div>
                          )}
                          <input
                            id="file"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                      </div>
                    </div>

                    {/* Alt Text */}
                    <div className="space-y-2">
                      <Label htmlFor="alt">Açıklama *</Label>
                      <Input
                        id="alt"
                        placeholder="Örn: Boeing 737 kalkış yapıyor"
                        value={formData.alt}
                        onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                        required
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tags">Etiketler</Label>
                      <Input
                        id="tags"
                        placeholder="Örn: B737, Kalkış, Gün Batımı (virgülle ayır)"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Etiketleri virgül ile ayırın
                      </p>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasyon</Label>
                      <Input
                        id="location"
                        placeholder="Örn: İstanbul Havalimanı"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date">Tarih</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    {/* Photographer */}
                    <div className="space-y-2">
                      <Label htmlFor="photographer">Fotoğrafçı</Label>
                      <Input
                        id="photographer"
                        placeholder="Adın Soyadın"
                        value={formData.photographer}
                        onChange={(e) => setFormData({ ...formData, photographer: e.target.value })}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/gallery')}
                        disabled={uploading}
                        className="flex-1"
                      >
                        İptal
                      </Button>
                      <Button
                        type="submit"
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Yükleniyor...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Yükle
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
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

export default UploadPhoto;
