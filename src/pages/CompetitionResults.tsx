import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Award, 
  Medal, 
  TrendingUp, 
  Image, 
  MessageCircle, 
  Heart,
  Calendar,
  Users,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ActiveSpotter {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  total_points: number;
  photo_uploads: number;
  comments: number;
  likes_given: number;
}

interface Competition {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  prize_description: string | null;
  winner_user_id: string | null;
}

interface CompetitionResult {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  total_points: number;
  rank: number | null;
  photo_uploads: number;
  comments: number;
  likes_given: number;
}

export default function CompetitionResults() {
  const [activeSpotters, setActiveSpotters] = useState<ActiveSpotter[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [competitionResults, setCompetitionResults] = useState<CompetitionResult[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveSpotters(selectedMonth);
    fetchCompetitions();
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedCompetition) {
      fetchCompetitionResults(selectedCompetition);
    }
  }, [selectedCompetition]);

  const fetchActiveSpotters = async (month: string) => {
    setLoading(true);
    try {
      const currentMonth = month || new Date().toISOString().slice(0, 7);
      
      // Spotter activity tablosundan veri çek
      const { data: activityData, error } = await (supabase
        .from('spotter_activity' as never)
        .select('*')
        .eq('month_year', currentMonth)
        .limit(500) as { data: any[] | null; error: any });

      if (error && error.code !== 'PGRST116') {
        // Alternatif yöntem: gallery_images'den hesapla
        const startDate = new Date(currentMonth + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

        const { data: photos } = await supabase
          .from('gallery_images')
          .select('user_id, profiles(full_name, avatar_url)')
          .eq('status', 'approved')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .limit(200);

        if (photos) {
          const userStats = new Map<string, ActiveSpotter>();
          photos.forEach((photo: any) => {
            if (photo.user_id) {
              const current = userStats.get(photo.user_id) || {
                user_id: photo.user_id,
                user_name: photo.profiles?.full_name || 'İsimsiz',
                user_avatar: photo.profiles?.avatar_url || null,
                total_points: 0,
                photo_uploads: 0,
                comments: 0,
                likes_given: 0,
              };
              current.photo_uploads += 1;
              current.total_points += 10;
              userStats.set(photo.user_id, current);
            }
          });
          setActiveSpotters(Array.from(userStats.values()).sort((a, b) => b.total_points - a.total_points));
        }
      } else if (activityData) {
        // Spotter activity tablosundan veri varsa
        const userStats = new Map<string, ActiveSpotter>();
        activityData.forEach((activity: any) => {
          const current = userStats.get(activity.user_id) || {
            user_id: activity.user_id,
            total_points: 0,
            photo_uploads: 0,
            comments: 0,
            likes_given: 0,
            user_name: '',
            user_avatar: null,
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
            user_name: profilesMap.get(stat.user_id)?.full_name || 'İsimsiz',
            user_avatar: profilesMap.get(stat.user_id)?.avatar_url || null,
          }));

          setActiveSpotters(spottersWithProfiles.sort((a, b) => b.total_points - a.total_points));
        }
      }
    } catch (error) {
      console.error('Error fetching active spotters:', error);
      toast.error('Aktif spotterlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await (supabase
        .from('competitions' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20) as { data: Competition[] | null; error: any });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching competitions:', error);
      } else if (data) {
        setCompetitions(data);
        if (data.length > 0 && !selectedCompetition) {
          setSelectedCompetition(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  const fetchCompetitionResults = async (competitionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('competition_participants' as never)
        .select('*')
        .eq('competition_id', competitionId)
        .order('total_points', { ascending: false })
        .limit(50) as { data: any[] | null; error: any });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching competition results:', error);
        setCompetitionResults([]);
      } else if (data) {
        // Profil bilgilerini getir
        const userIds = data.map(p => p.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const resultsWithProfiles = data.map((participant, index) => ({
            user_id: participant.user_id,
            user_name: profilesMap.get(participant.user_id)?.full_name || 'İsimsiz',
            user_avatar: profilesMap.get(participant.user_id)?.avatar_url || null,
            total_points: participant.total_points || 0,
            rank: participant.rank || index + 1,
            photo_uploads: 0,
            comments: 0,
            likes_given: 0,
          }));

          setCompetitionResults(resultsWithProfiles);
        } else {
          setCompetitionResults([]);
        }
      } else {
        setCompetitionResults([]);
      }
    } catch (error) {
      console.error('Error fetching competition results:', error);
      toast.error('Yarışma sonuçları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        value: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }),
      });
    }
    return months;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <Award className="h-4 w-4 text-muted-foreground" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-20 gradient-sky">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-4 crew-badge">
                <Trophy className="h-4 w-4 mr-1" />
                Yarışma Sonuçları
              </Badge>
              <h1 className="text-5xl font-bold mb-6">Yarışma Sonuçları</h1>
              <p className="text-xl text-muted-foreground">
                En aktif spotterlar ve yarışma sonuçları
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="monthly" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">
                  <Calendar className="h-4 w-4 mr-2" />
                  Aylık Sıralama
                </TabsTrigger>
                <TabsTrigger value="competitions">
                  <Trophy className="h-4 w-4 mr-2" />
                  Yarışmalar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monthly" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Aylık Aktif Spotterlar
                        </CardTitle>
                        <CardDescription>
                          Bu ay en çok aktivite gösteren spotterlar
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getMonthOptions().map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => fetchActiveSpotters(selectedMonth)}
                          disabled={loading}
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Yükleniyor...</p>
                      </div>
                    ) : activeSpotters.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Bu ay için henüz aktivite kaydı yok
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeSpotters.map((spotter, index) => (
                          <Card key={spotter.user_id} className="overflow-hidden">
                            <div className="flex items-center gap-4 p-4">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                                index === 0 ? 'bg-yellow-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {index + 1}
                              </div>
                              <Avatar className="h-14 w-14">
                                <AvatarImage src={spotter.user_avatar || undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {spotter.user_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg truncate">
                                    {spotter.user_name || 'İsimsiz'}
                                  </h3>
                                  {index < 3 && getRankIcon(index + 1)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <strong className="text-foreground">{spotter.total_points}</strong> puan
                                  </span>
                                  {spotter.photo_uploads > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Image className="h-4 w-4" />
                                      {spotter.photo_uploads} fotoğraf
                                    </span>
                                  )}
                                  {spotter.comments > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-4 w-4" />
                                      {spotter.comments} yorum
                                    </span>
                                  )}
                                  {spotter.likes_given > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-4 w-4" />
                                      {spotter.likes_given} beğeni
                                    </span>
                                  )}
                                </div>
                              </div>
                              {index < 3 && (
                                <Badge className={`${getRankBadgeColor(index + 1)} text-sm px-3 py-1`}>
                                  {index === 0 ? '🥇 1. Sıra' : index === 1 ? '🥈 2. Sıra' : '🥉 3. Sıra'}
                                </Badge>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competitions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Yarışma Sonuçları
                        </CardTitle>
                        <CardDescription>
                          Yarışma seçin ve sonuçları görüntüleyin
                        </CardDescription>
                      </div>
                      {competitions.length > 0 && (
                        <Select
                          value={selectedCompetition || ''}
                          onValueChange={setSelectedCompetition}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Yarışma seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {competitions.map((comp) => (
                              <SelectItem key={comp.id} value={comp.id}>
                                {comp.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {competitions.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Henüz yarışma bulunmuyor
                        </p>
                      </div>
                    ) : loading ? (
                      <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Yükleniyor...</p>
                      </div>
                    ) : competitionResults.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Bu yarışmaya henüz katılım yok
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {competitionResults.map((result) => (
                          <Card key={result.user_id} className="overflow-hidden">
                            <div className="flex items-center gap-4 p-4">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                                result.rank === 1 ? 'bg-yellow-500 text-white' :
                                result.rank === 2 ? 'bg-gray-400 text-white' :
                                result.rank === 3 ? 'bg-amber-600 text-white' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {result.rank || '-'}
                              </div>
                              <Avatar className="h-14 w-14">
                                <AvatarImage src={result.user_avatar || undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {result.user_name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg truncate">
                                    {result.user_name || 'İsimsiz'}
                                  </h3>
                                  {result.rank && result.rank <= 3 && getRankIcon(result.rank)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <strong className="text-foreground">{result.total_points}</strong> puan
                                  </span>
                                </div>
                              </div>
                              {result.rank && result.rank <= 3 && (
                                <Badge className={`${getRankBadgeColor(result.rank)} text-sm px-3 py-1`}>
                                  {result.rank === 1 ? '🥇 Kazanan' : result.rank === 2 ? '🥈 2. Sıra' : '🥉 3. Sıra'}
                                </Badge>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

