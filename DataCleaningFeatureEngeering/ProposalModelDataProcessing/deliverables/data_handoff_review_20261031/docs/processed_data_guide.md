# Processed Data Guide — Field-by-Field Reference and Follow-up Decisions

This teammate-facing reference follows the personal dictionary's structure: first the `original__` / `clean__` / `qa__` convention, then each field or source concept, then the consolidated outstanding-work register. It preserves research explanations and conditions rather than reducing everything to a one-line definition. Personal discussion history is omitted; the personal reference itself is unchanged.

**Current release:** 72,531 records (2019) and 84,119 (2025), **103 columns each**. Six official-FD fields have been appended; all original 97 columns and their values remain unchanged. Both labels are now available in the CSVs. Choosing a training target is still a modeling decision; no statistical imputation, feature selection, split, or model training has been performed.

Use `column_dictionary.csv` for a compact 103-column index. Use this guide for rationale, findings, and next steps. See Section 5 for the action register with separate verified-findings columns for each target. Counts were recomputed from the updated delivered data; “known” includes target values 0 and 1.

## 0. Understand `original__`, `clean__`, and `qa__` first

| Prefix | What it contains | Origin |
|---|---|---|
| `original__X` | Exact source text, including source missing codes | New column name; preserved source value |
| `clean__X` | Numeric representation with missing/invalid values as NA | Deterministic parsing and validity rules |
| `qa__X` | `valid`, `source_missing`, or a specific invalid-value reason | Computed quality status, not the original measure |

The three columns describe one concept, not three independent features. `valid` means the basic checks passed, not that a denominator is positive, the value is complete for every model, or that a feature is appropriate. A valid population of zero cannot be used as a ratio denominator. `qa__X='source_missing'` is a nonmissing string describing a missing source value; the QA column itself can be fully populated while the underlying field has missing values.

Read CSVs initially with `dtype=str, keep_default_na=False`. Explicitly convert numeric columns after replacing empty strings with NA. Preserve tract leading zeros and source tokens; never treat all text columns as numeric. Fields and prefixes are case sensitive, with **two underscores**. Source missing tokens are empty text, NULL, NA, N/A and NAN (after trimming and case normalization). Invalid text, nonfinite or negative numbers, out-of-domain binary/percentage values and invalid source income receive separate reasons. No whole-table dropna, generic clipping, or full-data median filling is performed.

The exported formula fields and official-FD fields have independent state columns: `label_status` does not describe FD_2. `not_comparable` does not mean the labels agree. Column statistics below distinguish all missing records from missing records with known labels under each target; the latter are potential missing-input issues, not automatically usable model rows.

## 1. Geography and source-version fields

### 1.1 `tract_id`

**Meaning and source:** Normalized 11-digit Census tract identifier. Source: CensusTract in 2019, CensusTract20 in 2025.

**Completed treatment:** Leading zeros are restored for valid 10/11-digit source strings; malformed or duplicate keys fail validation. First two/five digits describe state/county for that tract coding.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Use and limitations:** Only for joining, maps and explicitly approved grouping. It is not a numeric predictor. Matching IDs across years do not prove identical boundaries; no common-boundary panel is created.

### 1.2 `State`

**Meaning and source:** Source state name, retained as descriptive metadata.

**Completed treatment:** Both datasets cover 50 states plus D.C.; this is 51 state-level entries, not all U.S. territories.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Use and limitations:** Use a proper geographic key for joins. State membership can support an explicitly chosen training-reference fallback but is not automatically a model feature.

### 1.3 `County`

**Meaning and source:** 2019 County / 2025 County20 name; not County24.

**Completed treatment:** The General/Straight Line join also checks County24 for consistency but does not substitute it into the exported County field.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Use and limitations:** Names repeat across states and are not a unique cross-year matching key. Use audited codes/boundaries for county-level references.

### 1.4 `meta_dataset_version`

**Meaning and source:** Added release label, 2019 or 2025.

**Completed treatment:** Constant within each file, even when a measured field is missing.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Use and limitations:** It is not every field's observation year. Release dates, ACS periods, Census years and price years must be distinguished.

### 1.5 `meta_population_census_year`

**Meaning and source:** Added Census basis: 2010 for 2019; 2020 for 2025.

**Completed treatment:** Describes population/demographic totals; it is known even if a specific count is missing.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Use and limitations:** Does not apply to ACS socioeconomic counts. Mixing an ACS numerator with this older denominator does not create a measured same-year rate.

### 1.6 `meta_tract_vintage`

**Meaning and source:** Added tract-geography system: 2010 or 2020.

**Completed treatment:** This is distinct from a GIS boundary file's publication year. Earlier geography work used 2019-published cartographic boundaries for the 2010 tract system to match all 2019 USDA IDs.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Use and limitations:** Do not rename the vintage to 2019 just because a boundary file was published in 2019. ID matching alone does not validate every coordinate or establish cross-year equivalence.

## 2. The two FD labels and every associated column

### Shared conceptual definition and why two implementations exist

The proposal selects urban 1 mile / rural 20 miles low access: at least 500 persons **or** 33% of the tract population beyond the relevant distance. No low-income condition or GQ exclusion is added. The count 500 refers to low-access persons, not total population. USDA provides multiple distance choices; the proposal selected this one. Different urban/rural spatial scales do not prove that everyone inside the threshold has transport, affordable food or adequate access. The 2025 source is Straight Line, not Driving.

The formula reconstructs the classification from public L and P; the official flag supplies the agency's published classification. Conceptual correspondence is not guaranteed row-level equivalence when public counts are missing or rounded. Neither is a low-income-and-low-access LILA flag, nor a high/mid/low model probability bin.

| Year | Formula 0 | Formula 1 | Formula unknown | Formula not applicable | FD_2=0 | FD_2=1 | FD_2 NA | Comparable disagreements |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2019 | 11,901 | 24,716 | 35,914 | 0 | 47,822 | 24,709 | 0 | 7 |
| 2025 | 70,493 | 13,355 | 0 | 271 | 70,493 | 13,355 | 271 | 0 |

### 2.1 `fd_label`

**Definition and origin:** Derived formula label. For valid P>0 and 0≤L≤P, 1 if 100×L≥33×P OR L≥500, otherwise 0. Uses Decimal arithmetic, includes boundaries, and validates P before L.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 35,914 | 0 | 35,914 |
| 2025 | 84,119 | 271 | 0 | 0 |

**Interpretation and conditions:** 2019 uses LAPOP1_20 and Pop2010; 2025 uses SD_SRAM_LAPOP1_20 and POP2020. Missing/invalid input leaves NA; zero P is not applicable. Do not manufacture this target by filling L.

### 2.2 `label_status`

**Definition and origin:** Formula-only status: known, unknown or not_applicable.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Interpretation and conditions:** Known includes both 0 and 1. An unknown formula label does not imply the official label is unknown. Do not use this column to filter FD_2 training/evaluation.

### 2.3 `label_reason`

**Definition and origin:** Formula-only reason. Known cases: both_thresholds, share_threshold_only, count_threshold_only, below_both_thresholds. Other reasons describe missing/invalid population or L, L>P, or zero_population.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Interpretation and conditions:** count_threshold_only means L≥500 but the 33% condition was not met; e.g. P=2,000 and L=500. The current 35,914 formula-unknown records all have low_access_missing. Missing predictors do not themselves create a missing FD label.

