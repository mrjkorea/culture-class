# March · St. Patrick's & Wheaten Craft

Eleven-stage Culture Class craft for month 03. **Leo** Fish voice (`a60e9fc6e78c4bdca656702c6d27ba08`) — same voice family as March word packs.

## Stages (MID_ACTIVITIES)

1. Spot shamrocks in an Irish field  
2. Dance a short jig  
3. Paint green / wear green hat  
4. Find the pot of gold at the rainbow  
5. Catch the leprechaun  
6. Share Irish soda bread  
7. Play bodhrán drum beats  
8. Meet the Wheaten — pet/brush  
9. Walk the Wheaten through a green park  
10. Wheaten finds a hidden clover  
11. Victory parade (leprechaun + Wheaten)

## Wheaten photos

`assets/wheaten/` uses **stock stand-in** JPEGs (labeled placeholders). Jay’s own Wheaten photo can replace `wheaten_portrait.jpg`, walk frames, and `parade.jpg` when uploaded.

## Flow

Still ~3s → stage → stage movie (`assets/transitions/video/`). Finale + `finale.mp3`. Leaderboard: `culture_craft_mar_stpatricks_v1`.

## Audio

`assets/audio/leo/LINES.md` — re-bake with:

```bash
export FISH_API_KEY=…
./scripts/bake-leo-audio.sh
```

No Web Speech API. No Frank.
