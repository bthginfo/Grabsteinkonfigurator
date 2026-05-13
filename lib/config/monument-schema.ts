import { z } from "zod";

export const grabtypEnum = z.enum([
  "einzelgrab",
  "urnengrab",
  "familiengrab",
  "kindergrab",
  "gedenkstein",
]);
export type Grabtyp = z.infer<typeof grabtypEnum>;

export const formEnum = z.enum([
  "stele",
  "liegestein",
  "felsen",
  "herz",
  "buch",
  "kissenstein",
  "kreuz",
  "sockelanlage",
]);
export type FormTyp = z.infer<typeof formEnum>;

export const materialEnum = z.enum([
  "granit_schwarz",
  "granit_grau",
  "granit_rot",
  "granit_gruen",
  "marmor_weiss",
  "marmor_grau",
  "sandstein",
  "kalkstein",
  "schiefer",
  "heimischer_stein",
]);
export type Material = z.infer<typeof materialEnum>;

export const surfaceEnum = z.enum([
  "poliert",
  "gestockt",
  "geflammt",
  "sandgestrahlt",
  "gebuerstet",
  "naturspalt",
  "kombination",
]);
export type Surface = z.infer<typeof surfaceEnum>;

export const fontEnum = z.enum([
  "kapitalelchen",
  "kursiv",
  "antiqua",
  "modern",
  "handschrift",
]);
export type InschriftFont = z.infer<typeof fontEnum>;

export const alignmentEnum = z.enum(["links", "mittig", "rechts"]);
export type Alignment = z.infer<typeof alignmentEnum>;

export const engravingFinishEnum = z.enum([
  "sandgestrahlt",
  "goldlack",
  "vergoldet",
  "silber",
  "bronzebuchstaben",
  "farbig",
  "laser",
]);
export type EngravingFinish = z.infer<typeof engravingFinishEnum>;

export const bronzeAddonEnum = z.enum([
  "keins",
  "kreuz_standard",
  "kreuz_premium",
  "vase",
  "laterne",
  "weihwasserbecken",
  "sonder",
]);
export type BronzeAddon = z.infer<typeof bronzeAddonEnum>;

export const enclosureEnum = z.enum([
  "keine",
  "granit_4seitig",
  "abdeckplatte",
  "kieselpflaster",
  "pflanzflaeche",
]);
export type Enclosure = z.infer<typeof enclosureEnum>;

export const inscriptionSchema = z.object({
  name: z.string().min(1, "Name eingeben").max(120),
  dates: z.string().max(80).optional(),
  epitaph: z.string().max(400).optional(),
  font: fontEnum,
  alignment: alignmentEnum,
});
export type Inscription = z.infer<typeof inscriptionSchema>;

/** Vollständige Konfiguration (nach Schritt 10); Schritt 11 = Zusammenfassung. */
export const monumentConfigurationSchema = z.object({
  schemaVersion: z.literal(1),
  grabtyp: grabtypEnum,
  form: formEnum,
  material: materialEnum,
  surface: surfaceEnum,
  heightCm: z.number().min(20).max(250),
  widthCm: z.number().min(15).max(200),
  depthCm: z.number().min(4).max(40),
  inscription: inscriptionSchema,
  engravingFinish: engravingFinishEnum,
  ornaments: z.array(z.string().max(64)).max(12).default([]),
  bronze: bronzeAddonEnum,
  enclosure: enclosureEnum,
  montage: z.boolean().default(true),
});
export type MonumentConfiguration = z.infer<typeof monumentConfigurationSchema>;

/** Entwurf (optional Felder) — wird in der DB gespeichert. */
export const monumentDraftSchema = z.object({
  schemaVersion: z.literal(1),
  grabtyp: grabtypEnum.optional(),
  form: formEnum.optional(),
  material: materialEnum.optional(),
  surface: surfaceEnum.optional(),
  heightCm: z.number().min(20).max(250).optional(),
  widthCm: z.number().min(15).max(200).optional(),
  depthCm: z.number().min(4).max(40).optional(),
  inscription: inscriptionSchema.optional(),
  engravingFinish: engravingFinishEnum.optional(),
  ornaments: z.array(z.string().max(64)).max(12).optional(),
  bronze: bronzeAddonEnum.optional(),
  enclosure: enclosureEnum.optional(),
  montage: z.boolean().optional(),
});

export type MonumentDraft = z.infer<typeof monumentDraftSchema>;

export function parseMonumentDraft(raw: unknown): MonumentDraft {
  const parsed = monumentDraftSchema.safeParse(raw);
  if (!parsed.success) {
    return { schemaVersion: 1 };
  }
  return parsed.data;
}

export function defaultMonumentDraft(): MonumentDraft {
  return { schemaVersion: 1 };
}

/** Kumulative Validierung für Schritte 1–10 (Schritt 11 = nur Anzeige). */
export function validateWizardStep(
  step: number,
  draft: MonumentDraft,
): { ok: true } | { ok: false; message: string } {
  if (step < 1 || step > 10) return { ok: true };
  const checks: [boolean, string][] = [
    [Boolean(draft.grabtyp), "Bitte einen Grabtyp wählen."],
    [Boolean(draft.form), "Bitte eine Form wählen."],
    [Boolean(draft.material), "Bitte ein Material wählen."],
    [Boolean(draft.surface), "Bitte eine Oberfläche wählen."],
    [
      draft.heightCm != null && draft.widthCm != null && draft.depthCm != null,
      "Bitte gültige Maße (H × B × T) eingeben.",
    ],
    [
      inscriptionSchema.safeParse(draft.inscription ?? {}).success,
      "Bitte Inschrift prüfen (Name, Schriftart, Ausrichtung).",
    ],
    [Boolean(draft.engravingFinish), "Bitte eine Gravur-Veredelung wählen."],
    [draft.ornaments !== undefined, "Bitte Ornamente bestätigen (auch ohne Motive)."],
    [draft.bronze !== undefined && draft.bronze !== null, "Bitte Bronzezubehör wählen."],
    [draft.enclosure !== undefined && draft.enclosure !== null, "Bitte Einfassung wählen."],
  ];
  const idx = step - 1;
  for (let i = 0; i <= idx; i++) {
    const [pass, msg] = checks[i]!;
    if (!pass) return { ok: false, message: msg };
  }
  return { ok: true };
}

export function isConfigurationComplete(
  draft: MonumentDraft,
): draft is MonumentConfiguration {
  const r = monumentConfigurationSchema.safeParse(draft);
  return r.success;
}
