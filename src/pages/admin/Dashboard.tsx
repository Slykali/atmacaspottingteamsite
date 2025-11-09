import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Image, Users, Mail, MessageSquare, UserPlus, Eye, Heart, MessageCircle, Trophy, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [stats, setStats] = useState({
    announcements: 0,
    gallery: 0,
    members: 0,
    users: 0,
    pendingApplications: 0,
    suggestions: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    recentActivity: [] as Array<{
      id: string;
      user_id?: string;
      action: string;
      created_at: string;
    }>,
  });
  interface ActiveSpotter {
    user_id: string;
    user_name: string;
    user_avatar: string | null;
    total_points: number;
    photo_uploads: number;
    comments?: number;
    likes_given?: number;
  }
  const [activeSpotters, setActiveSpotters] = useState<ActiveSpotter[]>([]);
  useEffect(() => {
    const fetchStats = async () => {
      const [announcements, gallery, members, profiles, applications, suggestions, views, likes, comments, activity] = await Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_images').select('*', { count: 'exact', head: true }),
        supabase.from('team_members').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('suggestions').select('*', { count: 'exact', head: true }),
        supabase.from('announcement_views').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_likes').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_comments').select('*', { count: 'exact', head: true }),
        supabase.from('user_activity_log').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        announcements: announcements.count || 0,
        gallery: gallery.count || 0,
        members: members.count || 0,
        users: profiles.count || 0,
        pendingApplications: applications.count || 0,
        suggestions: suggestions.count || 0,
        totalViews: views.count || 0,
        totalLikes: likes.count || 0,
        totalComments: comments.count || 0,
        recentActivity: activity.data || [],
      });
    };

    const fetchActiveSpotters = async () => {
      try {
        // Bu ayın aktif spotterlarını getir
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM formatı
        
        // Eğer fonksiyon yoksa, manuel hesapla
        const result = await (supabase
          .from('spotter_activity' as never)
          .select('*')
          .eq('month_year', currentMonth)
          .limit(100) as unknown) as { data: ActiveSpotter[] | null; error: { code?: string } | null };
        const activityData = result.data;
        const error = result.error;

        if (error && error.code !== 'PGRST116') {
          // Tablo yoksa veya hata varsa, alternatif yöntem kullan
          const { data: photos } = await supabase
            .from('gallery_images')
            .select('user_id, profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
            .limit(50);

          if (photos) {
            const userStats = new Map<string, ActiveSpotter>();
            (photos as Array<{ user_id: string; profiles?: { full_name?: string; avatar_url?: string } | null }>).forEach((photo) => {
              if (photo.user_id) {
                const current = userStats.get(photo.user_id) || {
                  user_id: photo.user_id,
                  user_name: photo.profiles?.full_name || 'İsimsiz',
                  user_avatar: photo.profiles?.avatar_url || null,
                  total_points: 0,
                  photo_uploads: 0,
                };
                current.photo_uploads += 1;
                current.total_points += 10;
                userStats.set(photo.user_id, current);
              }
            });
            setActiveSpotters(Array.from(userStats.values()).sort((a, b) => b.total_points - a.total_points).slice(0, 10));
          }
        } else if (activityData) {
          // Spotter activity tablosundan veri varsa
          const userStats = new Map<string, Partial<ActiveSpotter>>();
          activityData.forEach((activity: { user_id: string; activity_points?: number; activity_type?: string }) => {
            const current = userStats.get(activity.user_id) || {
              user_id: activity.user_id,
              user_name: '',
              user_avatar: null,
              total_points: 0,
              photo_uploads: 0,
              comments: 0,
              likes_given: 0,
            };
            current.total_points += activity.activity_points || 0;
            if (activity.activity_type === 'photo_upload' || activity.activity_type === 'photo_approved') {
              current.photo_uploads += 1;
            } else if (activity.activity_type === 'comment') {
              current.comments += 1;
            } else if (activity.activity_type === 'like') {
              current.likes_given += 1;
            }
            userStats.set(activity.user_id, current);
          });

          // Profil bilgilerini getir
          const userIds = Array.from(userStats.keys());
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', userIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
            const spottersWithProfiles = Array.from(userStats.values()).map(stat => ({
              ...stat,
              user_name: profilesMap.get(stat.user_id || '')?.full_name || 'İsimsiz',
              user_avatar: profilesMap.get(stat.user_id || '')?.avatar_url || null,
            })) as ActiveSpotter[];

            setActiveSpotters(spottersWithProfiles.sort((a, b) => b.total_points - a.total_points).slice(0, 10));
          }
        }
      } catch (error) {
        console.error('Error fetching active spotters:', error);
      }
    };

    fetchStats();
    fetchActiveSpotters();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Admin panel'e hoş geldiniz</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı kullanıcılar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duyurular</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground mt-1">Toplam duyuru sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Galeri</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gallery}</div>
            <p className="text-xs text-muted-foreground mt-1">Fotoğraf sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ekip Üyeleri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif üye sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Başvurular</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">İncelenmesi gereken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Öneriler</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suggestions}</div>
            <p className="text-xs text-muted-foreground mt-1">Toplam öneri sayısı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görüntülenme</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Duyuru görüntülenmeleri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Beğeni</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes}</div>
            <p className="text-xs text-muted-foreground mt-1">Galeri beğenileri</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yorum</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground mt-1">Galeri yorumları</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Bu Ayın En Aktif Spotterları
              </span>
              <Link to="/yarisma-sonuclari">
                <Button variant="outline" size="sm">
                  Tümünü Gör
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSpotters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz bu ay aktivite yok
              </p>
            ) : (
              <div className="space-y-3">
                {activeSpotters.map((spotter, index) => (
                  <div
                    key={spotter.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={spotter.user_avatar || undefined} />
                        <AvatarFallback>
                          {spotter.user_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{spotter.user_name || 'İsimsiz'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {spotter.total_points} puan
                          </span>
                          {spotter.photo_uploads > 0 && (
                            <span className="flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              {spotter.photo_uploads} fotoğraf
                            </span>
                          )}
                        </div>
                      </div>
                      {index < 3 && (
                        <Badge variant={index === 0 ? 'default' : 'secondary'} className="ml-2">
                          <Award className="h-3 w-3 mr-1" />
                          {index === 0 ? '1.' : index === 1 ? '2.' : '3.'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz aktivite yok</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{activity.action}</Badge>
                      <span className="text-sm">{activity.user_id?.substring(0, 8)}...</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}