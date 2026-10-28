#!/usr/bin/env bash
# Pulisce i metadati di tutte le foto JPG del sito e ci scrive solo autore,
# credito e copyright (EXIF, IPTC, XMP). Spariscono macchina, obiettivo,
# impostazioni di scatto, data, software, eventuale GPS e miniature incorporate;
# restano solo il profilo colore (altrimenti i colori potrebbero cambiare) e
# l'orientamento (altrimenti una foto potrebbe apparire ruotata).
# Non tocca i pixel: cambiano solo i dati nascosti del file, che restano anche
# quando qualcuno salva la foto. Google Immagini mostra "Crediti" e "Nota sul
# copyright" leggendo proprio questi campi.
#
# Gira nella GitHub Action prima della pubblicazione, così i file nel repository
# restano quelli originali e ogni foto nuova riceve i dati in automatico.
# Uso: scripts/add-photo-credits.sh [cartella]   (default: img)
set -euo pipefail

DIR="${1:-img}"
AUTHOR="Davide Barattini"
CREDIT="Photo by Davide Barattini"
COPYRIGHT="© Davide Barattini - brtnvisuals.com"
WEBSITE="https://brtnvisuals.com"

# -all= cancella tutto, -tagsfromfile @ rimette solo profilo colore e
# orientamento, poi vengono scritti i crediti
exiftool -overwrite_original -q -q -r -ext jpg -ext jpeg \
  -all= -tagsfromfile @ -ICC_Profile -Orientation \
  -charset iptc=utf8 -IPTC:CodedCharacterSet=utf8 \
  -EXIF:Artist="$AUTHOR" \
  -EXIF:Copyright="$COPYRIGHT" \
  -IPTC:By-line="$AUTHOR" \
  -IPTC:Credit="$CREDIT" \
  -IPTC:CopyrightNotice="$COPYRIGHT" \
  -XMP-dc:Creator="$AUTHOR" \
  -XMP-dc:Rights="$COPYRIGHT" \
  -XMP-photoshop:Credit="$CREDIT" \
  -XMP-xmpRights:Marked=True \
  -XMP-iptcCore:CreatorWorkURL="$WEBSITE" \
  "$DIR"

echo "Metadata cleaned and photo credits written to JPG files in $DIR"
