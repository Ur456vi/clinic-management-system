/**
 * Lab test catalog for the Dr. Yuvraaj consultation "Test" panel selector.
 *
 * Structure: CATEGORY (collapsible section) -> PANEL (A, B, C…) -> tests.
 * Sourced from the clinic's master test list (Tests.docx). The doctor ticks
 * individual tests or a whole panel; the selection is stored on
 * `Consultation.sections.test.test__selected_tests` as a JSON array of
 * stable test keys (see `testKey`). The printed prescription renders the
 * selected tests grouped by panel.
 *
 * A test's key is `${panelId}::${name}` — name-based so it survives list
 * reordering. Keep panel `id`s stable.
 */

export type TestPanel = {
  /** Stable id, used in test keys. */
  id: string
  /** Display letter (A, B, …). */
  code: string
  name: string
  tests: string[]
}

export type TestCategory = {
  id: string
  title: string
  panels: TestPanel[]
}

export const TEST_CATALOG: TestCategory[] = [
  {
    id: "blood-urine-stool",
    title: "Blood / Urine / Stool Test Panels",
    panels: [
      {
        id: "routine",
        code: "A",
        name: "ROUTINE INVESTIGATIONS PANEL",
        tests: [
          "CBC with ESR with PERIPHERAL SMEAR with RETICULOCYTE COUNT",
          "KFT with Sr. Calcium / Magnesium / Phosphorous",
          "LFT with LDH and PT/INR",
          "THYROID PROFILE (FT3, FT4,TSH)",
          "EXTENDED LIPID PROFILE (with APOLIPOPROTEINS AND LIPOPROTEIN A)",
          "FBS/ PPBS /HbA1c",
          "Sr. Vit. B12 / Vit. D3 / Folate (B9) / IRON STUDIES / FERRITIN",
          "HsCRP / CRP",
          "Sr. HOMOCYSTEINE",
          "FASTING INSULIN LEVEL WITH HOMA IR INDEX",
          "Sr. CORTISOL (AM + PM)",
          "Sr. AMYLASE / LIPASE",
          "URINE R/E, M/E",
          "Sr. PSA (IN MALES ONLY)",
        ],
      },
      {
        id: "male-hormonal",
        code: "B",
        name: "MALE HORMONAL PANEL",
        tests: [
          "TESTOSTERONE (TOTAL AND FREE)",
          "DHEA-S",
          "ESTRADIOL (E2)",
          "PROGESTERONE",
          "SHBG (SEX HORMONE BINDING GLOBULIN)",
          "Sr. PROLACTIN",
          "LH / FSH",
          "Sr. CORTISOL (AM + PM)",
          "IGF-1",
          "THYROID PROFILE",
        ],
      },
      {
        id: "female-hormonal",
        code: "C",
        name: "FEMALE HORMONAL PANEL",
        tests: [
          "TESTOSTERONE (TOTAL AND FREE)",
          "DHEA-S",
          "ESTRADIOL (E2)",
          "PROGESTERONE",
          "17-ALPHA-OH- PROGESTERONE",
          "SHBG (SEX HORMONE BINDING GLOBULIN)",
          "Sr. PROLACTIN",
          "LH / FSH",
          "Sr. CORTISOL (AM + PM)",
          "IGF-1",
          "THYROID PROFILE (IN CASE THYROID LEVELS ARE DERANGED (HYPOTHYROID) THE THE LAB SHOULD AUTOMATICALLY RUN THE FOLLOWING ADDITIONAL TESTS - (a) REVERSE T3, (b)ANTI-TPO, (c) ANTI-THYROGLOBULIN (ANTI-TG))",
        ],
      },
      {
        id: "urine-dutch",
        code: "D",
        name: "URINE (DUTCH)",
        tests: [
          "2-OH-ESTROGENS",
          "4-OH-ESTROGEN",
          "16-A-OH-ESTRONE (E1)",
          "6-OH AND 6-SULFATOXYMELATONIN",
          "BETA-OH-ISOVALERATE",
          "QUINOLINATE",
          "INDICAN",
          "IODINE/CREATININE RATIO",
          "5-ALPHA- REDUCTASE (TYPE 1 AND TYPE 2) METABOLITES",
        ],
      },
      {
        id: "autoimmune",
        code: "E",
        name: "AUTOIMMUNE PANEL",
        tests: [
          "ANA PROFILE (18 PARAMETERS)",
          "ANTI-THYROGLOBULIN (ANTI-TG)",
          "ANTI-THYROID PEROXIDASE (ANTI-TPO)",
          "GAD-65",
          "ANTI- tTG - IgA (TISSUE TRANSGLUTAMINASE)",
        ],
      },
      {
        id: "genetic",
        code: "F",
        name: "GENETIC PANEL",
        tests: [
          "MTHFR MUTATION",
          "COMT MUTATIONS (V158M)",
          "MAT1A (METHIONINE ADENOSYLTRANSFERASE I/III) - HYPER METHIONINEMIA - CBS DYSFUNCTION",
          "CYP19A1 (AROMATASE)",
          "SHBG POLYMORPHISMS",
          "ANDROGEN RECEPTOR CAG REPEAT",
          "TELOMERE LENGTH",
        ],
      },
      {
        id: "tumor-markers",
        code: "G",
        name: "TUMOR MARKERS",
        tests: [
          "Ca - 15.3 (IN WOMEN AND IN MALES WITH CARCINOMA OF THE MALE BREAST - GYNAECOMASTIA)",
          "Ca - 72.4",
          "Ca - 19.9",
          "Ca - 125 (IN WOMEN)",
          "CARCINO EMBRYONIC ANTIGEN (CEA)",
          "ALPHA FETOPROTEIN",
          "PSA - TOTAL AND FREE (IN MALES)",
          "Ca - 242 (CARCINOMA GALL BLADDER)",
        ],
      },
      {
        id: "micronutrient",
        code: "H",
        name: "MICRONUTRIENT OPTIMIZATION PANEL",
        tests: [
          "VITAMIN D",
          "VITAMIN B12",
          "FOLATE",
          "FERRITIN",
          "MAGNESIUM (RBC)",
          "ZINC (RBC)",
          "COPPER",
          "OMEGA-3 INDEX",
          "SELENIUM",
          "OTHER TRACE ELEMENTS",
          "TOXIN PANEL (ARSENIC ETC)",
        ],
      },
      {
        id: "other-special",
        code: "I",
        name: "OTHER SPECIAL TESTS (METABOLIC + MITOCHONDRIAL MAP)",
        tests: [
          "INDOLAMINE (IDO)",
          "REVERSE T3",
          "GALECTIN-3",
          "ADIPONECTIN",
          "OXIDIZED LDL",
          "MYELOPEROXIDASE",
          "LACTATE",
          "PYRUVATE",
          "COENZYME Q10",
          "CARNITINE",
        ],
      },
      {
        id: "stool",
        code: "J",
        name: "STOOL TESTS",
        tests: [
          "STOOL R/E, M/E, C/S",
          "FECAL PANCREATIC ELASTASE (PE-1)",
          "STOOL FOR OCCULT BLOOD",
          "BETA GLUCURONIDASE",
          "FECAL CALPROTECTIN",
          "EOSINOPHIL PROTEIN X (EPX)",
          "FECAL SHORT CHAIN FATTY ACIDS (SCFAs)",
          "MICROBIOME TESTING",
        ],
      },
    ],
  },
]

