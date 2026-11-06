import pandas as pd

# Load the CSV file
df = pd.read_csv('2019_Food_Access_Research_Atlas_Data\Food Access Research Atlas.csv')


# Approach 2: Keep ONLY key summary columns (Selecting columns)
key_columns = [
    'CensusTract', 
    'State', 
    'County', 
    'Urban', 
    'Pop2010', 
    'OHU2010', 
    'GroupQuartersFlag',
    'NUMGQTRS', 
    'PCTGQTRS', 
    'LowIncomeTracts',
    'PovertyRate', 
    'MedianFamilyIncome', 
    'TractLOWI', 
    'TractKids', 
    'TractSeniors', 
    'TractWhite',
    'TractBlack',
    'TractAsian',
    'TractNHOPI',
    'TractAIAN',
    'TractOMultir',
    'TractHispanic',
    'TractHUNV',
    'TractSNAP'
]

df_summary = df[key_columns]

# -------------------------------------------------------------
# Approach 3: Drop all columns that are completely empty / NULL
# -------------------------------------------------------------
# Drops columns where 100% of values are missing/NULL
df_no_empty_cols = df_summary.dropna(how='all', axis=1)

df_cleaned = df_no_empty_cols

# Save the desired cleaned DataFrame to CSV
df_cleaned.to_csv('2019_cleaned_data.csv', index=False)
print("File processed and saved successfully.")