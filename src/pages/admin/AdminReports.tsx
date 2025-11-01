import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Report {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reported_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch reporter names separately
      const reporterIds = [...new Set(data.map(r => r.reporter_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reporterIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const reportsWithProfiles = data.map(report => ({
        ...report,
        profiles: report.reporter_id ? profilesMap.get(report.reporter_id) : undefined
      }));

      setReports(reportsWithProfiles as any);
    }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    const { error } = await supabase
      .from('reported_content')
      .update({
        status: newStatus,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) {
      toast.error('Durum güncellenemedi');
    } else {
      toast.success('Durum güncellendi');
      fetchReports();
      setDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: 'destructive',
      reviewed: 'secondary',
      resolved: 'default',
      dismissed: 'default',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Raporlanan İçerikler</h1>
        <p className="text-muted-foreground mt-2">
          Kullanıcılar tarafından bildirilen içerikleri yönetin
        </p>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raporlayan</TableHead>
              <TableHead>İçerik Tipi</TableHead>
              <TableHead>Sebep</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.profiles?.full_name || 'Bilinmeyen'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{report.content_type}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  {new Date(report.created_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setDialogOpen(true);
                    }}
                  >
                    Görüntüle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rapor Detayları</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">İçerik Tipi:</label>
                <p>{selectedReport.content_type}</p>
              </div>
              <div>
                <label className="font-semibold">Sebep:</label>
                <p>{selectedReport.reason}</p>
              </div>
              <div>
                <label className="font-semibold">Detaylar:</label>
                <p>{selectedReport.details || 'Yok'}</p>
              </div>
              <div>
                <label className="font-semibold">Durum Değiştir:</label>
                <Select
                  defaultValue={selectedReport.status}
                  onValueChange={(value) => updateStatus(selectedReport.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="reviewed">İncelendi</SelectItem>
                    <SelectItem value="resolved">Çözüldü</SelectItem>
                    <SelectItem value="dismissed">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