/** Stable key for a single test within a panel. */
export function testKey(panelId: string, testName: string): string {
  return `${panelId}::${testName}`
}

/** Every test key in the catalog. */
export function allTestKeys(): string[] {
  const out: string[] = []
  for (const cat of TEST_CATALOG)
    for (const p of cat.panels) for (const t of p.tests) out.push(testKey(p.id, t))
  return out
}

/** Keys for one panel. */
export function panelTestKeys(panel: TestPanel): string[] {
  return panel.tests.map((t) => testKey(panel.id, t))
}

/** Total number of tests in the catalog. */
export const TOTAL_TEST_COUNT = allTestKeys().length

/** Resolve a stored key back to its panel + test name (for the printout). */
export function lookupTest(
  key: string,
): { category: TestCategory; panel: TestPanel; name: string } | null {
  for (const category of TEST_CATALOG)
    for (const panel of category.panels)
      for (const name of panel.tests)
        if (testKey(panel.id, name) === key) return { category, panel, name }
  return null
}

/**
 * Group a flat list of selected keys by panel, preserving catalog order and
 * dropping any keys no longer in the catalog. Used by the prescription print.
 */
export function groupSelectedByPanel(
  selectedKeys: string[],
): { category: TestCategory; panel: TestPanel; tests: string[] }[] {
  const set = new Set(selectedKeys)
  const out: { category: TestCategory; panel: TestPanel; tests: string[] }[] = []
  for (const category of TEST_CATALOG) {
    for (const panel of category.panels) {
      const tests = panel.tests.filter((t) => set.has(testKey(panel.id, t)))
      if (tests.length) out.push({ category, panel, tests })
    }
  }
  return out
}

/** Parse the stored JSON value into a key array (tolerant). */
export function parseSelectedTests(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}
