export type RxGroup = { name: string; items: string[] }
export type RxCategory = { id: string; name: string; groups: RxGroup[] }
export type InfusionProtocol = { id: string; name: string; components: string[] }

/** Oral meds + supplements, grouped Category -> Subcategory -> item. */
export const RX_LIBRARY: RxCategory[] = [
  { id: "hormonal-therapies", name: "HORMONAL THERAPIES", groups: [
    { name: "THYROID", items: ["Levothyroxine 25 mcg OD empty stomach morning", "Levothyroxine 50 mcg OD empty stomach morning", "Levothyroxine 75 mcg OD empty stomach morning", "Levothyroxine 100 mcg OD empty stomach morning", "Liothyronine (T3) 5 mcg OD morning", "Liothyronine (T3) 10 mcg OD morning", "Combination T4/T3 compounded capsule OD morning", "Desiccated Thyroid Extract 30 mg OD morning", "Desiccated Thyroid Extract 60 mg OD morning"] },
    { name: "TESTOSTERONE", items: ["Testosterone Enanthate 100 mg IM weekly", "Testosterone Enanthate 125 mg IM weekly", "Testosterone Cypionate 100 mg IM weekly", "Testosterone Cypionate 150 mg IM weekly", "Testosterone Undecanoate 1000 mg IM every 10–12 weeks", "Testosterone Gel 1% 5 g topical OD morning", "Testosterone Gel 1% 10 g topical OD morning", "Testosterone Cream compounded topical OD", "Clomiphene Citrate 25 mg OD", "Clomiphene Citrate 50 mg alternate day", "hCG 1000 IU SC twice weekly", "hCG 2000 IU SC twice weekly", "Anastrozole 0.5 mg twice weekly", "Anastrozole 1 mg weekly"] },
    { name: "WOMEN'S HORMONAL THERAPY", items: ["Micronized Progesterone 100 mg HS", "Micronized Progesterone 200 mg HS", "Estradiol Patch 25 mcg twice weekly", "Estradiol Patch 50 mcg twice weekly", "Estradiol Gel 1 pump topical OD", "Estradiol Gel 2 pumps topical OD", "Vaginal Estriol Cream HS", "DHEA 25 mg OD morning", "DHEA 50 mg OD morning", "Pregnenolone 25 mg OD morning", "Pregnenolone 50 mg OD morning"] },
    { name: "ADRENAL / STRESS SUPPORT", items: ["Ashwagandha Extract 300 mg BD after meals", "Rhodiola Rosea 250 mg OD morning", "Phosphatidylserine 100 mg HS", "Magnesium Glycinate 200 mg HS", "Magnesium Glycinate 400 mg HS"] },
  ] },
  { id: "metabolic-health", name: "METABOLIC HEALTH", groups: [
    { name: "INSULIN RESISTANCE / GLP-1", items: ["Metformin XR 500 mg OD after dinner", "Metformin XR 500 mg BD after meals", "Metformin XR 1000 mg HS", "Berberine 500 mg BD before meals", "Myo-Inositol 2 g BD", "Semaglutide 0.25 mg SC weekly", "Semaglutide 0.5 mg SC weekly", "Semaglutide 1 mg SC weekly", "Tirzepatide 2.5 mg SC weekly", "Tirzepatide 5 mg SC weekly", "Tirzepatide 7.5 mg SC weekly", "Alpha Lipoic Acid 300 mg BD", "Alpha Lipoic Acid 600 mg OD"] },
    { name: "LIPID / CARDIOMETABOLIC SUPPORT", items: ["Omega-3 EPA/DHA 1000 mg OD after meals", "Omega-3 EPA/DHA 2000 mg OD after meals", "CoQ10 100 mg OD after breakfast", "CoQ10 200 mg OD after breakfast", "Red Yeast Rice 600 mg HS", "Citrus Bergamot 500 mg BD", "Curcumin BCM-95 500 mg BD"] },
  ] },
  { id: "gi-gut-restoration", name: "GI / GUT RESTORATION", groups: [
    { name: "ACID / REFLUX", items: ["Esomeprazole 40 mg OD empty stomach", "Pantoprazole 40 mg OD empty stomach", "Sodium Alginate suspension 10 mL TDS after meals", "Deglycyrrhizinated Licorice (DGL) chewable before meals"] },
    { name: "GUT HEALING", items: ["Zinc Carnosine 75 mg BD after meals", "L-Glutamine 5 g BD empty stomach", "L-Glutamine 10 g OD empty stomach", "Saccharomyces boulardii 250 mg BD", "Spore Probiotic 2 caps OD", "Multi-strain Probiotic 50 billion CFU OD", "Tributyrin 300 mg BD", "Sodium Butyrate 600 mg BD", "Aloe Vera Extract capsule BD", "Slippery Elm powder HS"] },
    { name: "DIGESTIVE SUPPORT", items: ["Pancreatic Enzymes 1 cap TDS with meals", "Ox Bile Extract 125 mg with meals", "Betaine HCl with Pepsin 1 cap with meals", "Digestive Enzyme Blend 1 cap TDS with meals"] },
    { name: "IBS / SIBO SUPPORT", items: ["Peppermint Oil Enteric Capsule BD", "Partially Hydrolyzed Guar Gum 5 g OD", "Rifaximin 550 mg TDS", "Neem Extract 500 mg BD", "Oregano Oil Softgel BD"] },
  ] },
  { id: "brain-mitochondrial-support", name: "BRAIN / MITOCHONDRIAL SUPPORT", groups: [
    { name: "", items: ["Acetyl L-Carnitine 500 mg BD", "NAC 600 mg BD", "NAC 1200 mg OD", "Citicoline 500 mg OD morning", "Citicoline 1000 mg OD morning", "Lion's Mane Extract 500 mg BD", "Magnesium L-Threonate HS", "Glycine 3 g HS", "Melatonin 1 mg HS", "Melatonin 3 mg HS", "Melatonin SR 5 mg HS", "Creatine Monohydrate 3 g OD", "Creatine Monohydrate 5 g OD", "NAD precursor capsule OD", "Resveratrol 250 mg OD", "PQQ 20 mg OD"] },
  ] },
  { id: "vitamins-micronutrients", name: "VITAMINS / MICRONUTRIENTS", groups: [
    { name: "VITAMIN D", items: ["Vitamin D3 2000 IU OD after meals", "Vitamin D3 5000 IU OD after meals", "Vitamin D3 60,000 IU weekly", "Vitamin D3 + K2 capsule OD"] },
    { name: "B12 / B COMPLEX", items: ["Methylcobalamin 1500 mcg OD", "Methylcobalamin 1500 mcg SL OD", "Hydroxocobalamin IM weekly", "Methylfolate 1 mg OD", "Methylfolate 5 mg OD", "Activated B Complex OD"] },
    { name: "MINERALS", items: ["Magnesium Glycinate 200 mg HS", "Magnesium Citrate 400 mg HS", "Zinc Picolinate 25 mg OD", "Zinc Picolinate 50 mg OD", "Selenium 200 mcg OD", "Iron Bisglycinate 100 mg OD"] },
  ] },
  { id: "sleep-recovery", name: "SLEEP / RECOVERY", groups: [
    { name: "", items: ["Magnesium Glycinate 400 mg HS", "Glycine 3 g HS", "L-Theanine 200 mg HS", "Apigenin 50 mg HS", "Melatonin 1 mg HS", "Melatonin 3 mg HS", "Ashwagandha 300 mg HS"] },
  ] },
  { id: "bone-health", name: "BONE HEALTH", groups: [
    { name: "", items: ["Calcium Citrate 500 mg OD after meals", "Calcium Citrate 500 mg BD after meals", "Vitamin K2 MK7 100 mcg OD", "Collagen Peptides 10 g OD", "Boron 3 mg OD"] },
  ] },
  { id: "detox-liver-support", name: "DETOX / LIVER SUPPORT", groups: [
    { name: "", items: ["NAC 600 mg BD", "Milk Thistle 140 mg BD", "TUDCA 250 mg BD", "Glutathione 500 mg OD", "Curcumin 500 mg BD"] },
  ] },
  { id: "aesthetic-hair-support", name: "AESTHETIC / HAIR SUPPORT", groups: [
    { name: "", items: ["Marine Collagen 10 g OD", "Biotin 5 mg OD", "Oral Hyaluronic Acid OD", "Saw Palmetto 320 mg OD", "Minoxidil topical HS", "Oral Minoxidil 1.25 mg HS", "Oral Minoxidil 2.5 mg HS"] },
  ] },
  { id: "cardiovascular-support", name: "CARDIOVASCULAR SUPPORT", groups: [
    { name: "", items: ["L-Arginine 3 g OD", "L-Citrulline 3 g OD", "Beetroot Extract OD", "CoQ10 200 mg OD", "Magnesium Taurate HS"] },
  ] },
]

