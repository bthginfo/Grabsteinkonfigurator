# PostgreSQL (Vercel & Produktion)

Lokal nutzt das Repo standardmäßig **SQLite** (`DATABASE_URL=file:./prisma/dev.db`), damit die App ohne Docker läuft.

Für **Vercel** oder eine **gemeinsame Postgres-Instanz**:

1. In `prisma/schema.prisma` den Block `datasource` auf PostgreSQL umstellen:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. In Vercel (oder `.env`) `DATABASE_URL` auf die Postgres-URL setzen (z. B. Neon).

3. Migrationen neu erzeugen oder das frühere SQL aus dem Git-Verlauf anwenden — Tabelle `Order` wie im Modell.

4. `npx prisma migrate deploy` gegen die Ziel-DB ausführen.

SQLite-Datei `dev.db` im **Projektroot** (nicht committen; siehe `.gitignore`).
