import pandas as pd

# 1. Read all three CSV files
df1 = pd.read_csv("2025-sram-fara-data/SRAM Driving Distance Data.csv", encoding="latin1")
df2 = pd.read_csv("2025-sram-fara-data/SRAM General Tract Characteristics Data.csv", encoding="latin1")
df3 = pd.read_csv("2025-sram-fara-data/SRAM Straight Line Distance Data.csv", encoding="latin1")

# 2. Merge sequentially using the key column
merged_df = df1.merge(df2, on="CensusTract20", how="inner").merge(df3, on="CensusTract20", how="inner")

# 3. Export to a single CSV
merged_df.to_csv("2025_joined_data.csv", index=False)