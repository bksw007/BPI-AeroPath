"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { 
  Clock, 
  CloudSun, 
  CloudRain,
  CloudLightning,
  CloudFog,
  Cloud,
  Sun,
  Moon,
  Droplet, 
  TrendingUp,
  Coins,
  Newspaper, 
  ShieldCheck, 
  Database, 
  Server, 
  Lock,
  Warehouse,
  Truck,
  FileText,
  AlertCircle,
  CheckCircle2,
  UserCircle,
  RefreshCw,
  BarChart3,
  GlobeLock
} from "lucide-react";
import { ParallaxProvider } from "@/contexts/ParallaxContext";
import { ParallaxElement } from "@/components/effects/ParallaxElement";
import { FloatingElements } from "@/components/effects/FloatingElements";

// ------------------------------------------------------------------
// 🕒 Components: World Clock
// ------------------------------------------------------------------
function WorldClock({ city, timezone }: { city: string; timezone: string }) {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center p-2.5 bg-[#EFD09E]/30 rounded-xl backdrop-blur-sm border border-[#D4AA7D]/20 min-w-[70px]">
      <span className="text-lg font-bold text-[#272727] font-mono">
        {mounted ? time.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"}
      </span>
      <span className="text-[10px] text-[#7E5C4A] font-medium">{city}</span>
    </div>
  );
}

// ------------------------------------------------------------------
// ⛅ Components: Weather Widget
// ------------------------------------------------------------------
interface WeatherData {
  temp: number;
  condition: string;
  description: string;
  humidity: number;
  high: number;
  low: number;
  city: string;
  icon_code: string;
  is_mock?: boolean;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather(lat?: number, lon?: number) {
      try {
        const query = lat && lon ? `?lat=${lat}&lon=${lon}` : "";
        const res = await fetch(`/api/weather${query}`);
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error("Failed to load weather", err);
      } finally {
        setLoading(false);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied/error:", error);
          fetchWeather(); // Fallback to default (Bangkok)
        }
      );
    } else {
      fetchWeather();
    }
  }, []);

  const getWeatherIcon = (code: string) => {
    // OpenWeatherMap Icon Codes
    // 01d/n: Clear
    // 02d/n: Few clouds
    // 03d/n: Scattered clouds
    // 04d/n: Broken clouds
    // 09d/n: Shower rain
    // 10d/n: Rain
    // 11d/n: Thunderstorm
    // 13d/n: Snow
    // 50d/n: Mist
    const isNight = code.endsWith('n');
    
    if (code.startsWith('01')) return isNight ? <Moon className="w-16 h-16 text-indigo-200" /> : <Sun className="w-16 h-16 text-yellow-500" />;
    if (code.startsWith('02')) return <CloudSun className="w-16 h-16 text-yellow-500" />;
    if (code.startsWith('03') || code.startsWith('04')) return <Cloud className="w-16 h-16 text-slate-400" />;
    if (code.startsWith('09') || code.startsWith('10')) return <CloudRain className="w-16 h-16 text-blue-400" />;
    if (code.startsWith('11')) return <CloudLightning className="w-16 h-16 text-purple-500" />;
    if (code.startsWith('13')) return <CloudSun className="w-16 h-16 text-cyan-200" />; // Snow fallback
    if (code.startsWith('50')) return <CloudFog className="w-16 h-16 text-slate-300" />;
    
    return <CloudSun className="w-16 h-16 text-yellow-500" />;
  };

  const getWeatherImage = (code: string) => {
     // Exact filename mapping based on user request and available files
     switch(code) {
       case '01d': return "01d Clear sky.png";
       case '01n': return "01n Clear sky (Night).png";
       case '02d': return "02d Few clouds.png";
       case '02n': return "02n _ 03n Few _ Scattered clouds (Night).png"; 
       case '03d': return "03d Scattered clouds.png";
       case '03n': return "02n _ 03n Few _ Scattered clouds (Night).png";
       case '04d': return "04d Broken _ Overcast clouds.png";
       case '04n': return "04n_Overcast clouds (Night).png";
       case '09d': case '09n': return "09d Shower rain _ Drizzle.png";
       case '10d': case '10n': return "10d Rain.png";
       case '11d': case '11n': return "11d Thunderstorm.png"; // Defaulting to generic thunderstorm
       case '50d': case '50n': return "50d Mist _ Haze _ Fog.png";
       default: return "01d Clear sky.png";
     }
  };

  if (loading) {
    return (
      <GlassCard className="h-full p-6 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-[#7E5C4A] border-t-transparent rounded-full animate-spin"></div>
      </GlassCard>
    );
  }

  const data = weather || {
    temp: 32, condition: "Partly Cloudy", description: "partly cloudy", humidity: 65, high: 34, low: 28, city: "Bangkok", icon_code: "02d"
  };

  return (
    <GlassCard className="h-full p-6 flex flex-col justify-between relative overflow-hidden group bg-[#F6EDDE]/40 border-[#D4AA7D]/15">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AA7D]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none z-0" />
      
      {/* Large Centered Custom Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
         <div className="relative w-[270px] h-[270px] drop-shadow-2xl opacity-90">
            <Image 
              src={`/icons/icon-weather/${getWeatherImage(data.icon_code)}`}
              alt={data.description}
              fill
              className="object-contain"
            />
         </div>
      </div>

      <div className="flex justify-between items-start z-10 relative">
        <div>
          <h3 className="text-[#7E5C4A] text-sm font-medium uppercase tracking-wider">{data.city}</h3>
          <p className="text-xs text-[#D4AA7D] mt-1 capitalize">{data.description}</p>
          {data.is_mock && <span className="text-[9px] text-rose-400 block mt-1">(Using Standard Data)</span>}
        </div>
        <div className="-mt-1 -mr-1 opacity-80 scale-90">
           {getWeatherIcon(data.icon_code)}
        </div>
      </div>
      
      <div className="mt-4 z-10 relative">
        <h2 className="text-4xl font-bold text-[#272727]">{data.temp}°C</h2>
        <div className="flex gap-3 mt-2 text-xs text-[#7E5C4A] font-medium">
          <span>H: {data.high}°</span>
          <span>L: {data.low}°</span>
          <span>Humidity: {data.humidity}%</span>
        </div>
      </div>
    </GlassCard>
  );
}

// ------------------------------------------------------------------
// 🛢️ Interface & Components: Oil Price Widget
// ------------------------------------------------------------------
interface OilPrice {
  OilName: string;
  PriceToday: number;
}

function OilPriceWidget() {
  const [prices, setPrices] = useState<OilPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOilPrices() {
      try {
        const res = await fetch("/api/oil-price");
        const json = await res.json();
        
        // Wrapper support: json.data contains the array
        const data = json.data || json;

        if (Array.isArray(data) && data.length > 0 && data[0].OilList) {
          // OilList is a JSON string inside the first element
          const oilListStr = data[0].OilList;
          const oilList = typeof oilListStr === 'string' ? JSON.parse(oilListStr) : oilListStr;
          
          const allFuels = (oilList as { OilName?: string; PriceToday?: number }[])
            .filter((item) => item?.OilName && typeof item.OilName === "string")
            .map(item => ({
              OilName: item.OilName!,
              PriceToday: item.PriceToday || 0
            }));
          setPrices(allFuels);
        }
      } catch (err) {
        console.error("Failed to load oil prices", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOilPrices();
  }, []);

  return (
    <GlassCard className="h-full flex flex-col px-6 pb-6 pt-3 relative overflow-hidden bg-[#F6EDDE]/40 backdrop-blur-md border-[#D4AA7D]/15">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mb-4 pb-3 border-b border-[#D4AA7D]/30 shrink-0">
        <div className="relative w-full h-16">
           <Image
             src="/images/Logo bangchak horizontal.svg"
             alt="Bangchak"
             fill
             className="object-contain object-center"
           />
        </div>
        <div className="flex items-center gap-1.5 text-[#7E5C4A]">
          <Droplet className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wider uppercase">Oil Prices</span>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 space-y-2">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <div key={i} className="h-9 bg-slate-100/50 rounded-lg animate-pulse" />)
        ) : (
          prices.map((fuel, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm p-2.5 bg-[#EFD09E]/25 rounded-xl hover:bg-[#EFD09E]/50 transition-all border border-[#D4AA7D]/15 hover:border-[#D4AA7D]/30 shadow-sm hover:shadow-md group">
              <span className="text-[#272727] font-medium group-hover:text-[#272727] transition-colors text-xs">{fuel.OilName}</span>
              <span className="font-bold text-[#272727] bg-[#EFD09E] px-2 py-0.5 rounded-lg text-[11px] shadow-sm border border-[#D4AA7D]/20 group-hover:text-[#7E5C4A] transition-colors">
                {fuel.PriceToday} ฿
              </span>
            </div>
          ))
        )}
        {prices.length === 0 && !loading && (
          <div className="text-center py-6 text-[#7E5C4A] text-sm">
             Unable to load prices
          </div>
        )}
      </div>
      
      {/* Footer */}
      <p className="text-[9px] text-[#D4AA7D] mt-3 text-center shrink-0">Updated Daily • Bangchak API</p>
    </GlassCard>
  );
}

