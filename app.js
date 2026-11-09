// Application State
const state = {
    selectedYear: "2019",
    currentView: "NATIONAL", // "NATIONAL" or "STATE"
    selectedStateCode: null,
    selectedStateName: null,
    selectedModel: "risklr",
    isNewMapView: true,
    datasets: {
        states: [],
        tracts: []
    },
    geoJson: {
        states: null,
        tracts2019: null, // Holds 2010 tracts from 2019 analysis
        tracts2025: null  // Holds 2020 tracts from 2025 analysis
    }
};

// Reusable Theme Colors
const THEME = {
    fallbackGray: "#cbd5e1",
    high: "#dc2626",
    mid: "#f59e0b",
    low: "#10b981",
    tooltip: "#334155",
    strokeColor: "#ffffff",

    food_desert_yes: "#d8e61a",
    food_desert_no: "#45551a",  
};

// Colors mapping for Risk Levels
const colorScale2025 = d3.scaleOrdinal()
    .domain(["High Risk", "Mid Risk", "Low Risk", "No data"])
    .range([THEME.high, THEME.mid, THEME.low, THEME.fallbackGray]);

const colorScale2019 = d3.scaleOrdinal()
    .domain(["Food Desert", "Not Food Desert", "No Data"])
    .range([THEME.food_desert_yes, THEME.food_desert_no, THEME.fallbackGray]);

// D3 Tip Tooltip Instance
const tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0]);

// Initialization
document.addEventListener("DOMContentLoaded", function () {
    initApp();
});

function initApp() {
    d3.select("#yearSelect").property("value", state.selectedYear);
    setupEventListeners();
    loadAllData();
}

function setupEventListeners() {
    d3.select("#yearSelect").on("change", function () {
        state.selectedYear = this.value;
        updateModelControlVisibility();
        renderMap();
    });

    d3.select("#model-select").on("change", function () {
        state.selectedModel = this.value;

        if (state.currentView === "STATE" && state.selectedStateCode) {
            updateModelColors();
        }
    });
}

function loadAllData() {
    const parseSimplifiedTracts = (csvArray, yearLabel) => {
        return csvArray.map(d => {
            return {
                tractId: String(d.tract_id).trim().padStart(11, '0'),
                stateCode: String(d.state).trim().padStart(2, '0'),
                county: String(d.county).trim(),
                year: yearLabel,
                risklr: String(d.risk_lr).trim().toLowerCase(),
                riskrf: String(d.risk_rf).trim().toLowerCase(),
                riskkm: String(d.risk_km).trim().toLowerCase(),
                populationTotal: Number(d.population_total),
                medianFamilyIncome: Number(d.median_family_income)
            };
        });
    };

    Promise.all([
        d3.csv("data/us_states_risk_2019_2025.csv"),

        //data with predictions
        d3.csv("data/us_tracts_risk_2025_predictions.csv"),

        //geo boundaries
        d3.json("data/geography/states.geojson"),
        d3.json("data/tracts_2010_topoJSON.json"),
        d3.json("data/tracts_2020_topoJSON.json")
    ]).then(([statesCsv, tracts2025Csv, statesGeoJson, tracts2010TopoJson, tracts2020TopoJson]) => {
        state.datasets.states = parseData(statesCsv);

        state.geoJson.states = statesGeoJson;

        const parsed2025Tracts = parseSimplifiedTracts(tracts2025Csv, "2025");

        state.datasets.tracts = parsed2025Tracts

        //console.log("Raw CSV from D3:", tracts2025Csv);
        //console.log("Raw CSV length:", tracts2025Csv.length);

        // Convert 2019 TopoJSON
        const key2019 = Object.keys(tracts2010TopoJson.objects)[0];
        state.geoJson.tracts2019 = topojson.feature(tracts2010TopoJson, tracts2010TopoJson.objects[key2019]);

        // Convert 2025 TopoJSON
        const key2025 = Object.keys(tracts2020TopoJson.objects)[0];
        state.geoJson.tracts2025 = topojson.feature(tracts2020TopoJson, tracts2020TopoJson.objects[key2025]);

        // Initialize Map Rendering
        renderMap();
    }).catch(err => {
        console.warn("Loading fallback/simulated data due to missing local CSV server setup:", err);
    });
}

