import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
        title: "Home",
        description: "Physician-Led Precision Health for Individuals Who Refuse to Normalize Decline.",
};

const serviceCards = [
        { title: "Perimenopause, Menopause & Post-Menopause Care", href: "/services/female-hormonal", tag: "Women's Health" },
        { title: "Men's Hormonal & Andropause Care", href: "/services/mens-hormonal", tag: "Men's Health" },
        { title: "Metabolic Health & Body Composition", href: "/services/metabolic-health", tag: "Metabolic" },
        { title: "Brain & Mitochondrial Restorative Care", href: "/services/brain-mitochondrial", tag: "Neurology" },
        { title: "Physical Restoration Programs", href: "/services/physical-restoration", tag: "Rehabilitation" },
        { title: "Aesthetic & External Restoration", href: "/services/aesthetic-external", tag: "Aesthetics" },
];

export default function HomePage() {
        return (
                <>
                        {/* HERO */}
                        <section className="bg-[#FAF8F3] min-h-[88vh] flex items-center">
                                <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full grid lg:grid-cols-2 gap-12 items-center py-16">
                                        <div>
                                                <h1 className="text-4xl lg:text-6xl font-serif font-medium text-[#2C1A0E] leading-tight mb-6">
                                                        Physician-Led Precision Health for Individuals Who{" "}
                                                        <span className="text-[#7B1B2A] italic">Refuse to Normalize Decline</span>
                                                </h1>
                                                <p className="text-[#5A4A3A] text-lg leading-relaxed mb-8 max-w-xl">
                                                        An advanced systems-based clinical institute focused on hormonal, metabolic and regenerative health through measurable diagnostics, biological precision and long-term physician-guided care.
                                                </p>
                                                <div className="flex flex-wrap gap-4 mb-10">
                                                        <Link href="/services" className="bg-[#6B7C5A] text-white font-medium px-6 py-3 rounded flex items-center gap-2 hover:bg-[#5A6A4A] transition-colors">
                                                                Explore The Clinical Framework <ArrowRight size={16} />
                                                        </Link>
                                                        <Link href="/about" className="border-2 border-[#7B1B2A] text-[#7B1B2A] font-medium px-6 py-3 rounded hover:bg-[#7B1B2A] hover:text-white transition-colors">
                                                                About The Institute
                                                        </Link>
                                                </div>
                                                <div className="flex flex-wrap gap-8 text-xs font-bold tracking-widest text-[#5A4A3A]">
                                                        <span>20+ YEARS CLINICAL EXPERIENCE</span>
                                                        <span>PRECISION METABOLIC MEDICINE</span>
                                                        <span>HORMONAL & LONGEVITY CARE</span>
                                                </div>
                                        </div>
                                        <div className="hidden lg:block">
                                                <div className="w-full aspect-[4/5] bg-gradient-to-b from-[#E8DDD0] to-[#C9B8A8] rounded-2xl" />
                                        </div>
                                </div>
                        </section>

                        {/* PROBLEM STATEMENT */}
                        <section className="bg-white py-20">
                                <div className="max-w-5xl mx-auto px-6 lg:px-12">
                                        <h2 className="text-3xl lg:text-5xl font-serif font-medium text-[#2C1A0E] mb-3">
                                                When Standard Metrics Fail To Explain{" "}
                                                <span className="text-[#8B7355] italic">What You Are Experiencing</span>
                                        </h2>
                                        <p className="text-[#5A4A3A] mb-10">You are functioning. But not at your best.</p>
                                        <div className="grid md:grid-cols-2 gap-8 mb-10">
                                                <ul className="space-y-4">
                                                        {["Non-Restorative sleep. Sleep disruption is frequently a downstream signal, not the primary issue.", "Your energy is inconsistent.", "Intimacy, confidence, or clarity began to fade", "Your body is changing—despite doing everything right."].map((s) => (
                                                                <li key={s} className="flex items-start gap-3 text-[#3A2C1E]">
                                                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#7B1B2A] shrink-0" />
                                                                        <span className="text-sm leading-relaxed">{s}</span>
                                                                </li>
                                                        ))}
                                                </ul>
                                                <div>
                                                        <ul className="space-y-4 mb-8">
                                                                {["Metabolic resistance (weight gain) rarely develops without deeper physiological drivers", "Cognitive clarity is often one of the earliest indicators of systemic imbalance"].map((s) => (
                                                                        <li key={s} className="flex items-start gap-3 text-[#3A2C1E]">
                                                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#7B1B2A] shrink-0" />
                                                                                <span className="text-sm leading-relaxed">{s}</span>
                                                                        </li>
                                                                ))}
                                                        </ul>
                                                        <p className="text-[#5A4A3A] text-sm mb-3 font-medium">And yet, you&apos;ve been told:</p>
                                                        <ul className="space-y-2">
                                                                {['"Everything looks normal."', '"It\'s just stress."', '"It\'s part of aging."'].map((q) => (
                                                                        <li key={q} className="text-[#7B1B2A] italic text-sm">{q}</li>
                                                                ))}
                                                        </ul>
                                                </div>
                                        </div>
                                        <Link href="/assessment" className="inline-block bg-[#7B1B2A] text-white font-semibold px-8 py-4 rounded hover:bg-[#9B2535] transition-colors">
                                                Request Consultation
                                        </Link>
                                </div>
                        </section>

                        {/* A DIFFERENT STANDARD OF CARE */}
                        <section className="bg-[#FAF8F3] py-20">
                                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
                                        <div className="hidden lg:block">
                                                <div className="w-full aspect-square max-w-lg bg-gradient-to-b from-[#3A2C1E] to-[#1A0E06] rounded-2xl" />
                                        </div>
                                        <div>
                                                <h2 className="text-3xl lg:text-4xl font-serif font-medium text-[#2C1A0E] mb-6">A Different Standard of Care</h2>
                                                <div className="space-y-3 text-[#5A4A3A] mb-8 text-sm leading-relaxed">
                                                        <p>At this institute, care is not based on assumptions.</p>
                                                        <p>It is based on systems, structure, and precision.</p>
                                                        <p>We do not treat isolated symptoms.</p>
                                                        <p>We evaluate how your hormones, metabolism, and physiology interact as a whole.</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mb-8">
                                                        {["Structured Clinical Protocols", "Advanced Diagnostic Evaluation", "Individualized Therapeutic Strategies", "Continuous Monitoring & Refinement"].map((item) => (
                                                                <div key={item} className="border border-[#E8DDD0] rounded-lg p-4 text-xs font-medium text-[#5A4A3A] bg-white">{item}</div>
                                                        ))}
                                                </div>
                                                <div className="space-y-1 text-[#7B1B2A] font-semibold italic">
                                                        <p>No generic plans.</p>
                                                        <p>No unnecessary interventions.</p>
                                                        <p>Only precision-based medicine.</p>
                                                </div>
                                        </div>
                                </div>
                        </section>

                        {/* OUR CLINICAL FRAMEWORK */}
                        <section className="bg-white py-20">
                                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                                        <h2 className="text-3xl lg:text-4xl font-serif font-medium text-[#2C1A0E] text-center mb-16">Our Clinical Framework</h2>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                        { num: "01", title: "Hormonal Systems", desc: "Hormonal systems do not function independently or in isolation" },
                                                        { num: "02", title: "Metabolic Health", desc: "Metabolic health governs energy, weight, and inflammation" },
                                                        { num: "03", title: "Vascular Integrity", desc: "Vascular integrity defines performance, appetite, and more" },
                                                        { num: "04", title: "Imbalance Prevention", desc: "Imbalance begins years before it becomes clinically visible" },
                                                ].map((step) => (
                                                        <div key={step.num} className="text-center p-6 border border-[#E8DDD0] rounded-xl bg-[#FAF8F3]">
                                                                <div className="text-4xl font-serif font-light text-[#C9B8A8] mb-4">{step.num}</div>
                                                                <h3 className="font-semibold text-[#2C1A0E] text-sm mb-2">{step.title}</h3>
                                                                <p className="text-xs text-[#8B7355] leading-relaxed">{step.desc}</p>
                                                        </div>
                                                ))}
                                        </div>
                                </div>
                        </section>

                        {/* SERVICES OVERVIEW */}
                        <section className="bg-[#FAF8F3] py-20">
                                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                                        <h2 className="text-3xl lg:text-4xl font-serif font-medium text-[#2C1A0E] text-center mb-4">Our Clinical Programs</h2>
                                        <p className="text-center text-[#8B7355] mb-12 text-sm">Each program is built around your physiology, not a template.</p>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {serviceCards.map((card) => (
                                                        <Link key={card.href} href={card.href} className="group bg-white border border-[#E8DDD0] rounded-xl p-6 hover:border-[#7B1B2A] hover:shadow-md transition-all">
                                                                <div className="text-[10px] font-bold tracking-widest text-[#7B1B2A] uppercase mb-3">{card.tag}</div>
                                                                <h3 className="font-serif text-[#2C1A0E] font-medium mb-4 group-hover:text-[#7B1B2A] transition-colors">{card.title}</h3>
                                                                <span className="text-xs text-[#8B7355] flex items-center gap-1">Learn More <ArrowRight size={12} /></span>
                                                        </Link>
                                                ))}
                                        </div>
                                </div>
                        </section>

                        {/* CTA */}
                        <section className="bg-[#7B1B2A] py-20">
                                <div className="max-w-3xl mx-auto px-6 text-center">
                                        <h2 className="text-3xl lg:text-4xl font-serif text-white mb-4">Begin With A Clinical Assessment</h2>
                                        <p className="text-[#E8C8C0] mb-8 text-sm leading-relaxed">Start your physician-led biological evaluation. Take our health assessment questionnaire to understand how your biology is functioning.</p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                                <Link href="/assessment" className="bg-white text-[#7B1B2A] font-semibold px-8 py-4 rounded hover:bg-[#FAF8F3] transition-colors">Take Health Assessment</Link>
                                                <Link href="/assessment" className="border-2 border-white text-white font-semibold px-8 py-4 rounded hover:bg-white hover:text-[#7B1B2A] transition-colors">Book Consultation</Link>
                                        </div>
                                </div>
                        </section>
                </>
        );
}