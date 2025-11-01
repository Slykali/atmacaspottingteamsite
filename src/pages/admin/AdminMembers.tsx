import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  instagram: string | null;
}

export default function AdminMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    instagram: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Üyeler yükleme hatası:', error);
        toast.error('Üyeler yüklenemedi: ' + error.message);
      } else {
        console.log('Üyeler yüklendi:', data?.length || 0);
        setMembers(data || []);
      }
    } catch (error) {
      console.error('Fetch hatası:', error);
      toast.error('Üyeler yüklenirken bir hata oluştu');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let photoUrl = editingMember?.photo || null;

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('team-photos')
        .upload(fileName, selectedFile);

      if (uploadError) {
        toast.error('Fotoğraf yüklenemedi');
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('team-photos')
        .getPublicUrl(fileName);

      photoUrl = publicUrl;
    }

    const memberData = {
      ...formData,
      photo: photoUrl,
    };

    try {
      if (editingMember) {
        const { data, error } = await supabase
          .from('team_members')
          .update(memberData)
          .eq('id', editingMember.id)
          .select();

        if (error) {
          console.error('Güncelleme hatası:', error);
          toast.error('Güncelleme başarısız: ' + error.message);
        } else {
          console.log('Üye güncellendi:', data);
          toast.success('Üye başarıyla güncellendi');
          fetchMembers();
          resetForm();
        }
      } else {
        const { data, error } = await supabase
          .from('team_members')
          .insert([memberData])
          .select();

        if (error) {
          console.error('Ekleme hatası:', error);
          
          // RLS policy hatası kontrolü
          if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('policy')) {
            toast.error('Erişim izni hatası: Supabase RLS politikalarını kontrol edin. Admin kullanıcıların team_members tablosuna INSERT yapma izni olmalı.');
          } else {
            toast.error('Ekleme başarısız: ' + error.message);
          }
        } else {
          console.log('Üye eklendi:', data);
          toast.success('Üye başarıyla eklendi');
          fetchMembers();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, photo: string | null) => {
    if (!confirm('Bu üyeyi silmek istediğinize emin misiniz?')) return;

    if (photo) {
      const fileName = photo.split('/').pop();
      if (fileName) {
        await supabase.storage.from('team-photos').remove([fileName]);
      }
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Silme başarısız');
    } else {
      toast.success('Üye silindi');
      fetchMembers();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      instagram: '',
    });
    setSelectedFile(null);
    setEditingMember(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio,
      instagram: member.instagram || '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ekip Üyeleri</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Üye
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? 'Üye Düzenle' : 'Yeni Üye Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Fotoğraf</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Biyografi</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@kullanici_adi"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>İptal</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>En Aktif Spotter'lar (Ekip Üyeleri)</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz ekip üyesi yok. Yeni üye eklemek için yukarıdaki butonu kullanın.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fotoğraf</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Biyografi</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.photo ? (
                        <img 
                          src={member.photo} 
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Fotoğraf Yok</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">{member.bio || '-'}</p>
                    </TableCell>
                    <TableCell>
                      {member.instagram ? (
                        <a 
                          href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {member.instagram}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(member)}
                          className="gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="hidden sm:inline">Düzenle</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(member.id, member.photo)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Sil</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}