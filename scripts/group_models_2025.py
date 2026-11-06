import pandas as pd

# 1. Read all three CSV files
df_lg = pd.read_csv("./logistic_regression_modeling/cleaned_2025_w_predictions.csv", 
                    dtype={"tract_id": str, "state": str},
                    encoding="latin1")
df_rf = pd.read_csv("./random_forest_model/cleaned_2025_w_rf_predictions.csv", 
                    dtype={"tract_id": str, "state": str},
                    encoding="latin1")
df_km = pd.read_csv("./kmeans_modeling/model_output_2025.csv", 
                    dtype={"tract_id": str, "state": str},
                    encoding="latin1")

small_df_lg = df_lg[['tract_id', 'state', 'risk']].copy()
small_df_lg.rename(columns={'risk': 'risk_lr'}, inplace=True)
small_df_rf = df_rf[['tract_id', 'risk']].copy()
small_df_rf.rename(columns={'risk': 'risk_rf'}, inplace=True)
small_df_km = df_km[['tract_id', 'risk']].copy()
small_df_km.rename(columns={'risk': 'risk_km'}, inplace=True)

# 2. Merge sequentially using the key column
merged_df = small_df_lg.merge(small_df_rf, on="tract_id", how="inner").merge(small_df_km, on="tract_id", how="inner")

# 3. Export to a single CSV
merged_df.to_csv("./data/us_tracts_risk_2025_predictions.csv", index=False)