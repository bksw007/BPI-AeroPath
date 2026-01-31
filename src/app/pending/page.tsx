"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GlassCard } from "@/components/shared/GlassCard";
import { 
  LogOut, 
  Clock, 
  CloudSun, 
  Droplet, 
  DollarSign, 
  Newspaper, 
  ShieldCheck, 
  Database, 
  Server, 
  Lock,
  Warehouse,
  Truck,
  FileText
} from "lucide-react";

// ------------------------------------------------------------------
// 🕒 Components: World Clock
// ------------------------------------------------------------------
function WorldClock({ city, region, timezone }: { city: string; region: string; timezone: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center p-3 bg-white/40 rounded-xl backdrop-blur-sm border border-white/30">
      <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">{region}</span>
      <span className="text-lg font-bold text-slate-700 font-mono my-1">
        {time.toLocaleTimeString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false })}
      </span>
      <span className="text-xs text-slate-400">{city}</span>
    </div>
  );
}

// ------------------------------------------------------------------
// ⛅ Components: Weather Widget (Mock for now, easy to swap with API)
// ------------------------------------------------------------------
function WeatherWidget() {
  return (
    <GlassCard className="h-full p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Bangkok</h3>
          <p className="text-xs text-slate-400 mt-1">Partly Cloudy</p>
        </div>
        <CloudSun className="w-8 h-8 text-yellow-500" />
      </div>
      
      <div className="mt-4 z-10">
        <h2 className="text-4xl font-bold text-slate-700">32°C</h2>
        <div className="flex gap-3 mt-2 text-xs text-slate-500">
          <span>H: 34°</span>
          <span>L: 28°</span>
          <span>Humidity: 65%</span>
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
        const data = await res.json();
        if (Array.isArray(data)) {
          // Flatten data and show ALL valid oil types
          const allFuels = (data as { OilName?: string; PriceToday?: number }[])
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
    <GlassCard className="h-full p-6 flex flex-col relative overflow-hidden bg-white/60 backdrop-blur-md border-white/40">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50">
        <div className="flex items-center gap-2 text-slate-700">
          <Droplet className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-base">Oil Prices</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
           {/* Bangchak Logo Representation */}
           <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
             <div className="w-2 h-2 rounded-full border-2 border-white"></div>
           </div>
           <span className="text-[11px] font-black text-green-700 tracking-wider">BANGCHAK</span>
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        {loading ? (
          [1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-slate-100/50 rounded-lg animate-pulse" />)
        ) : (
          prices.map((fuel, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm p-3 bg-white/40 rounded-xl hover:bg-white/80 transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md group">
              <span className="text-slate-600 font-medium group-hover:text-slate-800 transition-colors">{fuel.OilName}</span>
              <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg text-xs shadow-sm border border-slate-100 group-hover:text-indigo-600 transition-colors">
                {fuel.PriceToday} ฿
              </span>
            </div>
          ))
        )}
        {prices.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-400 text-sm">
             Unable to load prices
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-6 text-center">Updated Daily • Source: Bangchak API</p>
    </GlassCard>
  );
}

// ------------------------------------------------------------------
// 💸 Components: Currency Widget (Mock Data)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 💸 Components: Currency Widget (Mock Data)
// ------------------------------------------------------------------
function CurrencyWidgetHorizontal() {
  return (
    <GlassCard className="h-full px-8 py-5 flex items-center justify-between relative overflow-hidden bg-white/60 backdrop-blur-md border-white/40">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 p-2 rounded-full">
          <DollarSign className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
           <h3 className="font-bold text-slate-800">Exchange Rates</h3>
           <p className="text-xs text-slate-500">Real-time updates</p>
        </div>
      </div>
      
      <div className="flex gap-8 md:gap-12 text-sm">
        <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-sm">
           <span className="text-2xl">🇺🇸</span>
           <div>
              <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-700">USD/THB</span>
                 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+0.15%</span>
              </div>
              <span className="text-lg font-black text-slate-800">34.25</span>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-sm">
           <span className="text-2xl">🇯🇵</span>
           <div>
              <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-700">JPY/THB</span>
                 <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded">-0.05%</span>
              </div>
              <span className="text-lg font-black text-slate-800">23.12</span>
           </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-xl border border-white/60 shadow-sm">
           <span className="text-2xl">🇪🇺</span>
           <div>
              <div className="flex items-center gap-2">
                 <span className="font-bold text-slate-700">EUR/THB</span>
                 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+0.08%</span>
              </div>
              <span className="text-lg font-black text-slate-800">37.45</span>
           </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ------------------------------------------------------------------
//  Components: News Card
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full z-20">
          {category}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-1">{date}</p>
      <h4 className="font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
        {title}
      </h4>
    </div>
  );
}

// ------------------------------------------------------------------
// 🚀 Main Page Component
// ------------------------------------------------------------------
export default function PendingPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Redirect if actually active
  useEffect(() => {
    if (user?.status === "active") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* 1. Header / Top Bar */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container-custom py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 shadow-lg rounded-xl overflow-hidden bg-white">
               <Image src="/icons/Logo no bg.png" alt="Logo" width={40} height={40} className="w-full h-full object-contain p-1" />
            </div>
            <div>
                <h1 className="font-extrabold text-slate-800 tracking-tight leading-none text-lg">BPI AeroPath</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Public Hub Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex gap-4">
              <WorldClock city="Bangkok" region="TH" timezone="Asia/Bangkok" />
              <WorldClock city="Tokyo" region="JP" timezone="Asia/Tokyo" />
              <WorldClock city="New York" region="US" timezone="America/New_York" />
              <WorldClock city="London" region="EU" timezone="Europe/London" />
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
            
            <button 
              onClick={() => signOut()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 2. Welcome Message */}
      <section 
        className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/30 to-slate-50"
        style={{ paddingTop: '40px', paddingBottom: '80px' }} // Adjusted padding for balance
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
        
        <div className="container-custom relative z-10 pt-10"> {/* Added top padding for inner content */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold mb-6 border border-amber-100 shadow-sm animate-fade-in-up">
              <Clock className="w-3.5 h-3.5" />
              <span>ACCOUNT PENDING APPROVAL</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight animate-fade-in-up delay-100">
              Welcome to the <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Digital Workspace</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto animate-fade-in-up delay-200">
              Your account is currently under review by the administrator. <br className="hidden md:block"/>
              In the meantime, explore our public hub for updates and insights.
            </p>
          </div>

          {/* Widgets Grid - New Sidebar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
            
            {/* Left Main Content (Span 3) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Top Row: Weather + Feature */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[320px]">
                {/* Weather - Fixed Height */}
                <div className="md:col-span-1 h-full">
                   <WeatherWidget />
                </div>
                
                {/* Feature - Fixed Height */}
                <div className="md:col-span-2 h-full bg-slate-900 rounded-3xl shadow-xl overflow-hidden relative group">
                  <Image 
                      src="/images/sky-paper-plane-bg.jpg" 
                      alt="Highlight" 
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 blur-[2px] group-hover:blur-0 scale-105 group-hover:scale-100" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
                  <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-3 inline-block shadow-lg shadow-indigo-500/30">
                      Latest Feature
                    </span>
                    <h3 className="text-3xl font-bold mb-2 leading-tight">Logistics AI Module</h3>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                      Our new AI-powered route optimization is now live. Reduce delivery times by up to 25% with smart traffic analysis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Exchange Rates */}
              <div className="w-full">
                <CurrencyWidgetHorizontal />
              </div>
            </div>

            {/* Right Sidebar: Oil Prices (Span 1) - Tall */}
            <div className="lg:col-span-1">
              <OilPriceWidget />
            </div>

          </div>
        </div>
      </section>

      {/* 3. News Section */}
      <section className="py-20 bg-white relative">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-indigo-600" />
                Latest Announcements
              </h2>
              <p className="text-slate-500 mt-2 font-medium">Stay updated with the latest news from BPI AeroPath team</p>
            </div>
            <a href="#" className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">View All →</a>
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
      <section className="py-20 bg-slate-50">
        <div className="container-custom">
          
          {/* Intro */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Why AeroPath?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              A comprehensive digital solution designed to transform warehouse logistics into a secure, real-time, and paperless operation.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Warehouse className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Total Visibility</h3>
              <p className="text-slate-600 leading-relaxed">
                Track every movement from receiving to dispatch. Real-time dashboards provide instant insights into stock levels and asset location.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Enterprise Security</h3>
              <p className="text-slate-600 leading-relaxed">
                Built with industry-standard encryption and role-based access control to ensure your data remains secure and compliant.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Operational Redundancy</h3>
              <p className="text-slate-600 leading-relaxed">
                Enable seamless team collaboration. No single point of failure means your operations continue smoothly even when key staff are away.
              </p>
            </div>
          </div>

          {/* Tech Stack Infographic */}
          <GlassCard className="p-10 md:p-16 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
             {/* Background Mesh */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-black"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-6">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                    POWERED BY ANTIGRAVITY
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    Modern Architecture for <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Maximum Performance</span>
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                    Leveraging the latest in web technology to deliver a lightning-fast, secure, and scalable experience.
                  </p>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <Server className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Next.js 14</h4>
                      <p className="text-sm text-slate-400">Server-side rendering for ultimate speed and SEO.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <Lock className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Firebase Auth</h4>
                      <p className="text-sm text-slate-400">Secure identity management with Google integration.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <Database className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Firestore</h4>
                      <p className="text-sm text-slate-400">Real-time NoSQL database for instant data sync.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <FileText className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold text-lg mb-1">Cloud Storage</h4>
                      <p className="text-sm text-slate-400">Enterprise-grade storage for documents and assets.</p>
                    </div>
                </div>
             </div>
          </GlassCard>

        </div>
      </section>

      {/* 5. Custom Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container-custom text-center">
          <div className="flex justify-center items-center gap-3 mb-8">
            <Image src="/icons/Logo no bg.png" alt="BPI AeroPath" width={50} height={50} className="opacity-80 grayscale hover:grayscale-0 transition-all" />
            <span className="text-2xl font-bold text-white tracking-tight">BPI AeroPath</span>
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

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
            <p>© {new Date().getFullYear()} BPI AeroPath. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Created by <span className="text-indigo-400 font-bold">Antigravity</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
