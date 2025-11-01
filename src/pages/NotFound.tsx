import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plane, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
              <Plane className="h-32 w-32 mx-auto text-accent opacity-20 animate-pulse" />
            </div>
            
            <h1 className="text-7xl font-bold mb-4 text-accent">404</h1>
            <h2 className="text-3xl font-bold mb-4">Uçuş Yönü Bulunamadı</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Bu rota haritada yok! Aradığınız sayfa gökyüzünde kaybolmuş olabilir.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button size="lg" className="gap-2">
                  <Home className="h-5 w-5" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
              <Link to="/galeri">
                <Button size="lg" variant="outline" className="gap-2">
                  <Plane className="h-5 w-5" />
                  Galeriyi İncele
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
