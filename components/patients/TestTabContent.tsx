"use client"

import React from "react"

interface TestTabContentProps {
  activeSection: string
}

const InputField = ({ label, placeholder = "", className = "", subLabel = "" }: { label: string; placeholder?: string; className?: string; subLabel?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-sm font-medium text-[#344054]">{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      className="w-full h-11 px-4 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
    />
    {subLabel && <p className="text-xs text-[#667085]">{subLabel}</p>}
  </div>
)

const TextAreaField = ({ label, placeholder = "", className = "" }: { label: string; placeholder?: string; className?: string }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-sm font-medium text-[#344054]">{label}</label>
    <textarea
      placeholder={placeholder}
      rows={3}
      className="w-full px-4 py-3 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
    />
  </div>
)

const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-base font-bold text-[#101828] border-b border-[#EAECF0] pb-4">{title}</h3>
)

const RoutineInvestigations = () => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold text-[#101828]">Routine Investigations Panel</h2>
        <p className="text-sm text-[#667085] mt-1">Complete blood count and biochemistry</p>
      </div>

      <div className="space-y-6">
        <SectionHeader title="CBC with ESR" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Hemoglobin (g/dL)" />
          <InputField label="Total WBC (cells/µL)" />
          <InputField label="RBC (million/µL)" />
          <InputField label="Platelet Count (lakhs/µL)" />
          <InputField label="ESR (mm/hr)" />
          <InputField label="Reticulocyte Count (%)" />
          <TextAreaField label="Peripheral Smear Findings" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="KFT with Minerals" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Sr. Creatinine (mg/dL)" />
          <InputField label="Blood Urea (mg/dL)" />
          <InputField label="Sr. Calcium (mg/dL)" />
          <InputField label="Sr. Magnesium (mg/dL)" />
          <InputField label="Sr. Phosphorous (mg/dL)" />
          <InputField label="Sr. Uric Acid (mg/dL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="LFT with Coagulation" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Total Bilirubin (mg/dL)" />
          <InputField label="Direct Bilirubin (mg/dL)" />
          <InputField label="SGOT/AST (U/L)" />
          <InputField label="SGPT/ALT (U/L)" />
          <InputField label="ALP (U/L)" />
          <InputField label="GGT (U/L)" />
          <InputField label="Total Protein (g/dL)" />
          <InputField label="Albumin (g/dL)" />
          <InputField label="LDH (U/L)" />
          <InputField label="PT (seconds)" />
          <InputField label="INR" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Thyroid Profile" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="FT3 (pg/mL)" />
          <InputField label="FT4 (ng/dL)" />
          <InputField label="TSH (µIU/mL)" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Extended Lipid Profile" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Total Cholesterol (mg/dL)" />
          <InputField label="Triglycerides (mg/dL)" />
          <InputField label="HDL Cholesterol (mg/dL)" />
          <InputField label="LDL Cholesterol (mg/dL)" />
          <InputField label="VLDL (mg/dL)" />
          <InputField label="Apolipoprotein A1 (mg/dL)" />
          <InputField label="Apolipoprotein B (mg/dL)" />
          <InputField label="Lipoprotein A (mg/dL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Diabetes Panel" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="FBS (mg/dL)" />
          <InputField label="PPBS (mg/dL)" />
          <InputField label="HbA1c (%)" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Vitamins & Minerals" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Vitamin B12 (pg/mL)" />
          <InputField label="Vitamin D3 (ng/mL)" />
          <InputField label="Folate/B9 (ng/mL)" />
          <InputField label="Serum Iron (µg/dL)" />
          <InputField label="TIBC (µg/dL)" />
          <InputField label="Ferritin (ng/mL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Inflammatory Markers" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="HsCRP (mg/L)" />
          <InputField label="CRP (mg/L)" />
          <InputField label="Sr. Homocysteine (µmol/L)" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Insulin & Cortisol" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Fasting Insulin (µIU/mL)" />
          <InputField label="HOMA-IR Index" />
          <InputField label="Sr. Cortisol AM (µg/dL)" />
          <InputField label="Sr. Cortisol PM (µg/dL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Pancreatic Enzymes" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Sr. Amylase (U/L)" />
          <InputField label="Sr. Lipase (U/L)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Urine Analysis" />
        <div className="grid grid-cols-2 gap-6">
          <TextAreaField label="Urine R/E Findings" />
          <TextAreaField label="Urine M/E Findings" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Prostate (Males Only)" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Sr. PSA (ng/mL)" className="col-span-2" />
        </div>
      </div>
    </div>
  )
}

const MaleHormonalInvestigations = () => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold text-[#101828]">Male Hormonal Panel</h2>
        <p className="text-sm text-[#667085] mt-1">Complete male hormone profile</p>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Testosterone" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Total Testosterone (ng/dL)" />
          <InputField label="Free Testosterone (pg/mL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Adrenal Hormones" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="DHEA-S (µg/dL)" />
          <InputField label="Sr. Cortisol AM (µg/dL)" />
          <InputField label="Sr. Cortisol PM (µg/dL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Other Hormones" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Estradiol E2 (pg/mL)" />
          <InputField label="Progesterone (ng/mL)" />
          <InputField label="SHBG (nmol/L)" />
          <InputField label="Sr. Prolactin (ng/mL)" />
          <InputField label="LH (mIU/mL)" />
          <InputField label="FSH (mIU/mL)" />
          <InputField label="IGF-1 (ng/mL)" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Thyroid Profile" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="FT3 (pg/mL)" />
          <InputField label="FT4 (ng/dL)" />
          <InputField label="TSH (µIU/mL)" className="col-span-2" />
        </div>
      </div>
    </div>
  )
}

const FemaleHormonalInvestigations = () => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold text-[#101828]">Female Hormonal Panel</h2>
        <p className="text-sm text-[#667085] mt-1">Complete female hormone profile</p>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Testosterone" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Total Testosterone (ng/dL)" />
          <InputField label="Free Testosterone (pg/mL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Adrenal Hormones" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="DHEA-S (µg/dL)" />
          <InputField label="Sr. Cortisol AM (µg/dL)" />
          <InputField label="Sr. Cortisol PM (µg/dL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Sex Hormones" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Estradiol E2 (pg/mL)" />
          <InputField label="Progesterone (ng/mL)" />
          <InputField label="17-Alpha-OH-Progesterone (ng/mL)" />
          <InputField label="SHBG (nmol/L)" />
          <InputField label="Sr. Prolactin (ng/mL)" />
          <InputField label="LH (mIU/mL)" />
          <InputField label="FSH (mIU/mL)" />
          <InputField label="IGF-1 (ng/mL)" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Thyroid Profile" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="FT3 (pg/mL)" />
          <InputField label="FT4 (ng/dL)" />
          <InputField label="TSH (µIU/mL)" />
          <InputField label="Reverse T3 (ng/dL)" subLabel="If hypothyroid" />
          <InputField label="Anti-TPO (IU/mL)" subLabel="If hypothyroid" />
          <InputField label="Anti-Thyroglobulin (IU/mL)" subLabel="If hypothyroid" />
        </div>
      </div>
    </div>
  )
}