### 2.4 `FD_2_original`

**Definition and origin:** Exact source text of the official low-access flag; the preserved original column for the alternative target.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 271 | 0 | 0 |

**Interpretation and conditions:** 2019 source LA1and20; 2025 source SD_SRAM_LA1and20. Missing source tokens remain visible here even though FD_2 uses numeric NA. This is a label audit column, not a predictor.

### 2.5 `FD_2`

**Definition and origin:** Nullable numeric 0/1 copied from a valid official flag. Missing or invalid flags remain NA; no formula fallback is used.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 271 | 0 | 0 |

**Interpretation and conditions:** All 35,914 formula-unknown 2019 records have FD_2=0. Their L remains missing; classification availability does not recover a count of zero. Both labels are exported, without changing fd_label.

### 2.6 `FD_2_source_field`

**Definition and origin:** Added provenance naming LA1and20 or SD_SRAM_LA1and20.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Interpretation and conditions:** Identifies the actual upstream field, not a new measured value. It can be populated even when the official classification is absent.

### 2.7 `FD_2_status`

**Definition and origin:** Official-label-only status. Valid official 0/1 is known; missing official flag with zero population is not_applicable; other missing/invalid values are unknown.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Interpretation and conditions:** 2019 has 72,531 known official labels; 2025 has 83,848 known and 271 not applicable. For FD_2 supervised work, filter this status and then inspect selected inputs. Do not reuse the formula status.

### 2.8 `FD_2_reason`

**Definition and origin:** official_flag_available, zero_population_official_missing, official_flag_missing or official_flag_invalid.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Interpretation and conditions:** This independently explains official-label applicability. Available does not indicate good access; consult FD_2=0/1. Current data contain no invalid official 0/1 source values.

### 2.9 `FD_2_comparison`

**Definition and origin:** agree/different only when both labels are known; otherwise not_comparable.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Interpretation and conditions:** The seven 2019 differences are formula=1 / official=0. Exact upstream generation/precision causes remain unresolved. not_comparable covers 35,914 2019 formula-unknown records and 271 2025 zero-population records. Never treat it as agreement or as a predictor.

**Target selection:** Use one chosen label and its matching status as the target policy. Do not use the other label, comparison result, or direct label-generating information as independent predictors without addressing leakage. Existing named `fd_known`/`fd_unknown`/`fd_not_applicable` subfiles remain **formula-based**, even though they now carry FD_2 columns. In particular, `fd_unknown` contains 2019 records with known FD_2=0. For FD_2, start from the full master table and filter `FD_2_status`; these old filenames are not official-label subsets.

## 3. Source concepts, one field at a time

Each entry covers its original/clean/QA triplet together. The concept itself comes from the source, while column prefixes and QA are processing additions. Definitions and counts below are not a claim that all 24 candidates should enter a model together. Structural invalidity, absent source values, and cross-period comparisons need different treatment.

### 3.1 `Urban`

**Columns:** `original__Urban`, `clean__Urban`, `qa__Urban`.

**Source fields:** 2019 `Urban`; 2025 `Urban`. **Meaning:** Read the official flag; do not recalculate it from population density or total population. 2019 has 55,169 urban and 17,362 rural tracts; 2025 has 62,463 urban and 21,656 rural. These are numbers of tracts, not shares of people.

**What was done / what was found:** Retain 0/1. The flag identifies the branch used by the published 1/20-mile population measure; this notebook does not calculate individual shopping distances. A change in urban/rural tract counts between releases is not evidence that specific tracts urbanized.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** No missing-value treatment is required. Retain the official definition and discuss cross-release comparability when modeling.

### 3.2 `population_total`

**Columns:** `original__population_total`, `clean__population_total`, `qa__population_total`.

**Source fields:** 2019 `Pop2010`; 2025 `POP2020`. **Meaning:** Census 2010 population for 2019 and Census 2020 population for 2025. It is neither an ACS household count nor the low-access count.

**What was done / what was found:** Keep valid zero as 0. There are 271 zero-population 2025 tracts and none in 2019. Numeric QA can be valid while a population-based ratio is inapplicable; the formula label is not_applicable. The official label is also missing on those current records.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Do not median-fill a genuine zero or label it FD=0. Define route applicability and keep maps/data coverage distinct from model eligibility.

### 3.3 `occupied_housing_units_total`

**Columns:** `original__occupied_housing_units_total`, `clean__occupied_housing_units_total`, `qa__occupied_housing_units_total`.

**Source fields:** 2019 `OHU2010`; 2025 `OHU2020`. **Meaning:** An occupied housing-unit count, not total housing units including vacancies, not families, and not persons. Census reference years are 2010/2020.

**What was done / what was found:** Retain 106/420 zero-household records in 2019/2025. Positive population can occur in group quarters outside ordinary housing units. In 2025, 90 positive-population/zero-household records are not explained by all population being GQ; exact causes remain unresolved.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Never divide by zero or replace it with an arbitrary positive denominator. If a household rate is needed, obtain a compatible denominator and resolve period/universe differences; do not silently drop these tracts.

### 3.4 `GroupQuartersFlag`

**Columns:** `original__GroupQuartersFlag`, `clean__GroupQuartersFlag`, `qa__GroupQuartersFlag`.

**Source fields:** 2019 `GroupQuartersFlag`; 2025 `GroupQuartersFlag`. **Meaning:** Official flag for a GQ population share of at least 67%. The threshold is from USDA, not fitted here. Why the precise value is 67%, rather than another threshold, was not established by the reviewed sources.

**What was done / what was found:** Preserve the official flag. It is not a flag calculated by this notebook and is not an FD exclusion. Dormitory/institutional food arrangements can complicate distance interpretation, but the flag does not prove adequate access. A 0 flag cannot recover a missing exact count.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 271 | 0 | 0 |

**Next actions and conditions:** For 2025 zero-population records, preserve structural NA. For 2019 missing count/share but available flag, keep the fields distinct; do not infer zero GQ people from flag=0.

### 3.5 `NUMGQTRS`

**Columns:** `original__NUMGQTRS`, `clean__NUMGQTRS`, `qa__NUMGQTRS`.

**Source fields:** 2019 `NUMGQTRS`; 2025 `NUMGQTRS`. **Meaning:** Number of residents in group quarters. It is conceptually the numerator of the GQ share, but separately published count/share/flag fields can have different availability.

**What was done / what was found:** 2019 has 25 missing counts, with the corresponding share also missing and official flag=0. This does not establish a source contradiction: the coarse flag does not uniquely determine the exact numerator. In 2025, the 271 zero-population records have GQ count 0.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 25 | 10 | 25 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** If needed, recover matched Census values or design a documented route-specific treatment. Filling must preserve the count/share/total relationship. Under FD_2, all 25 missing 2019 counts are in label-known records, versus 10 under the formula.

### 3.6 `PCTGQTRS`

**Columns:** `original__PCTGQTRS`, `clean__PCTGQTRS`, `qa__PCTGQTRS`.

**Source fields:** 2019 `PCTGQTRS`; 2025 `PCTGQTRS`. **Meaning:** Group-quarters population as a percentage, on a 0–100 scale. A value of 67 means 67%, not 0.67%.

