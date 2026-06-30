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

import Get_data
import Get_temp_data
import datetime
import json
import csv
import pickle

def invert_grid(grid):
    grid = list(grid)
    inverted_grid = []
    for i in range(len(grid[0])):
        inverted_grid.append([x[i] for x in grid])
    return inverted_grid

Get_temp_data.update_data(datetime.datetime.today())

Get_data.get_data('1QojE91feA1K6smMq1K0LCHQhEgz35Ms-3NbDTu_FwsI','low tide checklist - Master list of observations and species')
#Get_data.get_data('1U7PNDsK2hTRfWDPedC3Iw2RF1-07-P7rkulNGLEcQbo')

with open("low tide checklist - Master list of observations and species.csv", newline='') as csvfile:
    data = list(csv.reader(csvfile))

json_data = json.dumps(data, indent=4)

js_data = f"const seldovia_raw_data = {json_data};"

with open("static/seldovia_sheet.js", "w", encoding="utf-8") as js:
    js.write(js_data)

with open('Temp_data', 'rb') as f:
    data = pickle.load(f)

json_data = json.dumps(data, indent=4)

js_data = f"const temp_data = {json_data};"

with open("static/Temp_data.js", "w", encoding="utf-8") as js:
    js.write(js_data)

Get_data.get_data('1VUVVE64tU2a8D6C8tn8jFhbHn97xDn5l','Costal studies intertidal data sheet')

with open("Costal studies intertidal data sheet.csv", newline='') as csvfile:
    data = list(csv.reader(csvfile))
    data = invert_grid(data)
    

json_data = json.dumps(data, indent=4)

js_data = f"const costal_studies_raw_data = {json_data};"

with open("static/costal_studies_sheet.js", "w", encoding="utf-8") as js:
    js.write(js_data)



    
