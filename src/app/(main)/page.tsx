import {
  Package,
  Warehouse,
  Truck,
  FileText,
  ListTodo,
  BarChart3,
  Wrench,
  Users,
  Eye,
  Target,
  Shield,
  ArrowRight,
  ArrowDown,
  Boxes,
} from "lucide-react";
import Image from "next/image";
import * as motion from "motion/react-client";
import { GlassCard } from "@/components/shared/GlassCard";
import { ProjectCard } from "@/components/shared/ProjectCard";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";

/**
 * Home Page - BPI AeroPath
 * 
 * หน้าหลักของแอพพลิเคชัน ประกอบด้วย:
 * - Hero Section: Headline + CTA
 * - Features Section: Bento Grid แสดง core features
 * - Projects Section: Grid ของโปรเจคทั้งหมด
 * - Footer
 */

const modules = [
  {
    title: "Material Control",
    description:
      "Manage inventory, requisitions, and receiving. Track stock levels and automate reorder points.",
    icon: Package,
    href: "/projects/material-control",
    status: "active" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "creamy" as const,
  },
  {
    title: "Warehouse Management",
    description:
      "Optimize warehouse operations with location tracking, stock movements, and space utilization.",
    icon: Warehouse,
    href: "/projects/warehouse",
    status: "active" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "creamy" as const,
  },
  {
    title: "Smart Packaging",
    description:
      "Intelligent packing plans based on customer specs. Manage pallets, box sizes, and automated lists.",
    icon: Boxes,
    href: "/projects/packaging",
    status: "active" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "creamy" as const,
  },
  {
    title: "Delivery Tracking",
    description:
      "Monitor shipments, delivery status, and logistics in real-time with automated notifications.",
    icon: Truck,
    href: "/projects/delivery",
    status: "active" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "creamy" as const,
  },
  {
    title: "Document Center",
    description:
      "Centralized repository for all documents, reports, and compliance records.",
    icon: FileText,
    href: "/projects/documents",
    status: "beta" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "buff" as const,
  },
  {
    title: "Task Management",
    description:
      "Assign, track, and manage team tasks with priorities and deadlines.",
    icon: ListTodo,
    href: "/projects/tasks",
    status: "beta" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "buff" as const,
  },
  {
    title: "Analytics Dashboard",
    description:
      "Comprehensive reports and insights on inventory, operations, and team performance.",
    icon: BarChart3,
    href: "/projects/analytics",
    status: "coming-soon" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "creamy" as const,
  },
  {
    title: "Settings",
    description:
      "System configuration, user management, and administrative controls.",
    icon: Wrench,
    href: "/projects/settings",
    status: "coming-soon" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "creamy" as const,
  },
  {
    title: "Staff Schedule",
    description:
      "Manage team schedules, shifts, and availability for optimal coverage.",
    icon: Users,
    href: "/projects/staff",
    status: "coming-soon" as const,
    iconColor: "from-[#9ACD32] to-[#84B62B]",
    tone: "raisin" as const,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - padding-top ต้องใช้ inline style เพราะ Tailwind class ถูก override */}
      <section 
        className="relative overflow-hidden pb-20 md:pb-28"
        style={{ paddingTop: '80px' }}
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-radial opacity-40 blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="flex justify-center animate-fade-in">
              <Image
                src="/images/Logo h no bg.svg"
                alt="BPI AeroPath"
                width={800}
                height={192}
                className="h-42 md:h-48 w-auto object-contain drop-shadow-[0_10px_40px_rgba(39,39,39,0.28)] animate-float"
                priority
              />
            </div>
            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight animate-slide-up">
              <span className="text-[#272727] drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]">
                Centralized Work Hub for
              </span>{" "}
              <span className="text-[#7E5C4A]">
                Warehouse &amp; Logistics
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl lg:text-2xl text-[#7E5C4A] max-w-4xl mx-auto leading-relaxed font-light tracking-wide animate-slide-up delay-200">
              Manage inventory, track deliveries, and enable team redundancy.
              <br className="hidden md:block" />
              All-in-one platform for visual operations.
            </p>

            {/* CTA Buttons */}
            <div className="flex w-full flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-slide-up delay-300">
              <a 
                href="#modules" 
                className="cta-primary group px-6 py-3 font-semibold text-base rounded-full flex items-center gap-2 animate-wiggle"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="px-6 py-3 text-[#7E5C4A] border border-[#7E5C4A]/30 font-semibold text-base rounded-full hover:text-[#272727] hover:bg-[#EFD09E]/70 transition-all duration-300 hover-wiggle">
                View Documentation
              </button>
            </div>

            {/* Scroll Down Arrow */}
            <div className="flex justify-center pt-8 animate-bounce">
              <a href="#features" className="group">
                <div className="w-8 h-8 rounded-full border-2 border-[#7E5C4A]/40 flex items-center justify-center group-hover:border-[#7E5C4A]/60 transition-colors">
                  <ArrowDown className="w-4 h-4 text-[#7E5C4A]/60 group-hover:text-[#7E5C4A] transition-colors" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 relative">
        {/* Sticky Up Arrow Button */}
        <ScrollToTopButton />
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <span className="text-[#272727]">
                Why Choose BPI AeroPath?
              </span>
            </h2>
            <p className="text-[#7E5C4A] text-base md:text-lg max-w-2xl mx-auto">
              Built for teams who need real-time visibility, seamless tracking,
              and operational redundancy
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1: Visibility */}
            <GlassCard hoverEffect className="flex flex-col gap-4 border-[#7E5C4A]/28 bg-[#F6EDDE]/80">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#9ACD32] flex items-center justify-center shadow-[0_10px_20px_rgba(39,39,39,0.16)] flex-shrink-0">
                  <Eye className="w-7 h-7 text-[#272727]" />
                </div>
                <h3 className="text-2xl font-bold text-[#272727]">Visibility</h3>
              </div>
              <p className="text-[#7E5C4A] leading-relaxed">
                See all work movements in real-time. Track inventory, orders,
                and deliveries from a single dashboard.
              </p>
            </GlassCard>

            {/* Feature 2: Tracking */}
            <GlassCard hoverEffect className="flex flex-col gap-4 border-[#7E5C4A]/28 bg-[#F6EDDE]/80">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#9ACD32] flex items-center justify-center shadow-[0_10px_20px_rgba(39,39,39,0.16)] flex-shrink-0">
                  <Target className="w-7 h-7 text-[#272727]" />
                </div>
                <h3 className="text-2xl font-bold text-[#272727]">Tracking</h3>
              </div>
              <p className="text-[#7E5C4A] leading-relaxed">
                Monitor issues and progress across all departments. Get instant
                alerts and detailed reports.
              </p>
            </GlassCard>

            {/* Feature 3: Redundancy */}
            <GlassCard hoverEffect className="flex flex-col gap-4 border-[#7E5C4A]/28 bg-[#F6EDDE]/80">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#9ACD32] flex items-center justify-center shadow-[0_10px_20px_rgba(39,39,39,0.16)] flex-shrink-0">
                  <Shield className="w-7 h-7 text-[#272727]" />
                </div>
                <h3 className="text-2xl font-bold text-[#272727]">Redundancy</h3>
              </div>
              <p className="text-[#7E5C4A] leading-relaxed">
                Team members can seamlessly cover for each other. No single
                point of failure in your operations.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="modules" className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <span className="text-[#272727]">
                Explore Our Modules
              </span>
            </h2>
            <p className="text-[#7E5C4A] text-base md:text-lg max-w-2xl mx-auto">
              Everything you need to manage your warehouse and logistics
              operations
            </p>
          </div>

          {/* Projects Stack Deck */}
          <div className="relative mx-auto flex max-w-6xl flex-col pt-2 pb-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.href}
                initial={{
                  opacity: 0,
                  y: 120,
                  x: index % 2 === 0 ? -80 : 80,
                  scale: 0.86,
                  rotate: index % 2 === 0 ? -7 : 7,
                  filter: "blur(12px)",
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  x: 0,
                  scale: 1,
                  rotate: index % 2 === 0 ? -0.7 : 0.7,
                  filter: "blur(0px)",
                }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  type: "spring",
                  stiffness: 290,
                  damping: 16,
                  mass: 0.68,
                  delay: index * 0.06,
                }}
                whileHover={{
                  scale: 1.08,
                  y: -30,
                  x: index % 2 === 0 ? 120 : -120,
                  rotate: 0,
                  zIndex: 220,
                  boxShadow: "0 42px 70px rgba(39, 39, 39, 0.34)",
                  borderRadius: "2rem",
                }}
                whileTap={{ scale: 0.94, rotate: 0 }}
                className="transform-gpu will-change-transform rounded-[2rem]"
                style={{
                  zIndex: modules.length - index,
                  marginTop: index === 0 ? 0 : -10,
                  alignSelf: index % 2 === 0 ? "flex-start" : "flex-end",
                  width: index % 2 === 0 ? "min(94%, 980px)" : "min(90%, 940px)",
                  borderRadius: "2rem",
                }}
              >
                <ProjectCard
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  href={module.href}
                  status={module.status}
                  iconColor={module.iconColor}
                  tone={module.tone}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="home-footer !bg-[#272727] border-t border-[#EFD09E]/20 py-10 !text-[#EFD09E]"
        style={{ backgroundColor: "#272727", color: "#EFD09E" }}
      >
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            {/* Company Info */}
            <div className="md:col-span-4">
              <h3 className="text-[#EFD09E] font-bold text-lg mb-4">
                BPI AeroPath
              </h3>
              <p className="text-[#EFD09E]/80 text-sm leading-relaxed">
                Centralized Work Hub for Warehouse & Logistics Management.
                Built for teams who demand excellence.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 md:col-start-7">
              <h3 className="text-[#EFD09E] font-bold text-lg mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/projects"
                    className="text-[#EFD09E]/80 hover:text-[#9ACD32] transition-colors"
                  >
                    All Projects
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-[#EFD09E]/80 hover:text-[#9ACD32] transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/docs"
                    className="text-[#EFD09E]/80 hover:text-[#9ACD32] transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-3">
              <h3 className="text-[#EFD09E] font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/privacy"
                    className="text-[#EFD09E]/80 hover:text-[#9ACD32] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-[#EFD09E]/80 hover:text-[#9ACD32] transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-[#EFD09E]/80 hover:text-[#9ACD32] transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-[#EFD09E]/20 text-center">
            <p className="text-[#EFD09E]/70 text-sm">
              © {new Date().getFullYear()} BPI AeroPath. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