**What was done / what was found:** Keep the source percentage rather than rebuilding it indiscriminately. It shares the 25 missing 2019 records with NUMGQTRS; 2025 has 271 zero-population missing percentages. A missing percentage is not a measured 0%.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 25 | 10 | 25 |
| 2025 | 84,119 | 271 | 0 | 0 |

**Next actions and conditions:** Do not compute 0/0 as 0. If a matched-source recovery makes one component available, any derivation still requires a valid same-period denominator and explicit provenance.

### 3.7 `TractKids`

**Columns:** `original__TractKids`, `clean__TractKids`, `qa__TractKids`.

**Source fields:** 2019 `TractKids`; 2025 `TractKids`. **Meaning:** Population aged 0–17, from Census 2010/2020. This is an age-group count, not the number of low-access children.

**What was done / what was found:** Keep nonnegative published values and the four missing 2019 records. These records have formula-unknown labels because L is missing, not because child counts are missing. Under FD_2 they have known official labels.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** A fill is unnecessary for a formula-known-only training subset that excludes them, but potentially needed if selected for FD_2 training, clustering, or unlabeled scoring. Do not recover children by subtracting seniors from total population.

### 3.8 `TractSeniors`

**Columns:** `original__TractSeniors`, `clean__TractSeniors`, `qa__TractSeniors`.

**Source fields:** 2019 `TractSeniors`; 2025 `TractSeniors`. **Meaning:** Population aged 65 and over, from Census 2010/2020. Adults aged 18–64 mean children and seniors are not complements.

**What was done / what was found:** The same four 2019 records as TractKids are missing. Keep NA and check children+seniors against the total where inputs exist.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Do not use total minus children to recover seniors. Match source age bands, vintage and boundaries for external recovery; any statistical approach must be fitted to the appropriate training reference.

### 3.9 `TractWhite`

**Columns:** `original__TractWhite`, `clean__TractWhite`, `qa__TractWhite`.

**Source fields:** 2019 `TractWhite`; 2025 `TractWhite`. **Meaning:** White population count in the source race classification; not a binary composition flag.

**What was done / what was found:** Part of the six-category race sum. The same four 2019 records have missing racial counts. Hispanic is a separate overlapping ethnicity and cannot be subtracted to recover White population.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** If needed, recover or impute the racial composition jointly, respecting the total and source classification. All six counts plus total population are linearly dependent; feature encoding is a later model decision.

### 3.10 `TractBlack`

**Columns:** `original__TractBlack`, `clean__TractBlack`, `qa__TractBlack`.

**Source fields:** 2019 `TractBlack`; 2025 `TractBlack`. **Meaning:** Black or African American population count, not a population proportion or low-access subgroup count.

**What was done / what was found:** Preserve the published race category and missing values. It participates in the six-race sum; the same four 2019 records are affected.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Do not independently invent this count from other demographic percentages. Use matching Census race definitions or a constrained training-only joint approach.

### 3.11 `TractAsian`

**Columns:** `original__TractAsian`, `clean__TractAsian`, `qa__TractAsian`.

**Source fields:** 2019 `TractAsian`; 2025 `TractAsian`. **Meaning:** Asian population count from the corresponding Census basis.

**What was done / what was found:** Retain count and NA. It is one component of the six-race sum, not a mutually exclusive category with Hispanic ethnicity.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** If used as a rate, require positive compatible total population. Any recovery must preserve the multi-category composition rather than filling each component without constraints.

### 3.12 `TractNHOPI`

**Columns:** `original__TractNHOPI`, `clean__TractNHOPI`, `qa__TractNHOPI`.

**Source fields:** 2019 `TractNHOPI`; 2025 `TractNHOPI`. **Meaning:** Native Hawaiian and Other Pacific Islander population count. Small or zero counts remain valid; zero is not missing.

**What was done / what was found:** Keep official values and the same four missing 2019 records. No rare-category merging or automatic feature removal is performed.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Handling a sparse category or merging categories is a model-design choice, not a cleaning default. Document any changed category definition and validate on training data.

### 3.13 `TractAIAN`

**Columns:** `original__TractAIAN`, `clean__TractAIAN`, `qa__TractAIAN`.

**Source fields:** 2019 `TractAIAN`; 2025 `TractAIAN`. **Meaning:** American Indian and Alaska Native population count.

**What was done / what was found:** Retain zero, positive counts, and genuine NA as distinct. Use the exact published classification rather than inferring identity from geography.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Matched recovery requires the same Census vintage and race definition; a geographic proxy is not a replacement for the missing population count.

### 3.14 `TractOMultir`

**Columns:** `original__TractOMultir`, `clean__TractOMultir`, `qa__TractOMultir`.

**Source fields:** 2019 `TractOMultir`; 2025 `TractOMultir`. **Meaning:** Other/multiple-race population count under the source grouping. It completes the six-race composition, excluding Hispanic from the sum.

**What was done / what was found:** Preserve this combined category as supplied; do not split it into unsupported subcategories.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Although a complete sum can constrain a missing residual, the current records have multiple missing categories, so the total cannot uniquely recover this count. Any proposed derivation requires explicit completeness checks.

### 3.15 `TractHispanic`

**Columns:** `original__TractHispanic`, `clean__TractHispanic`, `qa__TractHispanic`.

**Source fields:** 2019 `TractHispanic`; 2025 `TractHispanic`. **Meaning:** Hispanic or Latino ethnicity count. Ethnicity overlaps race, so a person may contribute here and to one of the six racial categories.

**What was done / what was found:** Keep as an independent source concept, but exclude it from the six-race sum. Missing in the same four 2019 records, not recoverable from the race sum.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Do not add it to the six racial counts to obtain population, and do not infer White/non-White counts from it. Modeling overlap is not the same as a data error.

### 3.16 `LowIncomeTracts`

**Columns:** `original__LowIncomeTracts`, `clean__LowIncomeTracts`, `qa__LowIncomeTracts`.

**Source fields:** 2019 `LowIncomeTracts`; 2025 `LowIncomeTracts`. **Meaning:** Official binary low-income-area classification, involving poverty >=20% or the applicable state/metro median-family-income 80% criterion. It is not TractLOWI and has no single national dollar cutoff.

**What was done / what was found:** No missing flags. Retain 29 2019 cases with displayed PovertyRate=20 and flag=0. Source phrasing differs at the income 80% boundary, and exact causes of displayed discrepancies are not established. This flag does not enter the project FD rule.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** Do not reconstruct it from PovertyRate alone or assume flag=0 means no low-income residents. Changing boundary records requires unrounded source or official-generation evidence.

### 3.17 `PovertyRate`

**Columns:** `original__PovertyRate`, `clean__PovertyRate`, `qa__PovertyRate`.

**Source fields:** 2019 `PovertyRate`; 2025 `PovertyRate`. **Meaning:** ACS percentage for people whose poverty status is determined. Its denominator need not equal decennial Census total population; TractLOWI uses a different threshold/universe.

**What was done / what was found:** Keep 3/701 source-missing values in 2019/2025. Of the 2025 missing values, 433 are in positive-population, label-known records under either target. The 3 missing 2019 cases are known under FD_2 but not the formula.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 3 | 0 | 3 |
| 2025 | 84,119 | 701 | 433 | 433 |

**Next actions and conditions:** A separate percentage treatment is needed if selected: compatible ACS recovery, explicit input eligibility, or justified training-only imputation. Do not reverse-engineer it from the official low-income flag, TractLOWI, or total population.

