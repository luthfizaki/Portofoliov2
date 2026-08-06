import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "motion/react";
import { useLenis } from "lenis/react";
import {
  Sparkles,
  Target,
  Box,
  ChevronDown,
} from "lucide-react";
import { DynamicSpotlightPhoto } from "./DynamicSpotlightPhoto";
import { StaggeredText } from "./StaggeredText";
import { DigitalClock } from "./DigitalClock";
import { MagneticLink } from "./MagneticLink";
import { useContent } from "../context/ContentContext";

const defaultHero = {
  role: "UI/UX Designer",
  yearsRange: "2022 - 2026",
  experienceYears: "4+ yrs exp.",
  backgroundBlurUrl: "/luthfi_blur.png",
  backgroundSharpUrl: "/luthfi_sharp.png",
  firstName: "LUTHFI",
  lastName: "ARZAKI",
  tagline: "Designing impactful digital experiences through user-centered thinking",
  taglineHighlight: "impactful",
  sideTexts: [
    { text: "Crafting meaningful\ndigital experiences" },
    { text: "Designing with\npurpose and precision" },
    { text: "Turning ideas into\nimpactful solutions" },
  ],
  scrollIndicatorText: "Scroll to explore",
  ctaText: "View My Work",
  ctaLink: "projects",
};

const defaultNavLinks = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Experience", id: "experience" },
  { label: "Project", id: "projects" },
  { label: "Skill", id: "skills" },
  { label: "Contact", id: "contact" },
];

const NAV_OFFSET = 96;

const renderMultilineText = (text: string) =>
  text.split("\n").map((line, index, lines) => (
    <React.Fragment key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 && <br />}
    </React.Fragment>
  ));

const aboutText = (value: string) => value.split(",")[0]?.trim() || value;

