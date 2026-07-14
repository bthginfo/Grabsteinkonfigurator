"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "zustand/react";
import { MonumentPreview } from "@/components/preview/MonumentPreview";
import {
  saveDraftConfiguration,
  submitOrderAction,
} from "@/lib/actions/draft-actions";
import {
  validateConfiguratorStage,
  type FormTyp,
  type Grabtyp,
  type MonumentDraft,
} from "@/lib/config/monument-schema";
import { calculatePrice, type PriceCatalog } from "@/lib/pricing/calculate";
import { createWizardStore, type WizardStore } from "./wizard-store";

const STAGES = [
  { number: 1, label: "Modell" },
  { number: 2, label: "Stein" },
  { number: 3, label: "Inschrift" },
  { number: 4, label: "Ausstattung" },
  { number: 5, label: "Anfrage" },
] as const;

const GRAVE_TYPES = [
  { value: "einzelgrab", label: "Einzelgrab", description: "Klassisches Grabmal für eine Grabstelle" },
  { value: "urnengrab", label: "Urnengrab", description: "Kompakte Maße für eine Urnengrabstätte" },
  { value: "familiengrab", label: "Familiengrab", description: "Breitere Anlage für mehrere Grabstellen" },
  { value: "kindergrab", label: "Kindergrab", description: "Behutsame, kleinere Gestaltung" },
  { value: "gedenkstein", label: "Gedenkstein", description: "Freistehender Erinnerungsstein" },
] as const;

const FORMS = [
  { value: "stele", label: "Stele", description: "Schlank und aufrecht" },
  { value: "breitstein", label: "Breitstein", description: "Breit und ruhig für mehrere Namen" },
  { value: "liegestein", label: "Liegestein", description: "Flache Platte mit geringer Neigung" },
  { value: "felsen", label: "Felsen", description: "Natürlich und individuell" },
  { value: "herz", label: "Herz auf Sockel", description: "Gerundete Herzform mit Standfuß" },
  { value: "buch", label: "Buch", description: "Aufgeschlagene Buchform" },
  { value: "kissenstein", label: "Kissenstein", description: "Kompakter Keil mit geneigter Schriftfläche" },
  { value: "kreuz", label: "Kreuz", description: "Klassisch christlich" },
  { value: "sockelanlage", label: "Sockelanlage", description: "Repräsentativ mit Sockel" },
] as const;

const FORM_RECOMMENDATIONS: Record<Grabtyp, readonly FormTyp[]> = {
  einzelgrab: ["stele", "sockelanlage", "felsen", "herz", "kreuz", "liegestein"],
  urnengrab: ["kissenstein", "liegestein", "stele", "buch", "herz", "felsen"],
  familiengrab: ["breitstein", "sockelanlage", "felsen", "stele", "liegestein"],
  kindergrab: ["herz", "kissenstein", "buch", "stele", "kreuz"],
  gedenkstein: ["felsen", "stele", "sockelanlage", "breitstein", "kreuz"],
};

const GRAVE_TYPE_NOTES: Record<Grabtyp, string> = {
  einzelgrab: "Typisch sind aufrechte Hochsteine um 80-100 cm Höhe und 40-60 cm Breite.",
  urnengrab: "Kompakte Stelen, Liege- und Kissensteine nutzen die kleinere Grabfläche sinnvoll.",
  familiengrab: "Breitsteine und Sockelanlagen schaffen Platz für mehrere Namen und Grabstellen.",
  kindergrab: "Kleinere Herz-, Buch- und Kissenformen wirken maßstäblich und zurückhaltend.",
  gedenkstein: "Findling, Stele und freiere Anlagen eignen sich für Orte außerhalb klassischer Grabfelder.",
};

function recommendedForms(grabtyp?: Grabtyp) {
  if (!grabtyp) return [];
  return FORM_RECOMMENDATIONS[grabtyp]
    .map((value, index) => {
      const form = FORMS.find((item) => item.value === value);
      return form ? { ...form, badge: index === 0 ? "Empfohlen" : undefined } : null;
    })
    .filter((form): form is NonNullable<typeof form> => Boolean(form));
}

function defaultDimensions(grabtyp: Grabtyp, form: FormTyp) {
  if (form === "liegestein") {
    return grabtyp === "familiengrab"
      ? { heightCm: 20, widthCm: 80, depthCm: 50 }
      : { heightCm: 12, widthCm: 50, depthCm: 40 };
  }
  if (form === "kissenstein") return { heightCm: 18, widthCm: 50, depthCm: 40 };
  if (form === "breitstein") return { heightCm: 85, widthCm: 125, depthCm: 18 };
  if (form === "herz") {
    return grabtyp === "kindergrab"
      ? { heightCm: 50, widthCm: 38, depthCm: 10 }
      : { heightCm: 76, widthCm: 50, depthCm: 14 };
  }
  if (form === "buch") return { heightCm: 18, widthCm: 55, depthCm: 38 };
  if (grabtyp === "urnengrab") return { heightCm: 55, widthCm: 36, depthCm: 10 };
  if (grabtyp === "kindergrab") return { heightCm: 55, widthCm: 38, depthCm: 10 };
  if (grabtyp === "familiengrab") return { heightCm: 90, widthCm: 110, depthCm: 18 };
  if (grabtyp === "gedenkstein") return { heightCm: 75, widthCm: 50, depthCm: 15 };
  return { heightCm: 90, widthCm: 50, depthCm: 14 };
}

