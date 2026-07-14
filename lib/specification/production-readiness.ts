import type {
  FormTyp,
  Grabtyp,
  MonumentDraft,
} from "@/lib/config/monument-schema";

export type ProductionIssueSeverity = "blocker" | "warning" | "recommendation";
export type ProductionIssueCategory =
  | "model"
  | "stone"
  | "dimensions"
  | "inscription"
  | "site"
  | "installation";

export type ProductionIssue = {
  id: string;
  severity: ProductionIssueSeverity;
  category: ProductionIssueCategory;
  stage: 1 | 2 | 3 | 4 | 5;
  title: string;
  message: string;
  action: string;
  pdfMessage: string;
};

export type ReadinessChecklistItem = {
  id: string;
  label: string;
  weight: number;
  stage: 1 | 2 | 3 | 4;
  complete: boolean;
};

export type ReleaseRequirement = {
  id: string;
  label: string;
  pdfMessage: string;
};

export type ProductionReadiness = {
  score: number;
  status: "incomplete" | "review_required" | "quote_ready";
  checklist: ReadinessChecklistItem[];
  issues: ProductionIssue[];
  releaseRequirements: ReleaseRequirement[];
};

const SUITABLE_FORMS: Record<Grabtyp, readonly FormTyp[]> = {
  einzelgrab: ["stele", "sockelanlage", "felsen", "herz", "kreuz", "liegestein"],
  urnengrab: ["kissenstein", "liegestein", "stele", "buch", "herz", "felsen"],
  familiengrab: ["breitstein", "sockelanlage", "felsen", "stele", "liegestein"],
  kindergrab: ["herz", "kissenstein", "buch", "stele", "kreuz"],
  gedenkstein: ["felsen", "stele", "sockelanlage", "breitstein", "kreuz"],
};

const UPRIGHT_FORMS = new Set<FormTyp>([
  "stele",
  "breitstein",
  "felsen",
  "herz",
  "kreuz",
  "sockelanlage",
]);

const DARK_MATERIALS = new Set([
  "granit_schwarz",
  "granit_gruen",
  "schiefer",
]);

const LIGHT_MATERIALS = new Set([
  "marmor_weiss",
  "sandstein",
  "kalkstein",
]);

export const RELEASE_REQUIREMENTS: ReleaseRequirement[] = [
  {
    id: "cemetery-approval",
    label: "Friedhofsordnung und Genehmigung durch die zuständige Stelle prüfen.",
    pdfMessage: "Cemetery regulations and formal permit confirmed by the responsible authority",
  },
  {
    id: "foundation-design",
    label: "Fundament, Verdübelung und Standsicherheit durch den ausführenden Steinmetz bemessen.",
    pdfMessage: "Foundation, dowel layout and stability calculation by the executing mason",
  },
  {
    id: "signed-drawings",
    label: "Bemaßte Zeichnung und Inschriftenlayout schriftlich freigeben.",
    pdfMessage: "Signed dimensional drawing and inscription layout approval",
  },
  {
    id: "stone-sample",
    label: "Natursteinmuster, Farbspiel und Oberflächenreferenz freigeben.",
    pdfMessage: "Approved natural-stone sample, colour range and finish reference",
  },
];

function issue(
  data: Omit<ProductionIssue, "category"> & { category: ProductionIssueCategory },
): ProductionIssue {
  return data;
}

function hasDimensions(draft: MonumentDraft) {
  return Boolean(draft.heightCm && draft.widthCm && draft.depthCm);
}

