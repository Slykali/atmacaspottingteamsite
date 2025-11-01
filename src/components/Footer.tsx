import React from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import siteData from "../../contents/site.json";
import atmacaLogo from "@/assets/atmaca-logo.jpg";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-[#FFD700] shadow-md">
                <img 
                  src={atmacaLogo} 
                  alt="Atmaca Spotting Team Logo" 
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <div>
                <div className="font-bold text-foreground">{siteData.siteName}</div>
                <div className="text-xs text-muted-foreground">{siteData.slogan}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {siteData.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-foreground">Hızlı Erişim</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-accent transition-colors">Ana Sayfa</Link></li>
              <li><Link to="/hakkinda" className="text-muted-foreground hover:text-accent transition-colors">Hakkında</Link></li>
              <li><Link to="/duyurular" className="text-muted-foreground hover:text-accent transition-colors">Duyurular</Link></li>
              <li><Link to="/galeri" className="text-muted-foreground hover:text-accent transition-colors">Galeri</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-bold mb-4 text-foreground">Topluluk</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/aktifler" className="text-muted-foreground hover:text-accent transition-colors">Aktif Üyeler</Link></li>
              <li><Link to="/basvuru" className="text-muted-foreground hover:text-accent transition-colors">Başvuru</Link></li>
              <li><Link to="/iletisim" className="text-muted-foreground hover:text-accent transition-colors">İletişim</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-bold mb-4 text-foreground">Bağlantı</h3>
            <div className="space-y-3">
              <div className="flex gap-3 pt-2">
                <a
                  href={siteData.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Instagram'dan bize ulaşabilirsiniz
              </p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {siteData.siteName} . + SS YAZILIM HİZMETLERİ. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
