# 3D-Modelle und Datenquellen

Stand: 2026-07-14

## Import in den Konfigurator

Der Browser rendert `GLB` oder `glTF`. Fertigungsdateien wie STEP, IGES, 3DM,
DWG oder DXF bleiben die referenzierte Originalquelle und werden vor dem Import
mit FreeCAD, Blender oder dem CAD-System des Lieferanten in GLB konvertiert.

Anforderungen an ein Webmodell:

- Y zeigt nach oben, die beschriftbare Vorderseite zeigt in Richtung +Z.
- Ursprung mittig an der Unterkante; Transformationen vor dem Export anwenden.
- Reale Fertigmaße in Zentimetern im Katalog eintragen.
- Geschlossene, triangulierte Geometrie; möglichst unter 150.000 Dreiecken.
- Texturen als 1K oder 2K WebP/JPEG/PNG einbetten; Zielgröße unter 8 MB.
- Eine GLB-Datei unter `public/models/` ablegen und einen Eintrag in `models`
  im Produktkatalog ergänzen. Externe HTTPS-URLs sind ebenfalls möglich.
- CAD-Original, Lieferantenreferenz, Lizenz/Freigabe und SHA-256 dokumentieren.

Beispiel:

```json
{
  "id": "lieferant-serie-142",
  "label": "Serie 142",
  "description": "Asymmetrischer Hochstein mit Naturkante",
  "runtimeUrl": "/models/lieferant-serie-142.glb",
  "format": "glb",
  "fallbackForm": "stele",
  "nativeSizeCm": { "height": 92, "width": 54, "depth": 16 },
  "transform": {
    "rotationDeg": [0, 0, 0],
    "offsetCm": [0, 0, 0],
    "uniformScale": 1
  },
  "materialMode": "configurable",
  "inscriptionSurface": {
    "mode": "upright",
    "positionRatio": [0, 0.56, 0.5],
    "rotationDeg": [0, 0, 0],
    "maxWidthRatio": 0.68
  },
  "source": {
    "originalFileName": "Serie-142.step",
    "originalFormat": "step",
    "supplierReference": "S142"
  }
}
```

`materialMode: configurable` ersetzt importierte Materialien durch das im
Konfigurator gewählte Steinmaterial. `embedded` bewahrt die Materialien des
GLB. Kann ein Modell nicht geladen werden, zeigt der Renderer automatisch die
in `fallbackForm` angegebene parametrische Form.

## Recherche: frei zugängliche Daten

Es gibt aktuell keine erkennbare offene, branchendeckende Datenbank mit
fertigungsfähigen europäischen Grabmal-CAD-Modellen. Sinnvoll kombinierbar sind:

- Die [DNSA-Steindatenbank](https://www.natursteinonline.de/steindatenbank/dnsa-datenbank)
  mit mehr als 5.200 Natursteinen, Handelsnamen, Herkunft, Eigenschaften und
  Anbieterinformationen. Das ist eine starke Materialreferenz, aber keine
  pauschale Freigabe zur Übernahme von Bildern oder Massendaten.
- Die [kostenlose DNV-Liste für Grab- und Denkmalproduktion](https://shop.natursteinonline.de/shop/download-deutsche-natursteine-fuer-die-grab-und-denkmalproduktion/)
  mit rund 40 deutschen Steinen, Rohblock-/Plattengrößen, Lieferanten sowie
  Minimal- und Maximalmaßen für Grabmale.
- Öffentliche Händlerkataloge und Lagerseiten, etwa
  [Hansen Naturstein](https://www.hansen-naturstein.de/),
  [Roll Natursteine](https://www.roll.de/) und
  [Naturstein Risse](https://www.naturstein-risse.de/), als Recherche- und
  Kontaktquelle. Produktdaten sollten per Partnerfeed, Export oder schriftlicher
  Freigabe übernommen werden, nicht per ungefragtem Scraping.
- [Poly Haven](https://polyhaven.com/license) für CC0-HDRIs, PBR-Texturen und
  generische Felsmodelle. Das eignet sich für Umgebung, Materialien und freie
  Naturformen, ersetzt aber keine fertigungsgerechte Händlerform.
- Einzelne CC0-Grabsteinmodelle, etwa bei
  [Pixabay](https://pixabay.com/3d-models/tombstone-gravestone-cemetery-stone-617/),
  eignen sich höchstens als technische Testassets. Stil und Maße sind meist
  nicht auf den deutschsprachigen Grabmalmarkt ausgelegt.

## Ableitung aus Produktbildern

Technisch lassen sich aus mehreren Ansichten per Photogrammetrie oder aus einer
Frontansicht als manuell nachgezeichnetes Profil Näherungsmodelle erzeugen.
Eine einzelne Produktaufnahme liefert jedoch keine verlässliche Tiefe,
Rückseite, Kantenbearbeitung oder Fertigmaße und ist deshalb keine CAD-Quelle.

Für veröffentlichte Produktmodelle ist vorher eine Nutzungsfreigabe sinnvoll.
Fotos sind regelmäßig urheberrechtlich relevant; außerdem kann die Erscheinung
eines Produkts Designschutz betreffen. Eine systematische Übernahme eines
Händlerbestands kann zusätzlich Datenbankrechte berühren. Die EU erläutert
[Urheberrechte an Fotos](https://europa.eu/youreurope/business/running-business/intellectual-property/copyright/index_en.htm)
und den [Schutz von Datenbanken](https://europa.eu/youreurope/business/running-business/intellectual-property/database-protection/index_en.htm).
Praktisch sollte ein Lieferant deshalb Maße/CAD und eine ausdrückliche Erlaubnis
für Darstellung, Bearbeitung und kommerzielle Nutzung bereitstellen.

## Empfohlenes Partnerpaket

Von einem Steinmetz oder Großhändler je Modell anfordern:

1. STEP/IGES/3DM oder GLB, alternativ bemaßte Front- und Seitenzeichnung.
2. Fertigmaße, Bauteile, Vorderseite, Standfläche und zulässige Skalierung.
3. Material-/Oberflächenvarianten, Artikelnummer, Lieferstatus und Richtpreis.
4. Beschriftbare Fläche sowie Sperrflächen für Ornamente und Zubehör.
5. Schriftliche Web-/Bearbeitungsfreigabe und gewünschte Quellenangabe.

