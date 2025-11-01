import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Upload, Heart, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [announcementNotifications, setAnnouncementNotifications] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPreferences();
      fetchFavorites();
      fetchApplications();
      fetchFollowers();
      fetchFollowing();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url || '');
      setBio(data.bio || '');
      setInstagram(data.instagram || '');
      setTwitter(data.twitter || '');
    }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setEmailNotifications(data.email_notifications);
      setAnnouncementNotifications(data.announcement_notifications);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_favorites')
      .select('*, announcements(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setFavorites(data);
  };

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });
    
    if (data) setApplications(data);
  };

  const fetchFollowers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_follows')
      .select('*, profiles:follower_id(*)')
      .eq('following_id', user.id);
    
    if (data) setFollowers(data);
  };

  const fetchFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_follows')
      .select('*, profiles:following_id(*)')
      .eq('follower_id', user.id);
    
    if (data) setFollowing(data);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    
    setLoading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({ title: 'Avatar güncellendi!' });
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          instagram,
          twitter,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Profil güncellendi!' });
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          announcement_notifications: announcementNotifications,
        });

      if (error) throw error;

      toast({ title: 'Tercihler kaydedildi!' });
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', favoriteId);

    if (!error) {
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast({ title: 'Favorilerden çıkarıldı' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>Lütfen giriş yapınız.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Profilim</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{fullName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    Avatar Yükle
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={loading}
                  />
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biyografi</Label>
                <Input
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={loading}
                  placeholder="Kısa bir tanıtım yazısı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  disabled={loading}
                  placeholder="@kullaniciadi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  disabled={loading}
                  placeholder="@kullaniciadi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bildirim Tercihleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">Email Bildirimleri</Label>
                <Switch
                  id="email-notif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="announcement-notif">Duyuru Bildirimleri</Label>
                <Switch
                  id="announcement-notif"
                  checked={announcementNotifications}
                  onCheckedChange={setAnnouncementNotifications}
                />
              </div>

              <Button onClick={handleSavePreferences} disabled={loading} className="w-full">
                Tercihleri Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Favori Duyurularım
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favorites.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Henüz favori duyurunuz yok</p>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <Link to={`/duyurular/${fav.announcements.slug}`} className="flex-1 hover:text-primary">
                        <p className="font-medium">{fav.announcements.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(fav.announcements.date).toLocaleDateString('tr-TR')}</p>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavorite(fav.id)}
                      >
                        Çıkar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Başvurularım
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Henüz başvurunuz bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{app.full_name}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status === 'approved' ? 'Onaylandı' : 
                           app.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Takipçiler ({followers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {followers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Henüz takipçi yok</p>
              ) : (
                <div className="space-y-2">
                  {followers.map((follow: any) => (
                    <div key={follow.id} className="flex items-center gap-2 p-2 border rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={follow.profiles?.avatar_url} />
                        <AvatarFallback>{follow.profiles?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{follow.profiles?.full_name || 'Bilinmeyen'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Takip Edilenler ({following.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {following.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Henüz kimseyi takip etmiyorsunuz</p>
              ) : (
                <div className="space-y-2">
                  {following.map((follow: any) => (
                    <div key={follow.id} className="flex items-center gap-2 p-2 border rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={follow.profiles?.avatar_url} />
                        <AvatarFallback>{follow.profiles?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{follow.profiles?.full_name || 'Bilinmeyen'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