### 3.18 `MedianFamilyIncome`

**Columns:** `original__MedianFamilyIncome`, `clean__MedianFamilyIncome`, `qa__MedianFamilyIncome`.

**Source fields:** 2019 `MedianFamilyIncome`; 2025 `MedianFamilyIncome`. **Meaning:** Median family income, not mean income, per-capita income, or median household income. ACS periods are 2014–2018/2020–2024, with 2018/2024 price years.

**What was done / what was found:** Preserve source text and endpoint codes in the original/clean columns. Source missingness is 748/2,143. Derive common-price ordinary income and endpoint proxies in separate columns; no true missing income has been filled.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 748 | 377 | 748 |
| 2025 | 84,119 | 2,143 | 1,873 | 1,873 |

**Next actions and conditions:** Choose the income representation and define training IDs before statistical filling. The detailed derived-income entries below explain price provenance, endpoint range information, and reference eligibility.

### 3.19 `TractLOWI`

**Columns:** `original__TractLOWI`, `clean__TractLOWI`, `qa__TractLOWI`.

**Source fields:** 2019 `TractLOWI`; 2025 `TractLOWI`. **Meaning:** ACS low-income persons, based on family income at or below 200% of the applicable poverty threshold. It is not the poverty numerator and is measured in persons.

**What was done / what was found:** Preserve the same 4/14 missing records as HUNV/SNAP; 2019 records become label-known under FD_2. Counts above an older Census population reference are retained as cross-period issues, not clipped.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 14 | 14 | 14 |

**Next actions and conditions:** If selected, investigate matching ACS recovery or route-specific handling. A same-period rate needs an appropriate ACS denominator; do not manufacture a <=100% value by clipping.

### 3.20 `TractHUNV`

**Columns:** `original__TractHUNV`, `clean__TractHUNV`, `qa__TractHUNV`.

**Source fields:** 2019 `TractHUNV`; 2025 `TractHUNV`. **Meaning:** Occupied housing units/households without a vehicle, from ACS. It is not the number of people without cars and not just households beyond half a mile.

**What was done / what was found:** Preserve counts, zero and missing separately. ACS household counts can exceed an older Census housing reference without proving a numeric error.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 14 | 14 | 14 |

**Next actions and conditions:** It cannot replace the no-vehicle-and-distance household count in the official vehicle-access flag. Household-ratio construction requires compatible period and universe.

### 3.21 `TractSNAP`

**Columns:** `original__TractSNAP`, `clean__TractSNAP`, `qa__TractSNAP`.

**Source fields:** 2019 `TractSNAP`; 2025 `TractSNAP`. **Meaning:** Households receiving SNAP benefits, from ACS; not recipients, people, dollars, or the number of SNAP-authorized retailers.

**What was done / what was found:** Keep source counts and missingness. In the 2019 research, 22 counts exceeded Census occupied housing units: 21 had a positive reference denominator and one had a zero reference. These were not automatically corrected.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 4 | 0 | 4 |
| 2025 | 84,119 | 14 | 14 | 14 |

**Next actions and conditions:** Use a compatible household denominator if a rate is needed. Investigate source differences or selected-input treatment; do not replace missing SNAP participation with zero benefits.

### 3.22 `LATracts_half`

**Columns:** `original__LATracts_half`, `clean__LATracts_half`, `qa__LATracts_half`.

**Source fields:** 2019 `LATracts_half`; 2025 `SD_SRAM_LATracts_half`. **Meaning:** Official urban low-access flag at half a mile, using at least 500 low-access persons or 33% of the population. No low-income requirement.

**What was done / what was found:** Retain the official flag. 2025 has 164 missing values, all zero-population; rural zeros are not evidence of good food access. Threshold reconstructions from published rounded counts are diagnostic only.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 164 | 0 | 0 |

**Next actions and conditions:** Preserve structural NA. Check whether the indicator is appropriate for the target and urban/rural analysis; do not overwrite boundary cases without official evidence.

### 3.23 `LATracts1`

**Columns:** `original__LATracts1`, `clean__LATracts1`, `qa__LATracts1`.

**Source fields:** 2019 `LATracts1`; 2025 `SD_SRAM_LATracts1`. **Meaning:** Official urban one-mile low-access flag, using the 500-person OR 33% rule.

**What was done / what was found:** Retain official values and the same 164 zero-population missing 2025 records. Its urban definition overlaps the project FD target, creating a modeling rather than cleaning concern.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 164 | 0 | 0 |

**Next actions and conditions:** If selected, assess whether it exposes the target directly. Known target labels do not make a highly target-overlapping flag an independent forecasting signal.

### 3.24 `LATractsVehicle_20`

**Columns:** `original__LATractsVehicle_20`, `clean__LATractsVehicle_20`, `qa__LATractsVehicle_20`.

**Source fields:** 2019 `LATractsVehicle_20`; 2025 `SD_SRAM_LATractsVehicle_20`. **Meaning:** Applies in urban and rural tracts. Two OR branches: no-vehicle households beyond half a mile reaching the documented household threshold, or persons beyond 20 miles reaching 500/33%. This is not an urban/rural branch switch.

**What was done / what was found:** 2025 missing=121: 107 zero-population and 14 positive-population, the latter sharing missing economic counts. Detailed lookup says at least 100 households, while narrative wording says more than 100; 124 2019 displayed-100 discrepancies remain unresolved.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 121 | 14 | 14 |

**Next actions and conditions:** Preserve official values and record uncertainty. Do not substitute all TractHUNV households, median-fill a binary flag into a fractional value, or change the boundary merely to fit displayed counts.

### 3.25 `low_access_population_1_20`

**Columns:** `original__low_access_population_1_20`, `clean__low_access_population_1_20`, `qa__low_access_population_1_20`.

**Source fields:** 2019 `LAPOP1_20`; 2025 `SD_SRAM_LAPOP1_20`. **Meaning:** Published low-access persons beyond urban 1 mile / rural 20 miles: L in the formula label. It is a target-construction count, not a store-distance measurement calculated here.

**What was done / what was found:** 2019 has 35,914 source-missing counts; their formula labels remain unknown, while official FD_2 is available and zero. 2025 has no missing count, including zero counts on zero-population tracts.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 35,914 | 0 | 35,914 |
| 2025 | 84,119 | 0 | 0 | 0 |

**Next actions and conditions:** An official flag can supply a classification but cannot recover L. Never fill L with zero or a median to manufacture labels. Do not treat direct target ingredients as ordinary independent predictors.

## 4. Derived income fields, one column at a time

The source `clean__MedianFamilyIncome` remains in source-year dollars and retains endpoint codes. The following 13 columns describe status, price provenance or alternative numeric representations. They are not 13 independent socioeconomic features. Genuine missing values remain NA; no training-reference median has been fitted.

### 4.1 `income_value_status`

**Definition and origin:** Derived mutually exclusive category: ordinary, lower_endpoint, upper_endpoint, source_missing, invalid_source.

**Completed treatment and interpretation:** Ordinary means valid and not an endpoint, not middle income. 2019 counts are 71,511 / 2 / 270 / 748 / 0; 2025 counts are 80,331 / 16 / 1,629 / 2,143 / 0. Use this category to distinguish different causes of NA in derived income.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.2 `income_source_missing`

