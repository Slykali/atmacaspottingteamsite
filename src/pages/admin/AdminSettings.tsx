import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [site, setSite] = useState({ siteName: '', slogan: '', description: '' });
  const [about, setAbout] = useState({ short: '', mission: '', ethics: [] as string[] });
  const [contact, setContact] = useState({ email: '', phone: '', address: '' });
  const [social, setSocial] = useState({ instagram: '', twitter: '', youtube: '' });
  const [hero, setHero] = useState({ title: '', subtitle: '', image: '' });
  const [footer, setFooter] = useState({ text: '' });
  const [theme, setTheme] = useState({ primaryColor: '', logo: '' });
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '', expectedEndTime: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*');

    if (error) {
      toast.error('Ayarlar yüklenemedi');
      return;
    }

    data.forEach((setting) => {
      if (setting.key === 'site') setSite(setting.value as any);
      if (setting.key === 'about') {
        const aboutValue = setting.value as any;
        setAbout({
          short: aboutValue?.short || '',
          mission: aboutValue?.mission || '',
          ethics: Array.isArray(aboutValue?.ethics) ? aboutValue.ethics : []
        });
      }
      if (setting.key === 'contact') setContact(setting.value as any);
      if (setting.key === 'social') setSocial(setting.value as any);
      if (setting.key === 'hero') setHero(setting.value as any);
      if (setting.key === 'footer') setFooter(setting.value as any);
      if (setting.key === 'theme') setTheme(setting.value as any);
      if (setting.key === 'maintenance') setMaintenance(setting.value as any);
    });
  };

  const handleSave = async () => {
    setLoading(true);

    const updates = [
      { key: 'site', value: site },
      { key: 'about', value: about },
      { key: 'contact', value: contact },
      { key: 'social', value: social },
      { key: 'hero', value: hero },
      { key: 'footer', value: footer },
      { key: 'theme', value: theme },
      { key: 'maintenance', value: maintenance },
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: update.value })
        .eq('key', update.key);

      if (error) {
        toast.error(`${update.key} güncellenemedi`);
        setLoading(false);
        return;
      }
    }

    toast.success('Ayarlar güncellendi');
    setLoading(false);
  };

  const handleEthicsChange = (index: number, value: string) => {
    const newEthics = [...about.ethics];
    newEthics[index] = value;
    setAbout({ ...about, ethics: newEthics });
  };

  const addEthicsItem = () => {
    setAbout({ ...about, ethics: [...about.ethics, ''] });
  };

  const removeEthicsItem = (index: number) => {
    setAbout({ ...about, ethics: about.ethics.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Site Ayarları</h1>

      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site Adı</Label>
            <Input
              value={site.siteName}
              onChange={(e) => setSite({ ...site, siteName: e.target.value })}
              placeholder="Atmaca Spotting Team"
            />
          </div>
          <div className="space-y-2">
            <Label>Slogan</Label>
            <Input
              value={site.slogan}
              onChange={(e) => setSite({ ...site, slogan: e.target.value })}
              placeholder="Göklerde iz peşinde"
            />
          </div>
          <div className="space-y-2">
            <Label>Açıklama (SEO için)</Label>
            <Textarea
              value={site.description}
              onChange={(e) => setSite({ ...site, description: e.target.value })}
              rows={2}
              placeholder="Havacılık tutkunlarını bir araya getiren profesyonel uçak spotter topluluğu"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hakkımızda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kısa Açıklama</Label>
            <Textarea
              value={about.short}
              onChange={(e) => setAbout({ ...about, short: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Misyon</Label>
            <Textarea
              value={about.mission}
              onChange={(e) => setAbout({ ...about, mission: e.target.value })}
              rows={8}
            />
          </div>
          <div className="space-y-2">
            <Label>Etik Kurallar</Label>
            {about.ethics.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleEthicsChange(index, e.target.value)}
                  placeholder="Etik kural giriniz"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeEthicsItem(index)}
                >
                  Sil
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEthicsItem}>
              + Etik Kural Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="info@atmacaspotting.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input
              type="tel"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+90 XXX XXX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label>Adres</Label>
            <Input
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              placeholder="İstanbul, Türkiye"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sosyal Medya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input
              type="url"
              value={social.instagram}
              onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
              placeholder="https://instagram.com/atmacaspotting"
            />
          </div>
          <div className="space-y-2">
            <Label>Twitter URL</Label>
            <Input
              type="url"
              value={social.twitter}
              onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
              placeholder="https://twitter.com/atmacaspotting"
            />
          </div>
          <div className="space-y-2">
            <Label>YouTube URL</Label>
            <Input
              type="url"
              value={social.youtube}
              onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
              placeholder="https://youtube.com/@atmacaspotting"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ana Sayfa Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input
              value={hero.title}
              onChange={(e) => setHero({ ...hero, title: e.target.value })}
              placeholder="Atmaca Spotting Team"
            />
          </div>
          <div className="space-y-2">
            <Label>Alt Başlık</Label>
            <Input
              value={hero.subtitle}
              onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
              placeholder="Göklerde iz peşinde"
            />
          </div>
          <div className="space-y-2">
            <Label>Hero Görsel URL</Label>
            <Input
              value={hero.image}
              onChange={(e) => setHero({ ...hero, image: e.target.value })}
              placeholder="/hero-aircraft.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Footer Metni</Label>
            <Input
              value={footer.text}
              onChange={(e) => setFooter({ ...footer, text: e.target.value })}
              placeholder="© 2024 Atmaca Spotting Team. Tüm hakları saklıdır."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema ve Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Ana Renk (Hex)</Label>
            <Input
              value={theme.primaryColor}
              onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
              placeholder="#3B82F6"
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={theme.logo}
              onChange={(e) => setTheme({ ...theme, logo: e.target.value })}
              placeholder="/atmaca-logo.jpg"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bakım Modu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Bakım Modu Aktif</Label>
              <p className="text-sm text-muted-foreground">
                Aktif olduğunda sitedeki tüm ziyaretçiler bakım sayfasını görür (admin hariç)
              </p>
            </div>
            <Switch
              checked={maintenance.enabled}
              onCheckedChange={(checked) => setMaintenance({ ...maintenance, enabled: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label>Bakım Mesajı</Label>
            <Textarea
              value={maintenance.message}
              onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
              rows={3}
              placeholder="Sitemiz şu anda bakımdadır. Lütfen daha sonra tekrar deneyiniz."
            />
          </div>
          <div className="space-y-2">
            <Label>Tahmini Bitiş Zamanı</Label>
            <Input
              value={maintenance.expectedEndTime}
              onChange={(e) => setMaintenance({ ...maintenance, expectedEndTime: e.target.value })}
              placeholder="Örn: 15:00 - 20 Ocak 2025"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
      </Button>
    </div>
  );
}
