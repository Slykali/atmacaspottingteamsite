import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Clock, Plane, CheckCircle } from 'lucide-react';

export default function Maintenance() {
  const [message, setMessage] = useState('Sitemiz şu anda bakımdadır. Lütfen daha sonra tekrar deneyiniz.');
  const [expectedEndTime, setExpectedEndTime] = useState('');

  useEffect(() => {
    fetchMaintenanceInfo();
  }, []);

  const fetchMaintenanceInfo = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance')
      .single();

    if (data?.value) {
      const maintenance = data.value as { message?: string; expectedEndTime?: string };
      if (maintenance.message) setMessage(maintenance.message);
      if (maintenance.expectedEndTime) setExpectedEndTime(maintenance.expectedEndTime);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Plane animation */}
      <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
        <Plane className="absolute top-1/4 left-0 text-primary/10 h-32 w-32 animate-fly" />
        <Plane className="absolute top-3/4 right-0 text-blue-500/10 h-24 w-24 animate-fly-reverse" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* Main icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/20 to-blue-500/20 p-8 rounded-full backdrop-blur-lg border border-primary/30 shadow-2xl">
              <Wrench className="h-24 w-24 text-primary animate-spin-slow" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="h-16 w-16 rounded-full bg-blue-500/50 blur-xl animate-ping" />
            </div>
          </div>
        </div>

        {/* Title and message */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-gradient">
              Bakım Modu
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-blue-500 mx-auto rounded-full" />
          </div>
          
          <p className="text-xl md:text-2xl text-gray-200 max-w-lg mx-auto leading-relaxed">
            {message}
          </p>
          
          {expectedEndTime && (
            <div className="flex items-center justify-center gap-3 mt-6 p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
              <Clock className="h-6 w-6 text-primary animate-pulse" />
              <p className="text-base text-gray-300">
                Tahmini bitiş zamanı: <span className="font-semibold text-primary">{expectedEndTime}</span>
              </p>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="pt-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-lg rounded-full border border-white/10">
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-primary animate-ping absolute" />
              <div className="h-3 w-3 rounded-full bg-primary relative" />
            </div>
            <span className="text-sm text-gray-300 font-medium">Lütfen daha sonra tekrar kontrol ediniz</span>
          </div>
        </div>

        {/* Additional info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div className="p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Performans İyileştirme</p>
          </div>
          <div className="p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Yeni Özellikler</p>
          </div>
          <div className="p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-400">Güvenlik Güncellemeleri</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fly {
          0% { transform: translateX(-100px) translateY(0) rotate(-10deg); }
          50% { transform: translateX(calc(100vw + 100px)) translateY(-50px) rotate(10deg); }
          100% { transform: translateX(-100px) translateY(0) rotate(-10deg); }
        }
        @keyframes fly-reverse {
          0% { transform: translateX(calc(100vw + 100px)) translateY(0) rotate(10deg); }
          50% { transform: translateX(-100px) translateY(50px) rotate(-10deg); }
          100% { transform: translateX(calc(100vw + 100px)) translateY(0) rotate(10deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradient {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(45deg); }
        }
        .animate-fly {
          animation: fly 20s linear infinite;
        }
        .animate-fly-reverse {
          animation: fly-reverse 25s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
