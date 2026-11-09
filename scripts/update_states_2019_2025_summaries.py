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

df = pd.read_csv("./data/us_tracts_2019_fd.csv",
                    dtype={"tract_id": str, "state": str})


small_df = df[['tract_id', 'state', 'food_desert']].copy()
small_df['fdCount'] = small_df['food_desert'].astype(int)
small_df['nonFdCount'] = (~small_df['food_desert']).astype(int)

grouped = small_df.groupby('state').agg(
    fdCount=('fdCount', 'sum'),
    nonFdCount=('nonFdCount', 'sum')
).reset_index()

grouped.rename(columns={'state': 'stateCode'}, inplace=True)
grouped['year'] = '2019'
grouped['stateName'] = grouped['stateCode'].map(fips_to_state)

final_2019_df = grouped[['year', 'stateCode', 'stateName', 'fdCount', 'nonFdCount']]

#print(final_2019_df)

#now take the data\us_states_risk_2019_2025.csv file and update with 2019 lines.

df = pd.read_csv("./data/us_states_risk_2019_2025.csv",
                    dtype={"stateCode": str})

print(df)

#final_df.to_csv("./data/us_states_2019_fd.csv", index=False)