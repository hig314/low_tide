import requests
import json
import pickle
import datetime



full_data = []
def update_data(end_date):
    try:
        file = open("Temp_data", 'rb')
        Temp_data,start_date = pickle.load(file)
        file.close()
    except (FileNotFoundError,EOFError):
        Temp_data = []
        start_date = "20160101"
    start_date = datetime.datetime.strptime(start_date,'%Y%m%d')
    redo = False
    save_end = end_date
    if start_date + datetime.timedelta(days=365) < end_date:
        end_date = start_date + datetime.timedelta(days=365)
        redo = True
        
    start_date = start_date.strftime("%Y%m%d")
    end_date = end_date.strftime("%Y%m%d")
    url = f"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date={start_date}&end_date={end_date}&station=9455500&product=water_temperature&time_zone=lst_ldt&units=metric&interval=h&application=LowTIdeDataAnalasys&format=json"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()['data']
        day_temp = 0
        valid = False
        new_data = []
        p_date = ''
        for hour in data:
            if hour['t'][11:] == '00:00' and valid:
                new_data.append({"date":p_date,"temp":day_temp/24})
                day_temp = 0
                valid = False
            p_date = hour['t'][:10]
            if hour['f'] == "0,0,0":
                valid = True
                day_temp += float(hour['v'])
        Temp_data.extend(new_data)
        file = open("Temp_data", 'wb')
        pickle.dump((Temp_data,end_date), file)
        file.close()
        if redo:
            update_data(save_end)
        
                
        
            
    else:
        raise Exception(f"Failed to fetch data. Status code: {response.status_code}")

update_data(datetime.datetime.today())