function updateModelControlVisibility() {
    //console.log("View:", state.currentView, "| Year:", state.selectedYear);

    const modelGroup = d3.select("#model-control-group");

    if (state.currentView === "STATE" && String(state.selectedYear) === "2025") {
        modelGroup.style("display", "");
    } else {
        modelGroup.style("display", "none");

        state.selectedModel = "risklr";
        d3.select("#model-select").property("value", "risklr");
    }
}

function parseData(data) {
    return data.map(d => ({
        ...d,
        // Force the ID to a string and pad to 11 characters. 
        // Note: USDA FARA datasets often use "CensusTract" as the column name. 
        // Adjust the fallback fields below to match your exact CSV column header.
        tractId: String(d.tractId || d.geoid || d.CensusTract).padStart(11, '0'),

        highRiskCount: +d.highRiskCount || 0,
        midRiskCount: +d.midRiskCount || 0,
        lowRiskCount: +d.lowRiskCount || 0
    }));
}

/**
 * Main Map Renderer
 */
function renderMap() {
    const svg = d3.select("#mapSvg");
    svg.selectAll("*").remove(); // Clear viewport

    // Attach Tooltip
    svg.call(tip);

    const width = document.getElementById("mapViewport").clientWidth;
    const height = document.getElementById("mapViewport").clientHeight || 500;

    if (state.currentView === "NATIONAL") {
        renderNationalMap(svg, width, height);
    } else {
        renderStateMap(svg, width, height);
    }

    renderLegend();
}

/**
 * Render US National Map (State Aggregation)
 */
function renderNationalMap(svg, width, height) {
    d3.select("#viewSubtitle").text("US National Level • State Risk Aggregation");
    d3.select("#mapTitle").text(`United States Food Desert Risk (${state.selectedYear})`);
    d3.select("#backBtn").classed("hidden", true);
    d3.select("#clickHint").text("💡 Tip: Click on any State to drill down into State & Tract view.");

    const mapGroup = svg.append("g").attr("class", "map-group");
    setupZoomControls(svg, mapGroup);

    const projection = d3.geoAlbersUsa()
        .fitExtent([
            [width * 0.15, height * 0.15],
            [width * 0.85, height * 0.85]
        ], state.geoJson.states);

    const path = d3.geoPath().projection(projection);

    // Filter state metrics by selected year
    const yearData = state.datasets.states.filter(d => d.year === state.selectedYear);
    const dataMap = new Map(yearData.map(d => [d.stateCode, d]));

    // Configure Tooltip
    tip.html(d => {
        const fips = d.properties.state_fips;
        const info = dataMap.get(fips) || dataMap.get(+fips);
        return `
            <h4>${d.properties.state_name} (${state.selectedYear})</h4>
            <div class="row"><span>High Risk Tracts:</span> <strong>${info.highRiskCount}</strong></div>
            <div class="row"><span>Mid Risk Tracts:</span> <strong>${info.midRiskCount}</strong></div>
            <div class="row"><span>Low Risk Tracts:</span> <strong>${info.lowRiskCount}</strong></div>
            <div style="margin-top:4px; font-size:0.75rem; color:${THEME.fallbackGray};">
                Highest Risk: ${info.highestRiskCounty}<br/>
                Lowest Risk: ${info.lowestRiskCounty}
            </div>
        `;
    });

    // Draw States
    mapGroup.selectAll("path")
        .data(state.geoJson.states.features)
        .enter()
        .append("path")
        .attr("class", "feature-path")
        .attr("d", path)
        .attr("fill", d => {
            const fips = d.properties.state_fips;
            const info = dataMap.get(fips) || dataMap.get(+fips);
            return calculateDominantRiskColor(info);
        })
        .attr("stroke", THEME.strokeColor)
        .attr("stroke-width", 0.1)
        .style("vector-effect", "non-scaling-stroke")
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .on("click", d => {
            tip.hide();
            drillDownToState(d.properties.state_fips, d.properties.state_name);
        });

    svg.call(zoomBehavior.transform, d3.zoomIdentity);

    updateSidebarNational(yearData);
}

