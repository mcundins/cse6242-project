// Application State
const state = {
    selectedYear: "2019",
    currentView: "NATIONAL", // "NATIONAL" or "STATE"
    selectedStateCode: null,
    selectedStateName: null,
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

// Colors mapping for Risk Levels
const colorScale = d3.scaleOrdinal()
    .domain(["High Risk", "Mid Risk", "Low Risk"])
    .range(["#dc2626", "#f59e0b", "#10b981"]);

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
        renderMap();
    });
}

function loadAllData() {
    Promise.all([
        d3.csv("data/us_states_risk_2019_2025.csv"),
        d3.csv("data/us_tracts_risk_2019_2025.csv"),
        d3.json("data/geography/states.geojson"),
        d3.json("data/tracts_2010_topoJSON.json"),
        d3.json("data/tracts_2020_topoJSON.json")
    ]).then(([statesCsv, tractsCsv, statesGeoJson, tracts2010TopoJson, tracts2020TopoJson]) => {
        state.datasets.states = parseData(statesCsv);
        state.datasets.tracts = parseData(tractsCsv);

        state.geoJson.states = statesGeoJson;

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

    const projection = d3.geoAlbersUsa()
        .fitSize([width, height], state.geoJson.states);

    const path = d3.geoPath().projection(projection);

    // Filter state metrics by selected year
    const yearData = state.datasets.states.filter(d => d.year === state.selectedYear);
    const dataMap = new Map(yearData.map(d => [d.stateCode, d]));

    // Configure Tooltip
    tip.html(d => {
        const fips = d.properties.state_fips;
        const info = dataMap.get(fips) || dataMap.get(+fips) || getSimulatedStateMetric(fips);
        return `
            <h4>${d.properties.state_name} (${state.selectedYear})</h4>
            <div class="row"><span>High Risk Tracts:</span> <strong>${info.highRiskCount}</strong></div>
            <div class="row"><span>Mid Risk Tracts:</span> <strong>${info.midRiskCount}</strong></div>
            <div class="row"><span>Low Risk Tracts:</span> <strong>${info.lowRiskCount}</strong></div>
            <div style="margin-top:4px; font-size:0.75rem; color:#cbd5e1;">
                Highest Risk: ${info.highestRiskCounty}<br/>
                Lowest Risk: ${info.lowestRiskCounty}
            </div>
        `;
    });

    const mapGroup = svg.append("g").attr("class", "map-group");
    setupZoomControls(svg, mapGroup);

    // Draw States
    mapGroup.selectAll("path")
        .data(state.geoJson.states.features)
        .enter()
        .append("path")
        .attr("class", "feature-path")
        .attr("d", path)
        .attr("fill", d => {
            const fips = d.properties.state_fips;
            const info = dataMap.get(fips) || dataMap.get(+fips) || getSimulatedStateMetric(fips);
            return calculateDominantRiskColor(info);
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .on("click", d => {
            tip.hide();
            drillDownToState(d.properties.state_fips, d.properties.state_name);
        });

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

    /*
    console.log("--- TRACT YEAR RENDER DEBUG ---");
    console.log("1. Selected Year Dropdown:", state.selectedYear);
    console.log("2. Total Features in Active GeoJSON:", activeGeoJson.features.length);
    console.log("3. Filtered State Tracts Count:", stateTractFeatures.length);

    if (stateTractFeatures.length > 0) {
        const sampleProps = stateTractFeatures[0].properties;
        console.log("4. Sample Tract Properties:", sampleProps);

        // If your 2019 and 2025 files have different metadata (like tract_vintage), this proves which file loaded
        if (sampleProps.tract_vintage) {
            console.log("5. Verified Tract Vintage:", sampleProps.tract_vintage);
        }
    }
    console.log("-------------------------------");
    */

    // Build a map lookup for CSV risk data by tractId
    const riskDataMap = new Map(yearTracts.map(d => [d.tractId, d]));

    // Fit projection directly to state tract boundaries
    const featureCollection = { type: "FeatureCollection", features: stateTractFeatures };
    const projection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([width, height], featureCollection);
    const path = d3.geoPath().projection(projection);

    tip.html(d => {
        const tractId = d.id || d.properties.geoid;
        const info = riskDataMap.get(tractId) || { riskCategory: "Low Risk", score: "N/A" };
        return `
        <h4>Tract ${tractId} (${state.selectedYear})</h4>
        <div class="row"><span>Risk Category:</span> <strong>${info.riskCategory || 'Low Risk'}</strong></div>
        <div class="row"><span>Risk Score:</span> <strong>${info.score || 'N/A'}</strong></div>
    `;
    });

    // Render individual tract geometries
    mapGroup.selectAll("path")
        .data(stateTractFeatures)
        .enter()
        .append("path")
        .attr("class", "feature-path tract-path")
        .attr("d", path)
        .attr("fill", d => {
            const tractId = d.id || d.properties.geoid;
            const info = riskDataMap.get(tractId);
            if (!info) return "#10b981";
            if (info.riskCategory === "High Risk") return "#dc2626";
            if (info.riskCategory === "Mid Risk") return "#f59e0b";
            return "#10b981"; //low risk
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.001)
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    updateSidebarState(yearTracts);
}

/**
 * Navigation Actions
 */
function drillDownToState(stateCode, stateName) {
    state.currentView = "STATE";
    state.selectedStateCode = stateCode;
    state.selectedStateName = stateName;
    renderMap();
}

function resetToNationalView() {
    state.currentView = "NATIONAL";
    state.selectedStateCode = null;
    state.selectedStateName = null;
    renderMap();
}

/**
 * Helpers & Legends
 */
function renderLegend() {
    const container = d3.select("#riskLegend");
    container.html("");

    const legendSvg = container.append("svg")
        .attr("width", 320)
        .attr("height", 50);

    const legendOrdinal = d3.legendColor()
        .shapeWidth(20)
        .shapeHeight(15)
        .shapePadding(75)
        .orient('horizontal')
        .scale(colorScale);

    const legendGroup = legendSvg.append("g")
        .attr("transform", "translate(10, 5)")
        .call(legendOrdinal);

    legendSvg.call(legendOrdinal);
}

function calculateDominantRiskColor(info) {
    if (!info) return "#cbd5e1";
    if (info.highRiskCount >= info.midRiskCount && info.highRiskCount >= info.lowRiskCount) {
        return "#dc2626";
    } else if (info.midRiskCount >= info.lowRiskCount) {
        return "#f59e0b";
    }
    return "#10b981";
}

function updateSidebarNational(data) {
    d3.select("#aggValue").text("3,142");

    d3.select("#countHigh").text("412");
    d3.select("#countMid").text("1,280");
    d3.select("#countLow").text("1,450");

    d3.select("#highestRiskArea").text("Cook County, IL");
    d3.select("#lowestRiskArea").text("Loving County, TX");
}

function updateSidebarState(data) {
    d3.select("#aggLabel").text(`Total Census Tracts (${state.selectedStateName})`);
    d3.select("#aggValue").text("1,840");

    d3.select("#countHigh").text("85");
    d3.select("#countMid").text("420");
    d3.select("#countLow").text("1,335");

    d3.select("#highestRiskArea").text("Tract 9801.01");
    d3.select("#lowestRiskArea").text("Tract 0102.00");
}

function getSimulatedStateMetric(id) {
    return {
        highRiskCount: Math.floor(Math.random() * 15) + 2,
        midRiskCount: Math.floor(Math.random() * 30) + 10,
        lowRiskCount: Math.floor(Math.random() * 40) + 15,
        highestRiskCounty: "Metro County",
        lowestRiskCounty: "Rural County"
    };
}

function getSimulatedCountyMetric(name) {
    return {
        highRiskCount: Math.floor(Math.random() * 8) + 1,
        midRiskCount: Math.floor(Math.random() * 15) + 3,
        lowRiskCount: Math.floor(Math.random() * 25) + 5,
        highestRiskTract: "Tract 104.02",
        lowestRiskTract: "Tract 002.01"
    };

}


// Keep track of the active zoom instance
let zoomBehavior;

function setupZoomControls(svg, mapGroup) {
    // 1. Create the D3 zoom behavior
    zoomBehavior = d3.zoom()
        .scaleExtent([0.5, 8])
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