const MATERIALS = [
  { value: "granit_schwarz", label: "Granit Schwarz", description: "Tiefdunkel und kontrastreich", swatch: "#242526" },
  { value: "granit_grau", label: "Granit Grau", description: "Zeitlos und pflegeleicht", swatch: "#777b7e" },
  { value: "granit_rot", label: "Granit Rot", description: "Warm und markant", swatch: "#78504d" },
  { value: "granit_gruen", label: "Granit Grün", description: "Ruhige, natürliche Tiefe", swatch: "#435b50" },
  { value: "marmor_weiss", label: "Marmor Weiß", description: "Hell und fein gezeichnet", swatch: "#e5e1d8" },
  { value: "marmor_grau", label: "Marmor Grau", description: "Elegant mit lebendiger Aderung", swatch: "#aaa9a6" },
  { value: "sandstein", label: "Sandstein", description: "Warm und handwerklich", swatch: "#b89b72" },
  { value: "kalkstein", label: "Kalkstein", description: "Dezent und natürlich", swatch: "#aaa390" },
  { value: "schiefer", label: "Schiefer", description: "Dunkel mit klarer Struktur", swatch: "#3f484b" },
  { value: "heimischer_stein", label: "Heimischer Stein", description: "Regional ausgewähltes Material", swatch: "#80786d" },
] as const;

const SURFACES = [
  ["poliert", "Poliert"],
  ["gestockt", "Gestockt"],
  ["geflammt", "Geflammt"],
  ["sandgestrahlt", "Sandgestrahlt"],
  ["gebuerstet", "Gebürstet"],
  ["naturspalt", "Naturspalt"],
  ["kombination", "Kombination"],
] as const;

const SURFACE_DETAILS = [
  { value: "poliert", label: "Poliert", description: "Tiefe Farbe, klare Spiegelungen" },
  { value: "gestockt", label: "Gestockt", description: "Hellere, punktuell raue Schlagstruktur" },
  { value: "geflammt", label: "Geflammt", description: "Leicht wellig, kristallin und matt" },
  { value: "sandgestrahlt", label: "Sandgestrahlt", description: "Fein und gleichmäßig aufgeraut" },
  { value: "gebuerstet", label: "Gebürstet", description: "Gerichtete Struktur mit Seidenglanz" },
  { value: "naturspalt", label: "Naturspalt", description: "Deutliche natürliche Höhen und Brüche" },
  { value: "kombination", label: "Kombination", description: "Polierte Schriftfläche, matte übrige Flächen" },
] as const;

const EDGE_PROFILES = [
  ["gefast_3mm", "3-mm-Fase"],
  ["gerundet_5mm", "5-mm-Rundung"],
  ["scharfkantig", "Scharfkantig, leicht gebrochen"],
  ["naturkante", "Handwerkliche Naturkante"],
] as const;

const INSCRIPTION_COLORS = [
  ["kontrast_auto", "Automatischer Kontrast"],
  ["weiss", "Weiß"],
  ["anthrazit", "Anthrazit"],
  ["gold", "Goldton"],
  ["silber", "Silberton"],
  ["bronze", "Bronzeton"],
] as const;

const FINISHES = [
  ["sandgestrahlt", "Sandgestrahlt"],
  ["goldlack", "Goldlack"],
  ["vergoldet", "Blattgold"],
  ["silber", "Silber"],
  ["bronzebuchstaben", "Bronzebuchstaben"],
  ["farbig", "Farbig"],
  ["laser", "Lasergravur"],
] as const;

const ORNAMENTS = [
  ["rose", "Rose"],
  ["lilie", "Lilie"],
  ["aere", "Ähre"],
  ["kreuz_motiv", "Kreuz"],
  ["baum", "Baum des Lebens"],
] as const;

const BRONZE = [
  ["keins", "Kein Bronzezubehör"],
  ["kreuz_standard", "Bronzekreuz Standard"],
  ["kreuz_premium", "Bronzekreuz Premium"],
  ["vase", "Vase oder Schale"],
  ["laterne", "Laterne"],
  ["weihwasserbecken", "Weihwasserbecken"],
  ["sonder", "Sonderanfertigung"],
] as const;

const ENCLOSURES = [
  ["keine", "Keine Einfassung"],
  ["granit_4seitig", "Granit, vierseitig"],
  ["abdeckplatte", "Abdeckplatte"],
  ["kieselpflaster", "Kieselpflasterung"],
  ["pflanzflaeche", "Pflanzfläche"],
] as const;

type InitialCustomer = {
  name: string | null;
  email: string | null;
  phone: string | null;
  postalCode: string | null;
  message: string | null;
};

export function WizardClient({
  orderId,
  initialDraft,
  initialStep,
  initialStatus,
  initialCustomer,
  catalog,
}: {
  orderId: string;
  initialDraft: MonumentDraft;
  initialStep: number;
  initialStatus: string;
  initialCustomer: InitialCustomer;
  catalog: PriceCatalog;
}) {
  const [store] = useState(() =>
    createWizardStore(orderId, initialDraft, initialStep),
  );
  return (
    <WizardInner
      store={store}
      initialStatus={initialStatus}
      initialCustomer={initialCustomer}
      catalog={catalog}
    />
  );
}

