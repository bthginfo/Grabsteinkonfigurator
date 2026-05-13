"use client";

import { useEffect, useState } from "react";
import { useStore } from "zustand/react";
import catalogSample from "@/config/catalog/sample.json";
import {
  validateWizardStep,
} from "@/lib/config/monument-schema";
import { wizardStepLabels, WIZARD_SUMMARY_STEP } from "@/lib/config/wizard-steps";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import { saveDraftConfiguration } from "@/lib/actions/draft-actions";
import { calculatePrice } from "@/lib/pricing/calculate";
import { createWizardStore, type WizardStore } from "./wizard-store";

type CatalogBase = (typeof catalogSample.bases)[number];

function suggestDimensions(draft: MonumentDraft): {
  heightCm: number;
  widthCm: number;
  depthCm: number;
} {
  const bases = catalogSample.bases as CatalogBase[];
  const m = bases.find(
    (b) =>
      b.grabtyp === draft.grabtyp &&
      b.form === draft.form &&
      b.material === draft.material &&
      b.surface === draft.surface,
  );
  if (m) {
    return {
      heightCm: m.heightCm,
      widthCm: m.widthCm,
      depthCm: m.depthCm,
    };
  }
  return { heightCm: 60, widthCm: 40, depthCm: 10 };
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function WizardClient({
  orderId,
  initialDraft,
}: {
  orderId: string;
  initialDraft: MonumentDraft;
}) {
  const [store] = useState(() => createWizardStore(orderId, initialDraft));
  return <WizardInner store={store} />;
}

function WizardInner({ store }: { store: WizardStore }) {
  const step = useStore(store, (s) => s.step);
  const draft = useStore(store, (s) => s.draft);
  const patchDraft = useStore(store, (s) => s.patchDraft);
  const setStep = useStore(store, (s) => s.setStep);
  const orderId = useStore(store, (s) => s.orderId);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 5) {
      if (
        draft.heightCm == null ||
        draft.widthCm == null ||
        draft.depthCm == null
      ) {
        patchDraft(suggestDimensions(draft));
      }
    }
    if (step === 8 && draft.ornaments === undefined) {
      patchDraft({ ornaments: [] });
    }
    if (step === 9 && draft.bronze === undefined) {
      patchDraft({ bronze: "keins" });
    }
    if (step === 10 && draft.enclosure === undefined) {
      patchDraft({ enclosure: "keine" });
    }
  }, [step, draft, patchDraft]);

  const goNext = async () => {
    setError(null);
    const v = validateWizardStep(step, draft);
    if (!v.ok) {
      setError(v.message);
      return;
    }
    const res = await saveDraftConfiguration(orderId, store.getState().draft);
    if (!res.ok) {
      setError(res.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    if (step < WIZARD_SUMMARY_STEP) {
      setStep(step + 1);
    }
  };

  const goBack = async () => {
    setError(null);
    if (step <= 1) return;
    await saveDraftConfiguration(orderId, store.getState().draft);
    setStep(step - 1);
  };

  const price = calculatePrice(draft, catalogSample);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Schritt {step} von {WIZARD_SUMMARY_STEP}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {wizardStepLabels[step] ?? "Konfiguration"}
        </h1>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-800 transition-[width] dark:bg-zinc-200"
            style={{ width: `${(step / WIZARD_SUMMARY_STEP) * 100}%` }}
          />
        </div>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <SelectField
          label="Grabtyp"
          value={draft.grabtyp ?? ""}
          onChange={(v) => patchDraft({ grabtyp: v as MonumentDraft["grabtyp"] })}
          options={[
            ["einzelgrab", "Einzelgrab"],
            ["urnengrab", "Urnengrab"],
            ["familiengrab", "Familiengrab / Doppelgrab"],
            ["kindergrab", "Kindergrab"],
            ["gedenkstein", "Gedenkstein"],
          ]}
        />
      ) : null}

      {step === 2 ? (
        <SelectField
          label="Form & Modell"
          value={draft.form ?? ""}
          onChange={(v) => patchDraft({ form: v as MonumentDraft["form"] })}
          options={[
            ["stele", "Stele"],
            ["liegestein", "Liegestein"],
            ["felsen", "Felsen / Findling"],
            ["herz", "Herz"],
            ["buch", "Buch"],
            ["kissenstein", "Kissenstein"],
            ["kreuz", "Kreuz"],
            ["sockelanlage", "Sockelanlage"],
          ]}
        />
      ) : null}

      {step === 3 ? (
        <SelectField
          label="Material"
          value={draft.material ?? ""}
          onChange={(v) => patchDraft({ material: v as MonumentDraft["material"] })}
          options={[
            ["granit_schwarz", "Granit schwarz"],
            ["granit_grau", "Granit grau"],
            ["granit_rot", "Granit rot"],
            ["granit_gruen", "Granit grün"],
            ["marmor_weiss", "Marmor weiß"],
            ["marmor_grau", "Marmor grau"],
            ["sandstein", "Sandstein"],
            ["kalkstein", "Kalkstein"],
            ["schiefer", "Schiefer"],
            ["heimischer_stein", "Heimische Steine"],
          ]}
        />
      ) : null}

      {step === 4 ? (
        <SelectField
          label="Oberfläche & Veredelung"
          value={draft.surface ?? ""}
          onChange={(v) => patchDraft({ surface: v as MonumentDraft["surface"] })}
          options={[
            ["poliert", "Poliert"],
            ["gestockt", "Gestockt"],
            ["geflammt", "Geflammt"],
            ["sandgestrahlt", "Sandgestrahlt"],
            ["gebuerstet", "Gebürstet"],
            ["naturspalt", "Naturspaltung"],
            ["kombination", "Kombination"],
          ]}
        />
      ) : null}

      {step === 5 ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Höhe (cm)"
            value={draft.heightCm ?? ""}
            onChange={(n) => patchDraft({ heightCm: n })}
          />
          <NumberField
            label="Breite (cm)"
            value={draft.widthCm ?? ""}
            onChange={(n) => patchDraft({ widthCm: n })}
          />
          <NumberField
            label="Tiefe (cm)"
            value={draft.depthCm ?? ""}
            onChange={(n) => patchDraft({ depthCm: n })}
          />
        </div>
      ) : null}

      {step === 6 ? (
        <div className="flex flex-col gap-4">
          <TextField
            label="Name / Zeile 1"
            value={draft.inscription?.name ?? ""}
            onChange={(name) =>
              patchDraft({
                inscription: {
                  name,
                  dates: draft.inscription?.dates,
                  epitaph: draft.inscription?.epitaph,
                  font: draft.inscription?.font ?? "antiqua",
                  alignment: draft.inscription?.alignment ?? "mittig",
                },
              })
            }
          />
          <TextField
            label="Daten (optional)"
            value={draft.inscription?.dates ?? ""}
            onChange={(dates) =>
              patchDraft({
                inscription: {
                  name: draft.inscription?.name ?? "",
                  dates,
                  epitaph: draft.inscription?.epitaph,
                  font: draft.inscription?.font ?? "antiqua",
                  alignment: draft.inscription?.alignment ?? "mittig",
                },
              })
            }
          />
          <TextField
            label="Spruch / Widmung (optional)"
            value={draft.inscription?.epitaph ?? ""}
            onChange={(epitaph) =>
              patchDraft({
                inscription: {
                  name: draft.inscription?.name ?? "",
                  dates: draft.inscription?.dates,
                  epitaph,
                  font: draft.inscription?.font ?? "antiqua",
                  alignment: draft.inscription?.alignment ?? "mittig",
                },
              })
            }
          />
          <SelectField
            label="Schriftart"
            value={draft.inscription?.font ?? "antiqua"}
            onChange={(font) =>
              patchDraft({
                inscription: {
                  name: draft.inscription?.name ?? "",
                  dates: draft.inscription?.dates,
                  epitaph: draft.inscription?.epitaph,
                  font: font as NonNullable<MonumentDraft["inscription"]>["font"],
                  alignment: draft.inscription?.alignment ?? "mittig",
                },
              })
            }
            options={[
              ["kapitalelchen", "Kapitälchen"],
              ["kursiv", "Kursiv"],
              ["antiqua", "Antiqua"],
              ["modern", "Modern"],
              ["handschrift", "Handschrift"],
            ]}
          />
          <SelectField
            label="Anordnung"
            value={draft.inscription?.alignment ?? "mittig"}
            onChange={(alignment) =>
              patchDraft({
                inscription: {
                  name: draft.inscription?.name ?? "",
                  dates: draft.inscription?.dates,
                  epitaph: draft.inscription?.epitaph,
                  font: draft.inscription?.font ?? "antiqua",
                  alignment: alignment as NonNullable<
                    MonumentDraft["inscription"]
                  >["alignment"],
                },
              })
            }
            options={[
              ["links", "Links"],
              ["mittig", "Mittig"],
              ["rechts", "Rechts"],
            ]}
          />
        </div>
      ) : null}

      {step === 7 ? (
        <SelectField
          label="Gravur-Veredelung"
          value={draft.engravingFinish ?? ""}
          onChange={(v) =>
            patchDraft({ engravingFinish: v as MonumentDraft["engravingFinish"] })
          }
          options={[
            ["sandgestrahlt", "Sandgestrahlt"],
            ["goldlack", "Goldlackiert"],
            ["vergoldet", "Vergoldet (Blattgold)"],
            ["silber", "Silber"],
            ["bronzebuchstaben", "Bronzebuchstaben"],
            ["farbig", "Farbig"],
            ["laser", "Lasergravur"],
          ]}
        />
      ) : null}

      {step === 8 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Motive auswählen (mehrfach möglich). Ohne Auswahl = keine Ornamente.
          </p>
          {(
            [
              ["rose", "Rose"],
              ["lilie", "Lilie"],
              ["aere", "Ähre"],
              ["kreuz_motiv", "Kreuz (Motiv)"],
              ["baum", "Baum des Lebens"],
            ] as const
          ).map(([id, label]) => {
            const set = new Set(draft.ornaments ?? []);
            const checked = set.has(id);
            return (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(draft.ornaments ?? []);
                    if (checked) next.delete(id);
                    else next.add(id);
                    patchDraft({ ornaments: [...next] });
                  }}
                />
                {label}
              </label>
            );
          })}
        </div>
      ) : null}

      {step === 9 ? (
        <SelectField
          label="Bronzezubehör"
          value={draft.bronze ?? "keins"}
          onChange={(v) => patchDraft({ bronze: v as MonumentDraft["bronze"] })}
          options={[
            ["keins", "Keins"],
            ["kreuz_standard", "Bronzekreuz Standard"],
            ["kreuz_premium", "Bronzekreuz Premium"],
            ["vase", "Vase / Schale"],
            ["laterne", "Laterne"],
            ["weihwasserbecken", "Weihwasserbecken"],
            ["sonder", "Sonderanfertigung"],
          ]}
        />
      ) : null}

      {step === 10 ? (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Einfassung & Abdeckung"
            value={draft.enclosure ?? "keine"}
            onChange={(v) =>
              patchDraft({ enclosure: v as MonumentDraft["enclosure"] })
            }
            options={[
              ["keine", "Keine Einfassung"],
              ["granit_4seitig", "Grabeinfassung Granit (4-seitig)"],
              ["abdeckplatte", "Abdeckplatte"],
              ["kieselpflaster", "Kieselpflasterung"],
              ["pflanzflaeche", "Pflanzfläche"],
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="size-4 rounded border-zinc-300"
              checked={draft.montage !== false}
              onChange={(e) => patchDraft({ montage: e.target.checked })}
            />
            Montage & Versetzung (pauschal lt. Katalog)
          </label>
        </div>
      ) : null}

      {step === WIZARD_SUMMARY_STEP ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Entwurf gespeichert. Übersicht und Preis (indikativ, netto zzgl. USt):
          </p>
          {price.canCalculate ? (
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {price.lines.map((line) => (
                <li
                  key={line.id}
                  className="flex justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span>{line.label}</span>
                  <span className="tabular-nums">
                    {formatEuro(line.lineTotalNet)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-4 bg-zinc-50 px-4 py-3 text-sm font-medium dark:bg-zinc-950">
                <span>Zwischensumme netto</span>
                <span className="tabular-nums">
                  {formatEuro(price.subtotalNet)}
                </span>
              </li>
              <li className="flex justify-between gap-4 px-4 py-2 text-xs text-zinc-500">
                <span>{String(catalogSample.taxLabel)}</span>
                <span className="tabular-nums">{formatEuro(price.vatAmount)}</span>
              </li>
              <li className="flex justify-between gap-4 px-4 py-3 text-sm font-semibold">
                <span>Endbetrag brutto (indikativ)</span>
                <span className="tabular-nums">{formatEuro(price.totalGross)}</span>
              </li>
            </ul>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {price.reason}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => void goBack()}
          disabled={step <= 1}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Zurück
        </button>
        {step < WIZARD_SUMMARY_STEP ? (
          <button
            type="button"
            onClick={() => void goNext()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Weiter
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Bitte wählen —</option>
        {options.map(([val, lab]) => (
          <option key={val} value={val}>
            {lab}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      <input
        type="number"
        min={1}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        value={value === "" ? "" : value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return;
          const n = Number(v);
          if (!Number.isFinite(n)) return;
          onChange(n);
        }}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      <input
        type="text"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
