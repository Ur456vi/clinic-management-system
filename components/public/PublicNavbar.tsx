"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, Instagram, Facebook, Youtube } from "lucide-react";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Men's Hormonal", href: "/services/mens-hormonal-andropause-care" },
  { label: "Female Hormonal", href: "/services/perimenopause-menopause-care" },
  { label: "Metabolic Health", href: "/services/metabolic-health-body-composition" },
  { label: "Regenerative Health", href: "/services/brain-mitochondrial-restorative-care" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  ];

export default function PublicNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

  return (
        <header className="w-full sticky top-0 z-50">
              <div className="bg-white border-b border-[#E8E0D0] px-6 lg:px-12 py-3 flex items-center justify-between">
                      <Link href="/" className="tracking-[0.2em] text-sm font-medium text-[#8B7355] uppercase">
                                Dr. Yuvraaj Singh, M.D.
                      </Link>Link>
                      <div className="hidden md:flex items-center gap-5">
                                <a href="tel:+919876543210" className="flex items-center gap-2 text-sm text-[#5A4A3A] hover:text-[#7B1B2A] transition-colors">
                                            <Phone size={15} /><span>(845) 847-3985</span>span>
                                </a>a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full bg-[#7B1B2A] flex items-center justify-center hover:bg-[#9B2535] transition-colors">
                                            <Instagram size={14} color="white" />
                                </a>a>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-[#7B1B2A] flex items-center justify-center hover:bg-[#9B2535] transition-colors">
                                            <Facebook size={14} color="white" />
                                </a>a>
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full bg-[#7B1B2A] flex items-center justify-center hover:bg-[#9B2535] transition-colors">
                                            <Youtube size={14} color="white" />
                                </a>a>
                                <Link href="/contact" className="ml-2 bg-[#7B1B2A] text-white text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded hover:bg-[#9B2535] transition-colors">
                                            Book Appointment
                                </Link>Link>
                      </div>div>
                      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[#5A4A3A]" aria-label="Toggle menu">
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                      </button>button>
              </div>div>
              <nav className="bg-[#7B1B2A] px-6 lg:px-12 hidden md:flex items-center">
                {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="text-white text-sm font-medium px-4 py-3 hover:bg-[#9B2535] transition-colors whitespace-nowrap">
                      {link.label}
                    </Link>Link>
                  ))}
              </nav>nav>
          {mobileOpen && (
                  <div className="md:hidden bg-white border-b border-[#E8E0D0] shadow-lg">
                            <nav className="flex flex-col">
                              {navLinks.map((link) => (
                                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="px-6 py-3 text-sm font-medium text-[#5A4A3A] border-b border-[#F0EBE3] hover:bg-[#FAF8F3] hover:text-[#7B1B2A] transition-colors">
                                    {link.label}
                                  </Link>Link>
                                ))}
                                        <div className="px-6 pb-4 pt-3">
                                                      <Link href="/contact" onClick={() => setMobileOpen(false)} className="block w-full text-center bg-[#7B1B2A] text-white text-sm font-semibold uppercase px-4 py-3 rounded hover:bg-[#9B2535] transition-colors">
                                                                      Book Appointment
                                                      </Link>Link>
                                        </div>div>
                            </nav>nav>
                  </div>div>
              )}
        </header>header>
      );
}</header>
