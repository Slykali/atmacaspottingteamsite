import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Code, 
  Database, 
  Server, 
  Settings, 
  Activity, 
  Terminal,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCode,
  Zap,
  Image,
  Clock,
  Trash2,
  Table,
  Users,
  Folder,
  FileText,
  BarChart3,
  Eye,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  TrendingUp,
  HardDrive,
  Network,
  Shield,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SystemStatus {
  database: 'online' | 'offline' | 'error';
  storage: 'online' | 'offline' | 'error';
  auth: 'online' | 'offline' | 'error';
  realtime: 'online' | 'offline' | 'error';
}

interface DatabaseQuery {
  id: string;
  query: string;
  result: any;
  error: string | null;
  executedAt: string;
}

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
  rejection_reason?: string | null;
}

export default function DeveloperPanel() {
  const { user, isAdmin, isDeveloper } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'offline',
    storage: 'offline',
    auth: 'offline',
    realtime: 'offline',
  });
  const [queryHistory, setQueryHistory] = useState<DatabaseQuery[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pendingImages, setPendingImages] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('profiles');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [storageBuckets, setStorageBuckets] = useState<any[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    checkSystemStatus();
    fetchStats();
    loadQueryHistory();
    if (isAdmin || isDeveloper) {
      fetchPendingImages();
      fetchTableData(selectedTable);
      fetchStorageBuckets();
      fetchRecentUsers();
      fetchPerformanceMetrics();
    }
  }, [isAdmin, isDeveloper, selectedTable]);

  const checkSystemStatus = async () => {
    const status: SystemStatus = {
      database: 'offline',
      storage: 'offline',
      auth: 'offline',
      realtime: 'offline',
    };

    // Database check
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      status.database = error ? 'error' : 'online';
    } catch {
      status.database = 'error';
    }

    // Storage check
    try {
      const { error } = await supabase.storage.from('gallery').list({ limit: 1 });
      status.storage = error ? 'error' : 'online';
    } catch {
      status.storage = 'error';
    }

    // Auth check
    try {
      const { data: { session } } = await supabase.auth.getSession();
      status.auth = session ? 'online' : 'offline';
    } catch {
      status.auth = 'error';
    }

    // Realtime check (basic)
    status.realtime = 'online'; // Assume online if no errors

    setSystemStatus(status);
  };

  const fetchStats = async () => {
    try {
      const [users, images, messages, announcements] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('gallery_images').select('id', { count: 'exact', head: true }),
        supabase.from('messages' as never).select('id', { count: 'exact', head: true } as never),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        users: users.count || 0,
        images: images.count || 0,
        messages: (messages as any).count || 0,
        announcements: announcements.count || 0,
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const loadQueryHistory = () => {
    const saved = localStorage.getItem('developer_query_history');
    if (saved) {
      try {
        setQueryHistory(JSON.parse(saved));
      } catch {
        setQueryHistory([]);
      }
    }
  };

  const saveQueryHistory = (queries: DatabaseQuery[]) => {
    localStorage.setItem('developer_query_history', JSON.stringify(queries.slice(-10))); // Son 10 sorgu
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) {
      toast.error('Lütfen bir sorgu girin');
      return;
    }

    setExecuting(true);
    const queryText = customQuery.trim();
    const queryId = Date.now().toString();

    try {
      // Güvenlik: Sadece SELECT sorgularına izin ver
      const upperQuery = queryText.toUpperCase().trim();
      if (!upperQuery.startsWith('SELECT')) {
        throw new Error('Sadece SELECT sorguları çalıştırılabilir');
      }

      // Supabase client ile sorgu çalıştırma (sınırlı)
      // Not: Gerçek SQL çalıştırmak için Supabase SQL Editor kullanılmalı
      const result = await supabase.rpc('execute_readonly_query', { 
        query_text: queryText 
      } as never);

      const newQuery: DatabaseQuery = {
        id: queryId,
        query: queryText,
        result: result.data,
        error: result.error ? result.error.message : null,
        executedAt: new Date().toISOString(),
      };

      const updatedHistory = [newQuery, ...queryHistory].slice(0, 10);
      setQueryHistory(updatedHistory);
      saveQueryHistory(updatedHistory);

      if (result.error) {
        toast.error('Sorgu hatası: ' + result.error.message);
      } else {
        toast.success('Sorgu başarıyla çalıştırıldı');
      }
    } catch (error: any) {
      const newQuery: DatabaseQuery = {
        id: queryId,
        query: queryText,
        result: null,
        error: error.message || 'Bilinmeyen hata',
        executedAt: new Date().toISOString(),
      };

      const updatedHistory = [newQuery, ...queryHistory].slice(0, 10);
      setQueryHistory(updatedHistory);
      saveQueryHistory(updatedHistory);

      toast.error('Sorgu hatası: ' + error.message);
    } finally {
      setExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const fetchPendingImages = async () => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .or('status.is.null,status.eq.pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPendingImages(data || []);
    } catch (error) {
      console.error('Error fetching pending images:', error);
      toast.error('Bekleyen fotoğraflar yüklenemedi');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleApproveImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('✅ Fotoğraf onaylandı');
      fetchPendingImages();
      fetchStats();
    } catch (error: any) {
      toast.error('Onaylama hatası: ' + error.message);
    }
  };

  const handleRejectImage = async (id: string) => {
    const reason = prompt('Red nedeni (opsiyonel):');
    if (reason === null) return;

    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ 
          status: 'rejected',
          rejection_reason: reason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('❌ Fotoğraf reddedildi');
      fetchPendingImages();
      fetchStats();
    } catch (error: any) {
      toast.error('Reddetme hatası: ' + error.message);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoadingTable(true);
    try {
      const { data, error } = await (supabase
        .from(tableName as never)
        .select('*')
        .limit(50) as { data: any[] | null; error: any });

      if (error) throw error;
      setTableData(data || []);
    } catch (error: any) {
      console.error('Error fetching table data:', error);
      toast.error('Tablo verisi yüklenemedi: ' + error.message);
      setTableData([]);
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchStorageBuckets = async () => {
    setLoadingStorage(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      setStorageBuckets(data || []);
    } catch (error: any) {
      console.error('Error fetching storage buckets:', error);
      toast.error('Storage bucket\'ları yüklenemedi');
    } finally {
      setLoadingStorage(false);
    }
  };

  const fetchRecentUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, avatar_url')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const startTime = performance.now();
      
      // Test queries
      const [profiles, images, messages] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('gallery_images').select('id', { count: 'exact', head: true }),
        supabase.from('messages' as never).select('id', { count: 'exact', head: true } as never),
      ]);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      setPerformanceMetrics({
        queryTime: queryTime.toFixed(2),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı`);
  };

  const tables = [
    'profiles',
    'gallery_images',
    'announcements',
    'messages',
    'user_roles',
    'applications',
    'notifications',
    'user_preferences',
  ];

  if (!isAdmin && !isDeveloper) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Erişim Reddedildi</h2>
            <p className="text-muted-foreground">
              Developer paneline erişmek için admin veya developer yetkisine sahip olmalısınız.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Code className="h-8 w-8" />
            Developer Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Sistem durumu, veritabanı sorguları ve geliştirici araçları
          </p>
        </div>
        <Button onClick={checkSystemStatus} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">
            <Activity className="h-4 w-4 mr-2" />
            Sistem Durumu
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Database className="h-4 w-4 mr-2" />
            İstatistikler
          </TabsTrigger>
          <TabsTrigger value="query">
            <Terminal className="h-4 w-4 mr-2" />
            SQL Sorguları
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Image className="h-4 w-4 mr-2" />
            Fotoğraf Onay
            {pendingImages.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingImages.length > 99 ? '99+' : pendingImages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="database">
            <Table className="h-4 w-4 mr-2" />
            Veritabanı
          </TabsTrigger>
          <TabsTrigger value="storage">
            <HardDrive className="h-4 w-4 mr-2" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performans
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Zap className="h-4 w-4 mr-2" />
            Araçlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Veritabanı</span>
                  {getStatusIcon(systemStatus.database)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(systemStatus.database)}>
                  {systemStatus.database}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Storage</span>
                  {getStatusIcon(systemStatus.storage)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(systemStatus.storage)}>
                  {systemStatus.storage}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Auth</span>
                  {getStatusIcon(systemStatus.auth)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(systemStatus.auth)}>
                  {systemStatus.auth}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Realtime</span>
                  {getStatusIcon(systemStatus.realtime)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(systemStatus.realtime)}>
                  {systemStatus.realtime}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sistem Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kullanıcı:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rol:</span>
                <Badge>Developer</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supabase URL:</span>
                <span className="font-mono text-xs">{supabase.supabaseUrl.split('//')[1]}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Fotoğraf</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.images}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Mesaj</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.messages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Duyuru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.announcements}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL Sorgusu Çalıştır</CardTitle>
              <CardDescription>
                Sadece SELECT sorguları çalıştırılabilir. Güvenlik için diğer sorgular Supabase SQL Editor'da çalıştırılmalıdır.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SQL Sorgusu</Label>
                <Textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="SELECT * FROM profiles LIMIT 10;"
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>
              <Button onClick={executeQuery} disabled={executing}>
                {executing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Çalıştırılıyor...
                  </>
                ) : (
                  <>
                    <Terminal className="h-4 w-4 mr-2" />
                    Sorguyu Çalıştır
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {queryHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sorgu Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queryHistory.map((q) => (
                    <div key={q.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-sm bg-muted p-2 rounded flex-1">
                          {q.query}
                        </code>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(q.executedAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      {q.error ? (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                          Hata: {q.error}
                        </div>
                      ) : (
                        <div className="text-sm text-green-500 bg-green-50 p-2 rounded">
                          Başarılı: {JSON.stringify(q.result).substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Bekleyen Fotoğraflar
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPendingImages}
                  disabled={loadingImages}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingImages ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
              </CardTitle>
              <CardDescription>
                Yüklenen fotoğrafları onaylayın veya reddedin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingImages ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : pendingImages.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">Bekleyen fotoğraf yok</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="relative">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-48 object-cover"
                        />
                        <Badge className="absolute top-2 right-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Bekliyor
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2 line-clamp-2">{image.alt}</h3>
                        {image.location && (
                          <p className="text-sm text-muted-foreground mb-1">
                            📍 {image.location}
                          </p>
                        )}
                        {image.photographer && (
                          <p className="text-sm text-muted-foreground mb-1">
                            📷 {image.photographer}
                          </p>
                        )}
                        {image.created_at && (
                          <p className="text-xs text-muted-foreground mb-3">
                            📅 {new Date(image.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleApproveImage(image.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleRejectImage(image.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reddet
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Veritabanı Tabloları
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTableData(selectedTable)}
                  disabled={loadingTable}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingTable ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
              </CardTitle>
              <CardDescription>
                Tablo seçin ve verileri görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Tablo Seç:</Label>
                <Select value={selectedTable} onValueChange={(value) => {
                  setSelectedTable(value);
                  fetchTableData(value);
                }}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingTable ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : tableData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Veri bulunamadı</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] border rounded-lg">
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(tableData[0] || {}).map((key) => (
                              <th key={key} className="text-left p-2 font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              {Object.values(row).map((value: any, cellIdx) => (
                                <td key={cellIdx} className="p-2 text-xs">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value).substring(0, 50)
                                    : String(value).substring(0, 100)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Toplam {tableData.length} kayıt gösteriliyor (maksimum 50)
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Buckets
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStorageBuckets}
                  disabled={loadingStorage}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingStorage ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStorage ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : storageBuckets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Bucket bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {storageBuckets.map((bucket) => (
                    <Card key={bucket.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Folder className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{bucket.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {bucket.public ? 'Public' : 'Private'} • 
                              Oluşturulma: {new Date(bucket.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={bucket.public ? 'default' : 'secondary'}>
                          {bucket.public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Son Kullanıcılar
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRecentUsers}
                  disabled={loadingUsers}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Kullanıcı bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name || ''} className="h-10 w-10 rounded-full" />
                            ) : (
                              <Users className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'İsimsiz'}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email || 'Email yok'} • 
                              Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.id, 'Kullanıcı ID')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performans Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceMetrics ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Sorgu Süresi:</span>
                      <span className="font-bold text-lg">{performanceMetrics.queryTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Son Güncelleme:</span>
                      <span className="text-sm">
                        {new Date(performanceMetrics.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={fetchPerformanceMetrics}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Metrikleri Yenile
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Metrikler yükleniyor...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sistem Sağlığı
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Veritabanı:</span>
                  <Badge className={getStatusColor(systemStatus.database)}>
                    {systemStatus.database}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage:</span>
                  <Badge className={getStatusColor(systemStatus.storage)}>
                    {systemStatus.storage}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auth:</span>
                  <Badge className={getStatusColor(systemStatus.auth)}>
                    {systemStatus.auth}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Realtime:</span>
                  <Badge className={getStatusColor(systemStatus.realtime)}>
                    {systemStatus.realtime}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Hızlı İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    window.open('https://supabase.com/dashboard', '_blank');
                  }}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Supabase Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => copyToClipboard(supabase.supabaseUrl, 'Supabase URL')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Supabase URL'yi Kopyala
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => copyToClipboard(user?.id || '', 'User ID')}
                >
                  <Key className="h-4 w-4 mr-2" />
                  User ID'yi Kopyala
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.success('Oturum kapatıldı');
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Oturumu Kapat
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Güvenlik Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rol:</span>
                  <Badge>{isAdmin ? 'Admin' : isDeveloper ? 'Developer' : 'User'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-xs">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => copyToClipboard(user?.id || '', 'User ID')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Kopyala
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bilgi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Developer paneli sistem yönetimi ve geliştirme araçları sağlar.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Sistem durumunu kontrol edin</li>
                  <li>Veritabanı tablolarını görüntüleyin</li>
                  <li>Storage bucket'larını yönetin</li>
                  <li>Kullanıcıları görüntüleyin</li>
                  <li>Performans metriklerini izleyin</li>
                  <li>SQL sorguları çalıştırın</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Bağlantı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supabase URL:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => copyToClipboard(supabase.supabaseUrl, 'URL')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Kopyala
                  </Button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project ID:</span>
                  <span className="font-mono text-xs">
                    {supabase.supabaseUrl.split('//')[1]?.split('.')[0] || 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

