import React, { useEffect, useState } from 'react';
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NotFound from "./NotFound";

interface Announcement {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
}

const AnnouncementDetail = () => {
  const { slug } = useParams();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestionForm, setSuggestionForm] = useState({
    name: '',
    email: '',
    suggestion: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (data) {
        // Track view
        await supabase
          .from('announcement_views')
          .insert([{ announcement_id: data.id }]);
      }
      
      setAnnouncement(data);
      setLoading(false);
    };

    fetchAnnouncement();
  }, [slug]);

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcement) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('suggestions')
      .insert([{
        announcement_id: announcement.id,
        name: suggestionForm.name,
        email: suggestionForm.email,
        suggestion: suggestionForm.suggestion,
      }]);

    if (error) {
      toast.error('Öneri gönderilemedi');
    } else {
      toast.success('Öneriniz başarıyla gönderildi!');
      setSuggestionForm({ name: '', email: '', suggestion: '' });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>Yükleniyor...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!announcement) {
    return <NotFound />;
  }

  const formattedDate = new Date(announcement.date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <article className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link to="/duyurular">
                <Button variant="ghost" className="mb-8 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Duyurulara Dön
                </Button>
              </Link>

              <div className="mb-8 animate-fade-in">
                <Badge variant="secondary" className="gap-1 mb-4">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {announcement.title}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {announcement.excerpt}
                </p>
              </div>

              <div className="prose prose-lg max-w-none">
                <div
                  className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: announcement.content.replace(/\n/g, '<br/>') }}
                />
              </div>

              {/* Suggestion Form */}
              <Card className="mt-12">
                <CardHeader>
                  <CardTitle>Önerinizi Yollayın</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Adınız</Label>
                      <Input
                        id="name"
                        value={suggestionForm.name}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={suggestionForm.email}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suggestion">Öneriniz</Label>
                      <Textarea
                        id="suggestion"
                        value={suggestionForm.suggestion}
                        onChange={(e) => setSuggestionForm({ ...suggestionForm, suggestion: e.target.value })}
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Gönderiliyor...' : 'Gönder'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="mt-8 pt-8 border-t">
                <Link to="/duyurular">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Tüm Duyurular
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default AnnouncementDetail;