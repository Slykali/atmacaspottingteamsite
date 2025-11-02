import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun, Shield, LogOut } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import atmacaLogo from "@/assets/atmaca-logo.jpg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Çıkış yapıldı');
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  useEffect(() => {
    // Check if dark mode is enabled
    const darkMode = document.documentElement.classList.contains('dark');
    setIsDark(darkMode);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
    localStorage.setItem('darkMode', (!isDark).toString());
  };

  useEffect(() => {
    // Initialize dark mode from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const navLinks = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Hakkında", path: "/hakkinda" },
    { name: "Duyurular", path: "/duyurular" },
    { name: "Galeri", path: "/galeri" },
    { name: "Aktifler", path: "/aktifler" },
    { name: "Mesajlar", path: "/mesajlar", beta: true },
    { name: "İletişim", path: "/iletisim" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-[#FFD700] transition-transform group-hover:scale-105 shadow-md">
              <img 
                src={atmacaLogo} 
                alt="Atmaca Spotting Team Logo" 
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-foreground">Atmaca Spotting</div>
              <div className="text-xs text-muted-foreground -mt-0.5">Göklerde iz peşinde</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive(link.path) ? "default" : "ghost"}
                  className="relative"
                >
                  {link.name}
                  {link.beta && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500 text-white rounded">
                      BETA
                    </span>
                  )}
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="ml-2"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user ? (
              <>
                <NotificationBell />
                <Link to="/profile">
                  <Button variant="ghost" className="ml-2">
                    Profilim
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="icon" className="ml-2">
                      <Shield className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="ml-2"
                  onClick={handleSignOut}
                  aria-label="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" className="ml-2">
                    Giriş Yap
                  </Button>
                </Link>
                <Link to="/basvuru">
                  <Button variant="default" className="ml-2">
                    Bize Katıl
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive(link.path) ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    {link.name}
                    {link.beta && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500 text-white rounded">
                        BETA
                      </span>
                    )}
                  </Button>
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Profilim
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link to="/basvuru" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full">
                      Bize Katıl
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
