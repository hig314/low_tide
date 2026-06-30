"""
Copyright 2026 Katmai McKittrick

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the “Software”), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

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
        start_date = "20040101"
    start_date = datetime.datetime.strptime(start_date,'%Y%m%d')
    redo = False
    save_end = end_date
    if start_date > end_date:
        return
    if start_date + datetime.timedelta(days=365) < end_date:
        end_date = start_date + datetime.timedelta(days=365)
        redo = True

    
        
    start_date = start_date.strftime("%Y%m%d")
    end_date = end_date.strftime("%Y%m%d")
    print(start_date,end_date)
    url = f"https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date={start_date}&end_date={end_date}&station=9455500&product=water_temperature&time_zone=lst_ldt&units=metric&interval=h&application=LowTIdeDataAnalasys&format=json"
    response = requests.get(url, timeout=(3, 60))

    if response.status_code == 200:
        response = response.json()
        if list(response.keys())[0] == 'error':
            print(response['error']['message'])
            '''if response['error']['message'] == 'No data was found. This product may not be offered at this station at the requested time.':
                update_data(save_end-datetime.timedelta(days=1))
                date = (datetime.datetime.strptime(Temp_data[-1]['date'],'%Y%m%d')+datetime.timedelta(days=1)).strftime("%Y%m%d")
                Temp_data.append({"date":date,"temp":Temp_data[-1]['temp']})
                file = open("Temp_data", 'wb')
                pickle.dump((Temp_data,end_date), file)
                file.close()
                if redo:
                    update_data(save_end)'''
            return
        data = response['data']
        day_temp = 0
        valid = False
        starting = True
        new_data = []
        p_date = ''
        if len(Temp_data):
            p_date_time = datetime.datetime.strptime(Temp_data[-1]['date'],'%Y-%m-%d')
            prev_p_date_time = datetime.datetime.strptime(Temp_data[-2]['date'],'%Y-%m-%d')
        else:
            p_date_time = datetime.datetime.strptime('2004-01-01','%Y-%m-%d')
            prev_p_date_time = datetime.datetime.strptime('2003-12-31','%Y-%m-%d')
        for hour in data:
            p_date = hour['t'][:10]
            if hour['t'][11:] == '00:00' and not starting:
                
                
                if valid:
                    next_point = {"date":p_date,"temp":day_temp/24}
                    day_temp = 0
                    valid = False
                else:
                    print(p_date)
                    if len(new_data):
                        next_point = {"date":p_date,"temp":new_data[-1]['temp']}
                    elif len(Temp_data):
                        next_point = {"date":p_date,"temp":Temp_data[-1]['temp']}
                for i in range((p_date_time-prev_p_date_time).days):
                    new_data.append(next_point)
                prev_p_date_time = p_date_time
                p_date_time = datetime.datetime.strptime(new_data[-1]['date'],'%Y-%m-%d')
            if starting:
                print(hour['t'],'starting')
            if hour['f'] == "0,0,0":
                valid = True
                day_temp += float(hour['v'])
            starting = False
        Temp_data.extend(new_data)
        file = open("Temp_data", 'wb')
        pickle.dump((Temp_data,end_date), file)
        file.close()
        if redo:
            update_data(save_end)
        
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
        return


