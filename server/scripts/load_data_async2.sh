#!/bin/bash
SCRIPT="./seed_blasts_async.js"
node --max-old-space-size=3072 "$SCRIPT" MH0008xaa.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0008xab.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0008xac.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0008xae.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0009xaa.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0009xab.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0009xac.gz.blast.e-val0.01.filtered.parsed
node --max-old-space-size=3072 "$SCRIPT" MH0009xae.gz.blast.e-val0.01.filtered.parsed
