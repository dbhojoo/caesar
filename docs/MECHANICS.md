# Mechanics (Caesar III ruleset)

Numbers below are the working model for `packages/sim`. They come from `c3_model.txt` commentary, Heaven, Teoalida, mmxl, and labor/walker papers. Where sources disagree, the note says so.

## Housing

Twenty levels. Population is **per tile** for 1×1 houses; larger footprints use the documented total.

| Level | Name | Size | Pop/tile or total | Water | Food types | Gods | Ent. | Education | Health | Goods | Des. devolve | Des. evolve |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Small tent | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | — | −99 | −10 |
| 1 | Large tent | 1 | 7 | 1 | 0 | 0 | 0 | 0 | 0 | — | −12 | −5 |
| 2 | Small shack | 1 | 9 | 1 | 1 | 0 | 0 | 0 | 0 | — | −7 | 0 |
| 3 | Large shack | 1 | 11 | 1 | 1 | 1 | 0 | 0 | 0 | — | −2 | 4 |
| 4 | Small hovel | 1 | 13 | 2 | 1 | 1 | 0 | 0 | 0 | — | 2 | 8 |
| 5 | Large hovel | 1 | 15 | 2 | 1 | 1 | 10 | 0 | 0 | — | 6 | 12 |
| 6 | Small casa | 1 | 17 | 2 | 1 | 1 | 10 | 1 | 0 | — | 10 | 16 |
| 7 | Large casa | 1 | 19 | 2 | 1 | 1 | 10 | 1 | bath | pottery | 14 | 20 |
| 8 | Small insula | 1 | 19 | 2 | 1 | 1 | 25 | 1 | bath | pottery | 18 | 25 |
| 9 | Medium insula | 1 | 20 | 2 | 1 | 1 | 25 | 1 | doctor | pottery, furniture | 22 | 32 |
| 10 | Large insula | 2 | 84 tot | 2 | 1 | 1 | 25 | 2 | doctor, barber | + oil | 29 | 40 |
| 11 | Grand insula | 2 | 84 tot | 2 | 2 | 1 | 35 | 2 | doctor, barber | oil | 37 | 48 |
| 12 | Small villa | 2 | 40 tot | 2 | 2 | 2 | 35 | 2 | + | wine | 45 | 53 |
| 13 | Medium villa | 2 | 42 tot | 2 | 2 | 2 | 40 | 2 | doctor+hospital | wine | 50 | 58 |
| 14 | Large villa | 3 | 90 tot | 2 | 2 | 2 | 45 | 3 | + academy | wine | 55 | 63 |
| 15 | Grand villa | 3 | 100 tot | 2 | 3 | 3 | 50 | 3 | + | wine | 60 | 68 |
| 16 | Small palace | 3 | 106 tot | 2 | 3 | 3 | 55 | 3 | + | 2 wines | 65 | 74 |
| 17 | Medium palace | 3 | 112 tot | 2 | 3 | 4 | 60 | 3 | + | 2 wines | 70 | 80 |
| 18 | Large palace | 4 | 190 tot | 2 | 3 | 4 | 70 | 3 | + hippodrome | 2 wines | 76 | 90 |
| 19 | Luxury palace | 4 | 200 tot | 2 | 3 | 4 | 80 | 3 | + | 2 wines | 85 | 100 |

Water 1 = well or fountain. Water 2 = fountain. Education 1 = school or library, 2 = both, 3 = + academy. Villas and above are patrician (no labor).

Houses try to evolve every sixteenth if desirability and services are met, and devolve if desirability drops below the devolve line or a required service/good runs out.

2×2 merging uses a per-tile merge bit planted at map creation (~55% of tiles). Four occupied 1×1 houses of the same level merge when any of the four tiles allows it. Large insulae and above force a 2×2 footprint. Devolving below large insula splits the house back into four 1×1 plots, which may re-merge.

## Walkers

- Speed 6 = 54.4 tiles/month = 15 ticks/tile.
- Roam limit for most random walkers: **26 tiles**, then return home (can travel far on the way back).
- Four roam targets: roads near 8 tiles N/E/S/W of the building origin.
- Gatehouses block random walkers, not destination walkers (gatehouses not in this slice).
- Schoolchildren are shorter and do not return; not in this slice.

## Labor

Labor-seekers (or a principal walker acting as one) add, each tile, the number of occupied housing tiles within 2. Cap 300. Decay 16 points/month (1 per sixteenth). Buildings below a modest threshold send a seeker. Staffing uses the city workforce pool; buildings with no access get nobody.

Workforce ≈ 60% of plebeian population in a young colony (immigrants are working-age). Long-term aging toward ~3/8 is future work.

## Water

- Well: 5×5 coverage, water level 1, no labor.
- Fountain: 9×9, water level 2, 4 workers, must sit on reservoir pipe.
- Reservoir: 3×3, 80 dn. Fills if a tile of its footprint touches water **or** an aqueduct leads from a filled reservoir. Pipe range 10 from the edge. Staffed from the water labor pool (we require employees to *fill*, matching play experience; Heaven lists 0 labor and is treated as stale).
- Aqueduct: 8 dn/tile, no labor, cannot cross another aqueduct.
- Desert climate shrinks fountain/well range by 1 (future climate table). This slice is central climate.

## Industry (food)

Farms accrue 1 production point per employee per sixteenth. A cart leaves at 200 points (one load = 100 units). Carts path to the nearest granary with space (capacity 3200). Markets send a buyer to a granary when understocked; the trader (random walker) delivers to houses within 2 tiles.

Houses store about two months of a food type and eat monthly.

## Industry (raw materials and goods)

Clay pits, timber yards (on trees), olive/vine farms (meadow), iron mines and marble quarries (rock) use the same 200-point cart rule. Carts prefer a workshop that wants the raw, then a warehouse that is not set to “not accepting”.

Workshops fetch 100 units of their raw from a warehouse, spend 200 production points, and send 100 finished goods (pottery, furniture, oil, wine) back to a warehouse.

Warehouse orders per resource: **accepting** (default), **getting** (sends a getter walker to another store), **not accepting**. Capacity 3200, same as a granary.

Markets also fetch goods and the trader delivers them to houses. Houses consume each required good every sixteenth.

## Empire trade

Three partners ship with this valley: Capua (land: pottery, clay / wants wheat), Tarentum (sea: furniture, timber / wants oil), Syracusae (sea: wine, oil, olives / wants pottery). Opening a route costs denarii. A staffed trade post (land) or dock (sea) draws a caravan about twice a month. The trader sells up to two loads and buys one load of what it wants.

## Risk

Fire and damage accrue each sixteenth on buildings that are not immune (roads, gardens, wells, fountains, reservoirs, aqueducts). Prefects/engineers zero the matching risk within 2 tiles. At 100 the building becomes rubble or burning ruin.

Northern climate will later zero fire; desert will raise it.

## Money

Building costs from the Structure Guide / handbook. Monthly: wages for employees, modest tax from houses that a forum/senate collector has passed (forum not required in the tutorial slice; a flat low tax is collected so the treasury moves).
