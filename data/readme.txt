Steps to transform shape files
1. Load all to mapshaper
2. run in console in this order
merge-layers target=* (all layers at the same level)
rename-layers tracts
proj albersusa (the  projection we need)
filter-fields STATEFP10,COUNTYFP10,TRACTCE10,GEOID10 (to only keep needed fields)
simplify dp 5% (to reduce redundant coordinate points)
3. export