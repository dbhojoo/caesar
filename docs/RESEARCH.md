# Research notes

Sources used to reconstruct Caesar III systems. Julius/Augustus/Akhenaten are treated as prior art to *learn from*, not to copy.

## Primary public sources

| Topic | Source |
| --- | --- |
| Housing columns in `c3_model.txt` | [City Builders: The c3_model.txt file](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=st&fn=10&tn=105), [GameFAQs Model File Editing FAQ](https://gamefaqs.gamespot.com/pc/63635-caesar-iii/faqs/14466) |
| Housing levels, capacity, services | [Teoalida C3 notes](https://www.teoalida.com/games/caesar3/), [mmxl housing table](https://mmxl.wz.cz/c3a/housing2.html), [Heaven housing requirements](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=st&fn=2&tn=7447) |
| Building costs, labor, sizes | [GameFAQs Structure Guide](https://gamefaqs.gamespot.com/pc/63635-caesar-iii/faqs/2420), [Augustus handbook building summary](https://www.caesar3augustus.com/book/appendix/buildingsummary) |
| Random / destination walkers | [Walker behaviour](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=st&fn=2&tn=3458), [Randomness of Random Walkers](https://caesar3.heavengames.com/cgi-bin/forums/display.cgi?action=ct&f=2%2C6254%2C800%2Call), [Destination walker paths](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=st&fn=2&tn=7585) |
| Time and walker speed | [Walker Speeds (Bianca van Schaik)](https://poseidon.biancavanschaik.nl/speed.html) |
| Labor access | [Labor access explained](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=st&fn=25&tn=7133), [Labor Access thread](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=ct&f=2,6825,,all) |
| Water | [Heaven water buildings](https://caesar3.heavengames.com/buildings/water/), [Reservoir range](https://caesar3.heavengames.com/cgi-bin/caeforumscgi/display.cgi?action=st&fn=2&tn=4796), [Augustus reservoir/fountain](https://www.caesar3augustus.com/book/water/reservoiraqueduct) |
| Engine topology (for contrast only) | [Julius `src/` layout](https://github.com/bvschaik/julius), `building/type.h` |

## Look and feel references

Reviewed stills and playthrough framing (GamerZakh and similar C3 career videos, Heaven screenshots, Teoalida 4K city shots):

- True isometric diamonds, north toward the top-right of the screen
- Soft ochre/olive terrain, terracotta roofs, cream marble civic buildings
- Right-hand build palette grouped by category (water, health, religion, education, entertainment, government, engineering, industry)
- Top status: city name, date, population, denarii
- Overlay keys (water, fire, damage, desirability) as washed tints over the same city view
- Walkers as small togaed figures on roads; cart pushers with loads
- Right-click building panel in the “wax tablet / wood frame” register

This client approximates that chrome with **original** procedural isometric art. It does not load `.sg2` / `.555` sprites.

## What Julius already is

Julius is a C reimplementation whose explicit goal is *the same logic as the original binary*, including bugs, plus 100% save compatibility. It requires the original data files. Augustus layers quality-of-life and extra systems on that base.

This repo’s goal is different:

1. Reconstruct the *documented* systems as a modern, testable simulation.
2. Keep the player-facing loop and visual language of C3.
3. Ship without copyrighted assets.
4. Leave a door open for a Pharaoh ruleset (Akhenaten/Ozymandias already occupy the “play the original data” niche).

## Fidelity stance for this milestone

Implemented to documented numbers where they are consistent:

- 20 housing levels, evolve/devolve desirability, service bits
- 816 ticks/month, 51-tick sixteenth, 15 ticks/tile at walker speed 6
- Random-walker 26-tile roam, four cardinal targets ~8 tiles from the building origin
- Destination BFS on road-like tiles, fail past ~500 tiles
- Labor access: +housing tiles within 2 of a seeker, cap 300, decay 16/month
- Wells 5×5, fountains 9×9, reservoir pipes 10 tiles from the edge
- Production points: 200 for raw/food, 1 per employee per sixteenth

Known original quirks **not** reproduced unless we later decide to: 4-god religion cap bug, schoolchild teleport/index shuffle, pottery vanishing in 25k+ cities, 1999-building hard cap (we keep a soft warning, not a hard stop).
