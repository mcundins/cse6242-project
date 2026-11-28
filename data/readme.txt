================================================================================
US FOOD DESERT RISK ANALYSIS DASHBOARD (2019 & 2025)
================================================================================

An interactive D3.js choropleth visualization dashboard for exploring US food
desert status in 2019 alongside 2025 machine learning risk predictions across
national (state-aggregated) and census tract levels.

Application has been published under GNU license on GitHub:
The whole Team 9 has agreed to it.
Team 9: ysouffront3, rgunton6, mmiao6, camaral3, jramirez320, mcundins3

https://mcundins.github.io/cse6242-project/

Dashboard Demo recording:
https://www.youtube.com/watch?v=1uIIWHxxVXw 

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
├── scripts/                                  # Data cleaning, modeling join scripts & aggregators
├── DataCleaningFeatureEngeering/             # Feature engineering & data handoff notebooks
├── logistic_regression_modeling/             # Logistic Regression training & predictions
├── random_forest_model/                      # Random Forest training & predictions
├── kmeans_modeling/                          # K-Means Clustering training & predictions
└── data/                                     # Web dashboard data files & GIS topologies
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
DATA PIPELINE & LINEAGE WORKFLOW
--------------------------------------------------------------------------------    

+------------------------------------------------------------------------------+
| 1. RAW DATA SOURCES (not included in package)                                |
| Need to be downloaded from:                                                  |
| https://www.ers.usda.gov/data-products/food-access-research-atlas/download-the-data
+------------------------------------------------------------------------------+
  - 2019 USDA Atlas: (2019 Large Retailer Access Map (LRAM) (formerly known as 
      the Food Access Research Atlas (FARA)) Data)
      Food Access Research Atlas.csv
  - 2025 SRAM Data: (2025 SNAP-authorized Retailer Access Map (SRAM) Data)
      SRAM Driving Distance Data.csv
      SRAM General Tract Characteristics Data.csv
      SRAM Straight Line Distance Data.csv

+------------------------------------------------------------------------------+
| 2. CLEANING & FEATURE ENGINEERING (scripts/ & DataCleaningFeatureEngeering/) |
+------------------------------------------------------------------------------+
  - Scripts Used:
      scripts/clean2019FARA.py               -> Cleans 2019 USDA FARA dataset
      scripts/2025_join_data.py             -> Merges SRAM driving, straight-line,
                                                 and general tract characteristics
      scripts/normalize_tract.py            -> Standardizes 11-digit FIPS GEOIDs
      DataCleaningFeatureEngeering/.../model_input_preparation_for_modeling.ipynb
  - Intermediate Deliverables:
      DataCleaningFeatureEngeering/.../cleaned_2019.csv & cleaned_2025.csv
      DataCleaningFeatureEngeering/.../model_input_2019.csv & model_input_2025.csv

+------------------------------------------------------------------------------+
| 3. MACHINE LEARNING MODELING & PREDICTIONS                                   |
+------------------------------------------------------------------------------+
  - Logistic Regression (logistic_regression_modeling/):
      Training Script: FD_risk_prediction_modeling.ipynb
      Training Script Input: DataCleaningFeatureEngeering/.../cleaned_2019.csv
      Artifact: log_reg_model.pkl
      Predictions Script: modeling_2025data.ipynb
      Predictions Script Input: DataCleaningFeatureEngeering/.../cleaned_2025.csv
      Output: cleaned_2025_w_predictions.csv
  - Random Forest (random_forest_model/):
      Script: RF_risk_prediction_modeling.ipynb & RF_modeling_2025data.ipynb
      Artifact: rf_model.pkl
      Output: cleaned_2025_w_rf_predictions.csv
  - K-Means Clustering (kmeans_modeling/):
      Script: kmeans_food_desert_risk_train.ipynb & kmeans_food_desert_risk_test.ipynb
      Artifact: cluster_model.pkl
      Output: model_output_2025.csv

+------------------------------------------------------------------------------+
| 4. DASHBOARD CSV GENERATION (scripts/)                                       |
+------------------------------------------------------------------------------+
  - scripts/generate_2019_fd.py
      Source: DataCleaningFeatureEngeering/.../cleaned_2019.csv
      Output: data/us_tracts_2019_fd.csv
  - scripts/generate_2025_risk_predictions.py
      Source: Merges Logistic Regression, Random Forest, and K-Means predictions 
      across 2025 census tracts
      Output: data/us_tracts_risk_2025_predictions.csv
  - scripts/update_states_2019_2025_summaries.py & 2025_states_risk_script.ipynb
      Source: Aggregates tract-level outputs and counts to 2-digit FIPS State
      Output: data/us_states_risk_2019_2025.csv

+------------------------------------------------------------------------------+
| 5. GEOSPATIAL TOPOLOGY PREPARATION (data/geography/)                         |
+------------------------------------------------------------------------------+
  - Source: Individual state TopoJSON files can be downloaded from Census.gov.
    2010 census: https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2010&layergroup=Census+Tracts 
    2020 census: https://www.census.gov/cgi-bin/geo/shapefiles/index.php?year=2020&layergroup=Census+Tracts
  - Processing: Documented in data/geography/Tract Geo data processing.md
  - Final Web Topologies:
      data/tracts_2010_topoJSON.json (2010 census boundaries for 2019 data)
      data/tracts_2020_topoJSON.json (2020 census boundaries for 2025 data)
      data/geography/states.geojson   (US states polygon geometry)
  - There was one manual, non-automated step that included Mapshaper where TopoJSON
    files and GeoJSON files were loaded and performed the following steps on the 
    Mapshaper Console to standardize and reduce the size of the files and make 
    it easier for the application to load and manage in runtime.

    - merge-layers target=* | all layers are at the same level. That 
      simplifies programmatically the access to the tracts.
    - rename-layers tracts | Rename the layers names to tracts for uniformity in 
    names of objects.
    - proj albersusa | This type of projection simplifies the view on a map 
    rather than a mercator that will be skewed on the web application and make 
    the user experience not ideal.
    - simplify dp 5% | The most important step to reduce size. It was applied
    Ramer–Douglas–Peucker algorithm. An algorithm that reduces redundant 
    coordinate points that are invisible to the human eye on a screen and 
    saves hundreds of MBs for a more smooth user experience.

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
