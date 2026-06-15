/**
 * Single source of truth for the 6 service pages.
 *
 * Each entry drives the dynamic `/services/[slug]` route plus the nav/footer
 * link lists. Adding a new service is purely additive — just append to the
 * `SERVICES` array and the page will mount automatically.
 *
 * The copy below was extracted directly from the Figma reference; long-form
 * content lives in section objects so we can render a consistent shell.
 */

export type IconKey =
  | "scale"
  | "leaf"
  | "brain"
  | "dumbbell"
  | "sparkle"
  | "stethoscope"
  | "heart"
  | "microscope"
  | "shield"
  | "target"
  | "chart"
  | "clock"
  | "award"
  | "metabolic-restoration"
  | "hormonal-balance"
  | "body-composition"
  | "long-term-health"
  | "pills"
  | "capsules"
  | "bone-bottle"
  | "torso"
  | "cycle-drops"
  | "cycle-female"
  | "brain-complex"
  | "heart-hand"
  | "bone"
  | "moon";

export type ServiceContent = {
  slug: string;
  shortLabel: string;        // for nav menu
  programTag: string;        // small uppercase eyebrow above hero title
  heroTitle: string;
  heroTitleAccent: string;   // burgundy-coloured tail of the title (e.g. "Care")
  heroBody: string;
  heroImage: string;         // path under /public, e.g. "/images/landing/...jpg"
  heroQuote: { text: string; cite?: string };
  // 4 small icon tiles below the hero
  heroTiles: { icon: IconKey; label: string }[];
  /* Optional: a deep-burgundy strip with 3 column statements */
  pillars?: { icon: IconKey; title: string; body: string }[];
  /* "You are not imagining it" symptom grid */
  symptomsSection?: {
    eyebrow?: string;
    title: string;
    body: string;
    items: { icon: IconKey; label: string }[];
  };
  /* "Conventional approaches often fail" + olive callout */
  conventionalSection?: {
    title: string;
    body: string;
    failures: { icon: IconKey; label: string }[];
    footer?: string;
    callout: { title: string; subtitle?: string; body: string; items?: { icon: IconKey }[] };
  };
  /* Closing structured-approach grid */
  approachSection?: {
    title: string;
    subtitle: string;
    steps: { icon: IconKey; title: string; body?: string }[];
  };
};