/**
 * Render Single State Map (County & Tract Aggregation)
 */
function renderStateMap(svg, width, height) {
    svg.selectAll(".map-group").remove();

    // Append map group and attach zoom behavior
    const mapGroup = svg.append("g").attr("class", "map-group");
    setupZoomControls(svg, mapGroup);

    d3.select("#viewSubtitle").text(`State Level • ${state.selectedStateName}`);
    d3.select("#mapTitle").text(`${state.selectedStateName} - Food Desert Risk (${state.selectedYear})`);
    d3.select("#backBtn").classed("hidden", false);
    d3.select("#clickHint").text("💡 Viewing Tract-level aggregation per county.");

    // Filter data for selected state and year
    const yearTracts = state.datasets.tracts.filter(
        d => d.year === state.selectedYear && d.stateCode === state.selectedStateCode
    );

    // Select the correct geometry based on the dropdown year
    const activeGeoJson = state.selectedYear === "2019"
        ? state.geoJson.tracts2019
        : state.geoJson.tracts2025;

    // Filter loaded TopoJSON tracts matching the selected state FIPS code
    const selectedStateFips = state.selectedStateCode.toString().padStart(2, '0');

    // Map over activeGeoJson instead of state.geoJson.tracts
    const stateTractFeatures = activeGeoJson.features.filter(feature => {
        const tractId = feature.id || feature.properties.geoid;
        if (!tractId) return false;

        const tractIdStr = String(tractId).padStart(11, '0');
        return tractIdStr.startsWith(selectedStateFips);
    });

    // Build a map lookup for CSV risk data by tractId
    const riskDataMap = new Map(yearTracts.map(d => [d.tractId, d]));

    // Fit projection directly to state tract boundaries
    const featureCollection = { type: "FeatureCollection", features: stateTractFeatures };
    const projection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([width, height], featureCollection);
    const path = d3.geoPath().projection(projection);

    tip.html(d => {
        const tractId = String(d.id || d.properties.geoid).padStart(11, '0');
        const info = riskDataMap.get(tractId);

        const modelLabels = {
            risklr: "Model: Logistic Regression",
            riskrf: "Model: Random Forest",
            riskkm: "Model: K-Means Clustering"
        };

        const activeModelLabel = modelLabels[state.selectedModel] || "Model";

        if (info) {
            const rawRisk = info[state.selectedModel];

            // Format the string (e.g., "high" -> "High Risk")
            const formattedRisk = rawRisk
                ? (rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1)) + " Risk"
                : "N/A";

            return `
                <h4>Tract ${tractId} (${state.selectedYear})</h4>
                <div class="row" style="margin-bottom: 4px; border-bottom: 1px solid ${THEME.tooltip}; padding-bottom: 4px;">
                    <span style="color: ${THEME.fallbackGray}; font-size: 0.8rem;">${activeModelLabel}</span>
                </div>
                <div class="row"><span>Risk Category:</span> <strong>${formattedRisk}</strong></div>
                <div class="row"><span>County:</span> <strong>${info.county}</strong></div>
                <div class="row"><span>Population:</span> <strong>${info.populationTotal.toLocaleString()}</strong></div>
                <div class="row"><span>Median Family Income:</span> <strong>$${info.medianFamilyIncome.toLocaleString()}</strong></div>
            `;
        } else {
            return `
                <h4>Tract ${tractId} (${state.selectedYear})</h4>
                <div class="row"><span>Risk Category:</span> <strong>No Data</strong></div>
            `;
        }
    });

    // Render individual tract geometries
    mapGroup.selectAll("path")
        .data(stateTractFeatures)
        .enter()
        .append("path")
        .attr("class", "feature-path tract-path")
        .attr("d", path)
        .attr("fill", (d, i) => {
            const tractId = String(d.id || d.properties.geoid).padStart(11, '0');
            const tractData = riskDataMap.get(tractId);

            /*
            if (i === 0) {
                console.log("1. Selected Year:", state.selectedYear, "| Type:", typeof state.selectedYear);
                console.log("2. Total tracts loaded in memory:", state.datasets.tracts.length);

                console.log("TopoJSON ID:", tractId);
                console.log("CSV id?:", tractData);
            }
            */

            if (tractData) {
                // Dynamically grab risk
                const activeRiskValue = tractData[state.selectedModel];
                return getRiskColorTract(activeRiskValue);
            }

            return THEME.fallbackGray;
        })
        .attr("stroke", THEME.strokeColor)
        .attr("stroke-width", 0.001)
        .style("vector-effect", "non-scaling-stroke")
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    if (state.isNewMapView) {
        // It's a new map view (initial load or clicking a state) -> Reset to default
        svg.call(zoomBehavior.transform, d3.zoomIdentity);
        state.isNewMapView = false; // Toggle off until the next map switch
    } else {
        // It's just a year dropdown change -> Preserve the exact current zoom & pan
        const currentZoom = d3.zoomTransform(svg.node());
        svg.call(zoomBehavior.transform, currentZoom);
    }

    updateSidebarState(yearTracts);
}

