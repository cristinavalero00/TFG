#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
 echo 'Instala Node.js LTS desde https://nodejs.org y vuelve a abrir este archivo.'
 exit 1
fi
(sleep 2; open http://127.0.0.1:4173) &
node iniciar.mjs
