import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Application {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Başvurular yüklenemedi');
    } else {
      setApplications(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Silme başarısız');
    } else {
      toast.success('Başvuru silindi');
      fetchApplications();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Durum güncellenemedi');
    } else {
      toast.success('Durum güncellendi');
      fetchApplications();
    }
  };

  const openDetails = (app: Application) => {
    setSelectedApp(app);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "default",
      reviewed: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Başvurular</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm Başvurular</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.full_name}</TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell>{app.phone}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>{new Date(app.created_at).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetails(app)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(app.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuru Detayları</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div>
                <strong>Ad Soyad:</strong> {selectedApp.full_name}
              </div>
              <div>
                <strong>Email:</strong> {selectedApp.email}
              </div>
              <div>
                <strong>Telefon:</strong> {selectedApp.phone}
              </div>
              <div>
                <strong>Mesaj:</strong>
                <p className="mt-2 whitespace-pre-wrap">{selectedApp.message}</p>
              </div>
              <div>
                <strong>Durum:</strong> {getStatusBadge(selectedApp.status)}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusChange(selectedApp.id, 'reviewed')}
                  size="sm"
                >
                  İncelendi
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                  variant="destructive"
                  size="sm"
                >
                  Reddedildi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