function inscriptionLines(draft: MonumentDraft) {
  return [draft.inscription?.name, draft.inscription?.dates, draft.inscription?.epitaph]
    .flatMap((value) => value?.split(/\r?\n/) ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildChecklist(draft: MonumentDraft): ReadinessChecklistItem[] {
  const engravingDetailsComplete = Boolean(
    draft.engravingFinish &&
      draft.inscriptionColor &&
      draft.letterHeightMm &&
      (draft.engravingFinish === "bronzebuchstaben" || draft.engravingDepthMm != null),
  );

  return [
    { id: "model", label: "Grabart und Form", weight: 12, stage: 1, complete: Boolean(draft.grabtyp && draft.form) },
    { id: "stone", label: "Material und Oberfläche", weight: 10, stage: 2, complete: Boolean(draft.material && draft.surface) },
    { id: "edge", label: "Kantenbearbeitung", weight: 5, stage: 2, complete: Boolean(draft.edgeProfile) },
    { id: "dimensions", label: "Fertigmaße", weight: 15, stage: 2, complete: hasDimensions(draft) },
    { id: "trade-name", label: "Stein-Handelsname", weight: 8, stage: 2, complete: Boolean(draft.stoneTradeName?.trim()) },
    { id: "inscription", label: "Inschriftentext und Satz", weight: 12, stage: 3, complete: Boolean(draft.inscription?.name && draft.inscription.font && draft.inscription.alignment) },
    { id: "lettering", label: "Schriftausführung", weight: 10, stage: 3, complete: engravingDetailsComplete },
    { id: "equipment", label: "Motive und Ausstattung", weight: 8, stage: 4, complete: Boolean(draft.ornaments && draft.bronze && draft.enclosure) },
    { id: "installation", label: "Montageumfang", weight: 5, stage: 4, complete: draft.montage != null },
    { id: "cemetery", label: "Friedhof und Ort", weight: 8, stage: 4, complete: Boolean(draft.cemeteryName?.trim() && draft.cemeteryCity?.trim()) },
    { id: "grave-location", label: "Grabstelle", weight: 7, stage: 4, complete: Boolean(draft.graveField?.trim() || draft.graveNumber?.trim()) },
  ];
}

function addMissingDataIssues(draft: MonumentDraft, issues: ProductionIssue[]) {
  if (!draft.grabtyp || !draft.form) {
    issues.push(issue({
      id: "missing-model",
      severity: "blocker",
      category: "model",
      stage: 1,
      title: "Grundmodell unvollständig",
      message: "Grabart und Form werden für Maße, Preis und technische Prüfung benötigt.",
      action: "Grabart und Form auswählen.",
      pdfMessage: "Grave type and monument form are not fully specified",
    }));
  }
  if (!draft.material || !draft.surface) {
    issues.push(issue({
      id: "missing-stone-finish",
      severity: "blocker",
      category: "stone",
      stage: 2,
      title: "Stein oder Oberfläche fehlt",
      message: "Materialfamilie und sichtbare Bearbeitung sind noch nicht vollständig festgelegt.",
      action: "Material und Oberfläche auswählen.",
      pdfMessage: "Stone family and visible finish are not fully specified",
    }));
  }
  if (!hasDimensions(draft)) {
    issues.push(issue({
      id: "missing-dimensions",
      severity: "blocker",
      category: "dimensions",
      stage: 2,
      title: "Fertigmaße fehlen",
      message: "Ohne Höhe, Breite und Tiefe ist keine technische Plausibilitätsprüfung möglich.",
      action: "Alle drei Fertigmaße eintragen.",
      pdfMessage: "Finished height, width and depth are not fully specified",
    }));
  }
  if (!draft.stoneTradeName?.trim()) {
    issues.push(issue({
      id: "missing-stone-trade-name",
      severity: "recommendation",
      category: "stone",
      stage: 2,
      title: "Handelsname noch offen",
      message: "Die Materialfamilie beschreibt noch keinen eindeutig bestellbaren Naturstein.",
      action: "Handelsname oder freizugebendes Lieferantenmuster ergänzen.",
      pdfMessage: "Exact commercial stone name, quarry and approved sample remain to be confirmed",
    }));
  }
  if (!draft.inscription?.name || !draft.inscription.font || !draft.inscription.alignment) {
    issues.push(issue({
      id: "missing-inscription",
      severity: "blocker",
      category: "inscription",
      stage: 3,
      title: "Inschrift unvollständig",
      message: "Text, Schriftstil und Ausrichtung müssen für den Satz feststehen.",
      action: "Inschrift und Satzangaben vervollständigen.",
      pdfMessage: "Inscription text, typeface or alignment is incomplete",
    }));
  }
  if (!draft.cemeteryName?.trim() || !draft.cemeteryCity?.trim()) {
    issues.push(issue({
      id: "missing-cemetery",
      severity: "warning",
      category: "site",
      stage: 4,
      title: "Friedhof nicht eindeutig",
      message: "Ohne Friedhof und Ort kann die geltende Satzung nicht zugeordnet werden.",
      action: "Friedhof und Ort ergänzen.",
      pdfMessage: "Cemetery and municipality are not fully identified",
    }));
  }
  if (!draft.graveField?.trim() && !draft.graveNumber?.trim()) {
    issues.push(issue({
      id: "missing-grave-location",
      severity: "warning",
      category: "site",
      stage: 4,
      title: "Grabstelle noch offen",
      message: "Feld oder Grabnummer erleichtern Genehmigung, Aufmaß und Montageplanung.",
      action: "Grabfeld oder Grabnummer ergänzen, falls bekannt.",
      pdfMessage: "Grave field and grave number remain to be confirmed",
    }));
  }
}

function addCompatibilityIssues(draft: MonumentDraft, issues: ProductionIssue[]) {
  if (draft.grabtyp && draft.form && !SUITABLE_FORMS[draft.grabtyp].includes(draft.form)) {
    issues.push(issue({
      id: "unusual-form-for-grave",
      severity: "warning",
      category: "model",
      stage: 1,
      title: "Ungewöhnliche Formkombination",
      message: "Die gewählte Form ist für diese Grabart nicht als Standardlösung hinterlegt.",
      action: "Mit Friedhof und Steinmetz klären oder eine empfohlene Form wählen.",
      pdfMessage: "Selected form is non-standard for the stated grave type; confirm local acceptance",
    }));
  }

  const { form, heightCm: h, widthCm: w, depthCm: d } = draft;
  if (form && h && w && d) {
    if (UPRIGHT_FORMS.has(form)) {
      const minimumDepth = h >= 100 ? 14 : h >= 70 ? 10 : 8;
      if (d < minimumDepth) {
        issues.push(issue({
          id: "upright-depth-low",
          severity: "blocker",
          category: "dimensions",
          stage: 2,
          title: "Tiefe für die Höhe kritisch",
          message: `Bei ${h} cm Höhe sollte der Entwurf zunächst mit mindestens ${minimumDepth} cm Steintiefe kalkuliert werden.`,
          action: "Tiefe erhöhen oder Standsicherheit konstruktiv nachweisen lassen.",
          pdfMessage: `Nominal depth ${d} cm is low for an upright height of ${h} cm; structural review required`,
        }));
      }
    }
    if ((form === "liegestein" || form === "kissenstein" || form === "buch") && d < 30) {
      issues.push(issue({
        id: "marker-footprint-shallow",
        severity: "warning",
        category: "dimensions",
        stage: 2,
        title: "Aufstandsmaß knapp",
        message: "Die Tiefe der liegenden beziehungsweise geneigten Form liegt unter 30 cm.",
        action: "Lesewinkel, Auflager und Entwässerung mit dem Steinmetz prüfen.",
        pdfMessage: `Marker footprint depth ${d} cm requires support and drainage review`,
      }));
    }
    if (form === "breitstein" && w < 80) {
      issues.push(issue({
        id: "wide-stone-too-narrow",
        severity: "warning",
        category: "dimensions",
        stage: 2,
        title: "Breitstein ungewöhnlich schmal",
        message: "Unter 80 cm Breite verliert die Form ihren typischen Nutz- und Gestaltungsraum.",
        action: "Breite erhöhen oder Stele als Form prüfen.",
        pdfMessage: `Wide-headstone width ${w} cm is below the typical minimum; confirm form classification`,
      }));
    }
    if (draft.grabtyp === "urnengrab" && (w > 70 || h > 100)) {
      issues.push(issue({
        id: "urn-size-large",
        severity: "warning",
        category: "dimensions",
        stage: 2,
        title: "Großes Maß für ein Urnengrab",
        message: "Die Abmessungen liegen oberhalb vieler kompakter Urnengrab-Anlagen.",
        action: "Maximalmaße der örtlichen Friedhofsordnung prüfen.",
        pdfMessage: "Overall dimensions are large for an urn grave; verify cemetery maximum dimensions",
      }));
    }
    if (draft.grabtyp === "familiengrab" && w < 70) {
      issues.push(issue({
        id: "family-width-small",
        severity: "warning",
        category: "dimensions",
        stage: 2,
        title: "Wenig Fläche für ein Familiengrab",
        message: "Die Breite bietet voraussichtlich wenig Reserve für mehrere Namen.",
        action: "Belegungs- und Inschriftenplanung vorab festlegen.",
        pdfMessage: "Width provides limited inscription reserve for a family grave",
      }));
    }
  }

  if ((draft.material === "sandstein" || draft.material === "kalkstein") && draft.surface === "poliert") {
    issues.push(issue({
      id: "soft-stone-polished",
      severity: "warning",
      category: "stone",
      stage: 2,
      title: "Politur materialabhängig",
      message: "Bei Sand- und Kalksteinen sind erreichbarer Glanz und Außenbeständigkeit stark sortenabhängig.",
      action: "Konkreten Handelsstein und Oberflächenmuster freigeben.",
      pdfMessage: "Polished finish on sandstone/limestone is stone-specific; approved finish sample required",
    }));
  }
  if (draft.material === "schiefer" && draft.surface === "poliert") {
    issues.push(issue({
      id: "slate-polished",
      severity: "warning",
      category: "stone",
      stage: 2,
      title: "Schieferoberfläche prüfen",
      message: "Schiefer wird im Außenbereich häufiger naturspalt oder gebürstet ausgeführt.",
      action: "Polierbarkeit am konkreten Schiefermuster bestätigen.",
      pdfMessage: "Polished slate finish requires confirmation on the selected commercial stone",
    }));
  }
  if ((draft.material === "marmor_weiss" || draft.material === "marmor_grau") && draft.surface === "poliert") {
    issues.push(issue({
      id: "marble-exterior-finish",
      severity: "recommendation",
      category: "stone",
      stage: 2,
      title: "Marmor im Außenbereich bemustern",
      message: "Frost, Bewitterung und Glanzverlust hängen von Marmorsorte und Standort ab.",
      action: "Eignung und Pflegehinweis für den konkreten Marmor dokumentieren.",
      pdfMessage: "Confirm exterior durability and long-term finish of the selected marble",
    }));
  }
}

function addInscriptionIssues(draft: MonumentDraft, issues: ProductionIssue[]) {
  const letterHeight = draft.letterHeightMm;
  const lines = inscriptionLines(draft);
  if (letterHeight && draft.widthCm && lines.length) {
    const longestLine = lines.reduce((longest, line) => line.length > longest.length ? line : longest, "");
    const glyphFactor = draft.inscription?.font === "handschrift" ? 0.64 : 0.56;
    const estimatedWidthMm = longestLine.length * letterHeight * glyphFactor;
    const usableWidthMm = draft.widthCm * 10 * 0.74;
    if (estimatedWidthMm > usableWidthMm) {
      const severe = estimatedWidthMm > usableWidthMm * 1.18;
      issues.push(issue({
        id: "inscription-fit",
        severity: severe ? "blocker" : "warning",
        category: "inscription",
        stage: 3,
        title: "Inschrift benötigt mehr Satzbreite",
        message: `Die längste Zeile ist bei ${letterHeight} mm Schrifthöhe voraussichtlich zu breit für die nutzbare Schriftfläche.`,
        action: "Zeile umbrechen, Text kürzen oder Schrifthöhe und Layout fachlich anpassen.",
        pdfMessage: "Estimated inscription line width exceeds the usable face; signed typesetting layout required",
      }));
    }
  }
  if (letterHeight && letterHeight < (draft.form && UPRIGHT_FORMS.has(draft.form) ? 25 : 20)) {
    issues.push(issue({
      id: "letter-height-low",
      severity: "warning",
      category: "inscription",
      stage: 3,
      title: "Schrift möglicherweise zu klein",
      message: "Die gewählte Buchstabenhöhe kann aus üblicher Betrachtungsdistanz schwer lesbar sein.",
      action: "Schrifthöhe erhöhen oder ein maßstäbliches 1:1-Layout prüfen.",
      pdfMessage: `Letter height ${letterHeight} mm requires a full-scale legibility check`,
    }));
  }
  if (draft.engravingFinish === "sandgestrahlt" && (draft.engravingDepthMm ?? 0) < 2) {
    issues.push(issue({
      id: "engraving-depth-low",
      severity: "warning",
      category: "inscription",
      stage: 3,
      title: "Gravurtiefe knapp",
      message: "Unter 2 mm ist die Dauerhaftigkeit einer sandgestrahlten Vertiefung materialabhängig.",
      action: "Tiefe anhand Schriftgröße und Gestein bemustern.",
      pdfMessage: "Sandblasted engraving below 2 mm requires durability confirmation",
    }));
  }
  if (draft.material && DARK_MATERIALS.has(draft.material) && draft.inscriptionColor === "anthrazit") {
    issues.push(issue({
      id: "low-contrast-dark",
      severity: "blocker",
      category: "inscription",
      stage: 3,
      title: "Zu geringer Schriftkontrast",
      message: "Anthrazit ist auf dem gewählten dunklen Stein voraussichtlich schlecht lesbar.",
      action: "Automatischen Kontrast, Weiß, Gold, Silber oder Bronze wählen.",
      pdfMessage: "Anthracite lettering on the selected dark stone has insufficient contrast",
    }));
  }
  if (draft.material && LIGHT_MATERIALS.has(draft.material) && draft.inscriptionColor === "weiss") {
    issues.push(issue({
      id: "low-contrast-light",
      severity: "blocker",
      category: "inscription",
      stage: 3,
      title: "Zu geringer Schriftkontrast",
      message: "Weiße Schrift ist auf dem gewählten hellen Stein voraussichtlich schlecht lesbar.",
      action: "Anthrazit, Bronze oder eine bemusterte dunkle Farbfüllung wählen.",
      pdfMessage: "White lettering on the selected light stone has insufficient contrast",
    }));
  }
  if (draft.engravingFinish === "laser" && draft.material !== "granit_schwarz" && draft.material !== "granit_grau") {
    issues.push(issue({
      id: "laser-material",
      severity: "warning",
      category: "inscription",
      stage: 3,
      title: "Lasergravur vorab bemustern",
      message: "Kontrast und Detailzeichnung der Lasergravur hängen stark von Farbe und Korn des Steins ab.",
      action: "Muster auf dem konkreten Naturstein anfordern.",
      pdfMessage: "Laser engraving contrast must be sampled on the selected stone",
    }));
  }
}

export function assessProductionReadiness(draft: MonumentDraft): ProductionReadiness {
  const checklist = buildChecklist(draft);
  const score = checklist.reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);
  const issues: ProductionIssue[] = [];
  addMissingDataIssues(draft, issues);
  addCompatibilityIssues(draft, issues);
  addInscriptionIssues(draft, issues);

  const hasBlocker = issues.some((item) => item.severity === "blocker");
  const status = score >= 90 && !hasBlocker
    ? "quote_ready"
    : score >= 65
      ? "review_required"
      : "incomplete";

  return {
    score,
    status,
    checklist,
    issues,
    releaseRequirements: RELEASE_REQUIREMENTS,
  };
}
