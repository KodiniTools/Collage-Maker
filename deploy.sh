#!/usr/bin/env bash
#
# Deploy-Skript für den Bilder-Collage-Macher.
#
# Baut den aktuellen main-Stand und spiegelt das Ergebnis nach
#   /var/www/kodinitools.com/collagemaker/
# Ausgeliefert wird von NGINX unter https://kodinitools.com/collagemaker/
# (alias + try_files-Fallback auf /collagemaker/index.html).
#
# Der Build ist bereits auf den Sub-Pfad konfiguriert:
#   vite.config.ts : base = '/collagemaker/'
#   router/index.ts: createWebHistory('/collagemaker/')
# An der NGINX-Konfiguration muss deshalb nichts geändert werden.
#
# ------------------------------------------------------------------------
# Aufruf (auf dem Server, aus dem Repo-Verzeichnis):
#   ./deploy.sh
#
# Konfiguration über Umgebungsvariablen (optional):
#   DEPLOY_DIR    Zielordner   (Default: /var/www/kodinitools.com/collagemaker)
#   DEPLOY_BRANCH Branch       (Default: main)
#   DEPLOY_OWNER  chown-Ziel   (z. B. "www-data:www-data"; leer = überspringen)
#   RUN_TESTS     Tests laufen lassen (Default: 1; auf 0 zum Überspringen)
#
# Beispiel:
#   DEPLOY_OWNER=www-data:www-data ./deploy.sh
#
# Voraussetzungen auf dem Server: git, node/npm, rsync.
# ------------------------------------------------------------------------
#
# Hinweis: Die gesamte Logik steht in main() und wird erst am Dateiende
# aufgerufen. Dadurch ist das komplette Skript geparst und im Speicher,
# bevor 'git reset --hard' die Datei auf der Platte ggf. verändert –
# so kann sich das laufende Skript nicht selbst beschädigen.

set -euo pipefail

main() {
  # ---- Konfiguration ------------------------------------------------------
  local BRANCH="${DEPLOY_BRANCH:-main}"
  local DEPLOY_DIR="${DEPLOY_DIR:-/var/www/kodinitools.com/collagemaker}"
  local OWNER="${DEPLOY_OWNER:-}"
  local RUN_TESTS="${RUN_TESTS:-1}"

  # Repo-Wurzel = Verzeichnis dieses Skripts (Aufruf von überall möglich).
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"

  echo "==> Repo:              $SCRIPT_DIR"
  echo "==> Branch:            $BRANCH"
  echo "==> Deploy-Verzeichnis: $DEPLOY_DIR"

  # ---- Werkzeuge prüfen ---------------------------------------------------
  local tool
  for tool in git node npm rsync; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      echo "!! Benötigtes Programm nicht gefunden: $tool" >&2
      exit 1
    fi
  done

  # ---- 1. Aktuellen Stand von origin/$BRANCH holen ------------------------
  echo "==> Hole aktuellen Stand von origin/$BRANCH ..."
  git fetch --prune origin "$BRANCH"
  git checkout -f "$BRANCH"
  git reset --hard "origin/$BRANCH"

  local COMMIT
  COMMIT="$(git rev-parse --short HEAD)"
  echo "==> Baue Commit: $COMMIT"

  # ---- 2. Abhängigkeiten (reproduzierbar) --------------------------------
  echo "==> Installiere Abhängigkeiten (npm ci) ..."
  npm ci

  # Hinweis: Custom-Fonts liegen als woff2 im Repo (src/assets/fonts/) und
  # werden über fonts.css (in main.ts importiert) gebündelt – kein Deploy-Schritt
  # nötig. Neue Schriften: Datei ablegen + `npm run fonts:generate` ausführen
  # (erzeugt fonts.css + fontList.ts), committen.

  # ---- 3. Tests (optional) + Produktions-Build ---------------------------
  if [[ "$RUN_TESTS" != "0" ]]; then
    echo "==> Führe Tests aus (RUN_TESTS=0 zum Überspringen) ..."
    npm run test
  else
    echo "==> Tests übersprungen (RUN_TESTS=0)."
  fi

  echo "==> Baue Produktionsversion (inkl. Typecheck) ..."
  npm run build

  if [[ ! -f dist/index.html ]]; then
    echo "!! Build fehlgeschlagen: dist/index.html nicht gefunden." >&2
    exit 1
  fi

  # ---- 4. Auslieferung ----------------------------------------------------
  echo "==> Stelle sicher, dass $DEPLOY_DIR existiert ..."
  mkdir -p "$DEPLOY_DIR"

  # Atomar-nah spiegeln: neue Dateien zuerst schreiben, veraltete am Ende
  # löschen (--delete-after). Der abschließende Slash bei dist/ kopiert den
  # INHALT von dist nach DEPLOY_DIR (nicht den Ordner selbst).
  echo "==> Spiegle dist/ nach $DEPLOY_DIR ..."
  rsync -a --delete-after --human-readable dist/ "$DEPLOY_DIR/"

  # ---- 5. Rechte (optional) ----------------------------------------------
  if [[ -n "$OWNER" ]]; then
    echo "==> Setze Eigentümer: $OWNER ..."
    chown -R "$OWNER" "$DEPLOY_DIR"
  fi

  echo ""
  echo "==> Fertig. Commit $COMMIT ist live unter:"
  echo "    https://kodinitools.com/collagemaker/"
}

main "$@"