function WizardInner({
  store,
  initialStatus,
  initialCustomer,
  catalog,
}: {
  store: WizardStore;
  initialStatus: string;
  initialCustomer: InitialCustomer;
  catalog: PriceCatalog;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const step = useStore(store, (state) => state.step);
  const draft = useStore(store, (state) => state.draft);
  const patchDraft = useStore(store, (state) => state.patchDraft);
  const setStep = useStore(store, (state) => state.setStep);
  const orderId = useStore(store, (state) => state.orderId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitState, submitAction, submitPending] = useActionState(
    submitOrderAction,
    null,
  );

  useEffect(() => {
    if (step === 2 && (!draft.heightCm || !draft.widthCm || !draft.depthCm)) {
      const matching = catalog.bases.find(
        (base) =>
          base.grabtyp === draft.grabtyp &&
          base.form === draft.form &&
          (!draft.material || base.material === draft.material),
      );
      const researchedDefaults = draft.grabtyp && draft.form
        ? defaultDimensions(draft.grabtyp, draft.form)
        : { heightCm: 90, widthCm: 50, depthCm: 14 };
      patchDraft(matching
        ? { heightCm: matching.heightCm, widthCm: matching.widthCm, depthCm: matching.depthCm }
        : researchedDefaults);
    }
    if (step === 2 && !draft.edgeProfile) patchDraft({ edgeProfile: "gefast_3mm" });
    if (step === 3 && (!draft.letterHeightMm || draft.engravingDepthMm == null || !draft.inscriptionColor)) {
      patchDraft({
        letterHeightMm: draft.letterHeightMm ?? (draft.form === "buch" || draft.form === "liegestein" || draft.form === "kissenstein" ? 28 : 35),
        engravingDepthMm: draft.engravingDepthMm ?? 3,
        inscriptionColor: draft.inscriptionColor ?? "kontrast_auto",
      });
    }
    if (step === 4) {
      const defaults: Partial<MonumentDraft> = {};
      if (draft.ornaments === undefined) defaults.ornaments = [];
      if (draft.bronze === undefined) defaults.bronze = "keins";
      if (draft.enclosure === undefined) defaults.enclosure = "keine";
      if (draft.montage === undefined) defaults.montage = true;
      if (Object.keys(defaults).length) patchDraft(defaults);
    }
  }, [step, draft, patchDraft, catalog]);

  const price = calculatePrice(draft, catalog);

  const moveTo = (nextStep: number) => {
    const bounded = Math.min(5, Math.max(1, nextStep));
    setStep(bounded);
    router.replace(`${pathname}?step=${bounded}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setSaving(true);
    const result = await saveDraftConfiguration(orderId, store.getState().draft);
    setSaving(false);
    if (!result.ok) setError(result.error ?? "Entwurf konnte nicht gespeichert werden.");
    return result.ok;
  };

  const goNext = async () => {
    setError(null);
    const validation = validateConfiguratorStage(step, draft);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (await save()) moveTo(step + 1);
  };

  const goBack = async () => {
    setError(null);
    await save();
    moveTo(step - 1);
  };

  const submitted = initialStatus !== "draft" || submitState?.ok;
  const availableForms = recommendedForms(draft.grabtyp);

  const selectGraveType = (grabtyp: Grabtyp) => {
    const suitable = FORM_RECOMMENDATIONS[grabtyp];
    const form = suitable[0];
    patchDraft({ grabtyp, form, ...defaultDimensions(grabtyp, form) });
  };

  const selectForm = (form: FormTyp) => {
    if (!draft.grabtyp) return;
    patchDraft({ form, ...defaultDimensions(draft.grabtyp, form) });
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-5 lg:hidden">
        <StageProgress current={step} />
      </div>
      <div className="grid w-full min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.82fr)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_520px]">
      <section className={`${step === 5 ? "order-1" : "order-2"} min-w-0 bg-white p-5 sm:p-8 lg:order-1 lg:border lg:border-[#d9ddda] xl:p-10`}>
        <div className="hidden lg:block">
          <StageProgress current={step} />
        </div>

        <div className="mt-8 lg:mt-10">
          {step === 1 ? (
            <StageShell
              eyebrow="Grundform"
              title="Welches Grabmal möchten Sie gestalten?"
              description="Wählen Sie zuerst die Grabart und anschließend die gewünschte Form. Beides kann später geändert werden."
            >
              <FieldGroup legend="Grabart">
                <ChoiceGrid
                  options={GRAVE_TYPES}
                  value={draft.grabtyp}
                  onChange={(value) => selectGraveType(value as Grabtyp)}
                />
              </FieldGroup>
              <FieldGroup legend="Form">
                {draft.grabtyp ? (
                  <>
                    <p className="border-l-2 border-[#17624b] bg-[#f4f8f6] px-4 py-3 text-xs leading-5 text-[#56615b]">
                      {GRAVE_TYPE_NOTES[draft.grabtyp]} Die verbindlichen Maße richten sich nach der örtlichen Friedhofsordnung.
                    </p>
                    <ChoiceGrid
                      options={availableForms}
                      value={draft.form}
                      onChange={(value) => selectForm(value as FormTyp)}
                      compact
                    />
                  </>
                ) : (
                  <p className="border border-dashed border-[#cdd2ce] px-4 py-5 text-sm text-[#626a65]">Wählen Sie zuerst die Grabart. Danach erscheinen passende Formfamilien und Maße.</p>
                )}
              </FieldGroup>
            </StageShell>
          ) : null}

          {step === 2 ? (
            <StageShell
              eyebrow="Material und Maße"
              title="Wie soll der Stein wirken?"
              description="Material, Bearbeitung und Größe bestimmen Erscheinung und Richtpreis."
            >
              <FieldGroup legend="Material">
                <ChoiceGrid
                  options={MATERIALS}
                  value={draft.material}
                  onChange={(value) => patchDraft({ material: value as MonumentDraft["material"] })}
                  compact
                />
              </FieldGroup>
              <FieldGroup legend="Oberfläche">
                <SurfaceGrid
                  options={SURFACE_DETAILS}
                  value={draft.surface}
                  onChange={(value) => patchDraft({ surface: value as MonumentDraft["surface"] })}
                />
              </FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup legend="Kantenbearbeitung">
                  <SelectField
                    label="Kantenbearbeitung"
                    value={draft.edgeProfile ?? "gefast_3mm"}
                    options={EDGE_PROFILES}
                    onChange={(value) => patchDraft({ edgeProfile: value as MonumentDraft["edgeProfile"] })}
                  />
                </FieldGroup>
                <TextField
                  label="Stein-Handelsname, falls bekannt"
                  value={draft.stoneTradeName ?? ""}
                  placeholder="z. B. Nero Assoluto Zimbabwe"
                  onChange={(stoneTradeName) => patchDraft({ stoneTradeName })}
                />
              </div>
              <FieldGroup legend="Maße in Zentimetern">
                <div className="grid grid-cols-3 gap-3">
                  <NumberField label="Höhe" value={draft.heightCm} min={6} max={250} onChange={(heightCm) => patchDraft({ heightCm })} />
                  <NumberField label="Breite" value={draft.widthCm} min={15} max={200} onChange={(widthCm) => patchDraft({ widthCm })} />
                  <NumberField label="Tiefe" value={draft.depthCm} min={4} max={40} onChange={(depthCm) => patchDraft({ depthCm })} />
                </div>
              </FieldGroup>
            </StageShell>
          ) : null}

          {step === 3 ? (
            <StageShell
              eyebrow="Persönliche Gestaltung"
              title="Die Inschrift auf dem Stein"
              description="Die Vorschau zeigt die Anordnung direkt auf dem gewählten Modell."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={draft.inscription?.name ?? ""}
                  placeholder="Maria Muster"
                  onChange={(name) => patchInscription(draft, patchDraft, { name })}
                />
                <TextField
                  label="Lebensdaten"
                  value={draft.inscription?.dates ?? ""}
                  placeholder="* 1942   † 2025"
                  onChange={(dates) => patchInscription(draft, patchDraft, { dates })}
                />
              </div>
              <TextAreaField
                label="Spruch oder Widmung"
                value={draft.inscription?.epitaph ?? ""}
                placeholder="In liebevoller Erinnerung"
                onChange={(epitaph) => patchInscription(draft, patchDraft, { epitaph })}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldGroup legend="Schriftstil">
                  <SegmentedOptions
                    options={[
                      ["antiqua", "Antiqua"],
                      ["kapitalelchen", "Kapitälchen"],
                      ["kursiv", "Kursiv"],
                      ["modern", "Modern"],
                      ["handschrift", "Handschrift"],
                    ]}
                    value={draft.inscription?.font ?? "antiqua"}
                    onChange={(font) => patchInscription(draft, patchDraft, { font })}
                    fontPreview
                  />
                </FieldGroup>
                <FieldGroup legend="Ausrichtung">
                  <SegmentedOptions
                    options={[["links", "Links"], ["mittig", "Mittig"], ["rechts", "Rechts"]]}
                    value={draft.inscription?.alignment ?? "mittig"}
                    onChange={(alignment) => patchInscription(draft, patchDraft, { alignment })}
                  />
                </FieldGroup>
              </div>
              <FieldGroup legend="Ausführung der Schrift">
                <SegmentedOptions
                  options={FINISHES}
                  value={draft.engravingFinish}
                  onChange={(value) => patchDraft({ engravingFinish: value as MonumentDraft["engravingFinish"] })}
                />
              </FieldGroup>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField label="Buchstabenhöhe" value={draft.letterHeightMm} min={10} max={120} unit="mm" onChange={(letterHeightMm) => patchDraft({ letterHeightMm })} />
                <NumberField label="Gravurtiefe" value={draft.engravingDepthMm} min={0} max={15} unit="mm" onChange={(engravingDepthMm) => patchDraft({ engravingDepthMm })} />
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-[#626a65]">Farbfüllung</span>
                  <SelectField
                    label="Farbfüllung"
                    value={draft.inscriptionColor ?? "kontrast_auto"}
                    options={INSCRIPTION_COLORS}
                    onChange={(value) => patchDraft({ inscriptionColor: value as MonumentDraft["inscriptionColor"] })}
                  />
                </label>
              </div>
            </StageShell>
          ) : null}

          {step === 4 ? (
            <StageShell
              eyebrow="Details"
              title="Motive und Ausstattung"
              description="Ergänzen Sie den Stein und die Grabanlage. Leere Auswahl ist ebenfalls möglich."
            >
              <FieldGroup legend="Motive">
                <ToggleGrid
                  options={ORNAMENTS}
                  selected={draft.ornaments ?? []}
                  onChange={(ornaments) => patchDraft({ ornaments })}
                />
              </FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <FieldGroup legend="Bronze">
                  <SelectField
                    label="Bronze"
                    value={draft.bronze ?? "keins"}
                    options={BRONZE}
                    onChange={(value) => patchDraft({ bronze: value as MonumentDraft["bronze"] })}
                  />
                </FieldGroup>
                <FieldGroup legend="Einfassung">
                  <SelectField
                    label="Einfassung"
                    value={draft.enclosure ?? "keine"}
                    options={ENCLOSURES}
                    onChange={(value) => patchDraft({ enclosure: value as MonumentDraft["enclosure"] })}
                  />
                </FieldGroup>
              </div>
              <label className="flex min-h-16 cursor-pointer items-start gap-3 border-t border-[#d9ddda] pt-5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 accent-[#17624b]"
                  checked={draft.montage !== false}
                  onChange={(event) => patchDraft({ montage: event.target.checked })}
                />
                <span>
                  <span className="block font-semibold text-[#202421]">Montage und Versetzung einplanen</span>
                  <span className="mt-1 block leading-5 text-[#626a65]">Pauschale laut Katalog; die endgültigen Kosten werden nach Ortstermin bestätigt.</span>
                </span>
              </label>
              <FieldGroup legend="Friedhof und Grablage für das Spec-Sheet">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Friedhof" value={draft.cemeteryName ?? ""} placeholder="Name des Friedhofs" onChange={(cemeteryName) => patchDraft({ cemeteryName })} />
                  <TextField label="Ort" value={draft.cemeteryCity ?? ""} placeholder="Ort / Gemeinde" onChange={(cemeteryCity) => patchDraft({ cemeteryCity })} />
                  <TextField label="Feld / Abteilung" value={draft.graveField ?? ""} placeholder="z. B. Feld 12, Reihe B" onChange={(graveField) => patchDraft({ graveField })} />
                  <TextField label="Grabnummer" value={draft.graveNumber ?? ""} placeholder="z. B. 47" onChange={(graveNumber) => patchDraft({ graveNumber })} />
                </div>
              </FieldGroup>
            </StageShell>
          ) : null}

          {step === 5 ? (
            <StageShell
              eyebrow="Zusammenfassung"
              title="Ihre unverbindliche Anfrage"
              description="Prüfen Sie die Auswahl und senden Sie sie zur persönlichen Beratung."
            >
              <ConfigurationSummary draft={draft} />
              {submitted ? (
                <div className="border-l-4 border-[#17624b] bg-[#edf6f2] p-5 text-[#174b3b]">
                  <p className="font-semibold">Anfrage ist eingegangen</p>
                  <p className="mt-1 text-sm">{submitState?.message ?? "Dieser Entwurf wurde bereits als Anfrage übermittelt."}</p>
                </div>
              ) : (
                <form action={submitAction} className="flex flex-col gap-4 border-t border-[#d9ddda] pt-6">
                  <input type="hidden" name="orderId" value={orderId} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField name="name" label="Ihr Name" required defaultValue={initialCustomer.name ?? ""} />
                    <TextField name="email" type="email" label="E-Mail" required defaultValue={initialCustomer.email ?? ""} />
                    <TextField name="phone" type="tel" label="Telefon (optional)" defaultValue={initialCustomer.phone ?? ""} />
                    <TextField name="postalCode" label="Postleitzahl" required defaultValue={initialCustomer.postalCode ?? ""} />
                  </div>
                  <TextAreaField name="message" label="Hinweise oder Wünsche (optional)" defaultValue={initialCustomer.message ?? ""} />
                  <label className="flex items-start gap-3 text-sm leading-5 text-[#626a65]">
                    <input className="mt-0.5 size-5 accent-[#17624b]" type="checkbox" name="consent" required />
                    <span>Ich stimme zu, dass meine Angaben zur Bearbeitung dieser Anfrage verwendet werden.</span>
                  </label>
                  {submitState?.error ? <p className="text-sm text-red-700" role="alert">{submitState.error}</p> : null}
                  <button
                    type="submit"
                    disabled={submitPending}
                    className="min-h-12 w-full bg-[#17624b] px-6 text-sm font-semibold text-white transition hover:bg-[#104736] disabled:cursor-wait disabled:opacity-50 sm:w-fit"
                  >
                    {submitPending ? "Anfrage wird gesendet..." : "Unverbindliche Anfrage senden"}
                  </button>
                </form>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <a className="inline-flex min-h-11 items-center border border-[#cdd2ce] px-4 font-medium text-[#4f5752] hover:border-[#17624b] hover:text-[#17624b]" href={`/api/orders/${orderId}/pdf?variant=customer-de`}>PDF-Angebot</a>
                <a className="inline-flex min-h-11 items-center border border-[#cdd2ce] px-4 font-medium text-[#4f5752] hover:border-[#17624b] hover:text-[#17624b]" href={`/api/orders/${orderId}/pdf?variant=supplier-en`}>Fertigungs-Spec (EN)</a>
              </div>
            </StageShell>
          ) : null}
        </div>

        {error ? (
          <p className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {error}
          </p>
        ) : null}

        <div className={`${step === 5 ? "static" : "sticky bottom-0 z-20 shadow-[0_-12px_24px_rgba(32,36,33,0.06)] backdrop-blur"} -mx-5 mt-10 flex items-center justify-between border-t border-[#d9ddda] bg-white/95 px-5 py-4 sm:-mx-8 sm:px-8 lg:static lg:-mx-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:shadow-none`}>
          <button
            type="button"
            onClick={() => void goBack()}
            disabled={step === 1 || saving}
            className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#626a65] hover:text-[#17624b] disabled:invisible"
          >
            <span aria-hidden="true" className="mr-2">←</span> Zurück
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={saving}
              className="inline-flex min-h-12 items-center bg-[#17624b] px-6 text-sm font-semibold text-white transition hover:bg-[#104736] active:translate-y-px disabled:cursor-wait disabled:opacity-55"
            >
              {saving ? "Wird gespeichert..." : "Weiter"} {!saving ? <span aria-hidden="true" className="ml-3">→</span> : null}
            </button>
          ) : null}
        </div>
      </section>

      <aside className={`${step === 5 ? "order-2" : "order-1"} min-w-0 lg:sticky lg:top-6 lg:order-2`}>
        <div className="atelier-preview atelier-shadow overflow-hidden border border-[#cdd2ce] bg-white">
          <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#d9ddda] bg-white px-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#17624b]">Live-Entwurf</p>
              <p className="mt-0.5 text-xs text-[#626a65]">{FORMS.find((item) => item.value === draft.form)?.label ?? "Form wählen"} · {MATERIALS.find((item) => item.value === draft.material)?.label ?? "Material wählen"}</p>
            </div>
            <span className="flex items-center gap-2 text-[11px] text-[#747b76]"><span className="size-1.5 rounded-full bg-[#17624b]" />Aktuell</span>
          </div>
          <MonumentPreview draft={draft} orderId={orderId} embedded />
          <PricePanel price={price} currency={catalog.currency} taxLabel={catalog.taxLabel} />
        </div>
        <p className="mt-3 px-1 text-xs leading-relaxed text-[#747b76]">
          Richtpreis auf Basis der aktuellen Auswahl. Naturstein, Fundament und örtliche Gegebenheiten werden vor einem verbindlichen Angebot geprüft.
        </p>
      </aside>
      </div>
    </div>
  );
}

function StageProgress({ current }: { current: number }) {
  return (
    <div className="border-b border-[#d9ddda] pb-5">
      <div className="mb-3 flex items-center justify-between sm:hidden">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#17624b]">Schritt {current} von 5</span>
        <span className="font-display text-lg text-[#202421]">{STAGES[current - 1]?.label}</span>
      </div>
    <ol className="grid grid-cols-5" aria-label="Fortschritt">
      {STAGES.map((stage) => (
        <li key={stage.number} className="relative">
          <div className={`absolute left-1/2 top-3 h-px w-full ${stage.number < current ? "bg-[#17624b]" : "bg-[#d9ddda]"} ${stage.number === 5 ? "hidden" : ""}`} />
          <div className="relative z-10 flex flex-col items-center sm:items-start">
            <span className={`flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold ${stage.number < current ? "border-[#17624b] bg-[#17624b] text-white" : stage.number === current ? "border-[#17624b] bg-white text-[#17624b] ring-4 ring-[#dbe9e3]" : "border-[#cdd2ce] bg-[#f4f5f3] text-[#747b76]"}`}>
              {stage.number < current ? "✓" : stage.number}
            </span>
            <span className={`mt-3 hidden text-xs sm:block ${stage.number === current ? "font-semibold text-[#202421]" : "text-[#747b76]"}`}>
              {stage.label}
            </span>
          </div>
        </li>
      ))}
    </ol>
    </div>
  );
}

function StageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#17624b]"><span className="h-px w-7 bg-[#17624b]" />{eyebrow}</p>
        <h1 className="font-display mt-3 text-3xl leading-tight text-[#202421] sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#626a65]">{description}</p>
      </header>
      {children}
    </div>
  );
}

function FieldGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-[#e1e4e2] pt-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 pr-3 text-sm font-semibold text-[#202421]">{legend}</legend>
      {children}
    </fieldset>
  );
}

type ChoiceOption = { value: string; label: string; description: string; swatch?: string; badge?: string };

function ChoiceGrid({ options, value, onChange, compact = false }: { options: readonly ChoiceOption[]; value?: string; onChange: (value: string) => void; compact?: boolean }) {
  return (
    <div className={`grid gap-2.5 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`group relative flex min-h-24 items-center gap-4 rounded-[6px] border px-4 py-3 text-left transition ${selected ? "border-[#17624b] bg-[#edf6f2] shadow-[inset_3px_0_0_#17624b]" : "border-[#d9ddda] bg-white hover:border-[#9ca59f] hover:bg-[#f8f9f7]"}`}
          >
            {option.swatch ? <span className="size-11 shrink-0 rounded-[3px] border border-black/15 shadow-inner" style={{ backgroundColor: option.swatch }} /> : <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected ? "border-[#17624b] bg-[#17624b] text-white" : "border-[#c7ccc8] bg-[#f4f5f3] text-[#747b76]"}`}>{selected ? "✓" : ""}</span>}
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#202421]">
                {option.label}
                {option.badge ? <span className="rounded-[3px] bg-[#dbe9e3] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#17624b]">{option.badge}</span> : null}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#626a65]">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SegmentedOptions({ options, value, onChange, fontPreview = false }: { options: readonly (readonly [string, string])[]; value?: string; onChange: (value: string) => void; fontPreview?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          aria-pressed={optionValue === value}
          onClick={() => onChange(optionValue)}
          className={`min-h-11 rounded-[4px] border px-4 py-2 text-sm transition ${fontPreview ? `font-preview-${optionValue} text-base` : ""} ${optionValue === value ? "border-[#17624b] bg-[#17624b] font-semibold text-white shadow-sm" : "border-[#d2d7d3] bg-white text-[#4f5752] hover:border-[#7b857f] hover:bg-[#f8f9f7]"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type SurfaceOption = { value: string; label: string; description: string };

function SurfaceSwatch({ surface }: { surface: string }) {
  if (surface === "poliert") {
    return <span className="relative size-12 shrink-0 overflow-hidden rounded-[3px] border border-black/15 bg-[#17191a]"><span className="absolute inset-y-0 left-4 w-2 rotate-12 bg-[#7e8280]" /></span>;
  }
  if (surface === "kombination") {
    return <span className="grid size-12 shrink-0 grid-cols-2 overflow-hidden rounded-[3px] border border-black/15"><span className="bg-[#202324]" /><span className="bg-[#8b8e8b]" /></span>;
  }
  if (surface === "gestockt" || surface === "sandgestrahlt") {
    const dots = surface === "gestockt" ? 16 : 25;
    return (
      <span className={`grid size-12 shrink-0 ${surface === "gestockt" ? "grid-cols-4" : "grid-cols-5"} gap-1 rounded-[3px] border border-black/15 bg-[#858986] p-1.5`}>
        {Array.from({ length: dots }, (_, index) => <span key={index} className={`${surface === "gestockt" ? "size-1.5" : "size-1"} rounded-full bg-[#343837]`} />)}
      </span>
    );
  }
  const lines = surface === "gebuerstet" ? 9 : 6;
  return (
    <span className={`flex size-12 shrink-0 flex-col justify-center gap-1 overflow-hidden rounded-[3px] border border-black/15 ${surface === "naturspalt" ? "bg-[#454948]" : "bg-[#777b79]"}`}>
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={`block h-px bg-[#252827] ${surface === "naturspalt" ? (index % 2 ? "w-10" : "ml-2 w-8") : surface === "geflammt" ? (index % 2 ? "ml-1 w-11" : "w-9") : "w-full"}`} />
      ))}
    </span>
  );
}