/** IV infusion protocols (component ingredients, no dose). */
export const INFUSION_PROTOCOLS: InfusionProtocol[] = [
  { id: "myers-style-restorative-infusion", name: "MYERS-STYLE RESTORATIVE INFUSION", components: ["Magnesium Sulfate", "Vitamin C", "B Complex", "Calcium Gluconate", "B12"] },
  { id: "mitochondrial-recovery-infusion", name: "MITOCHONDRIAL RECOVERY INFUSION", components: ["Alpha Lipoic Acid", "Glutathione", "Vitamin C", "B Complex", "Magnesium"] },
  { id: "executive-fatigue-infusion", name: "EXECUTIVE FATIGUE INFUSION", components: ["Amino Acid Blend", "Magnesium", "Vitamin C", "B12", "Trace Minerals"] },
  { id: "immune-support-infusion", name: "IMMUNE SUPPORT INFUSION", components: ["Vitamin C", "Zinc", "Selenium", "Glutathione"] },
]

/** Instruction snippets to append to a med line or notes. */
export const RX_SUFFIXES: string[] = [
  "Take after meals",
  "Take before meals",
  "Take on empty stomach",
  "Take at bedtime",
  "Avoid dairy within 2 hours",
  "Avoid caffeine within 2 hours",
  "Maintain hydration",
  "Continue lifestyle modification",
  "Continue resistance training",
  "Follow-up after 4 weeks",
  "Repeat labs after 6–8 weeks",
  "Stop and report adverse effects immediately",
]

/** Flat search across the med/supplement library; returns matching items. */
export function searchRx(query: string): { category: string; item: string }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: { category: string; item: string }[] = []
  for (const c of RX_LIBRARY)
    for (const g of c.groups)
      for (const it of g.items)
        if (it.toLowerCase().includes(q)) out.push({ category: g.name || c.name, item: it })
  return out
}
