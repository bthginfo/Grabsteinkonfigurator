# Vercel und PostgreSQL

Das Projekt verwendet lokal und in Produktion PostgreSQL. Damit sind Prisma-Schema und Migrationen in allen Umgebungen identisch.

## Lokal

```bash
copy .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run dev
```

`docker-compose.yml` stellt PostgreSQL 16 unter `localhost:5432` bereit.

## Vercel

1. Das GitHub-Repository als neues Next.js-Projekt importieren.
2. Im Vercel Marketplace eine PostgreSQL-Integration wie Neon mit dem Projekt verbinden.
3. Pruefen, dass die Integration `DATABASE_URL` fuer Production, Preview und Development gesetzt hat. In serverlosen Umgebungen eine gepoolte URL verwenden.
4. `ADMIN_PASSWORD` und einen langen, zufaelligen `ADMIN_SESSION_SECRET` in den Project Settings setzen.
5. Optional die `SMTP_*`-Variablen aus `.env.example` setzen.
6. Als Build Command `npm run vercel-build` verwenden. `vercel.json` setzt ihn bereits im Repository.

Der Build fuehrt `prisma migrate deploy` aus. Der Befehl wendet nur ausstehende, versionierte Migrationen an und ist fuer Production/Staging vorgesehen.

## Datenbankaenderungen

Schema lokal in `prisma/schema.prisma` aendern und eine Migration erzeugen:

```bash
npm run db:migrate -- --name beschreibung
```

Die erzeugten Dateien unter `prisma/migrations` immer mit committen. Produktions-Zugangsdaten gehoeren ausschliesslich in Vercel Environment Variables.
