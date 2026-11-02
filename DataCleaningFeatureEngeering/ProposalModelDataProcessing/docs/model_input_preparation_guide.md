# Model Input Data: Preparation Summary and Modeling Notes

This guide explains which fields were retained, which missing values were filled, and what alternatives remain available. The reproducible workflow is [model_input_preparation_for_modeling.ipynb](../notebooks/model_input_preparation_for_modeling.ipynb). It starts from the existing cleaned tables and uses the raw straight-line files to check spatial-field recoverability. Required paths and packages are listed at the start of the notebook.

The notebook writes only `model_input_2019.csv` and `model_input_2025.csv`. Each contains **27 columns: `tract_id`, 25 candidate input fields, and the separate target `FD_2`**. All eligible input values and targets are present. Numerical completeness does not mean all 25 candidates should be used together in every model.

## 1. Record coverage and target

| Release | Source records | Excluded records | Output records |
|---|---:|---|---:|
| 2019 | 72,531 | 4 records with jointly missing children, seniors, and race/ethnicity counts | 72,527 |
| 2025 | 84,119 | 271 zero-population records, which also have unknown FD_2 | 83,848 |

The four 2019 records have known targets; they are excluded for incomplete selected demographic inputs. Independently filling all population components could break their composition relationship. These are the same four records across multiple fields, not additional exclusions for each field. No further rows are deleted because of the missing values discussed below. Full source tables remain unchanged.

`FD_2` is the official urban-1-mile/rural-20-mile low-access flag, carried from `LA1and20` in 2019 and its corresponding straight-line field in 2025. A tract meets the low-access condition when at least **500 people OR 33% of its population** are beyond the relevant distance. The 500 refers to low-access people, not total population. This target does **not** add a low-income requirement; the project uses the low-access flag as its FD target.

- Eligible target counts: 2019 has 47,818 zeros and 24,709 ones; 2025 has 70,493 zeros and 13,355 ones.
- No target is imputed or recomputed from estimated counts.
- `tract_id` is an 11-digit string used for matching and mapping, not a numeric predictor. Retain leading zeros.
- `FD_2` is separate from X, including for clustering. Neither the data nor a cluster number automatically defines low/medium/high risk.

## 2. Fields retained without additional imputation or transformation

“Retained” means using the existing cleaned value in this preparation step. It does not mean the raw data never underwent earlier normalization or cleaning.

| Fields in the output | Meaning and action | Important qualifications |
|---|---|---|
| `clean__Urban` | Official 0 = rural, 1 = urban. Retain observed values. | Both eligible datasets are complete and binary. Do not infer urban status from a low-access flag. |
| `clean__population_total` | Census population: 2010 for the 2019 release, 2020 for 2025. Retain positive observed counts. | Zero-population 2025 records are excluded rather than assigned a median or a target. |
| `clean__occupied_housing_units_total` | Occupied housing-unit count. Retain all observed values, including zero. | Eligible zero counts: 106 in 2019, 165 in 2025. Zero households need not mean zero people, for example in group quarters. This Census count is not automatically a compatible denominator for ACS household rates. |
| `clean__GroupQuartersFlag` | Official group-quarters flag, with 1 corresponding to at least 67% of population in group quarters. Retain the official flag. | Eligible records are complete. Flag 0 does not mean zero group-quarters residents and cannot recover an exact missing count/share. |
| `clean__TractKids`, `clean__TractSeniors` | Counts aged 0–17 and 65+, respectively. Retain observations and valid zeros. | Four source missing values per field in 2019 belong to the excluded records; 2025 is complete. Do not calculate seniors as total population minus children. |
| `clean__TractWhite`, `clean__TractBlack`, `clean__TractAsian`, `clean__TractNHOPI`, `clean__TractAIAN`, `clean__TractOMultir` | Six source race counts; retain observations and valid zeros. | They sum to total population. Independently imputing them can break this relationship; including all six plus total population creates a linear dependency. |
| `clean__TractHispanic` | Hispanic/Latino ethnicity count; retain observations and valid zeros. | Ethnicity overlaps race. Do not add this count to the six-race population sum. Its 2019 missing records are the same four excluded records. |
| `clean__LowIncomeTracts` | Official low-income 0/1 classification. Retain it. | No missing values. The definition involves poverty or income relative to state/metropolitan reference medians, not one national income cutoff. In 2019, 29 eligible records display PovertyRate = 20 and flag = 0; their cause is not established, so the official flag is not overwritten. |
| `clean__LATracts_half`, `clean__LATracts1` | Official urban half-mile and one-mile low-access flags. Retain eligible 0/1 values. | No eligible missing values. Each has 164 source missing values in 2025, all excluded by eligibility. See the spatial cautions in Section 4. |