**Definition and origin:** Derived 0/1 indicator for original income missingness.

**Completed treatment and interpretation:** 1 for 748/2,143 records. Endpoint codes are not counted as source missing. This flag is not itself a replacement for the missing amount.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.3 `income_invalid_source`

**Definition and origin:** Derived 0/1 indicator for nonmissing values failing numeric validity checks.

**Completed treatment and interpretation:** Currently all 0. Negative, zero, unparsable or nonfinite income would be invalid, with preserved original text and QA reason. Invalid source and absent source should not be silently filled by the same policy.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.4 `income_lower_endpoint`

**Definition and origin:** Derived indicator that source income is code 2499, representing $2,500 or below.

**Completed treatment and interpretation:** Counts: 2/16. The code is a Census publication convention, not an exact income, percentile cut, or missing value. A $2,500 boundary proxy can overestimate the actual income.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.5 `income_upper_endpoint`

**Definition and origin:** Derived indicator that source income is code 250001, representing $250,000 or above.

**Completed treatment and interpretation:** Counts: 270/1,629. A $250,000 proxy can underestimate actual income. Endpoint exclusion from a reference median does not delete these tracts.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.6 `income_source_price_year`

**Definition and origin:** Added provenance: 2018 for 2019 income; 2024 for 2025 income.

**Completed treatment and interpretation:** Known from ACS source documentation, not inferred from each amount. It remains known when income is absent. It differs from dataset version, ACS multi-year period, Census year and tract vintage.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.7 `income_target_price_year`

**Definition and origin:** Added common-price basis: 2018 for both files.

**Completed treatment and interpretation:** A project preparation choice, not a year mandated by the proposal. A populated target year does not mean the record has a valid converted amount.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.8 `income_price_factor_applied`

**Definition and origin:** Derived multiplier recorded only for ordinary income: 1 in 2019, approximately 0.7980347861871443 in 2025.

**Completed treatment and interpretation:** It comes from BLS target/source annual indices, not from fitting a mean or median. NA includes endpoints and missing income; the year-level factor is still known. Full source, workbook cells and derivation appear in 4.14–4.16.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 1,020 | 525 | 1,020 |
| 2025 | 84,119 | 3,788 | 3,518 | 3,518 |

### 4.9 `income_ordinary_2018_usd`

**Definition and origin:** Derived income amount in 2018 dollars for ordinary records only.

**Completed treatment and interpretation:** 71,511/80,331 nonmissing, 1,020/3,788 NA. Endpoint-induced NA is deliberate, not original absence. Do not indiscriminately median-fill this column and discard the known endpoint range. It is not a standardized model score.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 1,020 | 525 | 1,020 |
| 2025 | 84,119 | 3,788 | 3,518 | 3,518 |

### 4.10 `income_with_endpoint_proxy_2018_usd`

**Definition and origin:** Derived common-price amount combining ordinary income and endpoint boundary proxies.

**Completed treatment and interpretation:** Ordinary amounts equal the ordinary-only column. Endpoint codes are replaced by source-dollar boundaries 2,500/250,000 before price conversion, not by 2,499/250,001 times the factor. Nonmissing=71,783/81,976; genuine missing=748/2,143. This is still not a complete model input.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 748 | 377 | 748 |
| 2025 | 84,119 | 2,143 | 1,873 | 1,873 |

### 4.11 `income_endpoint_proxy_applied`

**Definition and origin:** Derived 0/1 indicator for lower or upper endpoint proxy use.

**Completed treatment and interpretation:** 1 for 272/1,645 records. It distinguishes approximation of a known range from filling a genuinely absent income. It is an audit marker, not automatically an extra model feature.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.12 `income_proxy_method`

**Definition and origin:** Derived textual provenance for the resulting income representation.

**Completed treatment and interpretation:** ordinary_amount_unchanged, lower_boundary_2500_source_usd, upper_boundary_250000_source_usd, source_missing_unfilled, or invalid_source_unfilled. Ordinary unchanged means unchanged from the already converted ordinary-income column, not necessarily unchanged from source-year dollars.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.13 `income_ordinary_reference_candidate`

**Definition and origin:** Derived 0/1 indicator: ordinary valid income is a candidate for later reference selection.

**Completed treatment and interpretation:** 1 for 71,511/80,331; 0 for 1,020=748+2+270 and 3,788=2,143+16+1,629. Candidate is not training membership or final eligibility: require positive population and explicit training IDs/folds. Endpoints are excluded to avoid treating ranges as exact incomes; evaluate selection effects.

| Dataset | All records | Missing | Missing with known `fd_label` | Missing with known `FD_2` |
|---|---:|---:|---:|---:|
| 2019 | 72,531 | 0 | 0 | 0 |
| 2025 | 84,119 | 0 | 0 | 0 |

### 4.14 Where `income_price_factor_applied` comes from

**This is a derived processing/provenance column, not an original USDA field and not a coefficient estimated from the project data.** It records the factor actually used for ordinary income:

`income_ordinary_2018_usd = clean__MedianFamilyIncome × income_price_factor_applied`

The derivation has four separate steps:

1. **Identify source price years.** The 2019 release's MedianFamilyIncome is from ACS 2014–2018, expressed in 2018 dollars. The 2025 release uses ACS 2020–2024, expressed in 2024 dollars. These are not the dataset-label years and not the Census population years.
2. **Choose a common target.** The project chose 2018 dollars to compare the income representations on one price basis. The proposal did not prescribe this adjustment or target year; it is a documented data-preparation decision.
3. **Obtain two comparable price indices from one official source snapshot.** The frozen source is the BLS **R-CPI-U-RS, All items, annual average (AVG)** workbook, not a project income average and not a December monthly index. In the verified workbook, the 2018 AVG is cell **N48 = 369.1** and the 2024 AVG is **N54 = 462.51116666666667**. Both values came from the same workbook version, avoiding a mixture of revised vintages or series.
4. **Divide target-year index by source-year index.** For 2025 income, `factor = 369.1 / 462.51116666666667 = 0.7980347861871443046381598268644014386812`. For 2019 income, source and target are both 2018, so `factor = 1`.

The workbook's indices are index levels, not dollar amounts. Their shared base cancels in the ratio. A factor below 1 expresses a 2024-dollar amount in the earlier year's price units; it does not mean the tract's actual family income fell by that amount.

