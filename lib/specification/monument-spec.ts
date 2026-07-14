import type { MonumentDraft } from "@/lib/config/monument-schema";

export const SPEC_LABELS = {
  graveTypes: {
    einzelgrab: "Single grave",
    urnengrab: "Urn grave",
    familiengrab: "Family / double grave",
    kindergrab: "Child grave",
    gedenkstein: "Memorial stone",
  },
  forms: {
    stele: "Upright headstone / stele",
    breitstein: "Wide family headstone",
    liegestein: "Low lying marker",
    felsen: "Natural rock memorial",
    herz: "Standing heart on base",
    buch: "Open inclined book marker",
    kissenstein: "Inclined pillow marker",
    kreuz: "Standing cross",
    sockelanlage: "Headstone and base assembly",
  },
  materials: {
    granit_schwarz: "Black granite family",
    granit_grau: "Grey granite family",
    granit_rot: "Red granite family",
    granit_gruen: "Green granite family",
    marmor_weiss: "White marble family",
    marmor_grau: "Grey marble family",
    sandstein: "Sandstone family",
    kalkstein: "Limestone family",
    schiefer: "Slate family",
    heimischer_stein: "Regional natural stone",
  },
  surfaces: {
    poliert: "Polished",
    gestockt: "Bush-hammered",
    geflammt: "Flamed",
    sandgestrahlt: "Sandblasted",
    gebuerstet: "Brushed",
    naturspalt: "Natural split",
    kombination: "Combination finish",
  },
  edges: {
    gefast_3mm: "3 mm chamfer",
    gerundet_5mm: "5 mm rounded edge",
    scharfkantig: "Square edge, lightly eased",
    naturkante: "Hand-worked natural edge",
  },
  fonts: {
    kapitalelchen: "Cinzel capitals",
    kursiv: "Cormorant italic",
    antiqua: "Cormorant Antiqua",
    modern: "Montserrat sans serif",
    handschrift: "Great Vibes script",
  },
  alignments: {
    links: "Left",
    mittig: "Centred",
    rechts: "Right",
  },
  engraving: {
    sandgestrahlt: "Recessed sandblasted lettering",
    goldlack: "Recessed lettering, gold paint fill",
    vergoldet: "Recessed lettering, genuine gold leaf",
    silber: "Recessed lettering, silver finish",
    bronzebuchstaben: "Applied bronze letters",
    farbig: "Recessed lettering, colour filled",
    laser: "Laser-etched lettering",
  },
  inscriptionColors: {
    kontrast_auto: "Automatic high-contrast fill",
    weiss: "Weather-resistant white fill",
    anthrazit: "Weather-resistant anthracite fill",
    gold: "Gold tone",
    silber: "Silver tone",
    bronze: "Natural bronze tone",
  },
} as const;

export type MonumentComponentSpec = {
  item: string;
  quantity: number;
  heightCm: number;
  widthCm: number;
  depthCm: number;
  note: string;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export function getMonumentComponents(draft: MonumentDraft): MonumentComponentSpec[] {
  const h = draft.heightCm ?? 0;
  const w = draft.widthCm ?? 0;
  const d = draft.depthCm ?? 0;
  if (!h || !w || !d) return [];

  const main: MonumentComponentSpec = {
    item: draft.form === "buch" ? "Open book body" : "Main memorial stone",
    quantity: 1,
    heightCm: h,
    widthCm: w,
    depthCm: d,
    note: "Finished overall dimensions; confirm production tolerances",
  };
  const components = [main];

  if (draft.form === "herz") {
    components.push({
      item: "Heart base",
      quantity: 1,
      heightCm: round(Math.max(9, h * 0.12)),
      widthCm: round(w * 1.18),
      depthCm: round(Math.max(d * 1.55, 20)),
      note: "Separate rectangular base, matching stone and finish",
    });
  }
  if (draft.form === "breitstein" || draft.form === "sockelanlage") {
    components.push({
      item: "Stone base / plinth",
      quantity: 1,
      heightCm: round(Math.max(11, h * 0.13)),
      widthCm: round(w * 1.28),
      depthCm: round(Math.max(d * 1.8, 24)),
      note: "Separate base; dowel layout by installing mason",
    });
  }
  if (draft.form === "kissenstein") {
    components.push({
      item: "Support slab",
      quantity: 1,
      heightCm: 4.5,
      widthCm: round(w * 1.05),
      depthCm: round(d * 1.04),
      note: "Matching support below inclined marker",
    });
  }
  if (draft.form === "buch") {
    components.push({
      item: "Inclined support wedge",
      quantity: 1,
      heightCm: round(Math.max(8, h * 0.55)),
      widthCm: round(w * 0.96),
      depthCm: d,
      note: "Support to provide drainage and reading angle",
    });
  }
  return components;
}

export function getSpecificationGaps(draft: MonumentDraft): string[] {
  const gaps: string[] = [];
  if (!draft.stoneTradeName?.trim()) gaps.push("exact commercial stone name / quarry and approved sample");
  if (!draft.cemeteryName?.trim()) gaps.push("cemetery name and applicable regulations");
  if (!draft.graveField?.trim() && !draft.graveNumber?.trim()) gaps.push("grave field / grave number");
  gaps.push("foundation dimensions and anchoring calculation by installing mason");
  gaps.push("signed inscription layout and dimensional drawing approval");
  return gaps;
}

