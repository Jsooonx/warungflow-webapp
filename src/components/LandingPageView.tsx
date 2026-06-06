import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Lenis from 'lenis';
import { RollingText } from './RollingText';
import dashboardImg from '../assets/dashboard.png';
import whatsappFollowUpImg from '../assets/dashboard_whatsappfollowup.png';
import ordersImg from '../assets/orders.png';
import templatesImg from '../assets/whatsapptemplate.png';
import customersImg from '../assets/customers.png';
import bottleneckImg from '../assets/dashboard_bottleneck.png';
import orderFormImg from '../assets/orderform.png';
import todaysWorkImg from '../assets/dashboard_todayswork.png';
import backgroundHeroImg from '../assets/background_hero.png';

interface LandingPageViewProps {
  onGetStartedClick: () => void;
  onLoginClick: () => void;
}

const NavRollingText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RollingText compact>{children}</RollingText>
);

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onGetStartedClick, onLoginClick }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const duration = 5000; // 5 seconds

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutQuart
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prevTab) => (prevTab + 1) % 4);
    }, duration);

    return () => clearInterval(timer);
  }, [activeTab]);

  // Scroll reveal Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = e.clientY - rect.top;
    const percentY = (y / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${percentY}%`);
  };

  const dict = {
    id: {
      features: 'Fitur',
      pricing: 'Harga',
      login: 'Masuk',
      startFree: 'Daftar Beta',
      new: 'Baru',
      releaseAnnounce: 'Pengumuman Rilis',
      heroTitle: 'Platform untuk Membantu Penjual di Luar E-commerce',
      heroSubtitle: 'Hindari potongan biaya admin e-commerce yang semakin mencekik (rata-rata 4% hingga 10%+ per transaksi). Kelola pesanan secara mandiri, praktis, dan simpan 100% keuntungan Anda.',
      betaQuota: '100 pendaftar pertama akan kami review. Akses beta diberikan bertahap mulai dari Batch 1.',
      getStarted: 'Daftar Beta Gratis',
      learnMore: 'Pelajari lebih lanjut',
      featuresTitle: 'Fitur yang dirancang untuk memperkuat alur kerja Anda',
      featuresSubtitle: 'Tetap terdepan dengan alat yang memprioritaskan kebutuhan Anda, mengintegrasikan wawasan dan efisiensi ke dalam satu platform yang kuat.',
      card1Title: 'Analitik Real-time',
      card1Desc: 'Ambil keputusan yang lebih cerdas dan terinformasi dengan wawasan data yang kuat dan dapat ditindaklanjuti, dirancang untuk memberdayakan bisnis Anda dengan alat yang dibutuhkan untuk mendorong pertumbuhan, efisiensi, dan kesuksesan.',
      card2Title: 'Follow-up Pelanggan',
      card2Desc: 'Buka chat WhatsApp pembeli secara instan dan kirim pesan konfirmasi/follow-up otomatis untuk menghemat waktu respon tim Anda.',
      card3Title: 'Spreadsheet Log',
      card3Desc: 'Kelola data pesanan pembeli dalam format log grid spreadsheet yang padat, responsif, dan mudah difilter berdasarkan status.',
      card4Title: 'Template Pesan Fleksibel',
      card4Desc: 'Gunakan template notifikasi terpadu (Unpaid, Paid, Shipping resi) dengan sistem substitusi nama dan total harga otomatis.',
      card5Title: 'Manajemen Pelanggan',
      card5Desc: 'Lacak total belanja pelanggan, frekuensi order, dan kelola database pelanggan yang terintegrasi secara otomatis dari data pesanan.',
      exploreTitle: 'Jelajahi fitur paling canggih kami',
      exploreSubtitle: 'Setiap fitur dibuat untuk memberikan integrasi dan performa yang mulus, memastikan tingkat fungsionalitas dan efisiensi yang tinggi.',
      pricingTitle: 'Pilih paket yang tepat untuk Anda.',
      pricingSubtitle: 'Tanpa biaya tersembunyi. Tanpa stres. Dibuat dengan kemudahan dan transparansi.',
      freePlan: 'Gratis',
      freePlanDesc: 'Mulai secara gratis dengan fitur dan sumber daya penting.',
      freePrice: 'Rp 0',
      freePeriod: '/bln',
      freeForEveryone: 'Gratis untuk semua orang',
      premiumPlan: 'Premium',
      premiumPlanDesc: 'Untuk bisnis yang sedang berkembang, perusahaan yang berekspansi, dan startup yang ambisius.',
      premiumPrice: 'Rp 50.000',
      premiumPeriod: '/bln',
      billedMonthly: 'Ditagih bulanan',
      popular: 'Populer',
      featureAnalytics: 'Analitik lanjutan',
      featureBranding: 'Branding kustom',
      featureIntegrations: 'Integrasi penyimpanan',
      featureAi: 'Asisten AI',
      featureReports: 'Laporan otomatis',
      footerTitle: 'Amankan kuota Anda dan bergabunglah dalam program eksklusif Beta Warungify sekarang',
      footerCta: 'Daftar Beta Warungify',
      footerCopyright: '© 2026 Warungify. Dibuat dengan cinta untuk penjual online modern.',
      howItWorks: 'Cara Kerja',
      howItWorksTitle: '4 Langkah Mudah Kelola Pesanan',
      howItWorksSubtitle: 'Dari input pesanan hingga terkirim ke pelanggan, semua terintegrasi secara otomatis.',
      step1Title: '1. Buat & Catat Pesanan Baru',
      step1Desc: 'Gunakan form pesanan cepat yang dioptimalkan untuk meminimalkan input manual. Data langsung terformat rapi.',
      step2Title: '2. Pantau Melalui Log Spreadsheet',
      step2Desc: 'Semua pesanan masuk ke dalam log grid spreadsheet yang padat. Perbarui status pembayaran dan pengemasan secara instan.',
      step3Title: '3. Kirim Tagihan & Notifikasi WhatsApp',
      step3Desc: 'Kirim pesan follow-up pembayaran atau resi pengiriman menggunakan template dinamis dengan variabel otomatis sekali klik.',
      step4Title: '4. Evaluasi & Selesaikan Hambatan',
      step4Desc: 'Deteksi pesanan tertunda atau hambatan di bagian packing secara otomatis untuk diselesaikan hari ini.'
    },
    en: {
      features: 'Features',
      pricing: 'Pricing',
      login: 'Login',
      startFree: 'Join Beta',
      new: 'New',
      releaseAnnounce: 'Release Announcement',
      heroTitle: 'Platform for Sellers Selling Outside of E-commerce',
      heroSubtitle: 'Avoid high e-commerce admin fees (averaging 4% to 10%+ per transaction). Manage your orders independently, practically, and keep 100% of your profits.',
      betaQuota: 'The first 100 applicants will be reviewed. Beta access opens gradually starting from Batch 1.',
      getStarted: 'Join Free Beta',
      learnMore: 'Learn more',
      featuresTitle: 'Features designed to empower your workflow',
      featuresSubtitle: 'Stay ahead with tools that prioritize your needs, integrating insights and efficiency into one powerful platform.',
      card1Title: 'Real-time Analytics',
      card1Desc: 'Make smarter, more informed decisions with powerful and actionable data insights, designed to empower your business with the tools needed to drive growth, efficiency, and success.',
      card2Title: 'Customer Follow-up',
      card2Desc: 'Instantly open buyer WhatsApp chat and send automatic confirmation/follow-up messages to save your team\'s response time.',
      card3Title: 'Spreadsheet Logs',
      card3Desc: 'Manage buyer order data in a compact, responsive spreadsheet log grid format that is easily filtered by status.',
      card4Title: 'Flexible Message Templates',
      card4Desc: 'Use integrated notification templates (Unpaid, Paid, Shipping receipt) with automatic name and total price substitution system.',
      card5Title: 'Customer Management',
      card5Desc: 'Track customer total spending, order frequency, and manage customer databases integrated automatically from order data.',
      exploreTitle: 'Explore our most powerful features',
      exploreSubtitle: 'Each feature is crafted to provide seamless integration and performance, ensuring a high level of functionality and efficiency.',
      pricingTitle: 'Choose a plan that\'s right for you.',
      pricingSubtitle: 'No hidden fees. No stress. Built with ease and transparency.',
      freePlan: 'Free',
      freePlanDesc: 'Get started for free with essential features and resources.',
      freePrice: 'Rp 0',
      freePeriod: '/mo',
      freeForEveryone: 'Free for everyone',
      premiumPlan: 'Premium',
      premiumPlanDesc: 'For growing businesses, expanding companies, and ambitious startups.',
      premiumPrice: 'Rp 50,000',
      premiumPeriod: '/mo',
      billedMonthly: 'Billed monthly',
      popular: 'Popular',
      featureAnalytics: 'Advanced analytics',
      featureBranding: 'Custom branding',
      featureIntegrations: 'Storage integrations',
      featureAi: 'AI assistant',
      featureReports: 'Automated reports',
      footerTitle: 'Secure your spot and join the exclusive Warungify Beta program today',
      footerCta: 'Join Warungify Beta',
      footerCopyright: '© 2026 Warungify. Built with love for modern online sellers.',
      howItWorks: 'How It Works',
      howItWorksTitle: '4 Easy Steps to Manage Your Orders',
      howItWorksSubtitle: 'From order input to shipping, everything is seamlessly integrated.',
      step1Title: '1. Create & Record New Orders',
      step1Desc: 'Use quick order forms optimized to minimize manual inputs. Data is formatted instantly.',
      step2Title: '2. Monitor via Spreadsheet Log',
      step2Desc: 'All orders flow into a dense spreadsheet grid. Update payment and packing status instantly.',
      step3Title: '3. Send Bills & WhatsApp Notifications',
      step3Desc: 'Send payment follow-up or shipping receipts using dynamic templates with automatic variables in one click.',
      step4Title: '4. Evaluate & Resolve Bottlenecks',
      step4Desc: 'Automatically detect delayed orders or packing bottlenecks to get them resolved today.'
    }
  };

  const t = dict[lang];

  const handleAnchorScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const tabs = [
    {
      title: lang === 'id' ? 'Deteksi Hambatan Operasional' : 'Detect Operational Bottlenecks',
      desc: lang === 'id' ? 'Cari pesanan yang menumpuk di bagian packing atau pembayaran tertunda yang telah melewati batas waktu secara otomatis untuk segera diselesaikan.' : 'Find orders piling up in packing or pending payments that have exceeded the time limit automatically to be resolved immediately.',
      image: bottleneckImg
    },
    {
      title: lang === 'id' ? 'Follow-up WhatsApp Cepat' : 'Fast WhatsApp Follow-up',
      desc: lang === 'id' ? 'Kirim notifikasi atau tagihan pembayaran lengkap dengan variabel nama pembeli ke WhatsApp secara instan dengan sekali klik langsung dari dasbor.' : 'Send notifications or payment bills complete with buyer name variables to WhatsApp instantly with a single click directly from the dashboard.',
      image: whatsappFollowUpImg
    },
    {
      title: lang === 'id' ? 'Spreadsheet Log Workspace' : 'Spreadsheet Log Workspace',
      desc: lang === 'id' ? 'Kelola data pesanan pembeli dalam format log grid spreadsheet yang padat, responsif, dan mudah diperbarui statusnya lewat status dropdown.' : 'Manage buyer order data in a compact, responsive spreadsheet log grid format that is easily updated via status dropdowns.',
      image: ordersImg
    },
    {
      title: lang === 'id' ? 'Database Pelanggan Otomatis' : 'Automatic Customer Database',
      desc: lang === 'id' ? 'Lacak riwayat belanja pelanggan, total pengeluaran, frekuensi order secara otomatis dari data order logs terpadu.' : 'Track customer shopping history, total spending, and order frequency automatically from integrated order logs data.',
      image: customersImg
    }
  ];

  return (
    <div className="min-h-screen w-full bg-white font-sans text-slate-900 select-none overflow-x-hidden">
      {/* Header / Dynamic Island Floating Navbar */}
      <header 
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
        className={`hero-nav-island fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between overflow-hidden bg-neutral-950/95 backdrop-blur-md border border-neutral-800/80 px-3 py-2 rounded-2xl shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isNavHovered ? 'w-[520px] sm:w-[560px]' : 'w-[180px]'
        }`}
      >
        {/* Logo container */}
        <div className="hero-nav-logo flex items-center pl-0.5 flex-shrink-0">
          <img 
            src="/Logo-warungify.png" 
            alt="Warungify Logo" 
            className="w-8 h-8 object-contain rounded-lg" 
          />
        </div>

        {/* Navigation links - hidden when not hovered, shown with a transition when hovered */}
        <nav className={`flex items-center justify-center gap-5 text-xs font-bold text-neutral-400 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isNavHovered ? 'max-w-[380px] opacity-100 mx-2 scale-100' : 'max-w-0 opacity-0 mx-0 scale-90 pointer-events-none'
        }`}>
          <a href="#features" onClick={(e) => handleAnchorScroll(e, 'features')} className="group hover:text-white transition-colors py-1 whitespace-nowrap">
            <NavRollingText>{t.features}</NavRollingText>
          </a>
          <a href="#how-it-works" onClick={(e) => handleAnchorScroll(e, 'how-it-works')} className="group hover:text-white transition-colors py-1 whitespace-nowrap">
            <NavRollingText>{t.howItWorks}</NavRollingText>
          </a>
          <a href="#pricing" onClick={(e) => handleAnchorScroll(e, 'pricing')} className="group hover:text-white transition-colors py-1 whitespace-nowrap">
            <NavRollingText>{t.pricing}</NavRollingText>
          </a>
          <button
            type="button"
            onClick={onLoginClick}
            className="group hover:text-white transition-colors py-1 whitespace-nowrap cursor-pointer"
          >
            <NavRollingText>{t.login}</NavRollingText>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setLang(lang === 'id' ? 'en' : 'id');
            }} 
            className="group text-neutral-500 hover:text-white transition-colors px-1.5 py-0.5 rounded border border-neutral-800 text-[10px] uppercase font-mono tracking-tight cursor-pointer whitespace-nowrap"
          >
            <RollingText compact>{lang}</RollingText>
          </button>
        </nav>

        {/* Action Button */}
        <div className="hero-nav-content flex-shrink-0">
          <button 
            onClick={onGetStartedClick}
            className="group h-8 px-4 rounded-xl border border-transparent bg-white hover:bg-neutral-950 text-neutral-950 hover:text-white text-xs font-extrabold transition-all duration-500 cursor-pointer shadow-sm whitespace-nowrap"
          >
            <RollingText>{t.startFree}</RollingText>
          </button>
        </div>
      </header>

      {/* Hero Section Background Wrapper (Boxed layout) */}
      <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div 
          className="w-full bg-cover bg-center bg-no-repeat rounded-[2rem] sm:rounded-[3rem] border border-slate-200/50 shadow-2xl overflow-hidden"
          style={{ backgroundImage: `url(${backgroundHeroImg})` }}
        >
        {/* Hero Section */}
        <section className="pt-16 pb-16 px-6 text-center space-y-8 max-w-4xl mx-auto">
          {/* Announce Badge */}
          <div className="hero-entry hero-entry-1 hero-badge-shimmer inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100/80 text-[10px] font-semibold text-slate-600">
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[8px] uppercase tracking-wide">{t.new}</span>
            {t.releaseAnnounce}
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-4">
            <h1 className="hero-entry hero-entry-2 text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-2xl mx-auto">
              {t.heroTitle}
            </h1>
            <p className="hero-entry hero-entry-3 text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
              {t.heroSubtitle}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="hero-entry hero-entry-4 flex items-center justify-center gap-3">
            <button 
              onClick={onGetStartedClick}
              className="group h-10 px-6 rounded-lg border border-transparent bg-slate-950 hover:bg-white text-white hover:text-slate-950 text-xs font-bold flex items-center gap-2 transition-all duration-500 shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <RollingText>{t.getStarted}</RollingText>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-1" />
            </button>
            <a 
              href="#features"
              onClick={(e) => handleAnchorScroll(e, 'features')}
              className="group h-10 px-6 rounded-lg border border-transparent bg-white hover:bg-slate-950 text-slate-700 hover:text-white text-xs font-bold flex items-center justify-center transition-all duration-500 cursor-pointer shadow-sm"
            >
              <RollingText>{t.learnMore}</RollingText>
            </a>
          </div>
          <p className="hero-entry hero-entry-5 text-[11px] font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
            {t.betaQuota}
          </p>
        </section>

        {/* Showcase Image Preview */}
        <section className="px-6 sm:px-12 max-w-6xl mx-auto pb-24">
          <div className="hero-showcase-rise">
            <div className="hero-showcase-float relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden p-2 sm:p-3">
              <img 
                src={dashboardImg} 
                alt="Warungify Dashboard Preview" 
                className="w-full h-auto object-cover rounded-xl border border-slate-100"
              />
            </div>
          </div>
        </section>
      </div>
    </div>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-slate-50/50 border-t border-slate-100 relative overflow-hidden">
        {/* Subtle mesh background accent */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-12 relative z-10">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">{t.features}</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              {t.featuresTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.featuresSubtitle}
            </p>
          </div>

          {/* Grid Layout matching reference image */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            
            {/* 1. Large Analytics Card (col-span-4) */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ transitionDelay: '0ms' }}
              className="reveal-on-scroll bento-feature-card md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs group overflow-hidden relative"
            >
              <div className="bento-glow-bg" />
              <div className="h-64 rounded-xl bg-slate-50/50 border border-slate-100/80 overflow-hidden relative flex items-center justify-center p-2 mb-6 z-10">
                <img 
                  src={dashboardImg} 
                  alt="Dashboard Analytics" 
                  className="w-full h-full object-cover object-[center_10%] rounded-lg border border-slate-200/50 shadow-xs transition-all duration-700 group-hover:scale-[1.03] group-hover:-translate-y-1"
                />
                {/* Floating Micro-interaction Widget */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/60 p-2.5 rounded-xl shadow-lg flex items-center gap-3 animate-float-1 group-hover:translate-y-[-6px] group-hover:translate-x-[-4px] transition-transform duration-500 z-20">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="dot-pulse" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 flex flex-col">
                    <span className="text-slate-400 font-semibold leading-tight">Konversi</span>
                    <span className="text-emerald-600 font-extrabold leading-none">+24.8% hari ini</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wider">
                  Analitik Real-time
                </span>
                <h3 className="text-sm font-bold text-slate-900">{t.card1Title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.card1Desc}
                </p>
              </div>
            </div>

            {/* 2. Small Follow-up Card (col-span-2) */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ transitionDelay: '100ms' }}
              className="reveal-on-scroll bento-feature-card md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs group overflow-hidden relative"
            >
              <div className="bento-glow-bg" />
              <div className="h-64 rounded-xl bg-slate-50/50 border border-slate-100/80 overflow-hidden relative flex items-center justify-center p-2 mb-6 z-10">
                <img 
                  src={whatsappFollowUpImg} 
                  alt="WhatsApp Follow up" 
                  className="w-full h-full object-cover object-[70%_center] rounded-lg border border-slate-200/50 shadow-xs transition-all duration-700 group-hover:scale-[1.03] group-hover:-translate-y-1"
                />
                {/* Floating WhatsApp Message Pop */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md border border-slate-200/60 p-2.5 rounded-xl shadow-lg flex items-center gap-2.5 animate-float-2 group-hover:translate-y-[-8px] transition-transform duration-500 z-20">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-extrabold">WA</div>
                  <div className="text-[9px] font-bold text-slate-800 flex flex-col">
                    <span className="text-slate-400 font-semibold leading-tight">Ke Pelanggan</span>
                    <span className="text-slate-900 font-extrabold leading-none">Follow-up Terkirim! ✓✓</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 text-[9px] font-extrabold uppercase tracking-wider">
                  WhatsApp Follow-up
                </span>
                <h3 className="text-sm font-bold text-slate-900">{t.card2Title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.card2Desc}
                </p>
              </div>
            </div>

            {/* 3. Small Log Card (col-span-2) */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ transitionDelay: '150ms' }}
              className="reveal-on-scroll bento-feature-card md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs group overflow-hidden relative"
            >
              <div className="bento-glow-bg" />
              <div className="h-48 rounded-xl bg-slate-50/50 border border-slate-100/80 overflow-hidden relative flex items-center justify-center p-2 mb-6 z-10">
                <img 
                  src={ordersImg} 
                  alt="Order Logs Table" 
                  className="w-full h-full object-cover object-[35%_center] rounded-lg border border-slate-200/50 shadow-xs transition-all duration-700 group-hover:scale-[1.03] group-hover:-translate-y-1"
                />
                {/* Floating Status Dropdown Widget */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/60 px-2 py-1.5 rounded-lg shadow-lg flex items-center gap-2 animate-float-1 group-hover:translate-x-[-4px] transition-transform duration-500 z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-[9px] font-extrabold text-slate-700">Status: Packing</span>
                </div>
              </div>
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[9px] font-extrabold uppercase tracking-wider">
                  Spreadsheet Log
                </span>
                <h3 className="text-sm font-bold text-slate-900">{t.card3Title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.card3Desc}
                </p>
              </div>
            </div>

            {/* 4. Small Template Card (col-span-2) */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ transitionDelay: '200ms' }}
              className="reveal-on-scroll bento-feature-card md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs group overflow-hidden relative"
            >
              <div className="bento-glow-bg" />
              <div className="h-48 rounded-xl bg-slate-50/50 border border-slate-100/80 overflow-hidden relative flex items-center justify-center p-2 mb-6 z-10">
                <img 
                  src={templatesImg} 
                  alt="WhatsApp Templates" 
                  className="w-full h-full object-cover object-[center_35%] rounded-lg border border-slate-200/50 shadow-xs transition-all duration-700 group-hover:scale-[1.03] group-hover:-translate-y-1"
                />
                {/* Floating Variable Tags */}
                <div className="absolute bottom-4 right-4 flex gap-1.5 animate-float-2 z-20">
                  <span className="bg-amber-100/90 text-amber-800 border border-amber-200/60 text-[8px] font-extrabold px-1.5 py-0.5 rounded">{`{nama}`}</span>
                  <span className="bg-slate-900/90 text-white border border-slate-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded">{`{total}`}</span>
                </div>
              </div>
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase tracking-wider">
                  Template Fleksibel
                </span>
                <h3 className="text-sm font-bold text-slate-900">{t.card4Title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.card4Desc}
                </p>
              </div>
            </div>

            {/* 5. Small Customer Card (col-span-2) */}
            <div 
              onMouseMove={handleCardMouseMove}
              style={{ transitionDelay: '250ms' }}
              className="reveal-on-scroll bento-feature-card md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs group overflow-hidden relative"
            >
              <div className="bento-glow-bg" />
              <div className="h-48 rounded-xl bg-slate-50/50 border border-slate-100/80 overflow-hidden relative flex items-center justify-center p-2 mb-6 z-10">
                <img 
                  src={customersImg} 
                  alt="Customer Management" 
                  className="w-full h-full object-cover object-[25%_center] rounded-lg border border-slate-200/50 shadow-xs transition-all duration-700 group-hover:scale-[1.03] group-hover:-translate-y-1"
                />
                {/* Floating VIP Tag */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200/60 px-2 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-float-1 group-hover:translate-y-[-4px] transition-transform duration-500 z-20">
                  <span className="text-[10px]">⭐</span>
                  <span className="text-[9px] font-extrabold text-purple-700">Pelanggan VIP</span>
                </div>
              </div>
              <div className="space-y-2 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-extrabold uppercase tracking-wider">
                  Manajemen Pelanggan
                </span>
                <h3 className="text-sm font-bold text-slate-900">{t.card5Title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.card5Desc}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Explore tab showcase section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">{t.features}</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              {t.exploreTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.exploreSubtitle}
            </p>
          </div>

          {/* Interactive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16 items-center">
            
            {/* Left side: Animated tabs list */}
            <div className="explore-tabs-list lg:col-span-5 space-y-6">
              {tabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <div 
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`explore-tab-item group cursor-pointer block select-none text-left transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ '--explore-tab-delay': `${idx * 70}ms` } as React.CSSProperties}
                  >
                    <div className={`space-y-2 ${isActive ? 'explore-tab-active-content' : ''}`}>
                      <h3 className={`text-sm font-bold transition-all duration-300 ${
                        isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                      } group-hover:translate-x-1`}>
                        {tab.title}
                      </h3>
                      {isActive && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {tab.desc}
                        </p>
                      )}
                    </div>
                    
                    {/* Progress indicator bar */}
                    <div className="w-full h-[2px] bg-slate-100 relative mt-4 overflow-hidden">
                      {isActive && (
                        <div 
                          key={`explore-progress-${activeTab}`}
                          className="explore-tab-progress absolute top-0 left-0 h-full w-full"
                          style={{ '--explore-duration': `${duration}ms` } as React.CSSProperties}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side: Product preview */}
            <div className="explore-preview-stage lg:col-span-7 bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-10 flex items-center justify-center min-h-[440px] shadow-xs">
              <div className="explore-preview-float w-full max-w-lg">
                <div
                  key={`explore-preview-${activeTab}`}
                  className="explore-preview-card explore-preview-sheen relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden p-2 w-full"
                >
                  <img 
                    src={tabs[activeTab].image} 
                    alt={tabs[activeTab].title}
                    className="explore-preview-image w-full h-auto object-cover rounded-xl border border-slate-100"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-20">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">{t.howItWorks}</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              {t.howItWorksTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.howItWorksSubtitle}
            </p>
          </div>

          {/* Steps list */}
          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">{t.step1Title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {t.step1Desc}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100/60 rounded-3xl p-4 sm:p-6 shadow-xs">
                <img src={orderFormImg} alt={t.step1Title} className="w-full h-auto object-cover rounded-xl border border-slate-200 shadow-xs" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="bg-slate-50 border border-slate-100/60 rounded-3xl p-4 sm:p-6 shadow-xs lg:order-2">
                <img src={ordersImg} alt={t.step2Title} className="w-full h-auto object-cover rounded-xl border border-slate-200 shadow-xs" />
              </div>
              <div className="space-y-4 lg:order-1">
                <h3 className="text-xl font-bold text-slate-900">{t.step2Title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {t.step2Desc}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">{t.step3Title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {t.step3Desc}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100/60 rounded-3xl p-4 sm:p-6 shadow-xs">
                <img src={templatesImg} alt={t.step3Title} className="w-full h-auto object-cover rounded-xl border border-slate-200 shadow-xs" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="bg-slate-50 border border-slate-100/60 rounded-3xl p-4 sm:p-6 shadow-xs lg:order-2">
                <img src={todaysWorkImg} alt={t.step4Title} className="w-full h-auto object-cover rounded-xl border border-slate-200 shadow-xs" />
              </div>
              <div className="space-y-4 lg:order-1">
                <h3 className="text-xl font-bold text-slate-900">{t.step4Title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {t.step4Desc}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">{t.pricing}</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              {t.pricingTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t.pricingSubtitle}
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-6">
            
            {/* 1. Free Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">{t.freePlan}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.freePlanDesc}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.freePrice}</span>
                  <span className="text-xs text-slate-400 font-bold">{t.freePeriod}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.freeForEveryone}</p>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureAnalytics}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureBranding}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureIntegrations}
                  </div>
                </div>
              </div>
              <button 
                onClick={onGetStartedClick}
                className="group mt-8 w-full h-10 rounded-xl border border-transparent bg-white hover:bg-slate-950 text-slate-800 hover:text-white text-xs font-bold transition-all duration-500 shadow-xs cursor-pointer"
              >
                <RollingText>{t.getStarted}</RollingText>
              </button>
            </div>

            {/* 2. Premium Card (Popular) */}
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 flex flex-col justify-between shadow-md relative scale-100 md:scale-[1.03]">
              <span className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-extrabold text-amber-800 tracking-wider uppercase">
                {t.popular}
              </span>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">{t.premiumPlan}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.premiumPlanDesc}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t.premiumPrice}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{t.premiumPeriod}</span>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    {t.billedMonthly}
                  </p>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureAnalytics}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureBranding}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureIntegrations}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureAi}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 font-bold">✓</span> {t.featureReports}
                  </div>
                </div>
              </div>
              <button 
                onClick={onGetStartedClick}
                className="group mt-8 w-full h-10 rounded-xl border border-transparent bg-slate-950 hover:bg-white text-white hover:text-slate-950 text-xs font-bold transition-all duration-500 shadow-md shadow-slate-900/10 cursor-pointer"
              >
                <RollingText>{t.getStarted}</RollingText>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Rebranded Footer */}
      <footer className="bg-slate-50 border-t border-slate-200/60 py-10 px-6 sm:px-12 md:px-20 text-left">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Call-to-Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200/60 gap-6">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight max-w-lg">
              {t.footerTitle}
            </h3>
            <button 
              onClick={onGetStartedClick}
              className="group h-10 px-5 rounded-xl border border-transparent bg-slate-950 hover:bg-white text-white hover:text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start md:self-auto shadow-sm shadow-slate-950/10 transition-all duration-500"
            >
              <RollingText>{t.footerCta}</RollingText>
            </button>
          </div>

          {/* Bottom Copyright & Socials */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-3">
              <img 
                src="/Logo-warungify.png" 
                alt="Warungify Logo" 
                className="w-6 h-6 object-contain rounded-md" 
              />
              <span className="text-[11px] text-slate-500">
                {t.footerCopyright}
              </span>
            </div>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4 text-slate-400">
              <a href="#instagram" aria-label="Instagram" className="hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn" className="hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#website" aria-label="Website" className="hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </a>
              <a href="#email" aria-label="Email" className="hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};
