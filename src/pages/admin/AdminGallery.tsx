import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  tags: string[];
  location: string | null;
  date: string | null;
  photographer: string | null;
  status: string | null;
  user_id: string | null;
  created_at: string | null;
}

export default function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [pendingImages, setPendingImages] = useState<GalleryImage[]>([]);
  const [approvedImages, setApprovedImages] = useState<GalleryImage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    alt: '',
    tags: '',
    location: '',
    date: '',
    photographer: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Galeri yüklenemedi');
    } else {
      const allImages = data || [];
      setImages(allImages);
      
      // Pending (bekleyen) fotoğraflar
      const pending = allImages.filter(img => img.status === 'pending');
      setPendingImages(pending);
      
      // Approved (onaylanmış) fotoğraflar
      const approved = allImages.filter(img => img.status === 'approved');
      setApprovedImages(approved);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Lütfen bir resim seçin');
      return;
    }

    setUploading(true);

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, selectedFile);

    if (uploadError) {
      toast.error('Yükleme başarısız');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert([{
          src: publicUrl,
          alt: formData.alt,
          tags: formData.tags.split(',').map(t => t.trim()),
          location: formData.location || null,
          date: formData.date || null,
          photographer: formData.photographer || null,
          status: 'approved', // Admin eklediği fotoğraflar direkt onaylı
        }]);

    if (dbError) {
      toast.error('Veritabanına kayıt başarısız');
    } else {
      toast.success('Resim eklendi');
      fetchImages();
      resetForm();
    }

    setUploading(false);
  };

  const handleDelete = async (id: string, src: string) => {
    if (!confirm('Bu resmi silmek istediğinize emin misiniz?')) return;

    try {
      // Supabase Storage URL'den dosya yolunu çıkar
      // URL formatı: https://...supabase.co/storage/v1/object/public/gallery/filename.jpg
      let filePath = '';
      
      if (src.includes('/storage/v1/object/public/gallery/')) {
        // Supabase Storage public URL'den yol çıkar
        const parts = src.split('/storage/v1/object/public/gallery/');
        if (parts.length > 1) {
          filePath = parts[1];
        }
      } else if (src.includes('gallery/')) {
        // Direkt gallery/ ile başlıyorsa
        const parts = src.split('gallery/');
        if (parts.length > 1) {
          filePath = parts[1];
        }
      } else {
        // Sadece dosya adı varsa
        filePath = src.split('/').pop() || '';
      }

      // Storage'dan dosyayı sil
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([filePath]);

        if (storageError) {
          console.error('Storage silme hatası:', storageError);
          // Storage hatası olsa bile veritabanından silmeye devam et
        }
      }

      // Veritabanından kaydı sil
      const { error: dbError } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Veritabanı silme hatası:', dbError);
        toast.error('Silme başarısız: ' + dbError.message);
      } else {
        toast.success('Resim silindi');
        fetchImages();
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Silme sırasında bir hata oluştu');
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('gallery_images')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      toast.error('Onaylama başarısız');
    } else {
      toast.success('Fotoğraf onaylandı');
      fetchImages();
    }
  };

  const handleReject = async (id: string, src: string) => {
    if (!confirm('Bu fotoğrafı reddetmek istediğinize emin misiniz?')) return;

    // Fotoğrafı sil
    await handleDelete(id, src);
    toast.success('Fotoğraf reddedildi ve silindi');
  };

  const resetForm = () => {
    setFormData({
      alt: '',
      tags: '',
      location: '',
      date: '',
      photographer: '',
    });
    setSelectedFile(null);
    setIsDialogOpen(false);
  };

  const renderImageCard = (image: GalleryImage) => (
    <Card key={image.id}>
      <CardHeader>
        <img
          src={image.src}
          alt={image.alt}
          className="w-full h-48 object-cover rounded"
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium">{image.alt}</p>
          {image.status === 'pending' && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Bekliyor
            </Badge>
          )}
          {image.status === 'approved' && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Onaylı
            </Badge>
          )}
        </div>
        {image.location && <p className="text-sm text-muted-foreground">📍 {image.location}</p>}
        {image.photographer && <p className="text-sm text-muted-foreground">📷 {image.photographer}</p>}
        {image.created_at && (
          <p className="text-xs text-muted-foreground mt-1">
            📅 {new Date(image.created_at).toLocaleDateString('tr-TR')}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          {image.status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => handleApprove(image.id)}
              >
                <CheckCircle className="h-4 w-4" />
                Onayla
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => handleReject(image.id, image.src)}
              >
                <XCircle className="h-4 w-4" />
                Reddet
              </Button>
            </>
          )}
          {image.status === 'approved' && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-1"
              onClick={() => handleDelete(image.id, image.src)}
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Galeri Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Fotoğrafları onaylayın, reddedin veya silin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Resim
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Resim Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Resim</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Etiketler (virgülle ayırın)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="A320, Kalkış, Gündüz"
                />
              </div>
              <div className="space-y-2">
                <Label>Lokasyon</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fotoğrafçı</Label>
                <Input
                  value={formData.photographer}
                  onChange={(e) => setFormData({ ...formData, photographer: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Yükleniyor...' : 'Kaydet'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>İptal</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Bekleyen ({pendingImages.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Onaylanmış ({approvedImages.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            Tümü ({images.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingImages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Bekleyen fotoğraf yok</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingImages.map(renderImageCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedImages.map(renderImageCard)}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map(renderImageCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}