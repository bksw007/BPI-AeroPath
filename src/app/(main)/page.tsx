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
  Boxes,
} from "lucide-react";
import Image from "next/image";
import { GlassCard } from "@/components/shared/GlassCard";
import { ProjectCard } from "@/components/shared/ProjectCard";

/**
 * Home Page - BPI AeroPath
 * 
 * หน้าหลักของแอพพลิเคชัน ประกอบด้วย:
 * - Hero Section: Headline + CTA
 * - Features Section: Bento Grid แสดง core features
 * - Projects Section: Grid ของโปรเจคทั้งหมด
 * - Footer
 */

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
                className="h-42 md:h-48 w-auto object-contain drop-shadow-[0_10px_40px_rgba(59,130,246,0.35)] animate-float"
                priority
              />
            </div>
            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight animate-slide-up">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 bg-[length:200%_100%] animate-shimmer drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                Centralized Work Hub for
              </span>{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient">
                Warehouse &amp; Logistics
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light tracking-wide animate-slide-up delay-200">
              Manage inventory, track deliveries, and enable team redundancy.
              <br className="hidden md:block" />
              All-in-one platform for visual operations.
            </p>

            {/* CTA Buttons */}
            <div className="flex w-full flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-slide-up delay-300">
              <a 
                href="#modules" 
                className="group px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/50 text-slate-700 font-medium text-base rounded-full hover:bg-white/80 transition-all duration-300 hover:shadow-md flex items-center gap-2 animate-wiggle"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="px-6 py-3 text-slate-500 font-medium text-base rounded-full hover:text-slate-700 hover:bg-white/40 transition-all duration-300 hover-wiggle">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 bg-[length:200%_100%] animate-shimmer drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                Why Choose BPI AeroPath?
              </span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
              Built for teams who need real-time visibility, seamless tracking,
              and operational redundancy
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1: Visibility */}
            <GlassCard hoverEffect className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Visibility</h3>
              <p className="text-slate-600 leading-relaxed">
                See all work movements in real-time. Track inventory, orders,
                and deliveries from a single dashboard.
              </p>
            </GlassCard>

            {/* Feature 2: Tracking */}
            <GlassCard hoverEffect className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Monitor issues and progress across all departments. Get instant
                alerts and detailed reports.
              </p>
            </GlassCard>

            {/* Feature 3: Redundancy */}
            <GlassCard hoverEffect className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Redundancy</h3>
              <p className="text-slate-600 leading-relaxed">
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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-600 to-slate-800 bg-[length:200%_100%] animate-shimmer drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                Explore Our Modules
              </span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
              Everything you need to manage your warehouse and logistics
              operations
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ProjectCard
              title="Material Control"
              description="Manage inventory, requisitions, and receiving. Track stock levels and automate reorder points."
              icon={Package}
              href="/projects/material-control"
              status="active"
              iconColor="from-blue-500 to-blue-600"
            />

            <ProjectCard
              title="Warehouse Management"
              description="Optimize warehouse operations with location tracking, stock movements, and space utilization."
              icon={Warehouse}
              href="/projects/warehouse"
              status="active"
              iconColor="from-purple-500 to-purple-600"
            />

            <ProjectCard
              title="Smart Packaging"
              description="Intelligent packing plans based on customer specs. Manage pallets, box sizes, and automated lists."
              icon={Boxes}
              href="/projects/packaging"
              status="active"
              iconColor="from-green-500 to-green-600"
            />

            <ProjectCard
              title="Delivery Tracking"
              description="Monitor shipments, delivery status, and logistics in real-time with automated notifications."
              icon={Truck}
              href="/projects/delivery"
              status="active"
              iconColor="from-indigo-500 to-blue-600"
            />

            <ProjectCard
              title="Document Center"
              description="Centralized repository for all documents, reports, and compliance records."
              icon={FileText}
              href="/projects/documents"
              status="beta"
              iconColor="from-amber-500 to-amber-600"
            />

            <ProjectCard
              title="Task Management"
              description="Assign, track, and manage team tasks with priorities and deadlines."
              icon={ListTodo}
              href="/projects/tasks"
              status="beta"
              iconColor="from-cyan-500 to-cyan-600"
            />

            <ProjectCard
              title="Analytics Dashboard"
              description="Comprehensive reports and insights on inventory, operations, and team performance."
              icon={BarChart3}
              href="/projects/analytics"
              status="coming-soon"
              iconColor="from-pink-500 to-pink-600"
            />

            <ProjectCard
              title="Maintenance Log"
              description="Track equipment maintenance, repairs, and service schedules."
              icon={Wrench}
              href="/projects/maintenance"
              status="coming-soon"
              iconColor="from-red-500 to-red-600"
            />

            <ProjectCard
              title="Staff Schedule"
              description="Manage team schedules, shifts, and availability for optimal coverage."
              icon={Users}
              href="/projects/staff"
              status="coming-soon"
              iconColor="from-indigo-500 to-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-300/50 py-10">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Company Info */}
            <div>
              <h3 className="text-slate-800 font-bold text-lg mb-4">
                BPI AeroPath
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Centralized Work Hub for Warehouse & Logistics Management.
                Built for teams who demand excellence.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-slate-800 font-bold text-lg mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/projects"
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    All Projects
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/docs"
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-slate-800 font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/privacy"
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-slate-300/50 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} BPI AeroPath. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
