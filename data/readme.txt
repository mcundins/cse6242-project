================================================================================
US FOOD DESERT RISK ANALYSIS DASHBOARD (2019 & 2025)
================================================================================

An interactive D3.js choropleth visualization dashboard for exploring US food
desert status in 2019 alongside 2025 machine learning risk predictions across
national (state-aggregated) and census tract levels.

--------------------------------------------------------------------------------
FEATURES
--------------------------------------------------------------------------------

1. Dual-Year Comparison (2019 vs. 2025):
   - 2019 Historical Baseline: Displays binary USDA Food Access Research Atlas
     classifications ("Food Desert" vs. "Not Food Desert") at the tract level
     and quantile-scaled state food desert prevalence rates nationally.
   - 2025 Predictive Risk Analysis: Displays multi-tier risk classifications
     ("High Risk", "Mid Risk", "Low Risk") using a weighted state-level
     quantile score nationally and categorical tract-level styling on drill-down.

2. Multi-Model Selection (2025):
   Switch dynamically between three predictive models with smooth color transitions:
   - Logistic Regression 
   - Random Forest 
   - K-Means Clustering

3. Hierarchical Map Drill-Down:
   - National View: Albers USA projection displaying
     state-level aggregations. Clicking any state transitions to the tract-level
     view for that state.
   - State / Tract View: Identity-projected census tract boundaries (2010 tract
     boundaries for 2019 data; 2020 tract boundaries for 2025 data) with
     state-level population and median family income extremes.

4. Interactive Zoom, Pan & Tooltips:
   - Mouse wheel / drag zoom and pan (0.5x to 10x) with dedicated "+", "-",
     and "Reset" viewport controls.
   - Context-aware d3-tip hover tooltips displaying tract/state IDs, county
     names, population, median family income, and model-specific risk breakdowns.

5. Dynamic Summary Sidebar:
   Real-time recalculation of total analyzed census tracts, category counts,
   total state population, and highest/lowest tract median family incomes.

--------------------------------------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------------------------------------

├── index.html                                # Main dashboard layout and UI controls
├── app.js                                    # D3.js state management, map rendering, and data parsing
├── styles.css                                # Responsive grid layout, theme tokens, and tooltip/control styles
├── lib/                                      # Local D3 v5 and geospatial dependencies
│   ├── d3.v5.min.js
│   ├── d3-dsv.min.js
│   ├── d3-geo-projection.v2.min.js
│   ├── d3-legend.min.js
│   ├── d3-tip.min.js
│   └── topojson.v2.min.js
└── data/                                     # Tabular datasets and geographic boundary files
    ├── us_states_risk_2019_2025.csv
    ├── us_tracts_risk_2025_predictions.csv
    ├── us_tracts_2019_fd.csv
    ├── tracts_2010_topoJSON.json
    ├── tracts_2020_topoJSON.json
    └── geography/
        └── states.geojson

--------------------------------------------------------------------------------
DATA SCHEMAS
--------------------------------------------------------------------------------

The application loads three CSV datasets and three geographic boundary files

1. data/us_states_risk_2019_2025.csv
   State-level summary counts used for the National view and sidebar totals:
   - year ("2019" or "2025"), stateCode (2-digit FIPS), stateName
   - 2019 Columns: fdCount, nonFdCount
   - 2025 Model Columns: highRiskCount_lr, midRiskCount_lr, lowRiskCount_lr,
     highRiskCount_rf, midRiskCount_rf, lowRiskCount_rf, highRiskCount_km,
     midRiskCount_km, lowRiskCount_km

2. data/us_tracts_2019_fd.csv & data/us_tracts_risk_2025_predictions.csv
   Census tract-level records joined to TopoJSON geometries by 11-digit
   zero-padded GEOID (tract_id):
   - tract_id, state (2-digit FIPS), county, population_total, median_family_income
   - 2019 Specific: food_desert ("True" / "False")
   - 2025 Specific: risk_lr, risk_rf, risk_km ("high", "mid", "low")

3. Geographic Boundaries
   - data/geography/states.geojson: US state polygons keyed by
     properties.state_fips and properties.state_name.
   - data/tracts_2010_topoJSON.json: 2010 Census Tract TopoJSON used when
     Analysis Year = 2019.
   - data/tracts_2020_topoJSON.json: 2020 Census Tract TopoJSON used when
     Analysis Year = 2025.

--------------------------------------------------------------------------------
LOCAL SETUP & EXECUTION
--------------------------------------------------------------------------------
Because the dashboard loads CSV, GeoJSON, and TopoJSON files via browser fetch /
XHR requests (d3.csv and d3.json), it must be served over HTTP rather than opened
directly via file://.

1. Clone or download the repository and ensure all lib/ scripts and data/ files
   are in place.
2. Start a local web server from the project root directory:

   # Using Python 3
   python -m http.server 8000

3. Open the dashboard in your browser:
   http://localhost:8000

--------------------------------------------------------------------------------
TECHNOLOGIES USED
--------------------------------------------------------------------------------
- D3.js (v5): Core data binding, scales (scaleQuantile, scaleOrdinal),
  transitions, and zoom/pan behaviors.
- TopoJSON Client (v2): Converting compact 2010 and 2020 census tract TopoJSON
  topologies into GeoJSON features on load.
- d3-geo-projection (v2): d3.geoAlbersUsa national projection and d3.geoIdentity
  state tract fitting.
- d3-legend & d3-tip: Dynamic SVG color legends and interactive hover tooltips.