**Alternatives:** if additional excluded demographic records are required, seek compatible official observations or a jointly constrained composition method. Converting counts to rates is a separate feature-engineering decision requiring an appropriate denominator. A valid zero is not a missing value.

## 3. Fields with missing-value treatment

The following counts refer to records retained for model input. Imputation changes only originally missing cells; observed values are preserved. Group references require **at least five valid observations**, a practical rule for this pipeline rather than an official standard. Filled values never become donors. FD_2 values are not used to group donors or choose imputation values.

### 3.1 Group-quarters count and share: treat the pair together

**Fields:** `clean__NUMGQTRS`, `clean__PCTGQTRS`.

2019 has 21 eligible jointly missing pairs; 2025 has none. Use observed eligible **2019** percentages consistent with the official group-quarters flag. Select the median within state and flag; if fewer than five donors, fall back to the national same-flag group. Never cross flag groups. Stop if the final reference is insufficient.

Fill the percentage first, then derive:

`NUMGQTRS = population_total × PCTGQTRS / 100`

All 21 pairs use state/same-flag reference with no fallback: seven Arizona records use 0.13%, one California record 0.27%, 12 New York records 0.28%, and one Virginia record 0.05%. The resulting counts may be fractional estimates. Existing official flags remain unchanged.

**Alternatives:** matching Census recovery, a validated population-constrained joint estimator, or omitting both count/share fields from X. Separate count and share medians can produce internally inconsistent pairs.

### 3.2 Poverty rate: use 2019 grouped medians

**Field:** `clean__PovertyRate`, in 0–100 percentage units.

No missing values remain in eligible 2019 records; 433 require filling in 2025. Use **2019** observed values, including valid zeros, with the sequence:

`same state + same Urban → national same Urban → national overall`

All 433 use state/same-Urban references, with no national fallback. Do not change the official LowIncomeTracts flag after filling poverty. The poverty-status denominator is not automatically Census total population, and PovertyRate is not interchangeable with TractLOWI.

**Alternatives:** matching ACS recovery, training-fitted predictive imputation, or same-year medians with explicit disclosure that the test-feature distribution is used.

### 3.3 Family income: preserve existing price conversion and endpoint proxies

**Input field:** `income_with_endpoint_proxy_2018_usd`.

The cleaned input already expresses ordinary income and endpoint proxy amounts in **2018 dollars**. This notebook does not apply another price adjustment. Raw codes 2499 / 250001 indicate reporting endpoints, not exact observed incomes. Eligible endpoint proxies—272 in 2019 and 1,645 in 2025—are retained and excluded from the reference pool.

Genuine missing values: **745 in 2019; 1,873 in 2025**. Reference values come only from the 71,510 eligible **2019 ordinary observed incomes**, identified by `income_value_status == ordinary` and `income_ordinary_2018_usd`.

| Records to fill | Reference hierarchy | Actual outcome |
|---|---|---|
| 2019 | 2019 county → state → national | 721 county medians; 24 state fallbacks |
| 2025 | 2019 state → national | All 1,873 state medians |