function SurfaceGrid({ options, value, onChange }: { options: readonly SurfaceOption[]; value?: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex min-h-20 items-center gap-3 rounded-[5px] border p-3 text-left transition ${selected ? "border-[#17624b] bg-[#edf6f2] shadow-[inset_3px_0_0_#17624b]" : "border-[#d9ddda] bg-white hover:border-[#9ca59f]"}`}
          >
            <SurfaceSwatch surface={option.value} />
            <span>
              <span className="block text-sm font-semibold text-[#202421]">{option.label}</span>
              <span className="mt-0.5 block text-xs leading-4 text-[#626a65]">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ToggleGrid({ options, selected, onChange }: { options: readonly (readonly [string, string])[]; selected: string[]; onChange: (selected: string[]) => void }) {
  const selectedSet = new Set(selected);
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map(([value, label]) => {
        const active = selectedSet.has(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              const next = new Set(selected);
              if (active) next.delete(value); else next.add(value);
              onChange([...next]);
            }}
            className={`flex min-h-14 items-center gap-3 rounded-[5px] border px-4 py-3 text-left text-sm transition ${active ? "border-[#17624b] bg-[#edf6f2] font-semibold text-[#174b3b]" : "border-[#d9ddda] bg-white text-[#4f5752] hover:border-[#9ca59f]"}`}
          >
            <span className={`flex size-5 items-center justify-center rounded-[3px] border ${active ? "border-[#17624b] bg-[#17624b] text-xs text-white" : "border-[#bfc6c1] bg-[#f8f9f7]"}`}>{active ? "✓" : ""}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({ label, value, min, max, onChange, unit = "cm" }: { label: string; value?: number; min: number; max: number; onChange: (value: number) => void; unit?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-xs font-medium text-[#626a65]">{label}</span>
      <div className="relative">
        <input className="min-h-12 w-full rounded-[4px] border border-[#cdd2ce] bg-white px-3 py-2.5 pr-10 text-[#202421] transition hover:border-[#9ca59f] focus:border-[#17624b]" type="number" min={min} max={max} value={value ?? ""} onChange={(event) => onChange(Number(event.target.value))} />
        <span className="pointer-events-none absolute right-3 top-3 text-sm text-[#747b76]">{unit}</span>
      </div>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, name, type = "text", required, defaultValue }: { label: string; value?: string; onChange?: (value: string) => void; placeholder?: string; name?: string; type?: string; required?: boolean; defaultValue?: string }) {
  const controlled = onChange !== undefined;
  return (
    <label className="text-sm">
      <span className="mb-1.5 block font-medium text-[#343a36]">{label}</span>
      <input className="min-h-12 w-full rounded-[4px] border border-[#cdd2ce] bg-white px-3.5 py-2.5 text-[#202421] placeholder:text-[#969d98] transition hover:border-[#9ca59f] focus:border-[#17624b]" name={name} type={type} required={required} placeholder={placeholder} {...(controlled ? { value: value ?? "", onChange: (event) => onChange(event.target.value) } : { defaultValue })} />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, name, defaultValue }: { label: string; value?: string; onChange?: (value: string) => void; placeholder?: string; name?: string; defaultValue?: string }) {
  const controlled = onChange !== undefined;
  return (
    <label className="text-sm">
      <span className="mb-1.5 block font-medium text-[#343a36]">{label}</span>
      <textarea className="min-h-28 w-full resize-y rounded-[4px] border border-[#cdd2ce] bg-white px-3.5 py-3 text-[#202421] placeholder:text-[#969d98] transition hover:border-[#9ca59f] focus:border-[#17624b]" name={name} placeholder={placeholder} {...(controlled ? { value: value ?? "", onChange: (event) => onChange(event.target.value) } : { defaultValue })} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void }) {
  return (
    <select aria-label={label} className="min-h-12 w-full rounded-[4px] border border-[#cdd2ce] bg-white px-3.5 py-2.5 text-sm text-[#202421] transition hover:border-[#9ca59f] focus:border-[#17624b]" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
    </select>
  );
}

function patchInscription(draft: MonumentDraft, patchDraft: (patch: Partial<MonumentDraft>) => void, patch: Record<string, string>) {
  patchDraft({
    inscription: {
      name: draft.inscription?.name ?? "",
      dates: draft.inscription?.dates,
      epitaph: draft.inscription?.epitaph,
      font: draft.inscription?.font ?? "antiqua",
      alignment: draft.inscription?.alignment ?? "mittig",
      ...patch,
    } as NonNullable<MonumentDraft["inscription"]>,
  });
}

function PricePanel({ price, currency, taxLabel }: { price: ReturnType<typeof calculatePrice>; currency: string; taxLabel?: string }) {
  if (!price.canCalculate) {
    return (
      <div className="border-t border-[#d9ddda] bg-white p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#747b76]">Richtpreis</p>
        <p className="mt-2 text-sm leading-relaxed text-[#626a65]">{price.reason}</p>
      </div>
    );
  }
  const formatter = new Intl.NumberFormat("de-DE", { style: "currency", currency });
  return (
    <div className="border-t border-[#d9ddda] bg-white p-5 sm:p-6">
      <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#747b76]">Richtpreis inkl. USt</p>
          <p className="font-display mt-1 text-3xl text-[#202421]">{formatter.format(price.totalGross)}</p>
        </div>
        <span className="max-w-full text-xs text-[#747b76] sm:text-right">{taxLabel}</span>
      </div>
      <div className="mt-4 space-y-2.5 border-t border-[#e1e4e2] pt-4 text-xs">
        {price.lines.map((line) => (
          <div key={line.id} className="flex justify-between gap-3 text-[#626a65]">
            <span className="min-w-0 truncate">{line.label}</span>
            <span className="shrink-0 tabular-nums">{formatter.format(line.lineTotalNet)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigurationSummary({ draft }: { draft: MonumentDraft }) {
  const rows = [
    ["Grabart", GRAVE_TYPES.find((item) => item.value === draft.grabtyp)?.label],
    ["Form", FORMS.find((item) => item.value === draft.form)?.label],
    ["Material", MATERIALS.find((item) => item.value === draft.material)?.label],
    ["Handelsname", draft.stoneTradeName],
    ["Oberfläche", SURFACES.find(([value]) => value === draft.surface)?.[1]],
    ["Kante", EDGE_PROFILES.find(([value]) => value === draft.edgeProfile)?.[1]],
    ["Maße", draft.heightCm && draft.widthCm && draft.depthCm ? `${draft.heightCm} × ${draft.widthCm} × ${draft.depthCm} cm` : undefined],
    ["Inschrift", draft.inscription?.name],
    ["Schrifthöhe", draft.letterHeightMm ? `${draft.letterHeightMm} mm` : undefined],
    ["Friedhof", [draft.cemeteryName, draft.cemeteryCity].filter(Boolean).join(", ") || undefined],
    ["Einfassung", ENCLOSURES.find(([value]) => value === draft.enclosure)?.[1]],
  ];
  return (
    <dl className="divide-y divide-[#e1e4e2] border-y border-[#d9ddda] text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-3">
          <dt className="text-[#747b76]">{label}</dt>
          <dd className="font-semibold text-[#202421]">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
