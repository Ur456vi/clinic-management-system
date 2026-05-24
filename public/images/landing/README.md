# Landing-page image assets

These 20 JPGs were extracted directly from the Figma file
`https://www.figma.com/design/SrJXZ6F175iHYjb4UDXSF8/clinic-dryuvraaj` via
the Figma MCP `get_screenshot` tool (32768-px-wide canvas render → per-frame
crops → per-asset crops). They render in `next/image` via the
`FigmaImage` component in `components/public/ui.tsx`.

## Inventory

| File | Used by | Description |
| --- | --- | --- |
| `home-hero-doctor.jpg` | `app/(public)/_home-content.tsx` § Hero | Dr. Yuvraaj Singh with stethoscope, against honeycomb |
| `home-care-doctor.jpg` | `_home-content.tsx` § "A Different Standard of Care" | Clinical portrait, geometric backdrop |
| `home-focus-female.jpg` | `_home-content.tsx` § Focus Area card 1 | Female-care illustration tile |
| `home-focus-male.jpg` | ↑ card 2 | Male-performance illustration |
| `home-focus-metabolic.jpg` | ↑ card 3 | Metabolic / body composition illustration |
| `home-focus-regenerative.jpg` | ↑ card 4 | Regenerative medicine illustration |
| `about-hero-doctor.jpg` | `about/page.tsx` § Hero | Arms-crossed clinical portrait |
| `about-chapter-01.jpg` | `about/page.tsx` Chapter 01 | Young Dr. Singh in the ICU |
| `about-chapter-02.jpg` | Chapter 02 | Anatomical heart illustration |
| `about-chapter-03.jpg` | Chapter 03 | Dr. Singh studying scans |
| `about-chapter-04.jpg` | Chapter 04 | Pandemic-era clinical work |
| `about-chapter-05.jpg` | Chapter 05 | Modern clinical institute |
| `service-female-hormonal-hero.jpg` | `services/[slug]/page.tsx` § Hero (slug `female-hormonal`) | Woman in serene setting |
| `service-metabolic-health-hero.jpg` | slug `metabolic-health` | Doctor + ECG anatomy reference |
| `service-mens-hormonal-hero.jpg` | slug `mens-hormonal` | Doctor portrait in clinical setting |
| `service-brain-mitochondrial-hero.jpg` | slug `brain-mitochondrial` | Doctor + cellular imagery |
| `service-physical-restoration-hero.jpg` | slug `physical-restoration` | Athletic subject + program rings |
| `service-aesthetic-external-hero.jpg` | slug `aesthetic-external` | Subject portrait, aesthetic theme |
| `contact-clinic-reception.jpg` | `contact/page.tsx` § Hero | Reception area, INSTITUTE OF PRECISION METABOLIC & HORMONAL HEALTH signage |
| `contact-doctor-chart.jpg` | `contact/page.tsx` § Form sidebar | Doctor reviewing patient chart |

## Upgrading to original-quality assets

The MCP-rendered crops are good (~150-300 KB each, ~800-1200 px wide) but
they're rasterised reproductions of the Figma layers — not the source PNG/
JPGs that the designer placed. If you need lossless originals (for retina
displays or large hero crops), the cleanest path is:

1. Open the Figma file in the **desktop app**.
2. For each frame on the canvas, right-click the image layer inside it and
   choose **Export → 2x PNG**.
3. Save each export over the matching filename in this folder. The page
   components reference these paths exactly — no code changes needed.

Alternatively, with a frame selected in the Figma desktop app I can call
the MCP's `get_design_context` tool and pull the asset download URL the
official way. Ask if you'd like to drive that.

## Brand cursive logotype

The "Dr. Yuvraaj Singh M.D." cursive in the header/footer is currently
rendered with the `Pinyon Script` Google font (wired up in
`app/layout.tsx`). If the Figma file ships a custom SVG logotype, drop it
at `/public/images/logos/dr-yuvraaj-mark.svg` and replace the
`<span style={{ fontFamily: "var(--font-script)" }}>` blocks in
`components/public/Header.tsx` and `components/public/Footer.tsx` with
`<Image src="…" />`.
