# Grabstein Konfigurator

Online-Konfigurator für Grabmäler (DACH) — eigene App ohne externes CMS.

**Architektur & Roadmap:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)  
**Credits für 3D/Assets:** [ATTRIBUTIONS.md](ATTRIBUTIONS.md)

## Voraussetzungen

- Node.js 20+
- npm
- Optional: Docker (für PostgreSQL lokal)

## Einrichtung

```bash
cd "Grabstein Konfigurator"
copy .env.example .env
```

**Datenbank:** PostgreSQL. Lokal den enthaltenen Docker-Service starten und die Migration anwenden:

```bash
docker compose up -d
npm run db:migrate
```

Die Produktions- und Vercel-Konfiguration steht in [docs/VERCEL-POSTGRES.md](docs/VERCEL-POSTGRES.md).

## Entwicklung

```bash
npm run dev
```

- Startseite: [http://localhost:3000](http://localhost:3000)  
- Konfigurator (neuer Entwurf): [http://localhost:3000/konfigurator](http://localhost:3000/konfigurator)  
- Entwurf fortsetzen: URL aus der Adresszeile nach „Neuen Entwurf starten“ (`/konfigurator/d/…`)
- PDF-Download (nach Wizard Zusammenfassung): `GET /api/orders/<orderId>/pdf?variant=customer-de` bzw. `variant=supplier-en`
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (`ADMIN_PASSWORD` in `.env` setzen)
- Katalogverwaltung: [http://localhost:3000/admin/catalog](http://localhost:3000/admin/catalog)

## Nützliche Befehle

| Befehl | Zweck |
|--------|--------|
| `npm run build` | Produktions-Build (inkl. `prisma generate`) |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:push` | Schema auf DB pushen (ohne Migrationsdatei) |
| `npm run test` | Vitest (Preis-Golden-Test) |

## Vercel (Deployment)

- **Build lokal:** `npm run build` generiert Prisma Client und baut Next.js.
- **Build auf Vercel:** `npm run vercel-build` wendet ausstehende Migrationen mit `prisma migrate deploy` an und baut danach die App.
- **Runtime:** Eine gepoolte PostgreSQL-Verbindung verwenden. Details: [docs/VERCEL-POSTGRES.md](docs/VERCEL-POSTGRES.md).
- **Hinweis:** Entwurfs-URLs (`/konfigurator/d/…`) sind ohne Auth öffentlich — für Produktion Zugriffsschutz oder Token ergänzen.

## Aktueller Stand

- Fünfstufiger Wizard mit serverseitig gespeichertem Fortschritt und URL-Schritt.
- Regelbasierter Richtpreis für alle gültigen Kombinationen; exakte Katalogpositionen werden bevorzugt.
- **3D:** formabhängige, weich gefaste Geometrien mit PBR-Steinmaterialien, lokal gehosteten SDF-Inschriften und PNG-Screenshot.
- Anfrageformular mit Kundendaten, Statuswechsel und unveränderlichem Preissnapshot.
- PDF DE/EN und optionaler SMTP-Versand.
- **Admin:** Passwort-Login, Bestellübersicht, Statuswechsel, Katalog-JSON-Import.

Als nächster Produktblock sind reale Preis- und Produktdaten, Rechtstexte/Datenschutz, Produktionsdatenbank und Deployment vorgesehen. Zahlungen folgen erst nach fachlicher und rechtlicher Freigabe.

## Paketname

Das npm-Paket heißt `grabstein-konfigurator` (der Ordnername mit Leerzeichen ist für npm ungültig — das ist unkritisch für den lokalen Pfad).
