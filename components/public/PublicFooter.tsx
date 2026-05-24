import Link from "next/link";
import { Instagram, Facebook, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";

const serviceLinks = [
  { label: "Perimenopause & Menopause Care", href: "/services/perimenopause-menopause-care" },
  { label: "Men's Hormonal & Andropause Care", href: "/services/mens-hormonal-andropause-care" },
  { label: "Metabolic Health & Body Composition", href: "/services/metabolic-health-body-composition" },
  { label: "Brain & Mitochondrial Restorative Care", href: "/services/brain-mitochondrial-restorative-care" },
  { label: "Physical Restoration Programs", href: "/services/physical-restoration-programs" },
  { label: "Aesthetic & External Restoration", href: "/services/aesthetic-external-restoration" },
  ];

export default function PublicFooter() {
    return (
          <footer className="bg-[#2C1A0E] text-[#D4C5B0]">
            {/* Main footer content */}
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {/* Brand column */}
                        <div className="lg:col-span-1">
                                  <div className="tracking-[0.2em] text-sm font-medium text-[#C9A96E] uppercase mb-3">
                                              Dr. Yuvraaj Singh, M.D.
                                  </div>div>
                                  <p className="text-xs leading-relaxed text-[#A89880] mb-6">
                                              Institute of Precision Metabolic &amp; Hormonal Health. An advanced systems-based clinical institute focused on hormonal, metabolic and regenerative health.
                                  </p>p>
                                  <div className="flex items-center gap-3">
                                              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full border border-[#5A4A3A] flex items-center justify-center hover:bg-[#7B1B2A] hover:border-[#7B1B2A] transition-colors">
                                                            <Instagram size={15} />
                                              </a>a>
                                              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full border border-[#5A4A3A] flex items-center justify-center hover:bg-[#7B1B2A] hover:border-[#7B1B2A] transition-colors">
                                                            <Facebook size={15} />
                                              </a>a>
                                              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full border border-[#5A4A3A] flex items-center justify-center hover:bg-[#7B1B2A] hover:border-[#7B1B2A] transition-colors">
                                                            <Youtube size={15} />
                                              </a>a>
                                  </div>div>
                        </div>div>
                
                  {/* Services */}
                        <div>
                                  <h3 className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-5">Our Services</h3>h3>
                                  <ul className="space-y-2">
                                    {serviceLinks.map((s) => (
                          <li key={s.href}>
                                          <Link href={s.href} className="text-xs text-[#A89880] hover:text-[#D4C5B0] transition-colors leading-relaxed">
                                            {s.label}
                                          </Link>Link>
                          </li>li>
                        ))}
                                  </ul>ul>
                        </div>div>
                
                  {/* Quick links */}
                        <div>
                                  <h3 className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-5">Institute</h3>h3>
                                  <ul className="space-y-2">
                                    {[
            { label: "Home", href: "/" },
            { label: "About the Institute", href: "/about" },
            { label: "Health Assessment", href: "/quiz" },
            { label: "Contact Us", href: "/contact" },
            { label: "Book Appointment", href: "/contact" },
                        ].map((l) => (
                                        <li key={l.href}>
                                                        <Link href={l.href} className="text-xs text-[#A89880] hover:text-[#D4C5B0] transition-colors">
                                                          {l.label}
                                                        </Link>Link>
                                        </li>li>
                                      ))}
                                  </ul>ul>
                        </div>div>
                
                  {/* Contact info */}
                        <div>
                                  <h3 className="text-[#C9A96E] text-xs font-semibold tracking-widest uppercase mb-5">Contact</h3>h3>
                                  <ul className="space-y-4">
                                              <li className="flex items-start gap-3">
                                                            <MapPin size={14} className="mt-0.5 shrink-0 text-[#C9A96E]" />
                                                            <span className="text-xs text-[#A89880] leading-relaxed">123 Wellness Avenue, Sector 45, Gurugram, Haryana 122003, India</span>span>
                                              </li>li>
                                              <li className="flex items-center gap-3">
                                                            <Phone size={14} className="shrink-0 text-[#C9A96E]" />
                                                            <a href="tel:+919876543210" className="text-xs text-[#A89880] hover:text-[#D4C5B0] transition-colors">+91 98765 43210</a>a>
                                              </li>li>
                                              <li className="flex items-center gap-3">
                                                            <Mail size={14} className="shrink-0 text-[#C9A96E]" />
                                                            <a href="mailto:care@precisionhealth.in" className="text-xs text-[#A89880] hover:text-[#D4C5B0] transition-colors">care@precisionhealth.in</a>a>
                                              </li>li>
                                              <li className="flex items-start gap-3">
                                                            <Clock size={14} className="mt-0.5 shrink-0 text-[#C9A96E]" />
                                                            <span className="text-xs text-[#A89880] leading-relaxed">Mon – Sat: 9:00 AM – 7:00 PM<br />Sunday: By Appointment Only</span>span>
                                              </li>li>
                                  </ul>ul>
                        </div>div>
                </div>div>
          
            {/* Bottom bar */}
                <div className="border-t border-[#3D2A1A] px-6 lg:px-12 py-5">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B5A4A]">
                                  <p>© {new Date().getFullYear()} Dr. Yuvraaj Singh, M.D. All rights reserved.</p>p>
                                  <p className="italic">"The Institute operates with a serious clinical framework at the intersection of internal medicine, precision hormonal and regenerative medicine."</p>p>
                        </div>div>
                </div>div>
          </footer>footer>
        );
}</footer>
