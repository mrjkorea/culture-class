# February · Valentine Card Craft

Ten-stage Culture Class craft for month 02. **Miss Harper** Fish voice only (`assets/audio/harper/`).

## Stages (MID_ACTIVITIES)

1. Pick card color  
2. Fold  
3. Stamp hearts  
4. Stickers  
5. Write wish  
6. Seal envelope  
7. Address classmate mailbox  
8. Drop in mailbox  
9. Open received card  
10. Trade candy hearts  

## Flow

Before each stage: still ~3s → play stage → stage movie (`assets/transitions/video/`). Finale: confetti + `finale.mp3`. Leaderboard key: `culture_craft_feb_valentine_v1`.

## Audio

See `assets/audio/harper/LINES.md`. Re-bake with Fish voice `736de7d32d7949469ba4664bce9f3f32`:

```bash
export FISH_API_KEY=…
./scripts/bake-harper-audio.sh
```

No Web Speech API.