// ------------------------------------------------------------------
// 💸 Components: Currency Widget (Mock Data)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 💸 Components: Currency Widget (Mock Data)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 💸 Components: Currency Widget (Mock Data)
// ------------------------------------------------------------------
const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  JPY: "🇯🇵",
  GBP: "🇬🇧",
  CNY: "🇨🇳",
  SGD: "🇸🇬",
  AUD: "🇦🇺",
  HKD: "🇭🇰",
  KRW: "🇰🇷",
  MYR: "🇲🇾"
};

const TARGET_CURRENCIES = ["USD", "EUR", "JPY", "GBP", "CNY", "SGD"];

interface ExchangeRate {
  currency_id: string;
  selling: string;
  period: string;
  change: number;
  trend: "up" | "down" | "flat";
}

function CurrencyWidget() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/exchange-rates");
        const json = await res.json();
        
        if (json.error) {
          throw new Error(json.details || "Failed to load rates");
        }

        const data = json.data || [];
        
        // Get date from response
        if (json.last_updated) {
           const [y, m, d] = json.last_updated.split('-');
           setDate(`${d}-${m}-${y}`);
        }

        // Filter and map
        const filtered = data.filter((item: ExchangeRate) => TARGET_CURRENCIES.includes(item.currency_id));
        setRates(filtered);
      } catch (err) {
        console.error("Failed to fetch rates:", err);
        setError("Unavailable");
      } finally {
        setLoading(false);
      }
    }

    fetchRates();
  }, []);

  return (
    <GlassCard className="w-full h-full px-6 pb-6 pt-3 flex flex-col relative overflow-hidden bg-[#F6EDDE]/40 backdrop-blur-md border-[#D4AA7D]/15">
      <div className="flex flex-col items-center gap-1 mb-6 pb-3 border-b border-[#D4AA7D]/30 shrink-0">
        <div className="relative w-full h-16 mb-2">
          <Image
            src="/images/BOT_logo_1.png"
            alt="Bank of Thailand"
            fill
            className="object-contain object-center"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[#7E5C4A]">
           <Coins className="w-3.5 h-3.5" />
           <span className="text-xs font-semibold tracking-wider uppercase">Exchange Rates</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col lg:justify-center">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {loading ? (
           [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-slate-100/50 rounded-xl animate-pulse" />)
        ) : error ? (
           <div className="text-center py-4 text-slate-400 text-xs">{error}</div>
        ) : (
          rates.map((rate) => (
            <div key={rate.currency_id} className="flex items-center justify-between bg-[#EFD09E]/25 px-3 py-3 rounded-xl border border-[#D4AA7D]/15 hover:bg-[#EFD09E]/50 transition-colors">
               <div className="flex items-center gap-2">
                 <span className="text-2xl">{CURRENCY_FLAGS[rate.currency_id] || "🏳️"}</span>
                 <span className="font-bold text-[#272727] text-sm">{rate.currency_id}</span>
               </div>
               <div className="text-right">
                  <span className="block text-sm font-bold text-[#272727] leading-none mb-1">
                    {parseFloat(rate.selling).toFixed(2)}
                  </span>
                  <div className={`flex items-center justify-end gap-0.5 text-[10px] font-medium ${
                    rate.trend === 'up' ? 'text-emerald-500' : rate.trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {rate.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                    {rate.trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
                    <span>{Math.abs(rate.change).toFixed(2)}</span>
                  </div>
               </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#D4AA7D]">
        <span className="font-medium">Bank of Thailand</span>
        {date && (
          <>
            <span className="w-1 h-1 rounded-full bg-[#D4AA7D]"></span>
            <span>{date}</span>
          </>
        )}
      </div>
    </GlassCard>
  );
}

// ------------------------------------------------------------------
// 🗺️ Components: Time Zone Widget
// ------------------------------------------------------------------
function TimeZoneWidget() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const cities = [
        { name: "Bangkok", tz: "Asia/Bangkok" },
        { name: "Tokyo", tz: "Asia/Tokyo" },
        { name: "London", tz: "Europe/London" },
        { name: "New York", tz: "America/New_York" }
      ];
      
      const newTimes: Record<string, string> = {};
      cities.forEach(city => {
        newTimes[city.name] = now.toLocaleTimeString("en-US", {
          timeZone: city.tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="h-full p-6 flex flex-col relative overflow-hidden bg-[#F6EDDE]/40 backdrop-blur-md border-[#D4AA7D]/15">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#D4AA7D]/30 shrink-0">
        <GlobeLock className="w-5 h-5 text-[#7E5C4A]" />
        <span className="text-sm font-bold tracking-wider uppercase text-[#7E5C4A]">Global Time Zones</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        {[
          { name: "Bangkok", flag: "🇹🇭" },
          { name: "Tokyo", flag: "🇯🇵" },
          { name: "London", flag: "🇬🇧" },
          { name: "New York", flag: "🇺🇸" }
        ].map((city) => (
          <div key={city.name} className="flex flex-col p-3 bg-[#EFD09E]/25 rounded-2xl border border-[#D4AA7D]/10 hover:bg-[#EFD09E]/40 transition-all hover:shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{city.flag}</span>
              <span className="text-[11px] font-bold text-[#7E5C4A] uppercase tracking-tight">{city.name}</span>
            </div>
            <div className="text-2xl font-black text-[#272727] font-mono tracking-tighter">
              {times[city.name] || "--:--"}
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-[9px] text-[#D4AA7D] mt-4 text-center italic">Synchronized with World Atomic Clock</p>
    </GlassCard>
  );
}

// ------------------------------------------------------------------
// 📰 Components: News Card
// ------------------------------------------------------------------
function NewsCard({ title, date, category, image }: { title: string; date: string; category: string; image: string }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative h-48 rounded-xl overflow-hidden mb-3">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10" />
        <span className="absolute top-3 left-3 bg-[#7E5C4A] text-white text-[10px] font-bold px-2 py-1 rounded-full z-20">
          {category}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-1">{date}</p>
      <h4 className="font-bold text-[#272727] leading-snug group-hover:text-[#7E5C4A] transition-colors">
        {title}
      </h4>
    </div>
  );
}

// ------------------------------------------------------------------
// 🚀 Main Page Component
// ------------------------------------------------------------------
export default function PendingPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isJoinHovered, setIsJoinHovered] = useState(false);

  // Redirect if actually active
  useEffect(() => {
    if (user?.status === "active") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <ParallaxProvider>
    <div className="min-h-screen bg-[#F6EDDE]">
      
      {/* 1. Header / Top Bar */}
      <header className="bg-[#F6EDDE]/70 backdrop-blur-2xl border-b border-[#D4AA7D]/20 sticky top-0 z-50 shadow-sm">
        <div className="container-custom py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <Image 
              src="/images/Logo no bg.svg" 
              alt="BPI AeroPath Logo" 
              width={160} 
              height={48} 
              className="h-10 w-auto object-contain" 
              priority
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex gap-4">
              <WorldClock city="Bangkok" timezone="Asia/Bangkok" />
              <WorldClock city="Tokyo" timezone="Asia/Tokyo" />
              <WorldClock city="New York" timezone="America/New_York" />
              <WorldClock city="London" timezone="Europe/London" />
            </div>
            
            <div className="h-8 w-px bg-[#D4AA7D]/30 hidden lg:block"></div>
            
            <button 
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              onMouseEnter={() => setIsJoinHovered(true)}
              onMouseLeave={() => setIsJoinHovered(false)}
              className="relative px-6 py-2.5 text-sm font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center min-w-[100px]"
            >
              <motion.span 
                animate={isJoinHovered ? { color: '#EFD09E' } : { color: ['#272727', '#EFD09E', '#272727'] }}
                transition={isJoinHovered ? { duration: 0.3 } : { duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative z-10"
              >
                Join us!!
              </motion.span>
              <AnimatePresence>
                {isJoinHovered && (
                  <motion.div
                    layoutId="join-us-pill"
                    className="absolute inset-0 bg-[#272727] rounded-xl z-0 border border-[#272727]/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.4
                    }}
                  />
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Notification Bar */}
      {user && !loading && (
        <div className="sticky top-[57px] z-40 w-full py-3 flex justify-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#EFD09E]/40 backdrop-blur-xl border border-[#D4AA7D]/30 rounded-full shadow-lg shadow-black/5">
            <div className="relative">
              <Clock className="w-4 h-4 text-[#7E5C4A]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#D4AA7D] rounded-full animate-ping"></span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#D4AA7D] rounded-full"></span>
            </div>
            <span className="text-sm font-semibold text-[#7E5C4A] tracking-wide">ACCOUNT PENDING APPROVAL</span>
          </div>
        </div>
      )}

      {/* 2. Welcome Message */}
      <section 
        className="relative overflow-hidden -mt-[110px]"
        style={{ 
          paddingTop: '130px', 
          paddingBottom: '80px',
        }}
      >
        {/* Retro Groovy Background */}
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/retro-groovy.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4,
          zIndex: 0
        }} />
        <div className="absolute inset-0 bg-linear-to-b from-[#F6EDDE]/50 via-transparent to-[#F6EDDE]/60" style={{ zIndex: 1 }} />
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#9ACD32]/30 to-transparent"></div>
        
        {/* Background Elements */}
        <FloatingElements />
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            
            {/* 🎯 Logo with Strong Parallax (Close/Fast) */}
            <div className="flex justify-center mb-8 animate-fade-in relative z-20">
              <ParallaxElement depth={0.08} speed="fast">
              <Image 
                src="/images/Logo h no bg.svg" 
                alt="BPI AeroPath" 
                width={800} 
                height={240} 
                className="h-40 md:h-56 w-auto object-contain drop-shadow-lg animate-float"
                priority
              />
              </ParallaxElement>
            </div>
            

            {/* 🎯 Main Heading with Medium Parallax */}
            <ParallaxElement depth={0.05} speed="medium">
            <h1 
              className="text-4xl md:text-6xl mb-10 tracking-tight leading-tight text-[#272727] animate-fade-in-up" 
              style={{ fontFamily: 'var(--font-montserrat-alt)', fontWeight: 600, fontStyle: 'italic', animationDuration: '1.5s' }}
            >
              Consolidate Your <br />
              <span className="lg:whitespace-nowrap text-3xl md:text-5xl text-[#7E5C4A]">Operating System Workflow</span>
            </h1>
            </ParallaxElement>

            {/* 🎯 Subtitle with Subtle Parallax (Far/Slow) */}
            <ParallaxElement depth={0.02} speed="slow">
            <div className="inline-block bg-[#EFD09E]/30 border border-[#D4AA7D]/20 rounded-2xl px-8 py-5">
              <p className="text-lg md:text-xl leading-relaxed max-w-none mx-auto text-center" style={{ fontFamily: 'var(--font-montserrat-alt)', fontWeight: 400, fontStyle: 'italic' }}>
                <span className="block text-[#272727] animate-fade-in-up delay-150 lg:whitespace-nowrap" style={{ animationDuration: '0.4s' }}>
                  Transform your warehouse operations into a streamlined, digital powerhouse.
                </span>
                <span className="block text-[#7E5C4A] animate-fade-in-up delay-200 lg:whitespace-nowrap" style={{ animationDuration: '0.4s' }}>
                  Real-time tracking, seamless syncing, enterprise-grade security — all in one hub.
                </span>
              </p>
            </div>
            </ParallaxElement>
          </div>

          {/* Main Grid Layout - 12 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto pb-10">
            
            {/* Exchange Rates - Col Span 7 (wider) */}
            <div className="lg:col-span-7">
               <ParallaxElement depth={0.03} speed="medium" className="h-full">
               <CurrencyWidget />
               </ParallaxElement>
            </div>

            {/* Oil Prices - Col Span 5 */}
            <div className="lg:col-span-5">
              <ParallaxElement depth={0.035} speed="medium" className="h-full">
              <OilPriceWidget />
              </ParallaxElement>
            </div>

            {/* Time Zones - Col Span 5 (Placed on the left) */}
            <div className="lg:col-span-5">
              <ParallaxElement depth={0.03} speed="medium" className="h-full">
              <TimeZoneWidget />
              </ParallaxElement>
            </div>

            {/* Weather - Col Span 7 (Placed on the right) */}
            <div className="lg:col-span-7">
              <ParallaxElement depth={0.04} speed="medium" className="h-full">
              <WeatherWidget />
              </ParallaxElement>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ MIDDLE SECTIONS — vintage-retro.svg background ═══ */}
      <div className="relative overflow-hidden">
        {/* Vintage Retro Background */}
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/vintage-retro.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat-y',
          opacity: 0.3,
          zIndex: 0
        }} />
        <div className="absolute inset-0 bg-[#F6EDDE]/60" style={{ zIndex: 1 }} />

      {/* 3. News Section */}
      <section className="py-20 relative z-2">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 border-b border-[#D4AA7D]/30 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#272727] flex items-center gap-3">
                <div className="p-2 bg-[#D4AA7D]/30 rounded-xl">
                  <Newspaper className="w-8 h-8 text-[#9ACD32]" />
                </div>
                Latest Announcements
              </h2>
              <p className="text-[#7E5C4A] mt-2 font-medium">Stay updated with the latest news from BPI AeroPath team</p>
            </div>
            <a href="#" className="px-6 py-2.5 bg-[#7E5C4A] text-[#EFD09E] rounded-full text-sm font-bold hover:bg-[#272727] transition-colors">View All →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NewsCard 
              image="/news1.png"
              category="System Update"
              date="Jan 30, 2026"
              title="Version 2.0 Release: Enhanced Material Control & Real-time Tracking"
            />
            <NewsCard 
              image="/news2.png"
              category="Maintenance"
              date="Jan 28, 2026"
              title="Scheduled Server Maintenance this Weekend (02:00 - 04:00 AM)"
            />
            <NewsCard 
              image="/news3.png"
              category="Security"
              date="Jan 25, 2026"
              title="New Multi-Factor Authentication (MFA) Features for Admin Users"
            />
          </div>
        </div>
      </section>

      {/* 4. System Showcase (Infographic Section) */}
      <section 
        className="py-20 relative z-2"
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-[#F6EDDE]/60 via-[#F6EDDE]/40 to-[#F6EDDE]/60 pointer-events-none"></div>
        
        <div className="container-custom relative z-10">
          
          {/* Intro */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#272727] mb-4">
              Why AeroPath?
            </h2>
            <p className="text-xl text-[#7E5C4A] max-w-3xl mx-auto">
              A comprehensive digital solution designed to transform warehouse logistics into a secure, real-time, and paperless operation.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AA7D]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Warehouse className="w-10 h-10 text-[#9ACD32]" />
              </div>
              <h3 className="text-xl font-bold text-[#272727] mb-3">Total Visibility</h3>
              <p className="text-[#7E5C4A] leading-relaxed">
                Track every movement from receiving to dispatch. Real-time dashboards provide instant insights into stock levels and asset location.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AA7D]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-[#9ACD32]" />
              </div>
              <h3 className="text-xl font-bold text-[#272727] mb-3">Enterprise Security</h3>
              <p className="text-[#7E5C4A] leading-relaxed">
                Built with industry-standard encryption and role-based access control to ensure your data remains secure and compliant.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4AA7D]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-[#9ACD32]" />
              </div>
              <h3 className="text-xl font-bold text-[#272727] mb-3">Operational Redundancy</h3>
              <p className="text-[#7E5C4A] leading-relaxed">
                Enable seamless team collaboration. No single point of failure means your operations continue smoothly even when key staff are away.
              </p>
            </div>
          </div>

          {/* Tech Stack Infographic */}
          <GlassCard className="p-10 md:p-16 relative overflow-hidden bg-linear-to-br from-[#272727] to-[#1a1a1a] text-white border-0">
             {/* Background Mesh */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#D4AA7D] via-[#272727] to-black"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-[#9ACD32]/15 border border-[#9ACD32]/30 text-[#9ACD32] text-sm font-medium">
                    POWERED BY ANTIGRAVITY
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    Modern Architecture for <br/> <span className="text-transparent bg-clip-text bg-linear-to-r from-[#D4AA7D] to-[#EFD09E]">Maximum Performance</span>
                  </h2>
                  <p className="text-[#D4AA7D] text-lg leading-relaxed max-w-xl">
                    Leveraging the latest in web technology to deliver a lightning-fast, secure, and scalable experience.
                  </p>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="p-6 rounded-2xl bg-white/5 border border-[#9ACD32]/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <Server className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Next.js 14</h4>
                      <p className="text-sm text-slate-400">Server-side rendering for ultimate speed and SEO.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-[#9ACD32]/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <Lock className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Firebase Auth</h4>
                      <p className="text-sm text-slate-400">Secure identity management with Google integration.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-[#9ACD32]/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <Database className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Firestore</h4>
                      <p className="text-sm text-slate-400">Real-time NoSQL database for instant data sync.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-[#9ACD32]/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <FileText className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Cloud Storage</h4>
                      <p className="text-sm text-slate-400">Enterprise-grade storage for documents and assets.</p>
                    </div>
                </div>
             </div>
          </GlassCard>

        </div>
      </section>

      {/* 5. Problem & Solution Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 bg-[#F6EDDE]/50 backdrop-blur-sm rounded-3xl my-10 border border-[#D4AA7D]/30 relative z-2">
        <h2 className="text-3xl font-bold mb-4 text-center text-[#272727]">
          Common Challenges in Warehouse Operations
        </h2>
        <p className="text-center text-[#7E5C4A] mb-16 max-w-2xl mx-auto">
          Manual operations lead to errors, delays, and significant hidden costs.
        </p>
        
        <div className="grid gap-10 md:grid-cols-2">
          <GlassCard className="p-8 hover:shadow-lg transition-all border-[#D4AA7D]/20 bg-[#F6EDDE]/60">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#D4AA7D]/30 rounded-lg">
                 <AlertCircle size={24} className="text-[#9ACD32]" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#272727]">Manual & Fragmented Workflow</h3>
                <p className="mt-4 text-[#7E5C4A] leading-relaxed">
                  Using multiple paper systems leads to data mismatch. 
                  Redundant data entry wastes time and increases error rates, distracting the team from core operational tasks.
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#9ACD32]/20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFD09E]/30 rounded-xl">
                <CheckCircle2 size={20} className="text-[#7E5C4A]" />
                <span className="font-bold text-[#7E5C4A]">Real-time Digital Workflow</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 hover:shadow-lg transition-all border-[#D4AA7D]/20 bg-[#F6EDDE]/60">
             <div className="flex items-start gap-4">
              <div className="p-3 bg-[#D4AA7D]/30 rounded-lg">
                 <AlertCircle size={24} className="text-[#9ACD32]" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#272727]">Lack of Visibility</h3>
                <p className="mt-4 text-[#7E5C4A] leading-relaxed">
                  Executives lack real-time visibility into operations. 
                  Reporting that lags by days or weeks leads to decisions based on outdated and potentially inaccurate information.
                </p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#9ACD32]/20">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFD09E]/30 rounded-xl">
                <CheckCircle2 size={20} className="text-[#7E5C4A]" />
                <span className="font-bold text-[#7E5C4A]">Instant Live Dashboard</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 5.5 Business Impact Section */}
      <section className="mx-auto max-w-7xl px-6 pb-24 relative z-2">
        <h2 className="text-3xl font-bold mb-12 text-center text-[#272727]">
          Measurable Business Impact
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          
          <GlassCard className="md:col-span-2 p-10 flex flex-col items-center text-center bg-[#F6EDDE]/70 hover:scale-[1.02] transition-transform duration-300 border-[#D4AA7D]/20">
            <div className="px-6 py-3 bg-[#EFD09E]/40 rounded-xl mb-4">
              <span className="text-5xl font-black text-[#272727] tracking-tight">-80%</span>
            </div>
            <h3 className="text-xl font-bold text-[#272727] mb-3">Infrastructure Cost</h3>
            <p className="text-[#7E5C4A] leading-relaxed text-sm">
              No server hardware required. <br/> Pay only for what you use.
            </p>
          </GlassCard>

          <GlassCard className="p-10 flex flex-col items-center text-center bg-[#F6EDDE]/70 hover:scale-[1.02] transition-transform duration-300 border-[#D4AA7D]/20">
            <div className="px-6 py-3 bg-[#EFD09E]/40 rounded-xl mb-4">
              <span className="text-5xl font-black text-[#272727] tracking-tight">+30%</span>
            </div>
            <h3 className="text-xl font-bold text-[#272727] mb-3">Operational Efficiency</h3>
            <p className="text-[#7E5C4A] leading-relaxed text-sm">
               Accelerate workflows, reduce redundancy, and minimize human error.
            </p>
          </GlassCard>

          <GlassCard className="md:col-span-1 p-10 flex flex-col items-center text-center bg-[#F6EDDE]/70 hover:scale-[1.02] transition-transform duration-300 border-[#D4AA7D]/20">
            <div className="px-6 py-3 bg-[#EFD09E]/40 rounded-xl mb-4">
              <span className="text-5xl font-black text-[#272727] tracking-tight">1-4</span>
            </div>
            <h3 className="text-xl font-bold text-[#272727] mb-3">Weeks to Value</h3>
            <p className="text-[#7E5C4A] leading-relaxed text-sm">
               Rapid deployment. <br/> Go live in weeks, not years.
            </p>
          </GlassCard>

        </div>
      </section>

      </div>{/* end MIDDLE SECTIONS wrapper */}

      {/* ═══ BOTTOM SECTIONS — vintage-retro-stripe.svg background ═══ */}
      <div className="relative overflow-hidden">
        {/* Vintage Retro Stripe Background */}
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/vintage-retro-stripe.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
          zIndex: 0
        }} />
        <div className="absolute inset-0 bg-linear-to-b from-[#F6EDDE]/60 via-[#F6EDDE]/30 to-transparent" style={{ zIndex: 1 }} />

      {/* 6. How It Works Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 relative z-2">
        <h2 className="text-3xl font-bold mb-16 text-center text-[#272727]">
          How It Works
        </h2>
        <div className="grid gap-10 md:grid-cols-4 text-center">
          {[
            {
              icon: UserCircle,
              step: '1',
              title: 'Login',
              desc: 'Secure role-based access control with verifiable audit trails.'
            },
            {
              icon: Truck,
              step: '2',
              title: 'Operate',
              desc: 'Receive & Dispatch tasks directly via mobile or tablet devices.'
            },
            {
              icon: RefreshCw,
              step: '3',
              title: 'Realtime Update',
              desc: 'Instant data synchronization across all devices. No need to wait for sync.'
            },
            {
              icon: BarChart3,
              step: '4',
              title: 'Decision',
              desc: 'Live Dashboard & automated alerts for precise, data-driven decisions.'
            }
          ].map((item, index) => (
            <GlassCard key={index} className="p-8 flex flex-col items-center hover:border-[#7E5C4A] transition-colors group bg-[#F6EDDE]/70 border-[#D4AA7D]/20">
              <div className="mb-6 p-4 rounded-full bg-[#D4AA7D] text-[#9ACD32] group-hover:bg-[#272727] transition-colors">
                <item.icon size={32} />
              </div>
              <p className="text-4xl font-black text-[#D4AA7D] group-hover:text-[#7E5C4A] transition-colors mb-2">{item.step}</p>
              <h4 className="mt-2 font-bold text-lg text-[#272727]">{item.title}</h4>
              <p className="mt-2 text-sm text-[#7E5C4A]">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* 7. Security Layers Section */}
      <section className="py-24 bg-[#F6EDDE]/50 backdrop-blur-sm border-y border-[#D4AA7D]/20 relative z-2">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold mb-16 text-center text-[#272727]">
            Enterprise-Grade Architecture & Security
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Authentication",
                desc: "Firebase Auth · MFA · Role-Based Access Control"
              },
              {
                icon: Database,
                title: "Realtime Database",
                desc: "Cloud Firestore · Instant Realtime Sync"
              },
              {
                icon: Server,
                title: "Serverless Backend",
                desc: "Cloud Functions · Auto Scaling Infrastructure"
              },
              {
                icon: GlobeLock,
                title: "Infrastructure",
                desc: "Vercel Edge Network · HTTPS · DDoS Protection"
              }
            ].map((item, index) => (
               <div key={index} className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-lg transition-all border border-[#D4AA7D]/15">
                  <div className="mb-4 bg-[#D4AA7D]/30 w-fit p-3 rounded-xl">
                      <item.icon size={24} className="text-[#9ACD32]" />
                  </div>
                  <h4 className="font-bold mb-2 text-lg text-[#272727]">{item.title}</h4>
                  <p className="text-sm text-[#7E5C4A] leading-relaxed">{item.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Custom Footer */}
      <footer className="bg-[#272727] text-[#D4AA7D] py-12 border-t border-[#7E5C4A]/30 relative z-2">
        <div className="container-custom text-center">
          <div className="flex justify-center items-center gap-3 mb-8">
            <Image src="/icons/Logo no bg.png" alt="BPI AeroPath" width={50} height={50} className="opacity-80 grayscale hover:grayscale-0 transition-all" />
            <span className="text-2xl font-bold text-[#EFD09E] tracking-tight">BPI AeroPath</span>
          </div>
          
          <div className="max-w-2xl mx-auto mb-10">
             <p className="text-sm mb-6">
               Centralized Work Hub for Warehouse & Logistics Management. <br/>
               Empowering teams with real-time data and seamless collaboration tools.
             </p>
             <div className="flex justify-center gap-6 text-2xl opacity-50">
               {/* Tech Logos (Text representation for now) */}
               <span className="hover:opacity-100 transition-opacity hover:text-white cursor-help" title="Next.js">⚛️</span>
               <span className="hover:opacity-100 transition-opacity hover:text-orange-400 cursor-help" title="Firebase">🔥</span>
               <span className="hover:opacity-100 transition-opacity hover:text-cyan-400 cursor-help" title="Tailwind CSS">🎨</span>
               <span className="hover:opacity-100 transition-opacity hover:text-blue-400 cursor-help" title="TypeScript">TS</span>
             </div>
          </div>

          <div className="border-t border-[#7E5C4A]/30 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
            <p>© {new Date().getFullYear()} BPI AeroPath. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Created by <span className="text-[#9ACD32] font-bold">Antigravity</span>
            </p>
          </div>
        </div>
      </footer>

      </div>{/* end BOTTOM SECTIONS wrapper */}

    </div>
    </ParallaxProvider>
  );
}
