"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Archive,
  History,
  TrendingUp,
  Database,
  LayoutGrid,
  FlaskConical,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

const sections = [
  {
    title: "Packing Planning",
    description: "Select customer and product details to create intelligent packing plans and draft lists.",
    href: "/projects/packaging/planning",
    icon: LayoutGrid,
  },
  {
    title: "Packing Planning V2",
    description: "Use the deterministic planning flow with strict unknown and warp handling.",
    href: "/projects/packaging/planning-v2",
    icon: LayoutGrid,
  },
  {
    title: "Customer Config",
    description: "Manage packing preferences, restrictions, and rules for each customer profile.",
    href: "/projects/packaging/customers",
    icon: Users,
  },
  {
    title: "Product Specs",
    description: "Maintain product dimensions and requirements used by every packing scenario.",
    href: "/projects/packaging/specs",
    icon: Archive,
  },
  {
    title: "Activity Log",
    description: "Track historical operations, audits, and module-level activity across teams.",
    href: "/projects/packaging/activity",
    icon: History,
  },
  {
    title: "Packing Reports",
    description: "Generate reports for list output, cycle history, and performance insights.",
    href: "/projects/packaging/reports",
    icon: TrendingUp,
  },
  {
    title: "Global Database",
    description: "Configure master data for pallets, box definitions, and BOM planning references.",
    href: "/projects/packaging/database",
    icon: Database,
  },
  {
    title: "Logic Process",
    description: "Visualize and debug algorithm decisions with a step-by-step process view.",
    href: "/projects/packaging/logic-process",
    icon: FlaskConical,
  },
] as const;

const retroPalette = [
  {
    surface: "#8F6F5E",
    text: "#F8EFD9",
    border: "#E9D8BA88",
    pattern: "/images/retro-groovy.svg",
  },
  {
    surface: "#A9846E",
    text: "#F9F1DF",
    border: "#E9D8BA88",
    pattern: "/images/retro-groovy.svg",
  },
  {
    surface: "#D8BA95",
    text: "#4C3B31",
    border: "#8E725F66",
    pattern: "/images/retro-groovy.svg",
  },
  {
    surface: "#EFE1C5",
    text: "#5B473B",
    border: "#8E725F55",
    pattern: "/images/retro-groovy.svg",
  },
] as const;

const tiltClasses = [
  "md:-rotate-[0.9deg]",
  "md:rotate-[0.7deg]",
  "md:-rotate-[0.5deg]",
  "md:rotate-[1deg]",
  "md:-rotate-[0.6deg]",
  "md:rotate-[0.8deg]",
  "md:-rotate-[0.7deg]",
  "md:rotate-[0.6deg]",
] as const;

export default function PackagingDashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden pt-20" style={{ backgroundColor: "#D4AA7D" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-14"
        style={{
          backgroundImage: "url('/images/retro-groovy.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#F6EDDE]/14" />

      <section className="relative py-10 md:py-16">
        <div className="container-custom space-y-10 md:space-y-14">
          <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h1 className="inline-block -rotate-1 rounded-md bg-[#DEC3A2] px-6 py-2 text-balance text-3xl font-black uppercase tracking-[0.14em] text-[#4C3B31] shadow-[0_8px_13px_rgba(76,59,49,0.18)] md:text-5xl">
              Packaging Console
            </h1>
            <p className="max-w-2xl text-sm font-semibold leading-relaxed text-[#6E5648] md:text-base">
              ศูนย์รวมเมนูสำหรับวางแผน ตรวจสอบ และติดตามงานแพ็กกิ้งแบบครบจบในหน้าเดียว
              พร้อมลำดับเมนูสลับฝั่งให้ไล่อ่านง่าย.
            </p>
          </header>

          <div className="flex flex-col gap-5 md:gap-7">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isRight = index % 2 !== 0;
              const tone = retroPalette[index % retroPalette.length];

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={cn(
                    "group block w-full max-w-4xl transition-transform duration-300",
                    isRight ? "md:ml-auto" : "md:mr-auto"
                  )}
                >
                  <motion.article
                    initial={{ opacity: 0, x: isRight ? 120 : -120, scale: 0.98 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    whileHover={{
                      scale: 1.06,
                      y: -10,
                      rotate: isRight ? -1.6 : 1.6,
                      boxShadow: "0 30px 46px rgba(39,39,39,0.34)",
                    }}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ type: "spring", stiffness: 340, damping: 12, mass: 0.7, delay: index * 0.04 }}
                    className={cn(
                      "relative overflow-hidden rounded-[2rem] border-2 px-5 py-5 shadow-[0_14px_24px_rgba(88,67,54,0.18)] transition-all duration-300 group-hover:-translate-y-1 group-hover:rotate-0 group-hover:shadow-[0_18px_28px_rgba(88,67,54,0.22)] md:px-7 md:py-5",
                      tiltClasses[index % tiltClasses.length],
                      isRight ? "md:pr-24" : "md:pl-24"
                    )}
                    style={{ backgroundColor: tone.surface, color: tone.text, borderColor: tone.border }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-18 mix-blend-multiply"
                      style={{
                        backgroundImage: `url('${tone.pattern}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_36%,rgba(0,0,0,0.06)_100%)]" />

                    <div
                      className={cn(
                        "absolute top-1/2 z-20 hidden h-[4.6rem] w-[4.6rem] -translate-y-1/2 items-center justify-center rounded-full border-[5px] bg-[#FBF2E3] text-[2rem] font-black text-[#5B473B] shadow-[0_10px_18px_rgba(76,59,49,0.2)] md:flex",
                        isRight ? "-right-4" : "-left-4"
                      )}
                    >
                      {index + 1}
                    </div>

                    <div
                      className={cn(
                        "relative z-10 flex items-start gap-4 md:gap-6",
                        isRight && "md:flex-row-reverse md:text-right"
                      )}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#A6BE67]/45 bg-[#FFF8EA33] shadow-inner shadow-[#6E56483A] transition-all duration-300 group-hover:border-[#272727] group-hover:bg-[#272727]">
                        <Icon className="h-[22px] w-[22px] text-[#A6BE67] transition-colors duration-300 group-hover:text-[#EFD09E]" strokeWidth={2.3} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 md:hidden">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F0E2] text-xs font-black text-[#5B473B]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Module</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.06em]">{section.title}</h2>
                        <p className="text-sm font-medium leading-relaxed opacity-90 md:text-[15px]">
                          {section.description}
                        </p>
                        <p className="pt-1 text-xs font-bold uppercase tracking-[0.24em] text-[#B6C97D] md:text-sm">
                          Open Module
                        </p>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
