"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Coins,
  Droplet,
  GlobeLock,
  Moon,
  Sun,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

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

interface OilPrice {
  OilName: string;
  PriceToday: number;
}

interface ExchangeRate {
  currency_id: string;
  selling: string;
  period: string;
  change: number;
  trend: "up" | "down" | "flat";
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  JPY: "🇯🇵",
  GBP: "🇬🇧",
  CNY: "🇨🇳",
  SGD: "🇸🇬",
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  JPY: "Japanese Yen",
  GBP: "British Pound",
  CNY: "Chinese Yuan",
  SGD: "Singapore Dollar",
};

const TARGET_CURRENCIES = ["USD", "EUR", "JPY", "GBP", "CNY", "SGD"];

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
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        () => fetchWeather()
      );
    } else {
      fetchWeather();
    }
  }, []);

  const getWeatherIcon = (code: string) => {
    const isNight = code.endsWith("n");
    if (code.startsWith("01")) return isNight ? <Moon className="w-14 h-14 text-indigo-200" /> : <Sun className="w-14 h-14 text-yellow-500" />;
    if (code.startsWith("02")) return <CloudSun className="w-14 h-14 text-yellow-500" />;
    if (code.startsWith("03") || code.startsWith("04")) return <Cloud className="w-14 h-14 text-slate-400" />;
    if (code.startsWith("09") || code.startsWith("10")) return <CloudRain className="w-14 h-14 text-blue-400" />;
    if (code.startsWith("11")) return <CloudLightning className="w-14 h-14 text-purple-500" />;
    if (code.startsWith("50")) return <CloudFog className="w-14 h-14 text-slate-300" />;
    return <CloudSun className="w-14 h-14 text-yellow-500" />;
  };

  if (loading) {
    return (
      <GlassCard className="h-full p-6 flex items-center justify-center bg-[#F6EDDE]/40 border-[#D4AA7D]/15">
        <div className="w-8 h-8 border-4 border-[#7E5C4A] border-t-transparent rounded-full animate-spin" />
      </GlassCard>
    );
  }

  const data = weather || {
    temp: 32,
    condition: "Partly Cloudy",
    description: "partly cloudy",
    humidity: 65,
    high: 34,
    low: 28,
    city: "Bangkok",
    icon_code: "02d",
  };

  return (
    <GlassCard className="h-full p-6 flex flex-col justify-between bg-[#F6EDDE]/40 border-[#D4AA7D]/15">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[#7E5C4A] text-sm font-medium uppercase tracking-wider">{data.city}</h3>
          <p className="text-xs text-[#D4AA7D] mt-1 capitalize">{data.description}</p>
        </div>
        <div className="-mt-1 -mr-1 opacity-80 scale-90">{getWeatherIcon(data.icon_code)}</div>
      </div>

      <div className="mt-6">
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

function OilPriceWidget() {
  const [prices, setPrices] = useState<OilPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOilPrices() {
      try {
        const res = await fetch("/api/oil-price");
        const json = await res.json();
        const data = json.data || json;

        if (Array.isArray(data) && data.length > 0 && data[0].OilList) {
          const oilListStr = data[0].OilList;
          const oilList = typeof oilListStr === "string" ? JSON.parse(oilListStr) : oilListStr;
          const allFuels = (oilList as { OilName?: string; PriceToday?: number }[])
            .filter((item) => item?.OilName && typeof item.OilName === "string")
            .map((item) => ({ OilName: item.OilName!, PriceToday: item.PriceToday || 0 }));
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
    <GlassCard className="h-full flex flex-col px-6 pb-6 pt-3 bg-[#F6EDDE]/40 border-[#D4AA7D]/15">
      <div className="flex flex-col items-center gap-1 mb-4 pb-3 border-b border-[#D4AA7D]/30 shrink-0">
        <div className="relative w-full h-12">
          <Image src="/images/Logo bangchak horizontal.svg" alt="Bangchak" fill className="object-contain object-center" />
        </div>
        <div className="flex items-center gap-1.5 text-[#7E5C4A]">
          <Droplet className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wider uppercase">Oil Prices</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => <div key={i} className="h-9 bg-slate-100/50 rounded-lg animate-pulse" />)
          : prices.map((fuel, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm p-2.5 bg-[#EFD09E]/25 rounded-xl border border-[#D4AA7D]/15">
                <span className="text-[#272727] font-medium text-xs">{fuel.OilName}</span>
                <span className="font-bold text-[#272727] bg-[#EFD09E] px-2 py-0.5 rounded-lg text-[11px] border border-[#D4AA7D]/20">
                  {fuel.PriceToday} ฿
                </span>
              </div>
            ))}
      </div>
    </GlassCard>
  );
}

function CurrencyWidget() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/exchange-rates");
        const json = await res.json();
        const data = json.data || [];
        const filtered = data.filter((item: ExchangeRate) => TARGET_CURRENCIES.includes(item.currency_id));
        setRates(filtered);
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRates();
  }, []);

  return (
    <GlassCard className="h-full px-6 pb-6 pt-3 flex flex-col bg-[#F6EDDE]/40 border-[#D4AA7D]/15">
      <div className="flex flex-col items-center gap-1 mb-4 pb-3 border-b border-[#D4AA7D]/30 shrink-0">
        <div className="relative w-full h-12 mb-1">
          <Image src="/images/BOT_logo_1.png" alt="Bank of Thailand" fill className="object-contain object-center" />
        </div>
        <div className="flex items-center gap-1.5 text-[#7E5C4A]">
          <Coins className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wider uppercase">Exchange Rates</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-12 bg-slate-100/50 rounded-xl animate-pulse" />)
          : rates.map((rate) => (
              <div key={rate.currency_id} className="flex items-center justify-between bg-[#EFD09E]/25 px-3 py-3 rounded-xl border border-[#D4AA7D]/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-3xl leading-none">{CURRENCY_FLAGS[rate.currency_id] || "🏳️"}</span>
                  <div className="min-w-0">
                    <span className="font-bold text-[#272727] text-sm block leading-tight">{rate.currency_id}</span>
                    <span className="text-[10px] text-[#7E5C4A] block truncate">
                      {CURRENCY_NAMES[rate.currency_id] || "Currency"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-[#272727] leading-none mb-1">{parseFloat(rate.selling).toFixed(2)}</span>
                  <div className={`flex items-center justify-end gap-0.5 text-[10px] font-medium ${rate.trend === "up" ? "text-emerald-500" : rate.trend === "down" ? "text-rose-500" : "text-slate-400"}`}>
                    {rate.trend === "up" && <TrendingUp className="w-3 h-3" />}
                    {rate.trend === "down" && <TrendingUp className="w-3 h-3 rotate-180" />}
                    <span>{Math.abs(rate.change).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </GlassCard>
  );
}

function TimeZoneWidget() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const cities = [
        { name: "Bangkok", tz: "Asia/Bangkok" },
        { name: "Tokyo", tz: "Asia/Tokyo" },
        { name: "London", tz: "Europe/London" },
        { name: "New York", tz: "America/New_York" },
      ];

      const newTimes: Record<string, string> = {};
      cities.forEach((city) => {
        newTimes[city.name] = now.toLocaleTimeString("en-US", {
          timeZone: city.tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="h-full p-6 flex flex-col bg-[#F6EDDE]/40 border-[#D4AA7D]/15">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#D4AA7D]/30 shrink-0">
        <GlobeLock className="w-5 h-5 text-[#7E5C4A]" />
        <span className="text-sm font-bold tracking-wider uppercase text-[#7E5C4A]">Global Time Zones</span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4">
        {[
          { name: "Bangkok", flag: "🇹🇭" },
          { name: "Tokyo", flag: "🇯🇵" },
          { name: "London", flag: "🇬🇧" },
          { name: "New York", flag: "🇺🇸" },
        ].map((city) => (
          <div key={city.name} className="flex flex-col p-3 bg-[#EFD09E]/25 rounded-2xl border border-[#D4AA7D]/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{city.flag}</span>
              <span className="text-[11px] font-bold text-[#7E5C4A] uppercase tracking-tight">{city.name}</span>
            </div>
            <div className="text-2xl font-black text-[#272727] font-mono tracking-tighter">{times[city.name] || "--:--"}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function PendingWidgetsGrid() {
  return (
    <div className="mt-6 md:mt-8 lg:mt-10 w-full max-w-7xl animate-slide-up delay-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-6">
        <div className="order-2 lg:order-1 lg:col-span-7 lg:min-h-[340px]">
          <CurrencyWidget />
        </div>
        <div className="order-3 lg:order-2 lg:col-span-5 lg:min-h-[340px]">
          <OilPriceWidget />
        </div>
        <div className="order-4 lg:order-3 lg:col-span-5 lg:min-h-[300px]">
          <TimeZoneWidget />
        </div>
        <div className="order-1 lg:order-4 lg:col-span-7 lg:min-h-[300px]">
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
}
