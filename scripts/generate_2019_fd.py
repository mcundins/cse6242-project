import pandas as pd

df = pd.read_csv("./logistic_regression_modeling/final_data/cleaned_2019.csv", 
                    dtype={"tract_id": str, "state": str})

df['State'] = df['tract_id'].str[:2]

small_df = df[['tract_id', 'State', 'County', 'FD_2', 'clean__population_total', 'clean__MedianFamilyIncome']].copy()
small_df.rename(columns={'FD_2': 'food_desert'}, inplace=True)
small_df['food_desert'] = small_df['food_desert'].map({0: False, 1: True})
small_df.rename(columns={'County': 'county'}, inplace=True)
small_df.rename(columns={'State': 'state'}, inplace=True)
small_df.rename(columns={'clean__population_total': 'population_total'}, inplace=True)
small_df.rename(columns={'clean__MedianFamilyIncome': 'median_family_income'}, inplace=True)

small_df.to_csv("./data/us_tracts_2019_fd.csv", index=False)