No national fallback is used. County matching is skipped for 2025 because the workflow does not assume a verified cross-year county mapping. These are medians of tract median incomes, not official county income estimates. The filled amounts are already in 2018 dollars and must not be converted again.

**Alternatives:** compatible ACS recovery, simpler state/national references, predictive or multiple imputation, or model-specific handling of censored endpoint income. Median imputation can reduce variation and does not recover true household income.

### 3.4 LOWI, HUNV, and SNAP: use separate 2025 grouped medians

All three have four source missing values in 2019, already excluded. Each has **14 eligible missing values in 2025**, in the same 14 tracts. Each field is processed independently using original **2025** observed values, including zeros:

`same state + same Urban → national same Urban → national overall`

| Output field | Unit and meaning | Actual fill for each of the 14 records |
|---|---|---:|
| `clean__TractLOWI` | Low-income people under the applicable 200% poverty-threshold criterion; not households or the poverty-rate denominator | 2,360 people |
| `clean__TractHUNV` | Households / occupied housing units without vehicle access; not only those far from stores | 227.5 households |
| `clean__TractSNAP` | Households / occupied housing units receiving SNAP; not people or benefit dollars | 155 households |

Each uses **4,474 New York urban observations** with no fallback. No filled value is rounded or clipped. Fractional household counts are estimates, not observed fractions of a household.

**Scale limitation:** tract `36103201200` has Census reference population 560 and occupied housing units 25. All three estimates exceed the corresponding reference total. They are retained with this limitation; differences in source periods do not establish that an estimate is appropriate. Existing observed ACS/Census cross-period exceedances are also retained, not silently truncated.

**Alternatives:** 2019 grouped references would yield 964 people, 235 households, and 144 households, respectively, for these records. Other options are matching official-source recovery or a validated estimator that accounts for tract scale. The chosen same-year method uses the **2025 test-feature distribution**, so this pipeline is not wholly fitted on 2019.

## 4. Spatial fields: treatment, interpretation, and cautions

### 4.1 Three binary flags

The three fields are 0/1 indicators, potentially with source NA; they are not distances or continuous shares.

- `clean__LATracts_half` and `clean__LATracts1` describe the respective **urban** distance conditions using at least 500 people or 33% of population. Both are complete after eligibility, so no filling occurs. A rural 0 must not be interpreted by itself as good food access.
- `clean__LATractsVehicle_20` combines vehicle availability and distance, regardless of urban/rural status. Its OR condition is: at least 100 no-vehicle households beyond half a mile; or at least 500 people beyond 20 miles; or at least 33% of population beyond 20 miles.

The vehicle flag has 14 eligible missing values in 2025. In the local source data, their half-mile no-vehicle counts are missing while their 20-mile population counts are zero. That zero does not establish that every OR branch is false, so it does not recover a flag of 0.

**Selected treatment:** use the **2025** same-state/same-Urban mode, falling back to national/same-Urban and national overall. Each reference needs at least five observations and a unique mode; tied 0/1 counts trigger fallback. Stop if no reference qualifies.

**Result:** all 14 are filled with 0 from the New York urban group: **4,308 zeros and 166 ones**, total 4,474. This is a statistical mode estimate, not “NA means 0” and not official-source recovery. No national fallback is used.

**Alternatives:** compatible official recovery, 2019-only modal references, missing-aware models, or retaining source NA and excluding the field from X. Binary flags should not be filled with an arbitrary fractional median or encoded as -1 for all models without considering that model's interpretation.

### 4.2 Low-access population: a separate, high-missingness case

**Field:** `clean__low_access_population_1_20`.

This counts people beyond 1 mile in urban areas or 20 miles in rural areas. It is not itself a binary label. The 2019 source has 35,914 missing values; **35,910 remain eligible**, about **49.51%** of eligible 2019 records. 2025 has no missing values and is retained unchanged.