const DutchInvestigations = () => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold text-[#101828]">DUTCH (Dried Urine Test)</h2>
        <p className="text-sm text-[#667085] mt-1">Comprehensive hormone metabolites</p>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Estrogen Metabolites" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="2-OH-Estrogens" />
          <InputField label="4-OH-Estrogen" />
          <InputField label="16-α-OH-Estrone (E1)" className="col-span-2" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="Other Metabolites" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="6-OH Melatonin" />
          <InputField label="6-Sulfatoxymelatonin" />
          <InputField label="Beta-OH-Isovalerate" />
          <InputField label="Quinolinate" />
          <InputField label="Indican" />
          <InputField label="Iodine/Creatinine Ratio" />
        </div>
      </div>

      <div className="space-y-6">
        <SectionHeader title="5-Alpha-Reductase Metabolites" />
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Type 1 Metabolites" />
          <InputField label="Type 2 Metabolites" />
        </div>
      </div>
    </div>
  )
}

const AutoimmuneInvestigations = () => (
  <div className="space-y-12">
    <div>
      <h2 className="text-xl font-bold text-[#101828]">Autoimmune Panel</h2>
      <p className="text-sm text-[#667085] mt-1">Autoimmune markers and antibodies</p>
    </div>

    {/* ANA Profile Section */}
    <div className="space-y-6">
      <SectionHeader title="ANA Profile" />
      <div className="grid grid-cols-1 gap-6">
        <TextAreaField 
          label="ANA Profile (18 Parameters)" 
          placeholder="List all 18 parameters and results" 
        />
      </div>
    </div>

    {/* Thyroid Antibodies Section */}
    <div className="space-y-6">
      <SectionHeader title="Thyroid Antibodies" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Anti-Thyroglobulin (IU/mL)" />
        <InputField label="Anti-TPO (IU/mL)" />
      </div>
    </div>

    {/* Other Antibodies Section */}
    <div className="space-y-6">
      <SectionHeader title="Other Antibodies" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="GAD-65 (U/mL)" />
        <InputField label="Anti-tTG IgA (U/mL)" />
      </div>
    </div>
  </div>
)


