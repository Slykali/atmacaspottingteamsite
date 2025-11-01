import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Suggestion {
  id: string;
  announcement_id: string;
  name: string;
  email: string;
  suggestion: string;
  created_at: string;
  announcements?: {
    title: string;
  };
}

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*, announcements(title)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Öneriler yüklenemedi');
    } else {
      setSuggestions(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu öneriyi silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Silme başarısız');
    } else {
      toast.success('Öneri silindi');
      fetchSuggestions();
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Öneriler</h1>

      <div className="grid gap-6">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <p className="font-medium">{suggestion.name}</p>
                <p className="text-sm text-muted-foreground">{suggestion.email}</p>
                {suggestion.announcements && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Duyuru: {suggestion.announcements.title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(suggestion.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(suggestion.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{suggestion.suggestion}</p>
            </CardContent>
          </Card>
        ))}

        {suggestions.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Henüz öneri yok
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