function updateModelColors() {
    // 1. Get the current data for the selected state and year
    const yearTracts = state.datasets.tracts.filter(
        d => d.year === state.selectedYear && d.stateCode === state.selectedStateCode
    );

    // 2. Build the lookup map
    const riskDataMap = new Map(yearTracts.map(d => [d.tractId, d]));

    // 3. Select all existing tracts and transition their fill color
    d3.selectAll(".tract-path")
        .transition()
        .duration(400)
        .attr("fill", d => {
            const tractId = String(d.id || d.properties.geoid).padStart(11, '0');
            const tractData = riskDataMap.get(tractId);

            if (tractData) {
                // Dynamically grab the new risk model's value (risklr, riskrf, riskkm)
                const activeRiskValue = tractData[state.selectedModel];
                return getRiskColorTract(activeRiskValue);
            }

            return THEME.fallbackGray;
        });

    updateSidebarState(yearTracts);
}

/**
 * Navigation Actions
 */
function drillDownToState(stateCode, stateName) {
    state.currentView = "STATE";
    state.selectedStateCode = stateCode;
    state.selectedStateName = stateName;
    state.isNewMapView = true;
    updateModelControlVisibility();
    renderMap();
}

function resetToNationalView() {
    state.currentView = "NATIONAL";
    state.selectedStateCode = null;
    state.selectedStateName = null;
    state.isNewMapView = true;
    updateModelControlVisibility();
    renderMap();
}

/**
 * Helpers & Legends
 */
function renderLegend() {
    const container = d3.select("#riskLegend");
    container.html("");

    const activeScale = state.selectedYear === "2019" ? colorScale2019 : colorScale2025;

    // Adjust width depending on how many items are in the legend
    const legendWidth = state.selectedYear === "2019" ? 350 : 420;

    const legendSvg = container.append("svg")
        .attr("width", legendWidth)
        .attr("height", 50);

    const legendOrdinal = d3.legendColor()
        .shapeWidth(20)
        .shapeHeight(15)
        .shapePadding(75)
        .orient('horizontal')
        .scale(activeScale);

    const legendGroup = legendSvg.append("g")
        .attr("transform", "translate(10, 5)")
        .call(legendOrdinal);

    legendSvg.call(legendOrdinal);
}

function calculateDominantRiskColor(info) {
    if (!info) return THEME.fallbackGray;
    if (info.highRiskCount >= info.midRiskCount && info.highRiskCount >= info.lowRiskCount) {
        return THEME.high;
    } else if (info.midRiskCount >= info.lowRiskCount) {
        return THEME.mid;
    }
    return THEME.low;
}