const GeneticInvestigations = () => (
  <div className="space-y-12">
    <div>
      <h2 className="text-xl font-bold text-[#101828]">Genetic Panel</h2>
      <p className="text-sm text-[#667085] mt-1">Genetic mutations and polymorphisms</p>
    </div>

    {/* Methylation Genes Section */}
    <div className="space-y-6">
      <SectionHeader title="Methylation Genes" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="MTHFR Mutation" placeholder="Result (e.g., C677T, A1298C)" />
        <InputField label="COMT V158M Mutation" placeholder="Result" />
        <InputField label="MAT1A" placeholder="Result" className="col-span-1" />
      </div>
    </div>

    {/* Hormone Genes Section */}
    <div className="space-y-6">
      <SectionHeader title="Hormone Genes" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="CYP19A1 (Aromatase)" placeholder="Result" />
        <InputField label="SHBG Polymorphisms" placeholder="Result" />
        <InputField label="Androgen Receptor CAG Repeat" placeholder="Number of CAG repeats" className="col-span-1" />
      </div>
    </div>

    {/* Aging Markers Section */}
    <div className="space-y-6">
      <SectionHeader title="Aging Markers" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Telomere Length" placeholder="Result" className="col-span-1" />
      </div>
    </div>
  </div>
)

const TumorMarkersInvestigations = () => (
  <div className="space-y-12">
    <div>
      <h2 className="text-xl font-bold text-[#101828]">Tumor Markers</h2>
      <p className="text-sm text-[#667085] mt-1">Cancer screening markers</p>
    </div>
    <div className="space-y-6">
      <SectionHeader title="Tumor Markers" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="CA 15.3 (U/mL)" subLabel="Women / Male breast carcinoma" />
        <InputField label="CA 72.4 (U/mL)" />
        <InputField label="CA 19.9 (U/mL)" />
        <InputField label="CA 125 (U/mL)" subLabel="Women only" />
        <InputField label="CEA (ng/mL)" />
        <InputField label="Alpha Fetoprotein (ng/mL)" />
        <InputField label="PSA Total (ng/mL)" subLabel="Males only" />
        <InputField label="PSA Free (ng/mL)" subLabel="Males only" />
        <InputField label="CA 242 (U/mL)" subLabel="Gall bladder carcinoma" className="col-span-1" />
      </div>
    </div>
  </div>
)


const MicronutrientInvestigations = () => (
  <div className="space-y-12">
    <div>
      <h2 className="text-xl font-bold text-[#101828]">Micronutrient Optimization Panel</h2>
      <p className="text-sm text-[#667085] mt-1">Vitamins, minerals, and trace elements</p>
    </div>

    {/* Vitamins Section */}
    <div className="space-y-6">
      <SectionHeader title="Vitamins" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Vitamin D (ng/mL)" />
        <InputField label="Vitamin B12 (pg/mL)" />
        <InputField label="Folate (ng/mL)" className="col-span-1" />
      </div>
    </div>

    {/* Minerals Section */}
    <div className="space-y-6">
      <SectionHeader title="Minerals" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Ferritin (ng/mL)" />
        <InputField label="Magnesium RBC (mg/dL)" />
        <InputField label="Zinc RBC (µg/dL)" />
        <InputField label="Copper (µg/dL)" />
        <InputField label="Selenium (µg/L)" className="col-span-1" />
      </div>
    </div>

    {/* Essential Fatty Acids Section */}
    <div className="space-y-6">
      <SectionHeader title="Essential Fatty Acids" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Omega-3 Index (%)" className="col-span-1" />
      </div>
    </div>

    {/* Trace Elements & Toxins Section */}
    <div className="space-y-6">
      <SectionHeader title="Trace Elements & Toxins" />
      <div className="grid grid-cols-2 gap-6">
        <TextAreaField label="Other Trace Elements" />
        <TextAreaField label="Toxin Panel (Arsenic, etc.)" />
      </div>
    </div>
  </div>
)