export const SERVICES: ServiceContent[] = [
  {
    slug: "female-hormonal",
    shortLabel: "Female Restorative",
    programTag: "WOMEN'S HORMONAL HEALTH PROGRAM",
    heroTitle: "Perimenopause, Menopause & Post-Menopause",
    heroTitleAccent: "Care",
    heroBody:
      "Hormonal changes do not just affect the body. They alter energy, emotions, sleep, cognition, relationships, confidence, and quality of life.",
    heroImage: "/images/landing/service-female-hormonal-hero.jpg",
    heroQuote: {
      text: "What has been normalized is often physiological dysfunction.",
    },
    heroTiles: [
      { icon: "scale", label: "Hormonal Optimization" },
      { icon: "leaf", label: "Metabolic Health" },
      { icon: "brain", label: "Cognitive Restoration" },
      { icon: "clock", label: "Longitudinal Care" },
    ],
    symptomsSection: {
      eyebrow: "I Don't Feel Like Myself Anymore",
      title: "For many women, the years surrounding menopause become a slow and confusing transition.",
      body: "Marked by:",
      items: [
        { icon: "clock", label: "Unexplained fatigue" },
        { icon: "leaf", label: "Disrupted sleep" },
        { icon: "heart", label: "Anxiety & irritability" },
        { icon: "brain", label: "Brain fog & memory changes" },
        { icon: "scale", label: "Weight gain despite effort" },
        { icon: "chart", label: "Loss of muscle tone & strength" },
        { icon: "shield", label: "Reduced libido & intimacy concerns" },
        { icon: "sparkle", label: "Hot flashes & night sweats" },
      ],
    },
    conventionalSection: {
      title: "Why Conventional Approaches Often Fail",
      body: "Symptoms are treated in isolation.",
      failures: [
        { icon: "pills", label: "Sleep\nmedications" },
        { icon: "capsules", label: "Antidepressants\nfor mood\nchanges" },
        { icon: "bone-bottle", label: "Calcium\ntablets for\nbone loss" },
        { icon: "torso", label: "Diet plans\nfor weight\ngain" },
      ],
      // footer: "But the body does not function in disconnected parts.",
      callout: {
        title: "The Body Does Not Function\nIn Disconnected Parts",
        subtitle: "We address the root. We restore the system.",
        body: "When hormones shift, every major physiological system\nbegins responding to that change.",
        items: [
          { icon: "cycle-drops" },
          { icon: "cycle-female" },
          { icon: "brain-complex" },
          { icon: "heart-hand" },
          { icon: "bone" },
          { icon: "moon" },
        ],
      },
    },
    approachSection: {
      title: "Our Clinical Approach",
      subtitle: "Structured, Comprehensive & Physiology-Driven",
      steps: [
        { icon: "hormonal-balance", title: "Hormonal\nTransitions" },
        { icon: "metabolic-restoration", title: "Metabolic\nChanges" },
        { icon: "shield", title: "Inflammatory\nBurden" },
        { icon: "body-composition", title: "Body\nComposition" },
        { icon: "heart", title: "Cardiovascular\nRisk" },
        { icon: "moon", title: "Sleep &\nRecovery" },
        { icon: "brain-complex", title: "Cognitive &\nEmotional Health" },
        { icon: "bone", title: "Long-Term\nBone Protection" },
      ],
    },
  },
  {
    slug: "metabolic-health",
    shortLabel: "Metabolic Health",
    programTag: "METABOLIC HEALTH PROGRAM",
    heroTitle: "Metabolic Health & Body Composition",
    heroTitleAccent: "(Non-GLP-1 and GLP-1 Based)",
    heroBody:
      "Weight gain is rarely the beginning of the problem.\nIt is usually the visible expression of a deeper\nmetabolic dysfunction that has been developing\nsilently for years.",
    heroImage: "/images/landing/service-metabolic-health-hero.jpg",
    heroQuote: {
      text: "Metabolism is not a willpower problem. It is a physiological system.",
    },
    heroTiles: [
      { icon: "metabolic-restoration", label: "Metabolic\nRestoration" },
      { icon: "hormonal-balance", label: "Hormonal\nBalance" },
      { icon: "body-composition", label: "Body\nComposition" },
      { icon: "long-term-health", label: "Long-Term\nHealth" },
    ],
    symptomsSection: {
      eyebrow: "You are not lacking discipline. You are exhausted from:",
      title: "Your Body Responds To More Than Calories.",
      body: "It responds to a complex interplay of internal systems.",
      items: [
        { icon: "clock", label: "Trying multiple diets" },
        { icon: "dumbbell", label: "Exercising without meaningful change" },
        { icon: "leaf", label: "Experiencing repeated cycles of\nweight loss and regain" },
        { icon: "heart", label: "Living with constant fatigue and cravings" },
        { icon: "brain", label: 'Watching your body change despite\n"doing everything right"' },
        { icon: "chart", label: "Insulin signaling dysfunction" },
        { icon: "target", label: "Cortisol patterns" },
        { icon: "stethoscope", label: "Mitochondrial efficiency" },
      ],
    },
    conventionalSection: {
      title: "And Yet, They Are Often Told",
      body: "The objective is not rapid weight loss. It is metabolic correction and restoration.",
      failures: [
        { icon: "leaf", label: '"Eat less."' },
        { icon: "dumbbell", label: '"Exercise more."' },
        { icon: "clock", label: '"It\'s age."' },
        { icon: "chart", label: '"Your reports are normal."' },
      ],
      callout: {
        title: "It is scientific correction and restoration.",
        body: "This is why temporary weight-loss approaches fail. The body is not simply trying to lose weight; it is responding to multiple physiological factors.",
      },
    },
    approachSection: {
      title: "A Structured Metabolic Evaluation.",
      subtitle: "Personalized For You.",
      steps: [
        { icon: "microscope", title: "Insulin resistance" },
        { icon: "leaf", title: "Metabolic inefficiency" },
        { icon: "scale", title: "Body composition abnormalities" },
        { icon: "heart", title: "Inflammatory markers" },
        { icon: "target", title: "Hormonal contributors" },
        { icon: "stethoscope", title: "Liver and pancreatic stress" },
        { icon: "chart", title: "Cardiovascular risk patterns" },
        { icon: "clock", title: "Sleep and recovery dysfunction" },
      ],
    },
  },
  {
    slug: "mens-hormonal",
    shortLabel: "Men's Hormonal",
    programTag: "MEN'S HORMONAL HEALTH PROGRAM",
    heroTitle: "Men's Hormonal & Andropause",
    heroTitleAccent: "Care",
    heroBody:
      "We go beyond symptom suppression to restore your hormones, energy, performance, and long-term vitality—at the root.",
    heroImage: "/images/landing/service-mens-hormonal-hero.jpg",
    heroQuote: {
      text: "Decline is not inevitable. It is a signal. And every signal has a cause.",
    },
    heroTiles: [
      { icon: "scale", label: "Hormonal\nOptimization" },
      { icon: "leaf", label: "Metabolic\nRestoration" },
      { icon: "shield", label: "Sexual Health\nSupport" },
      { icon: "dumbbell", label: "Performance\n& Recovery" },
      { icon: "clock", label: "Long-Term\nHealth" },
    ],
    pillars: [
      {
        icon: "target",
        title: "Identify the Root Cause",
        body: "We evaluate hormones, metabolism, inflammation, sleep, and vascular health to uncover what's really driving your symptoms.",
      },
      {
        icon: "heart",
        title: "Restore Physiological Function",
        body: "Personalized care plans designed to optimize hormones, build strength, improve energy, and enhance sexual & cognitive performance.",
      },
      {
        icon: "clock",
        title: "Sustainable, Long-Term Vitality",
        body: "We track, refine, and support your journey so you can feel, function, and perform at your best now and in the years ahead.",
      },
    ],
    symptomsSection: {
      title: "You're Not Imagining It. Your Body Is Telling You Something.",
      body: "Common signs of hormonal decline and andropause.",
      items: [
        { icon: "clock", label: "Low Energy & Stamina" },
        { icon: "heart", label: "Reduced Libido" },
        { icon: "scale", label: "Erectile Difficulties" },
        { icon: "dumbbell", label: "Loss of Strength & Muscle" },
        { icon: "leaf", label: "Fatigue & Poor Recovery" },
        { icon: "brain", label: "Brain Fog & Poor Focus" },
        { icon: "shield", label: "Poor Sleep & Restlessness" },
        { icon: "chart", label: "Increased Abdominal Fat" },
        { icon: "target", label: "Loss of Drive & Motivation" },
      ],
    },
    conventionalSection: {
      title: "Hormonal Decline In Men Is Not Just About Testosterone.",
      body: "It affects the entire physiology — metabolism, vascular health, inflammation, recovery, body composition, mental clarity, and sexual function.",
      failures: [
        { icon: "scale", label: "Hormonal signaling" },
        { icon: "leaf", label: "Metabolic efficiency" },
        { icon: "heart", label: "Vascular integrity" },
        { icon: "shield", label: "Inflammatory burden" },
      ],
      callout: {
        title: "These systems are deeply interconnected.",
        body: "When one shifts, every major physiological system begins responding to that change.",
      },
    },
    approachSection: {
      title: "Our Comprehensive Approach.",
      subtitle: "Structured. Personalized. Evidence-Based.",
      steps: [
        { icon: "microscope", title: "Advanced Hormonal Assessment" },
        { icon: "target", title: "Root Cause Identification" },
        { icon: "stethoscope", title: "Personalized Care Plan" },
        { icon: "chart", title: "Optimize & Restore" },
        { icon: "clock", title: "Continuous Monitoring" },
      ],
    },
  },
  {
    slug: "brain-mitochondrial",
    shortLabel: "Regenerative Health",
    programTag: "PRECISION HEALTH. CELLULAR RECOVERY.",
    heroTitle: "Brain & Mitochondrial Restorative",
    heroTitleAccent: "Care",
    heroBody:
      "Burnout is not always psychological. Sometimes, it is biological exhaustion. Outwardly, you continue functioning. Internally, the system is struggling to keep up.",
    heroImage: "/images/landing/service-brain-mitochondrial-hero.jpg",
    heroQuote: {
      text: "The brain is one of the most energy-demanding organs in the body. Its performance depends on multiple interconnected systems working in perfect balance.",
    },
    heroTiles: [
      { icon: "heart", label: "Cellular Energy" },
      { icon: "brain", label: "Cognitive Recovery" },
      { icon: "sparkle", label: "Neurological Recovery" },
      { icon: "shield", label: "Metabolic Resilience" },
    ],
    symptomsSection: {
      title: "When These Systems Begin Deteriorating, You May Experience",
      body: "",
      items: [
        { icon: "clock", label: "Fatigue" },
        { icon: "leaf", label: "Brain Fog" },
        { icon: "brain", label: "Poor Concentration" },
        { icon: "chart", label: "Reduced Productivity" },
        { icon: "heart", label: "Emotional Instability" },
        { icon: "shield", label: "Poor Recovery" },
        { icon: "clock", label: "Sleep Disruption" },
        { icon: "target", label: "Reduced Resilience" },
      ],
    },
    conventionalSection: {
      title: "This Is Not Simply \"Stress.\"",
      body: 'In many individuals, there is an underlying state of chronic physiological overload affecting cellular energy production and neurological recovery.',
      failures: [
        { icon: "leaf", label: "More caffeine" },
        { icon: "clock", label: "Sleep aids" },
        { icon: "heart", label: "Temporary stimulants" },
        { icon: "sparkle", label: 'Short bursts of "wellness"' },
      ],
      callout: {
        title: "Conventional Approaches Often Suppress Symptoms Without Restoring Function.",
        body: "But recovery cannot occur if the underlying physiology remains depleted.",
      },
    },
    approachSection: {
      title: "Our Brain & Mitochondrial Restorative Programs Are Designed To Support Recovery At A Cellular Level.",
      subtitle: "Structured Restorative Medicine — Not Wellness Therapy.",
      steps: [
        { icon: "leaf", title: "Mitochondrial Function" },
        { icon: "heart", title: "Inflammatory Burden" },
        { icon: "brain", title: "Oxidative Stress" },
        { icon: "shield", title: "Metabolic Efficiency" },
        { icon: "target", title: "Vascular & Neurological Health" },
        { icon: "scale", title: "Hormonal Contributors" },
        { icon: "chart", title: "Autonomic Physiology" },
      ],
    },
  },
  {
    slug: "physical-restoration",
    shortLabel: "Physical Restoration",
    programTag: "FUNCTION. STRENGTH. LONGEVITY.",
    heroTitle: "Physical Restoration",
    heroTitleAccent: "Programs",
    heroBody:
      "Movement is not simply exercise. It is one of the most powerful biological signals the human body receives.",
    heroImage: "/images/landing/service-physical-restoration-hero.jpg",
    heroQuote: {
      text: "The goal is not exhaustion. The goal is adaptation and restoration.",
    },
    heroTiles: [
      { icon: "dumbbell", label: "Strength" },
      { icon: "heart", label: "Mobility" },
      { icon: "leaf", label: "Metabolic Health" },
      { icon: "clock", label: "Recovery & Longevity" },
    ],
    symptomsSection: {
      eyebrow: "Too Inactive. Too Intense. Either Way, The Body Pays.",
      title: "Many individuals are caught between two extremes — chronic physical inactivity or aggressive training without understanding their physiology.",
      body: "The Result Is Often:",
      items: [
        { icon: "clock", label: "Chronic fatigue" },
        { icon: "leaf", label: "Stiffness" },
        { icon: "heart", label: "Poor recovery" },
        { icon: "scale", label: "Metabolic dysfunction" },
        { icon: "chart", label: "Persistent aches and pains" },
        { icon: "shield", label: "Injuries" },
        { icon: "brain", label: "Declining mobility" },
        { icon: "target", label: "Joint deterioration" },
      ],
    },
    conventionalSection: {
      title: "Most Exercise Programs Are Built Around Intensity. Very Few Are Built Around Physiology.",
      body: "At the Institute of Precision Hormonal and Metabolic Health, exercise is approached as a structured restorative intervention. Every program is individualized based on:",
      failures: [
        { icon: "scale", label: "Age & Body Composition" },
        { icon: "heart", label: "Mobility & Movement Assessment" },
        { icon: "leaf", label: "Hormonal & Metabolic Status" },
        { icon: "shield", label: "Cardiovascular Conditioning" },
      ],
      callout: {
        title: "We Are About Rebuilding Capacity.",
        body: "Our programs are physician-guided, therapist-supervised restoration programs.",
      },
    },
    approachSection: {
      title: "These Are Physician-Guided, Therapist-Supervised Restoration Programs.",
      subtitle: "Programs are conducted by trained Physical Restoration Specialists (PRS) within a structured clinical framework.",
      steps: [
        { icon: "target", title: "Corrective Movement Training" },
        { icon: "dumbbell", title: "Structured Strength Conditioning" },
        { icon: "heart", title: "Mobility & Flexibility Work" },
        { icon: "leaf", title: "Posture & Spine Correction" },
        { icon: "shield", title: "Cardiovascular Endurance Training" },
        { icon: "chart", title: "Low-Impact Metabolic Conditioning" },
        { icon: "clock", title: "Recovery-Focused Movement Protocols" },
      ],
    },
  },
  {
    slug: "aesthetic-external",
    shortLabel: "Aesthetic & External",
    programTag: "AESTHETIC HEALTH. INTERNAL HARMONY.",
    heroTitle: "Aesthetic & External Restoration",
    heroTitleAccent: "Programs",
    heroBody:
      "The face and skin often reflect what is happening internally long before laboratory reports do.",
    heroImage: "/images/landing/service-aesthetic-external-hero.jpg",
    heroQuote: {
      text: "Appearance is Deeply Connected to Physiology. The skin is the body's largest organ.",
    },
    heroTiles: [
      { icon: "sparkle", label: "Internal Balance" },
      { icon: "leaf", label: "Healthy Aging" },
      { icon: "heart", label: "Tissue Quality" },
      { icon: "shield", label: "Natural Restoration" },
      { icon: "clock", label: "Long-Term Vitality" },
    ],
    symptomsSection: {
      eyebrow: "Appearance Is Not Just Skin Deep.",
      title: "Changes in skin quality, facial volume, texture, elasticity, pigmentation, hair health, and overall appearance are frequently influenced by:",
      body: "",
      items: [
        { icon: "scale", label: "Hormonal Shifts" },
        { icon: "shield", label: "Inflammatory Burden" },
        { icon: "leaf", label: "Metabolic Dysfunction" },
        { icon: "sparkle", label: "Oxidative Stress" },
        { icon: "heart", label: "Vascular Health" },
        { icon: "clock", label: "Sleep Quality" },
        { icon: "target", label: "Nutritional Status" },
        { icon: "chart", label: "Collagen Decline" },
        { icon: "brain", label: "Chronic Stress" },
      ],
    },
    conventionalSection: {
      title: "Our Approach Is Different.",
      body: "At the Institute of Precision Hormonal and Metabolic Health, aesthetic and external restoration programs are approached as an extension of overall physiological health, not separate from it.",
      failures: [
        { icon: "leaf", label: "Healthy aging" },
        { icon: "heart", label: "Tissue quality" },
        { icon: "shield", label: "Structural integrity" },
        { icon: "sparkle", label: "Skin health" },
        { icon: "sparkle", label: "Regenerative capacity" },
        { icon: "leaf", label: "Natural restoration" },
      ],
      callout: {
        title: "This Is Not Trend-Driven Cosmetic Medicine.",
        body: "There is no interest in exaggerated or unnatural outcomes. Every intervention is approached conservatively, structurally, and in alignment with the individual's physiology, facial architecture, and long-term tissue health.",
      },
    },
    approachSection: {
      title: "External Restoration Programs May Include:",
      subtitle: "Programs Are Individualized.",
      steps: [
        { icon: "stethoscope", title: "Physician-guided skin restoration protocols" },
        { icon: "sparkle", title: "Regenerative aesthetic therapies" },
        { icon: "heart", title: "PRP-based interventions" },
        { icon: "leaf", title: "Microneedling & collagen induction therapies" },
        { icon: "target", title: "Botox & neuromodulator treatments" },
        { icon: "chart", title: "Dermal fillers where clinically appropriate" },
        { icon: "shield", title: "Skin quality & texture restoration" },
        { icon: "clock", title: "Pigmentation & aging-supportive protocols" },
        { icon: "leaf", title: "Hair & scalp restorative therapies" },
      ],
    },
  },
];

export function getServiceBySlug(slug: string): ServiceContent | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
