import pandas as pd

fips_to_state = {
    '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', 
    '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', 
    '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', 
    '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', 
    '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine', '24': 'Maryland', 
    '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota', '28': 'Mississippi', 
    '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada', 
    '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York', 
    '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma', 
    '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina', 
    '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', 
    '50': 'Vermont', '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', 
    '55': 'Wisconsin', '56': 'Wyoming'
}

df_2019_raw = pd.read_csv("./data/us_tracts_2019_fd.csv",
                    dtype={"tract_id": str, "state": str})


small_2019_df = df_2019_raw[['tract_id', 'state', 'food_desert']].copy()
small_2019_df['fdCount'] = small_2019_df['food_desert'].astype(int)
small_2019_df['nonFdCount'] = (~small_2019_df['food_desert']).astype(int)

grouped = small_2019_df.groupby('state').agg(
    fdCount=('fdCount', 'sum'),
    nonFdCount=('nonFdCount', 'sum')
).reset_index()

grouped.rename(columns={'state': 'stateCode'}, inplace=True)
grouped['year'] = '2019'
grouped['stateName'] = grouped['stateCode'].map(fips_to_state)

final_2019_df = grouped[['year', 'stateCode', 'stateName', 'fdCount', 'nonFdCount']]

#print(final_2019_df.head())

#now take the 2025 predictions tract and group to summarize.

df = pd.read_csv('data/us_tracts_risk_2025_predictions.csv',
                    dtype={"tract_id": str, "state": str})

small_2025_df = df[['tract_id', 'state', 'risk_lr', 'risk_rf', 'risk_km']].copy()
small_2025_df.rename(columns={'state': 'stateCode'}, inplace=True)
small_2025_df['stateName'] = small_2025_df['stateCode'].map(fips_to_state)

small_2025_df['year'] = '2025'
grouped = small_2025_df.groupby(['year', 'stateCode','stateName']).agg(
    highRiskCount_lr=('risk_lr', lambda x: (x == 'high').sum()),
    midRiskCount_lr=('risk_lr', lambda x: (x == 'mid').sum()),
    lowRiskCount_lr=('risk_lr', lambda x: (x == 'low').sum()),

    highRiskCount_km=('risk_km', lambda x: (x == 'high').sum()),
    midRiskCount_km=('risk_km', lambda x: (x == 'mid').sum()),
    lowRiskCount_km=('risk_km', lambda x: (x == 'low').sum()),

    highRiskCount_rf=('risk_rf', lambda x: (x == 'high').sum()),
    midRiskCount_rf=('risk_rf', lambda x: (x == 'mid').sum()),
    lowRiskCount_rf=('risk_rf', lambda x: (x == 'low').sum())

).reset_index()

final_2025_df = grouped

concat = pd.concat([final_2019_df, final_2025_df], ignore_index=True)
    
#print(concat)

concat.to_csv("./data/us_states_risk_2019_2025.csv", index=False)