**Source and reproducibility evidence:** [official BLS workbook](https://www.bls.gov/cpi/research-series/r-cpi-u-rs-allitems.xlsx); project snapshot verified on 2026-10-31; SHA-256 `355ea8a14a6d07d777a17a1ddad526b8a199390a7c1bb8c7b58e2dec1a2544d8`. The project archive is `sources/price_index_20261031/r-cpi-u-rs-allitems.xlsx`; `reports/income_price_verified_20261031T155833941089Z/verified_indices.csv` records the cells, and `verified_price_basis.json` records the factor and source hash. These archives support the research but are **not runtime dependencies** of the simplified English notebook.

The calculation uses the stored annual AVG values, not an intermediate rounded value such as 462.5. The notebook computes the ratio with Decimal precision 40, then uses a floating-point factor for the nullable numeric columns. It does not intentionally round exported income amounts to cents; examples in this document are rounded only for readability. Extra decimal places in the workbook are not a claim of equally precise economic measurement. Because the live BLS workbook may change, updating it requires an explicit version decision rather than an automatic download on every run.

Example: an ordinary 2025 source value of **50,000 in 2024 dollars** becomes approximately **39,901.74 in 2018 dollars**. An ordinary 2019 source value of 50,000 remains 50,000. This is a price-basis adjustment, not currency exchange, model scaling, or a geographic cost-of-living correction. It does not remove ACS sampling uncertainty, population-boundary differences, or within-country price differences.

### 4.15 Why the factor column has NA even though the year's factor is known

The factor is constant within each source/target price-year pair. However, the current **column only records ordinary-income conversions**. A record is ordinary when `income_value_status == 'ordinary'`; its pre-conversion amount is in `clean__MedianFamilyIncome`. Ordinary does not mean “middle income.”

| Dataset | Factor on ordinary rows | Rows with factor | NA breakdown | Total NA |
|---|---:|---:|---|---:|
| 2019 | 1 | 71,511 | 748 source-missing + 2 lower-endpoint + 270 upper-endpoint | 1,020 |
| 2025 | approximately 0.7980347861871443 | 80,331 | 2,143 source-missing + 16 lower-endpoint + 1,629 upper-endpoint | 3,788 |

NA here therefore means “not recorded for the ordinary-income conversion,” **not “the inflation factor is unknown.”** Do not impute this column with a median. Endpoint proxies use the same year's factor in the separate proxy calculation even though `income_price_factor_applied` remains NA on those rows. Source and target price-year metadata remain populated when income is missing because the price-year definition is known independently of the missing amount.

A possible alternative design would store a year-level factor on every row. That was discussed but **has not been implemented**: the existing income column names and NA patterns remain unchanged in the current 103-column export. Any redesign should be versioned and reflected in the dictionary.

### 4.16 Trace one value through all income representations

| Source case | `clean__MedianFamilyIncome` | `income_ordinary_2018_usd` | `income_with_endpoint_proxy_2018_usd` | Factor column | Reference candidate |
|---|---:|---:|---:|---|---:|
| 2019 ordinary 50,000 | 50,000 | 50,000 | 50,000 | 1 | 1 |
| 2025 ordinary 50,000 | 50,000 | about 39,901.74 | about 39,901.74 | about 0.7980347862 | 1 |
| 2025 lower endpoint | 2,499 (code) | NA | about 1,995.09 (=2,500×factor) | NA | 0 |
| 2025 upper endpoint | 250,001 (code) | NA | about 199,508.70 (=250,000×factor) | NA | 0 |
| Source missing | NA | NA | NA | NA | 0 |

These are explanatory examples, not additional project records. The original source text remains in `original__MedianFamilyIncome`. The clean source column remains in **source-year dollars**, including endpoint codes; it is not the common-price income field. The proxy column currently has 71,783 / 81,976 nonmissing values, leaving 748 / 2,143 genuine missing values. The ordinary column has fewer nonmissing values because it deliberately excludes endpoints.

Excluding an endpoint from the ordinary reference means not treating its code or boundary proxy as an exact amount when fitting a reference median. It does not remove the tract or erase its known income range. If a model uses the ordinary-only income column, endpoint NAs must not be blindly lumped together with source-missing income and filled as though their range information never existed.

## 5. Outstanding Fields, Verified Findings for Both Targets, and Feasible Actions

The register separates **observed issue counts** from the number with a usable label under each target. Both columns are now exported, but the team still chooses its target. A label-known affected record has a potential input issue; it is not automatically trainable. Fields and records overlap: do not sum across rows.

### 5.1 Two-target verified-findings register

| Field / issue | Verified findings — `fd_label` | Verified findings — `FD_2` | Current treatment / next condition |
|---|---|---|---|
| Low-access population missing | 2019: 35,914 affected; 0 known, 35,914 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | 2019: 35,914 affected; 35,914 known, 0 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | Keep L=NA; do not impute a target. Choose formula or official target explicitly. |
| Zero population | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 271 affected; 0 known, 0 unknown, 271 not applicable | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 271 affected; 0 known, 0 unknown, 271 not applicable | Keep 0 and inapplicability; no ratio or median-population fill. |
| Zero occupied housing units | 2019: 106 affected; 66 known, 40 unknown, 0 not applicable<br>2025: 420 affected; 165 known, 0 unknown, 255 not applicable | 2019: 106 affected; 106 known, 0 unknown, 0 not applicable<br>2025: 420 affected; 165 known, 0 unknown, 255 not applicable | Keep source values; compatible denominator/source review is needed if ratios matter. |
| Missing GQ count | 2019: 25 affected; 10 known, 15 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | 2019: 25 affected; 25 known, 0 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | Keep NA; official flag cannot restore an exact count. |
| Missing GQ percentage | 2019: 25 affected; 10 known, 15 unknown, 0 not applicable<br>2025: 271 affected; 0 known, 0 unknown, 271 not applicable | 2019: 25 affected; 25 known, 0 unknown, 0 not applicable<br>2025: 271 affected; 0 known, 0 unknown, 271 not applicable | Keep NA; distinguish 2019 missing data from 2025 zero-population inapplicability. |
| Missing GQ flag | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 271 affected; 0 known, 0 unknown, 271 not applicable | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 271 affected; 0 known, 0 unknown, 271 not applicable | Keep structural NA; do not force 0 for zero population. |
| Missing age / race / ethnicity group | 2019: 4 affected; 0 known, 4 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | 2019: 4 affected; 4 known, 0 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | Same four 2019 records across age/race fields. Under FD_2 they require selected-input handling. |
| True income missing | 2019: 748 affected; 377 known, 371 unknown, 0 not applicable<br>2025: 2,143 affected; 1,873 known, 0 unknown, 270 not applicable | 2019: 748 affected; 748 known, 0 unknown, 0 not applicable<br>2025: 2,143 affected; 1,873 known, 0 unknown, 270 not applicable | Price/endpoint processing completed; fit any imputer on approved training reference only. |
| Income endpoint records | 2019: 272 affected; 148 known, 124 unknown, 0 not applicable<br>2025: 1,645 affected; 1,645 known, 0 unknown, 0 not applicable | 2019: 272 affected; 272 known, 0 unknown, 0 not applicable<br>2025: 1,645 affected; 1,645 known, 0 unknown, 0 not applicable | Keep boundaries and proxy markers; select representation and evaluate sensitivity. |
| Displayed poverty=20 / official low-income flag=0 | 2019: 29 affected; 14 known, 15 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | 2019: 29 affected; 29 known, 0 unknown, 0 not applicable<br>2025: 0 affected; 0 known, 0 unknown, 0 not applicable | Keep official flag; needs unrounded source/generation evidence before correction. |
| Missing poverty rate | 2019: 3 affected; 0 known, 3 unknown, 0 not applicable<br>2025: 701 affected; 433 known, 0 unknown, 268 not applicable | 2019: 3 affected; 3 known, 0 unknown, 0 not applicable<br>2025: 701 affected; 433 known, 0 unknown, 268 not applicable | Compatible ACS recovery or separately justified training-only strategy if selected. |
| Missing ACS counts (LOWI / HUNV / SNAP) | 2019: 4 affected; 0 known, 4 unknown, 0 not applicable<br>2025: 14 affected; 14 known, 0 unknown, 0 not applicable | 2019: 4 affected; 4 known, 0 unknown, 0 not applicable<br>2025: 14 affected; 14 known, 0 unknown, 0 not applicable | Jointly missing records; no clipping to older Census totals or automatic same-period rates. |
| Missing urban half-mile flag | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 164 affected; 0 known, 0 unknown, 164 not applicable | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 164 affected; 0 known, 0 unknown, 164 not applicable | Keep structural NA and official boundary values; assess target overlap. |
| Missing urban one-mile flag | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 164 affected; 0 known, 0 unknown, 164 not applicable | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 164 affected; 0 known, 0 unknown, 164 not applicable | Keep structural NA; known input need not be appropriate as a predictor. |
| Missing vehicle/distance flag | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 121 affected; 14 known, 0 unknown, 107 not applicable | 2019: 0 affected; 0 known, 0 unknown, 0 not applicable<br>2025: 121 affected; 14 known, 0 unknown, 107 not applicable | Positive-population cases overlap ACS missing counts; binary handling must be explicit. |

“Missing age / race” and “missing ACS counts” use one representative field for shared-record counts, not an arithmetic sum. The 2019 four demographic/economic cases and the 2025 fourteen economic/vehicle cases must be tracked by tract ID. Nonmissing boundary diagnostics are included separately from missingness; label availability alone cannot establish that a source value is incorrect.

### 5.2 Decide the target before interpreting “not needed for training”

**Completed:** Formula and official labels are compared independently; both labels and their independent status/provenance are now exported. No low-access counts have been filled to create labels. Formula-unknown records remain in the full master table.

**Feasible next actions:**

1. Continue with the formula-based label and explicitly report the limited labeled coverage and possible selection bias.
2. Adopt the official same-concept classification as a versioned target, retaining the formula as an audit variable. This is a label-source change, not an imputation of L.
3. Compare conclusions under both label choices on clearly defined evaluation populations before deciding.

**Conditions:** Document the seven disagreements rather than silently choosing a label per record. The CSV schema, dictionary and this register now include both labels and recomputed intersections. When adopting FD_2 for a model, select FD_2_status and FD_2_reason, rebuild model-specific subsets and coverage reports, and do not overwrite the formula metadata. In particular, the four 2019 demographic/economic-missing records are currently excluded from supervised training/evaluation by formula-unknown status; the official flag is available for them, so their missing predictors become relevant under that alternative. Do not carry the old “no need to fill for supervised training” conclusion across a label switch.

**Not allowed by current rules:** Imputing L with zero or a median to manufacture a target; treating formula unknown as FD=0; treating an official 0 flag as a recovered population count; calling either binary label a calibrated future-risk probability.

### 5.3 Zero population and zero households

**Completed:** Population 0 is a retained numeric source value. For the formula label it produces `not_applicable`, not FD=0. Zero-household records are retained without changing their FD. No ratio with a zero denominator is created.

**What remains unresolved:** GQ can explain some positive-population/zero-household records but not all. In 2025, the 90 records with positive population and fewer GQ residents than total population have not been fully explained. A source discrepancy cannot be inferred solely from this comparison.

**Feasible next actions:** Keep these records with explicit applicability notes; if a chosen analysis requires household-based ratios, mark those ratios undefined and record the affected route. If necessary, inspect matching Census housing/population releases, boundary definitions, or supporting records before proposing a correction.

**Conditions:** Do not replace a genuine zero denominator with a median, infinity, or a fabricated small constant. Do not claim every zero-household tract consists entirely of group quarters. A model-specific exclusion must be logged with reason while the master table remains intact.

### 5.4 GQ count, share, and flag

**Completed:** The 25 missing 2019 GQ counts/shares remain NA; the official flag remains 0. The 2025 zero-population GQ share/flag NA remains structural inapplicability. The 67% definition is explanatory and used for diagnostics, not to overwrite source classifications.

**Feasible next actions for 2019:** If the final model does not use the count/share, no model-specific fill is required for them. If it does, either identify the affected rows as unavailable for that route, recover from a matching Census source, or develop a documented training-only imputation approach. A complete-case subset is a model-specific analysis choice, not permission to drop rows from the master table.

**Conditions:** Flag=0 permits many possible positive counts below the threshold; it does not prove zero GQ residents. Matching recovery must align geography, year, and GQ definition. Any derived count/share must use the same denominator and preserve their numerical relationship. Do not independently fill the two columns into an inconsistent pair. For zero population, 0/0 must not be written as 0% and ordinary imputation is not an appropriate way to conceal the structural issue.

### 5.5 Age and racial/ethnic composition

**Completed:** Missing counts are retained. Six-race totals are assessed only where component values and total population are available; Hispanic is kept separate. No count is reconstructed by subtraction and no automatic ratio features are created.

**Feasible next actions:** Under the current formula-only supervised route, the four missing 2019 records already lack usable target labels, so filling these predictors is not necessary for that narrow training/evaluation task. For clustering, scoring unlabeled tracts, or using FD_2, either mark the selected-input route incomplete, recover matching Census counts, or evaluate a training-only joint imputation scheme.

**Conditions:** Child and senior populations are not complements; total minus children does not equal seniors. Hispanic cannot recover White population or substitute for an exclusive racial category. The six racial counts need a jointly consistent representation; independently filling each column can violate the sum. External recovery requires matched year, age bands, race/ethnicity definitions, and tract boundaries, with source provenance. A statistical proposal must specify how nonnegativity, integer interpretation, totals, and overlap are handled. The exact linear-dependence and duplicate-information issues still need a modeling decision after missingness is addressed.

### 5.6 True missing income: executable strategy still requires a training reference

**Completed:** Source missingness, endpoint codes and ordinary incomes have been separated; common-price amounts and proxies have been generated. The **748 / 2,143 source-missing values have not been statistically imputed**. The simpler English notebook deliberately does not fit or apply an imputer. The full research notebook contains an earlier fit/apply implementation with synthetic tests; it is a reference implementation, not a fitted project artifact or a dependency of the simplified notebook.

**Feasible downstream approach already discussed:**

1. Choose the modeling route and a single appropriate income representation.
2. Obtain explicit 2019 training tract IDs (or the training portion of each validation fold).
3. Select ordinary-income, positive-population training records; exclude endpoint codes/proxies from the exact-amount reference.
4. Fit county medians, with training-state and training-overall fallbacks where there is no county reference. These are medians of tract family-income medians, not county medians of individual family incomes.
5. Apply the frozen reference to the selected missing-input records in training/validation/test/2025 as appropriate; retain the original amount and add imputation/source indicators.

**Conditions and unresolved choices:** Training IDs must represent the real training population, not all records relabeled as training. Use no validation/test/2025 medians and refit inside every cross-validation fold. Endpoint exclusion may change the reference population; evaluate sensitivity. County reference adequacy and any minimum sample-size requirement should be explicit; availability of one reference is not proof of reliability. If the entire valid reference is empty, stop or preserve NA rather than inventing a constant.

Cross-year county matching requires an audited mapping; matching codes or names alone does not prove comparable geography. The earlier implementation skips 2025 county matching unless supplied a map, then falls back to the training state/overall level. A one-to-many geography conversion needs its own method. Use string FIPS codes, preserving leading zeros. Revalidate the chosen implementation, including string county-code validation, before use; the simplified notebook does not fit or apply that interface.

The discussed approach fills ordinary source-missing income on eligible positive-population records; it does not automatically fill invalid source values or zero-population cases. If the model needs a different policy, record that as a deliberate change. This strategy is a feasible project option, not a claim that county median filling is optimal for every model or distribution.

### 5.7 Income endpoint and factor decisions are separate from source missingness

**Completed:** Endpoint codes stay in source/clean columns; boundary proxies are in a separate common-price column with flags. No endpoints are removed. The ordinary-reference flag excludes them. The price factor is frozen from official indices and has not been fitted to this sample.

**Feasible next actions:** Choose whether the model uses proxy-inclusive income or another explicit treatment of bounded values. Examine whether conclusions are sensitive to the proxy choice or excluding endpoints from the imputation reference. If an ordinary-only expression is chosen, maintain the difference between endpoint-induced NA and genuinely absent income.

**Conditions:** Do not median-fill every NA in `income_ordinary_2018_usd` indiscriminately; that discards endpoint range information. Do not interpret the factor column's NA as missing CPI, and do not add both income expressions as independent economic variables without a reasoned model design. Changing the factor column to be populated for every row remains an unimplemented schema option, not a required missing-value repair.

### 5.8 Poverty rate and official low-income flag

**Completed:** No missing LowIncomeTracts flags need filling. The 29 2019 displayed PovertyRate=20/flag=0 cases remain unchanged. PovertyRate missingness remains NA (3 in 2019; 701 in 2025, including 433 formula-known records).

**Feasible next actions:** If PovertyRate is selected, recover the statistic and its applicable population universe from a matching ACS source if feasible; otherwise define route-specific input eligibility or a separate training-only imputation strategy. If it is not used, no filling is needed just to make every column nonmissing. If the 29 boundary cases matter, seek unrounded source estimates or documented official generation rules.

**Conditions:** Do not derive poverty rate from the low-income flag, TractLOWI, or Census total. LowIncomeTracts also has income-reference branches; flag=1 does not imply poverty rate at least 20. A plausible display-rounding explanation is not confirmed evidence for a correction. An income-dollar median strategy cannot simply be copied onto a bounded percentage without defining and validating its own assumptions.

### 5.9 ACS low-income persons, no-vehicle households, and SNAP households

**Completed:** The shared 4/14 missing groups remain NA; published valid counts are retained. Counts above a different-period Census reference total are not clipped or converted automatically into rates.

**Feasible next actions:** Separate the two questions: is the source count absent, or is the proposed denominator from a different period? For an absent selected input, investigate a matched ACS source, use a justified model-specific missing policy, or record unscorable rows. For rates, obtain a compatible denominator and explicitly define the numerator's universe and reference period.

**Conditions:** TractLOWI is persons; HUNV and SNAP are households. Neither unit may be swapped. Jointly missing columns do not supply enough information to reconstruct one another. A ratio above 100% against an older reference is not sufficient evidence that the numerator is wrong. Do not clip it to 100% and call the result a measured same-year participation rate. The 14 positive-population 2025 records overlap missing vehicle-access flags, so record the shared tract IDs rather than summing all missing counts.

### 5.10 Spatial flags and boundary diagnostics

**Completed:** Official 0/1 values are preserved; absent values remain NA. The 164 missing half/one-mile flags are zero-population 2025 records. The 121 missing vehicle flags include 107 zero-population and 14 positive-population cases. Published-threshold diagnostic mismatches do not trigger relabeling.

**Feasible next actions:** Keep zero-population inapplicability explicit. For selected positive-population missing inputs, investigate matched official source data or define a binary-variable handling strategy. Assess whether a spatial flag reveals the target too directly for the intended prediction task; the preparation notebook does not make the final feature decision.

**Conditions:** A median of a binary input can be fractional and is not automatically a legitimate official class; any categorical/binary strategy must be explicit and fitted appropriately. The vehicle flag's 100-household wording/display discrepancy is unresolved; no evidence-based correction rule has been established. Rural zeros in urban-only half/one-mile flags are not proof of good rural access. Do not use all-tract HUNV as the vehicle-distance numerator.

### 5.11 Decision order and acceptance checks for any further treatment

1. **Classify the issue:** source missing, structural inapplicability, cross-period comparison, source-boundary uncertainty, or demonstrated invalid value. Do not call them all “missing data.”
2. **Specify the task:** chosen FD definition, selected fields, supervised evaluation versus clustering/scoring, and applicable population.
3. **Choose the least-assumptive justified action:** retain NA with an explicit route, recover from compatible evidence, or propose statistical treatment. Keeping NA may be the correct final preparation result.
4. **Define prerequisites:** training IDs/folds, compatible source year and boundary, units/universe, county mapping, and reference adequacy. Elapsed time or an available all-data median does not substitute for these.
5. **Implement traceably:** keep original values, add treatment method/source flags, record affected IDs and counts, and version the changed schema/rules. A model-specific exclusion should have a named reason and must not silently delete rows from the master table.
6. **Validate:** verify row/key integrity, valid ranges, joint count/share constraints, unchanged unrelated fields and labels, disjoint reason groups where intended, and no use of held-out statistics. Recalculate target/input intersections if label policy changes.
7. **Assess impact:** compare coverage and relevant validation results under reasonable alternatives. A higher number of usable rows alone does not demonstrate a better treatment.

**Still pending:** explicit choice between the two exported targets, actual model input selection, any approved missing-value recovery or statistical treatment, training-reference fitting, cross-year county handling, and modeling evaluation. **Already completed:** deterministic numeric cleaning, source-preserving QA, current formula labels, official-label export and comparison, common-price income conversion, endpoint proxy representation, and two-table export/round-trip validation. There is no new fill, row deletion, label switch, or model training implied by this guide.

## 6. Source References, Reproduction, and Release Checks

The English notebook reads three original USDA tables and writes only the two master CSVs to a new output directory. The dictionary and this guide are documentation, not runtime input dependencies. No reference medians, PCA or model parameters are fitted. Original 97-column values are compared against the previous release during this update; the six appended official-label fields are separately checked against raw source flags.

The current schema is 6 geography/provenance + 3 formula-label + 75 source/clean/QA + 13 income + 6 official-label columns = **103**. CSV status strings remain nonmissing even when the associated label or amount is NA. The original master rows are retained, with no exclusion solely for missing input.

### Official and project references

- USDA [Large Retailer Access Map Reference Guide](https://www.ers.usda.gov/data-products/food-access-research-atlas/documentation/large-retailer-access-map-reference-guide).
- USDA [2025 SNAP-authorized Retailer Access Map Reference Guide](https://www.ers.usda.gov/data-products/food-access-research-atlas/documentation/snap-authorized-retailer-access-map-reference-guide).
- Census [2019 ACS Summary File Handbook](https://www2.census.gov/programs-surveys/acs/summary_file/handbooks/acs_summary-file_handbook_2019.pdf), jam values for medians.
- BLS [R-CPI-U-RS all-items workbook](https://www.bls.gov/cpi/research-series/r-cpi-u-rs-allitems.xlsx); frozen inputs and archived workbook hash are documented in notebook Section 6.
- The local USDA lookup/Read Me files and the proposal's supplied Proposed Method / Data Modeling excerpts provide the remaining field context. Dataset labels, publication dates, observation periods, and price years are distinct.