Matching distance-specific counts and shares in the available raw files also lack values for these records. No recovery is available from those local components; this does not establish that every external source has been exhausted. Official flags and rounded zeros cannot reconstruct an exact missing population count.

**Selected treatment:** use 36,617 original observed eligible **2019** records to calculate low-access count / total population. Take the median proportion within state and Urban; if fewer than five donors, use national/same-Urban, then national overall. Multiply the selected proportion by the missing tract's population. Retain fractional estimates; do not use 2025 observations or FD_2 as references.

**Result:** 29,214 estimates use state/same-Urban reference; 6,696 use national/same-Urban fallback; none uses national overall. Estimated counts lie between 0 and total population. This addresses scale bounds but does not validate the estimates or eliminate selection bias in which tracts have observations.

**Major limitation:** applying the 500-person / 33% formula to these estimates disagrees with official FD_2 in **18,641 of 35,910 imputed records**. Seven of 36,617 observed 2019 counts also disagree; their cause is not assumed to be rounding. Observed 2025 counts have no disagreement. The comparison is diagnostic only: neither the official target nor estimated counts are changed to force agreement.

### 4.3 Why excluding these columns remains a valid option

1. **Target overlap:** LATracts1 and low-access population directly overlap FD_2's definition; the other flags measure closely related access conditions. Their inclusion may reproduce contemporaneous classification rather than demonstrate future-risk prediction.
2. **Extensive estimation:** roughly half the 2019 low-access population values are estimated. Medians compress variation, and donors may not represent missing records. Complete numeric values are not equivalent to complete observed information.
3. **Temporal evaluation:** the vehicle flag uses 2025 feature statistics; this must be disclosed with the other same-year imputations.

**Keeping the original values/NA and not using a column in the model is a legitimate preparation choice.** It does not require deleting the tract. The 21-feature option excludes all four spatial/count fields; the 25-feature option makes them available as candidates. If a model needs reliable observed access counts, these estimates should not be presented as recovered official measurements.

Other options include compatible official recovery, a validated alternative estimator, or model-specific missing-value handling. Removing all missing-count tracts would materially change training coverage and is not the selected approach. Do not reconstruct predictor counts from FD_2 or tune the estimates to match it.

Definitions are documented in the [USDA LRAM reference guide](https://www.ers.usda.gov/data-products/food-access-research-atlas/documentation/large-retailer-access-map-reference-guide), [USDA SRAM reference guide](https://www.ers.usda.gov/data-products/food-access-research-atlas/documentation/snap-authorized-retailer-access-map-reference-guide), and the local release dictionaries.

## 5. How to use the files

The notebook defines exact ordered lists:

- `BASE_FEATURES`: 21 candidates—eight demographic/housing fields, seven race/ethnicity fields, and six economic fields.
- `EXTENDED_FEATURES`: the same 21 plus the three spatial flags and low-access population.

Use the same list and order for both years. Select X explicitly rather than taking all CSV columns. `FD_2` is y; `tract_id` is an identifier. The official target remains binary; any probability thresholds or cluster interpretation needed for low/medium/high risk belong to the modeling stage.

The export layer uses the same field names as the cleaned inputs, but missing positions now contain estimates. For example, `clean__TractSNAP` in the output includes 14 imputed values. Source tables retain NA. The notebook's in-memory `imputed_flags` identifies filled positions if needed for sensitivity analysis; these flags are not automatically predictors and are not exported as separate logs/files in this version.

Preparation checks passed for both years: unique aligned IDs, identical feature order, no missing X/y values, finite input values, valid binary ranges, preservation of observed inputs, and exact CSV read-back equality. Running the teammate notebook with the same inputs reproduced the previously generated CSVs **byte for byte**. It creates a fresh timestamped directory and does not overwrite prior data.

These checks establish reproducibility and numeric integrity, not optimal feature selection or predictive validity. The notebook does not fit models, standardize inputs, resolve model-specific collinearity, or produce ordered risk classes. Those decisions remain with the model owner.
