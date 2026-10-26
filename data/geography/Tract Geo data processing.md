# Using the tract and geography data

## Processing overview

![Tract and geography processing logic](../../scripts/tract%20and%20geo%20data%20processing%20logic.png)

## 1. Normalize the raw tract column

Run [normalize_tract.py](../../scripts/normalize_tract.py) from the repository root with Python 3. It keeps every original column and row, and adds an 11-digit string `geoid` by trimming whitespace and padding leading zeros. The original CSV is unchanged; the output must be a new file.

**2019 — `CensusTract`:**

```bash
python3 scripts/normalize_tract.py \
  "raw_data/2019_Food_Access_Research_Atlas_Data/Food Access Research Atlas.csv" \
  ../usda_2019_with_geoid.csv \
  --column CensusTract
```

**2025 — `CensusTract20`:**

```bash
python3 scripts/normalize_tract.py \
  "raw_data/2025-sram-fara-data/SRAM General Tract Characteristics Data.csv" \
  ../usda_2025_general_with_geoid.csv \
  --column CensusTract20 --encoding cp1252
```

For the 2025 Straight Line and Driving Distance tables, change the input and output filenames; keep the same column and encoding options. Output CSVs use UTF-8. No audit reports are generated. Invalid IDs stop processing; this utility does not remove or detect duplicate IDs.

Always read `geoid` as a string, including when reading the output CSV. With pandas, use `dtype={"geoid": str}` to preserve leading zeros.

## 2. Delivered files

### Final coverage results

| USDA data year | Census tract framework (`tract_vintage`) | Boundary file release (`boundary_release`) | USDA tract records | Matched records | Display features | Features without a USDA record |
|---|---|---|---:|---:|---:|---:|
| 2019 | 2010 | 2019 | 72,531 | 72,531 (100%) | 72,831 | 300 |
| 2025 | 2020 | 2020 | 84,119 | 84,119 (100%) | 84,122 | 3 |

The Census tract framework and the boundary release are separate concepts. Use the mapping in `manifest.json`; do not select a boundary solely from the USDA data year. Both years cover 50 states and DC.

### Files and purpose

Paths below are relative to `data/geography/`.

| File | Use |
|---|---|
| `indices/tract_index_2019.csv` | Geographic index for 72,531 USDA tracts |
| `indices/tract_index_2025.csv` | Geographic index for 84,119 USDA tracts |
| `indices/states.csv` | State FIPS, names, and abbreviations for 50 states + DC |
| `tracts/2010/{state_fips}.topojson` | Tract boundaries for USDA **2019**, using the 2010 framework and 2019 boundary release |
| `tracts/2020/{state_fips}.topojson` | Tract boundaries for USDA **2025**, using the 2020 framework and 2020 boundary release |
| `states.geojson` | National state boundary layer, shared by both years |
| `manifest.json` | Year/state-to-file lookup and file metadata |
| `sources.json` | Original source URLs and hashes |
| `tracts_without_usda.json` | Boundary GEOIDs without a USDA source record |
| `validation/` | Delivered validation reports |

The indices contain geographic metadata, not the full USDA indicators or model results. The maps include 300 additional features without USDA records in 2019 and 3 in 2025. Census boundaries are generalized 1:500,000 display boundaries.

## 3. Load and join

1. Display `states.geojson` for national navigation. A selected state's code is `feature.properties.state_fips`.
2. Use the selected **data year + state FIPS** to find the tract file in `manifest.json`. Load one state at a time.
3. Decode the TopoJSON and join model results using **`geoid` ↔ `feature.properties.geoid`**. The corresponding year's tract index can also be joined by `geoid`; loading that index is optional for rendering.

Using the repository's D3 and TopoJSON libraries, with the page served from the repository root:

```javascript
const base = "data/geography/";
const manifest = await d3.json(base + "manifest.json");
const entry = manifest.years["2019"].states["01"]; // Alabama
const topology = await d3.json(base + entry.path);
const features = topojson.feature(
  topology, topology.objects[entry.object_name]
).features;
```

Coordinates are WGS84 longitude/latitude; apply a D3 projection during rendering. Select one year and model configuration (including distance method, if applicable) before joining, and check for duplicate result keys. Matching GEOIDs across years do not guarantee unchanged boundaries.

`has_usda_data = false` means **No source data**; a missing model result means **Unclassified**, never Low Risk. State-level risk coloring requires a separately defined aggregation rule. The existing prototype has not yet been integrated with these assets.