function updateSidebarNational(yearData) {
    let totalHigh = 0;
    let totalMid = 0;
    let totalLow = 0;

    let stateWithMostHighRisk = { name: "N/A", count: -1 };
    let stateWithMostLowRisk = { name: "N/A", count: -1 };

    // Sum up the metrics from the state-level CSV
    yearData.forEach(d => {
        totalHigh += d.highRiskCount;
        totalMid += d.midRiskCount;
        totalLow += d.lowRiskCount;

        if (d.highRiskCount > stateWithMostHighRisk.count) {
            stateWithMostHighRisk = { name: d.state || d.stateCode, count: d.highRiskCount };
        }
        if (d.lowRiskCount > stateWithMostLowRisk.count) {
            stateWithMostLowRisk = { name: d.state || d.stateCode, count: d.lowRiskCount };
        }
    });

    const totalTracts = totalHigh + totalMid + totalLow;
    const formatNum = d3.format(",");

    d3.select("#aggLabel").text("Total Census Tracts (US)");
    d3.select("#aggValue").text(formatNum(totalTracts));

    d3.select("#countHigh").text(formatNum(totalHigh));
    d3.select("#countMid").text(formatNum(totalMid));
    d3.select("#countLow").text(formatNum(totalLow));

    //hide temporarily
    d3.select(".extremes-section").style("display", "none");
}

function updateSidebarState(yearTracts) {
    const totalTracts = yearTracts.length;
    const activeModel = state.selectedModel;

    let highCount = 0;
    let midCount = 0;
    let lowCount = 0;
    let firstHighTract = null;
    let firstLowTract = null;

    // Tally the risk categories based on the currently selected model
    yearTracts.forEach(t => {
        const risk = t[activeModel];
        if (risk === 'high') {
            highCount++;
            if (!firstHighTract) firstHighTract = t.tractId;
        } else if (risk === 'mid') {
            midCount++;
        } else if (risk === 'low') {
            lowCount++;
            if (!firstLowTract) firstLowTract = t.tractId;
        }
    });

    const formatNum = d3.format(",");

    d3.select("#aggLabel").text(`Total Census Tracts (${state.selectedStateName})`);
    d3.select("#aggValue").text(formatNum(totalTracts));

    d3.select("#countHigh").text(formatNum(highCount));
    d3.select("#countMid").text(formatNum(midCount));
    d3.select("#countLow").text(formatNum(lowCount));

    // Display population and median income statistics 
    d3.select("#population").text(formatNum(yearTracts.reduce((total, d) => total + d.populationTotal, 0)));
    d3.select("#highestMedianIncome").text(formatNum(Math.max(...yearTracts.map(d => d.medianFamilyIncome))));
    d3.select("#lowestMedianIncome").text(formatNum(Math.min(...yearTracts.map(d => d.medianFamilyIncome))));

    d3.select(".extremes-section").style("display", "");
}


function getRiskColorTract(riskLevel) {
    switch (riskLevel?.toLowerCase()) {
        case 'low': return THEME.low;    // green
        case 'mid': return THEME.mid;    // orange
        case 'high': return THEME.high;   // red
        default: return THEME.fallbackGray;       // default gray
    }
}

// Keep track of the active zoom instance
let zoomBehavior;

function setupZoomControls(svg, mapGroup) {
    // 1. Create the D3 zoom behavior
    zoomBehavior = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", function () {
            // Apply zoom/pan transform to the map group element
            mapGroup.attr("transform", d3.event.transform);
        });

    // 2. Attach zoom behavior to the main SVG canvas
    svg.call(zoomBehavior);

    // 3. Attach click event listeners to the zoom control buttons
    d3.select("#zoomInBtn").on("click", function () {
        svg.transition()
            .duration(300)
            .call(zoomBehavior.scaleBy, 1.4);
    });

    d3.select("#zoomOutBtn").on("click", function () {
        svg.transition()
            .duration(300)
            .call(zoomBehavior.scaleBy, 1 / 1.4);
    });

    d3.select("#zoomResetBtn").on("click", function () {
        svg.transition()
            .duration(400)
            .call(zoomBehavior.transform, d3.zoomIdentity);
    });
};