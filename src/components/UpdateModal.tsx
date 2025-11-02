import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const CURRENT_VERSION = '2.0.1';
const VERSION_KEY = 'app_last_seen_version';

const updates = [
  'Güvenlik güncellemeleri',
  'Arka plan iyileştirmeleri',
  'Hata düzeltmeleri',
  'Sistem güncellemeleri',
  '{BETA} Uçaktan uçağa mesajlaşma',
];

export default function UpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Kullanıcının bu versiyonu görüp görmediğini kontrol et
    const lastSeenVersion = localStorage.getItem(VERSION_KEY);
    
    // Eğer versiyon farklıysa veya yoksa, modal'ı göster
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Kısa bir gecikme ile modal'ı aç
      const openTimer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      // 8 saniye sonra otomatik kapat (1 saniye açılış + 8 saniye gösterim = 9 saniye)
      const closeTimer = setTimeout(() => {
        setIsClosing(true);
        // Animasyon tamamlanınca kapat (500ms animasyon süresi)
        setTimeout(() => {
          setIsOpen(false);
          localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        }, 500);
      }, 9000);
      
      return () => {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
      };
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // Animasyon tamamlanınca kapat
    setTimeout(() => {
      setIsOpen(false);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-md bg-gradient-to-br from-background via-background to-muted/20 border-2 border-primary/20 transition-all duration-500 ease-out left-1/2 top-1/2 -translate-x-1/2 ${
        isClosing ? 'opacity-0 -translate-y-[60px] scale-95' : 'opacity-100 -translate-y-1/2 scale-100'
      }`}>
        <DialogHeader className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Güncelleme 2.0.1
            </DialogTitle>
            <Badge variant="secondary" className="ml-2">
              YENİ
            </Badge>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            Sitemize yeni özellikler ve iyileştirmeler eklendi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6 max-h-[60vh] overflow-y-auto pr-2">
          {updates.map((update, index) => (
            <div
              key={update}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-all duration-200 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]"
              style={{ animationDelay: `${index * 80 + 100}ms` }}
            >
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-foreground flex-1">
                {update}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-6 pt-4 border-t">
          <Button
            onClick={handleClose}
            className="gap-2"
            size="sm"
          >
            Anladım
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

