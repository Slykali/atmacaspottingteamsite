import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Image, Heart, MessageSquare, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Stats {
  total_users: number;
  total_announcements: number;
  total_gallery_images: number;
  total_comments: number;
  total_likes: number;
  total_views: number;
}

interface PopularAnnouncement {
  id: string;
  title: string;
  view_count: number;
  like_count: number;
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_announcements: 0,
    total_gallery_images: 0,
    total_comments: 0,
    total_likes: 0,
    total_views: 0,
  });
  const [popularAnnouncements, setPopularAnnouncements] = useState<PopularAnnouncement[]>([]);

  useEffect(() => {
    fetchStats();
    fetchPopularAnnouncements();
  }, []);

  const fetchStats = async () => {
    // Fetch counts from tables
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: announcementsCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    const { count: imagesCount } = await supabase
      .from('gallery_images')
      .select('*', { count: 'exact', head: true });

    const { count: commentsCount } = await supabase
      .from('gallery_comments')
      .select('*', { count: 'exact', head: true });

    const { count: likesCount } = await supabase
      .from('gallery_likes')
      .select('*', { count: 'exact', head: true });

    const { count: viewsCount } = await supabase
      .from('announcement_views')
      .select('*', { count: 'exact', head: true });

    setStats({
      total_users: usersCount || 0,
      total_announcements: announcementsCount || 0,
      total_gallery_images: imagesCount || 0,
      total_comments: commentsCount || 0,
      total_likes: likesCount || 0,
      total_views: viewsCount || 0,
    });
  };

  const fetchPopularAnnouncements = async () => {
    const { data: viewsData } = await supabase
      .from('announcement_views')
      .select('announcement_id')
      .limit(1000);

    const { data: likesData } = await supabase
      .from('announcement_likes')
      .select('announcement_id')
      .limit(1000);

    if (viewsData && likesData) {
      // Count views per announcement
      const viewCounts: Record<string, number> = {};
      viewsData.forEach((v) => {
        viewCounts[v.announcement_id] = (viewCounts[v.announcement_id] || 0) + 1;
      });

      // Count likes per announcement
      const likeCounts: Record<string, number> = {};
      likesData.forEach((l) => {
        likeCounts[l.announcement_id] = (likeCounts[l.announcement_id] || 0) + 1;
      });

      // Get unique announcement IDs
      const announcementIds = Array.from(
        new Set([...Object.keys(viewCounts), ...Object.keys(likeCounts)])
      );

      // Fetch announcement titles
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title')
        .in('id', announcementIds);

      if (announcements) {
        const popular = announcements.map((a) => ({
          id: a.id,
          title: a.title,
          view_count: viewCounts[a.id] || 0,
          like_count: likeCounts[a.id] || 0,
        }));

        popular.sort((a, b) => b.view_count - a.view_count);
        setPopularAnnouncements(popular.slice(0, 10));
      }
    }
  };

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Toplam Duyuru',
      value: stats.total_announcements,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: 'Galeri Fotoğrafları',
      value: stats.total_gallery_images,
      icon: Image,
      color: 'text-purple-600',
    },
    {
      title: 'Toplam Yorum',
      value: stats.total_comments,
      icon: MessageSquare,
      color: 'text-orange-600',
    },
    {
      title: 'Toplam Beğeni',
      value: stats.total_likes,
      icon: Heart,
      color: 'text-red-600',
    },
    {
      title: 'Toplam Görüntülenme',
      value: stats.total_views,
      icon: Eye,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analitik & İstatistikler</h1>
        <p className="text-muted-foreground mt-2">
          Site kullanım istatistiklerini görüntüleyin
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popüler Duyurular</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Duyuru</TableHead>
                <TableHead className="text-right">Görüntülenme</TableHead>
                <TableHead className="text-right">Beğeni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popularAnnouncements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell className="text-right">{announcement.view_count}</TableCell>
                  <TableCell className="text-right">{announcement.like_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