const MetabolicInvestigations = () => (
  <div className="space-y-12">
    <div>
      <h2 className="text-xl font-bold text-[#101828]">Metabolic & Mitochondrial Map</h2>
      <p className="text-sm text-[#667085] mt-1">Advanced metabolic markers</p>
    </div>

    {/* Metabolic Markers Section */}
    <div className="space-y-6">
      <SectionHeader title="Metabolic Markers" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Indolamine (IDO)" />
        <InputField label="Reverse T3 (ng/dL)" />
        <InputField label="Galectin-3 (ng/mL)" />
        <InputField label="Adiponectin (µg/mL)" />
        <InputField label="Oxidized LDL (U/L)" />
        <InputField label="Myeloperoxidase (ng/mL)" />
      </div>
    </div>

    {/* Mitochondrial Function Section */}
    <div className="space-y-6">
      <SectionHeader title="Mitochondrial Function" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Lactate (mmol/L)" />
        <InputField label="Pyruvate (mg/dL)" />
        <InputField label="Coenzyme Q10 (µg/mL)" />
        <InputField label="Carnitine (µmol/L)" />
      </div>
    </div>
  </div>
)


const StoolTestInvestigations = () => (
  <div className="space-y-12">
    <div>
      <h2 className="text-xl font-bold text-[#101828]">Stool Tests</h2>
      <p className="text-sm text-[#667085] mt-1">Gastrointestinal and microbiome analysis</p>
    </div>

    {/* Basic Stool Analysis Section */}
    <div className="space-y-6">
      <SectionHeader title="Basic Stool Analysis" />
      <div className="grid grid-cols-2 gap-6">
        <TextAreaField label="Stool R/E Findings" />
        <TextAreaField label="Stool M/E Findings" />
        <TextAreaField label="Stool C/S Results" />
        <InputField label="Occult Blood" placeholder="Positive / Negative" />
      </div>
    </div>

    {/* Functional Markers Section */}
    <div className="space-y-6">
      <SectionHeader title="Functional Markers" />
      <div className="grid grid-cols-2 gap-6">
        <InputField label="Fecal Pancreatic Elastase (µg/g)" />
        <InputField label="Beta Glucuronidase (U/g)" />
        <InputField label="Fecal Calprotectin (µg/g)" />
        <InputField label="Eosinophil Protein X (µg/g)" />
      </div>
    </div>

    {/* Advanced Testing Section */}
    <div className="space-y-6">
      <SectionHeader title="Advanced Testing" />
      <div className="grid grid-cols-2 gap-6">
        <TextAreaField label="Fecal Short Chain Fatty Acids" placeholder="Acetate, Propionate, Butyrate levels" />
        <TextAreaField label="Microbiome Testing Results" placeholder="Diversity, pathogen presence, beneficial bacteria" />
      </div>
    </div>
  </div>
)


export default function TestTabContent({ activeSection }: TestTabContentProps) {
  switch (activeSection) {
    case "Routine":
      return <RoutineInvestigations />
    case "Male Hormonal":
      return <MaleHormonalInvestigations />
    case "Female Hormonal":
      return <FemaleHormonalInvestigations />
    case "Dutch":
      return <DutchInvestigations />
    case "Autoimmune":
      return <AutoimmuneInvestigations />
    case "Genetic":
      return <GeneticInvestigations />
    case "Tumor Markers":
      return <TumorMarkersInvestigations />
    case "Micronutrient":
      return <MicronutrientInvestigations />
    case "Metabolic":
      return <MetabolicInvestigations />
    case "Stool Test":
      return <StoolTestInvestigations />
    default:
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">??</span>
          </div>
          <h3 className="text-lg font-semibold text-[#101828]">{activeSection}</h3>
          <p className="text-sm text-[#667085] mt-1">This investigation panel is under development.</p>
        </div>
      )
  }
}