export const HeroSection = () => {
  const { hero: dynamicHero, settings } = useContent();
  const hero = dynamicHero || defaultHero;
  const navLinks = settings?.navLinks?.length ? settings.navLinks : defaultNavLinks;
  const sideTexts = hero.sideTexts?.length ? hero.sideTexts : defaultHero.sideTexts;
  const contactEmail = settings?.personalInfo?.email || "hi@luthfiarzaki.com";
  const availability = settings?.footer?.availability || "Full-time, Freelance projects";
  const [taglineBefore, taglineAfter = ""] = hero.taglineHighlight
    ? hero.tagline.split(hero.taglineHighlight)
    : [hero.tagline, ""];
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out mouse movement for parallax
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  // Background glow moves subtly in opposite direction
  const glowX = useTransform(smoothMouseX, [0, 1], ["5%", "-5%"]);
  const glowY = useTransform(smoothMouseY, [0, 1], ["5%", "-5%"]);

  const [activeSection, setActiveSection] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const handleScroll = () => {
      const sectionTargets = [
        ...navLinks.map((item) => ({ id: item.id, activeId: item.id })),
        { id: "flagship-products", activeId: "projects" },
        { id: "creative-practice", activeId: "projects" },
        { id: "project-archive", activeId: "projects" },
        { id: "skills", activeId: "skills" },
        { id: "how-i-work", activeId: "skills" },
        { id: "capabilities-tools", activeId: "skills" }
      ];
      const scrollPosition = window.scrollY + 250; // offset for triggers

      for (const target of sectionTargets) {
        const el = document.getElementById(target.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(target.activeId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navLinks]);

  const scrollToSection = (id: string) => {
    const targetId = id;
    const el = document.getElementById(targetId);
    if (el) {
      if (lenis) {
        lenis.scrollTo(targetId === "home" ? 0 : el, {
          offset: targetId === "home" ? 0 : -NAV_OFFSET,
          lerp: 0.09,
        });
        return;
      }

      const top =
        targetId === "home"
          ? 0
          : el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Normalize values between 0 and 1
    const x = clientX / innerWidth;
    const y = clientY / innerHeight;

    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div
      id="home"
      className="relative min-h-screen w-full"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Background Photo with Spotlight & Brackets */}
      <DynamicSpotlightPhoto
        blurImageUrl={hero.backgroundBlurUrl}
        sharpImageUrl={hero.backgroundSharpUrl}
      />

      {/* Dynamic Background Glow */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#2B7FFF] rounded-full blur-[150px] opacity-[0.15] mix-blend-screen pointer-events-none z-10"
      />

      <div className="relative z-20 flex flex-col min-h-screen p-8 lg:p-12 max-w-[1600px] mx-auto">
        {typeof document !== "undefined" && createPortal(
          <>
        {/* Top Navigation */}
        <div className="portfolio-floating-nav fixed top-4 left-0 right-0 z-[1000] flex justify-center px-4 sm:px-6 lg:px-12 pointer-events-none">
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="portfolio-main-nav pointer-events-auto flex items-center justify-between w-full max-w-[850px] border border-white/20 rounded-full px-5 py-2 md:px-8 md:py-2.5 backdrop-blur-xl bg-[#020617]/70 md:bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.36)] z-50 select-none animate-shimmer"
          >
            {/* Left Links - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-8 lg:gap-12">
              {navLinks.slice(0, 3).map((item) => (
                <MagneticLink key={item.id} isActive={activeSection === item.id} onClick={() => scrollToSection(item.id)}>{item.label}</MagneticLink>
              ))}
            </div>

            {/* Logo / Control Container */}
            <div className="flex items-center justify-between md:justify-center w-full md:w-auto">
              <div role="button" onClick={() => scrollToSection("home")} className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#0A2F7E] to-[#06122F] flex items-center justify-center shadow-[0_0_20px_rgba(43,127,255,0.25)] border border-white/10 relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain mix-blend-screen p-2"
                />
              </div>
              
              {/* Mobile Hamburger button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex md:hidden w-10 h-10 rounded-full items-center justify-center border border-white/10 bg-white/5 active:scale-90 transition-transform relative z-[100]"
                aria-label="Toggle Menu"
              >
                <div className="flex flex-col gap-[5px] w-5 items-end">
                  <motion.span 
                    animate={isMobileMenuOpen ? { rotate: 45, y: 6.5, width: "20px" } : { rotate: 0, y: 0, width: "20px" }}
                    transition={{ duration: 0.3 }}
                    className="h-[1.5px] bg-white rounded-full origin-center"
                  />
                  <motion.span 
                    animate={isMobileMenuOpen ? { opacity: 0, width: "0px" } : { opacity: 1, width: "15px" }}
                    transition={{ duration: 0.2 }}
                    className="h-[1.5px] bg-white rounded-full"
                  />
                  <motion.span 
                    animate={isMobileMenuOpen ? { rotate: -45, y: -6.5, width: "20px" } : { rotate: 0, y: 0, width: "12px" }}
                    transition={{ duration: 0.3 }}
                    className="h-[1.5px] bg-white rounded-full origin-center"
                  />
                </div>
              </button>
            </div>

            {/* Right Links - Hidden on Mobile */}
            <div className="hidden md:flex items-center gap-8 lg:gap-12">
              {navLinks.slice(3, 6).map((item) => (
                <MagneticLink key={item.id} isActive={activeSection === item.id} onClick={() => scrollToSection(item.id)}>{item.label}</MagneticLink>
              ))}
            </div>
          </motion.nav>
        </div>

        {/* Mobile Overlay Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[990] bg-[#020617]/98 backdrop-blur-3xl flex flex-col justify-between p-8 pt-32 md:hidden"
            >
              {/* Top decorative glows */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2B7FFF]/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute top-1/3 left-0 w-[200px] h-[200px] bg-[#5C32FF]/8 blur-[100px] rounded-full pointer-events-none" />

              {/* Navigation Links inside overlay */}
              <div className="flex flex-col gap-5 relative z-10 pl-2">
                <span className="text-white/20 uppercase font-mono text-[9px] tracking-[0.3em] font-semibold mb-1 block select-none">
                  Navigation Menu
                </span>
                {navLinks.map((item, index) => {
                  const isActive = activeSection === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
                    >
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          scrollToSection(item.id);
                        }}
                        className="group flex items-center gap-4 text-left w-full active:scale-95 transition-transform"
                      >
                        <span className="font-mono text-[10px] text-[#2B7FFF]/60 w-5">0{index + 1}.</span>
                        <span className={`text-2xl sm:text-3xl font-light tracking-wide transition-all ${
                          isActive 
                            ? "text-[#2B7FFF] font-normal translate-x-1" 
                            : "text-[#E0E7F1] hover:text-white"
                        }`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2B7FFF] shadow-[0_0_8px_#2B7FFF]" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer details inside overlay */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="border-t border-white/10 pt-5 flex flex-col gap-4 relative z-10"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-white/30 font-mono text-[9px] uppercase tracking-widest">Current Time</span>
                  <DigitalClock />
                </div>

                <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-white/40 uppercase font-mono text-[8px] tracking-widest text-[#2B7FFF] leading-none">Available for:</span>
                    </div>
                    <p className="text-[10px] font-light text-slate-300 leading-snug">
                      {availability}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-white/30 font-mono text-[8px] uppercase tracking-widest block">Inquiries</span>
                    <a href={`mailto:${contactEmail}`} className="text-[11px] text-[#2B7FFF] font-mono hover:underline">
                      {contactEmail}
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </>,
          document.body,
        )}


        {/* Main Content Area */}
        <main className="flex-1 min-h-0 flex items-center mt-8 relative">
          {/* Scroll Indicator (Left edge) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 1.5, ease: "easeOut" }}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 hidden lg:flex"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
              className="tracking-widest text-xs font-mono text-[#2B7FFF] [writing-mode:vertical-rl] rotate-180 mb-6 uppercase"
            >
              {hero.scrollIndicatorText}
            </motion.div>
            <div className="w-px h-16 bg-[#2B7FFF]/30 relative overflow-hidden">
              <motion.div
                animate={{ top: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute w-full h-1/2 bg-[#2B7FFF]"
              />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#2B7FFF] shadow-[0_0_8px_rgba(43,127,255,0.8)]" />
          </motion.div>

          <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-8 w-full h-full lg:pl-16 relative">
            {/* Left Content (Text) */}
            <div className="col-span-1 lg:col-span-8 flex flex-col justify-center z-10 pt-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                className="flex items-center gap-3 mb-6 relative"
              >
                <div className="w-2 h-2 rounded-full bg-[#2B7FFF] shadow-[0_0_10px_#2B7FFF]" />
                <span className="text-[#2B7FFF] tracking-[0.2em] uppercase font-medium text-sm drop-shadow-md">
                  {hero.role}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                className="flex gap-6 text-[#8B9DBB] font-mono text-sm mb-12 drop-shadow-md"
              >
                <span>{hero.yearsRange}</span>
                <span>{hero.experienceYears}</span>
              </motion.div>

              <div className="flex flex-col gap-4 mb-20 relative">
                <StaggeredText
                  text={hero.firstName}
                  delayOffset={0.2}
                  className="font-display font-bold text-[12vw] lg:text-[9rem] leading-[0.8] tracking-tight uppercase mix-blend-overlay text-white/90 drop-shadow-lg"
                />
                <StaggeredText
                  text={hero.lastName}
                  delayOffset={0.4}
                  className="font-display font-bold text-[12vw] lg:text-[9rem] leading-[0.8] tracking-tight uppercase mix-blend-overlay text-white/90 drop-shadow-lg"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 1.1, ease: "easeOut" }}
                className="flex relative"
              >
                <div className="w-px bg-[#2B7FFF] mr-6 hidden md:block shadow-[0_0_8px_#2B7FFF]" />
                <p className="max-w-md text-[#E0E7F1] text-xl lg:text-2xl font-light leading-snug drop-shadow-md">
                  {taglineBefore}
                  {hero.taglineHighlight && (
                    <span className="shimmer font-normal text-[#2B7FFF]">
                      {hero.taglineHighlight}
                    </span>
                  )}
                  {taglineAfter}
                </p>
              </motion.div>
            </div>

            {/* Right Content (Vertical Text & CTA) */}
            <div className="col-span-1 lg:col-span-3 lg:col-start-9 flex flex-col justify-center items-end lg:items-start text-right lg:text-left pt-12 lg:pt-0 pb-20 lg:pb-0 gap-16 relative z-10 lg:pr-12 xl:pr-24 lg:-translate-y-16 lg:translate-x-16 -translate-y-8 translate-x-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                className="flex flex-col gap-10"
              >
                <div className="flex flex-col gap-2 drop-shadow-md">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#B3C5DF] leading-relaxed max-w-[200px]">
                    {renderMultilineText(sideTexts[0]?.text || defaultHero.sideTexts[0].text)}
                  </span>
                  <div className="w-6 h-px bg-[#2B7FFF]/50" />
                </div>

                <div className="flex flex-col gap-2 drop-shadow-md">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#B3C5DF] leading-relaxed max-w-[200px]">
                    {renderMultilineText(sideTexts[1]?.text || defaultHero.sideTexts[1].text)}
                  </span>
                  <div className="w-8 h-px bg-[#2B7FFF]" />
                </div>

                <div className="flex flex-col gap-2 drop-shadow-md">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#B3C5DF] leading-relaxed max-w-[200px]">
                    {renderMultilineText(sideTexts[2]?.text || defaultHero.sideTexts[2].text)}
                  </span>
                  <div className="w-6 h-px bg-[#2B7FFF]/50" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* MOBILE HERO VIEW */}
          <div className="flex md:hidden flex-col w-full px-2 pt-6 pb-4 gap-7 relative z-30 select-none">
            {/* Status & Work Experience */}
            <div className="flex flex-col gap-1.5 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2B7FFF]/70 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2B7FFF] shadow-[0_0_8px_rgba(43,127,255,0.8)]"></span>
                </span>
                <span className="text-[#2B7FFF] font-mono text-[11px] uppercase tracking-[0.25em] font-semibold">
                  {hero.role}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[#7F94B6]/90 font-mono text-xs mt-0.5">
                <span>{hero.yearsRange}</span>
                <span className="w-1 h-1 rounded-full bg-[#2B7FFF]/50" />
                <span>{hero.experienceYears}</span>
              </div>
            </div>

            {/* Mega Titles: Stacked LUTHFI ARZAKI */}
            <div className="flex flex-col select-none leading-none -mt-1 gap-1">
              <h1 className="font-sans font-black text-[13.5vw] uppercase tracking-[-0.03em] text-white">
                {hero.firstName}
              </h1>
              <h1 className="font-sans font-black text-[13.5vw] uppercase tracking-[-0.03em] text-white -mt-2">
                {hero.lastName}
              </h1>
            </div>

            {/* Description with Vertical Blue bar */}
            <div className="flex items-stretch min-h-[44px]">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="w-[1.5px] bg-[#2B7FFF] mr-4 shrink-0 shadow-[0_0_10px_rgba(43,127,255,0.8)]" 
              />
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="text-slate-200/90 font-light text-[15px] leading-[1.7] max-w-[295px]"
              >
                {taglineBefore}<span className="shimmer font-semibold">{hero.taglineHighlight}</span>{taglineAfter}
              </motion.p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-1">
              {[
                { label: "Experience", value: hero.experienceYears, icon: Sparkles },
                { label: "Focus", value: "Product UX", icon: Target },
                { label: "Available", value: aboutText(availability), icon: Box },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="min-h-[82px] rounded-[16px] border border-white/8 bg-[#020B1A]/55 p-3 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <Icon className="mb-2 h-4 w-4 text-[#2B7FFF]" />
                    <span className="block text-[8px] font-mono uppercase tracking-[0.16em] text-white/35">{item.label}</span>
                    <span className="mt-1 block text-[11px] font-medium leading-snug text-slate-100">{item.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Scroll Down Indicator */}
            <div className="flex flex-col items-center justify-center gap-1 mt-6 w-full select-none">
              {/* Glowing ring */}
              <div className="relative w-8 h-8 rounded-full border border-[#2B7FFF]/25 flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-full border border-dashed border-[#2B7FFF]/15 animate-spin-slow" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#2B7FFF] shadow-[0_0_8px_#2B7FFF] animate-ping" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#2B7FFF]" />
              </div>
              
              <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-[#8B9DBB]/50 font-medium mt-1">
                {hero.scrollIndicatorText}
              </span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-[#2B7FFF]/60 mt-0.5"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </div>
          </div>

          {/* Bottom Right Clock & Barcode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.3, ease: "easeOut" }}
            className="hidden md:flex absolute bottom-0 right-0 flex-col items-end gap-2 pr-8 pb-8 lg:pr-0 lg:pb-0 z-20"
          >
            <DigitalClock />
            <div className="flex gap-px opacity-30 mt-1 justify-end h-6 w-32 items-end">
              {/* Optimized Barcode: Pre-calculated static pattern */}
              {Array.from({ length: 30 }).map((_, i) => {
                const staticHeight = [
                  40, 70, 30, 90, 50, 80, 20, 60, 45, 75, 35, 85, 55, 65, 25,
                  95, 40, 70, 30, 90, 55, 85, 45, 75, 25, 95, 35, 65, 20, 80,
                ][i % 30];
                return (
                  <div
                    key={i}
                    className="w-0.5 bg-[#B3C5DF]"
                    style={{ height: `${staticHeight}%` }}
                  />
                );
              })}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
