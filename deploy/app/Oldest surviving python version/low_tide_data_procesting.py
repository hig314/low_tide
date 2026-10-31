import csv
import statistics

def cleanup(data_reader):
    data_reader = list(data_reader)
    max_row = len(data_reader)
    
    max_column = len(data_reader[3])
    data = []
    bad_rows = 1,2,3
    bad_columns = 0,1,3
    for row_count,row in enumerate(data_reader):
        if row_count >= max_row:
            break
        row = [i for j, i in enumerate(row[:max_column])\
               if j not in bad_columns]
        row = [row[0]] + row[1::2]
        if row_count not in bad_rows:
            data.append(row[:max_column])
    data = invert_grid(data)
    crab_indicies = get_crab_indices(data[0])
    data = data[1:]
    for low_tide_index in range(len(data)):
        data[low_tide_index] = {'location':get_location(data\
                                                        [low_tide_index][0]),\
                    'totall':'',
                    'date':data[low_tide_index][1],\
                    'crabs':get_crab_dict(data[low_tide_index][2:],\
                                          crab_indicies)}
        for crab in crab_indicies.keys():
            try: data[low_tide_index]['crabs'][crab] =\
                int(data[low_tide_index]['crabs'][crab])
            except ValueError:
                if data[low_tide_index]['crabs'][crab] in\
                   ['1-5','3-5','5-10','10-20','20-100']:
                    data[low_tide_index]['crabs'][crab] =\
                        int(statistics.mean([int(val) for val in\
                            data[low_tide_index]['crabs'][crab].split('-')]))
                    
                elif data[low_tide_index]['crabs'][crab] == '>100':
                    data[low_tide_index]['crabs'][crab] = 120
                    
                else: data[low_tide_index]['crabs'][crab] = 0
        data[low_tide_index]['totall'] = sum(data[low_tide_index]['crabs'].values())
    data = dict([(key,[value for value in data if value['location'] == key])
                 for key in ['Outside Beach','Waterfall Beach',\
                     'White Rock Beach','MacDonald Spit','Jakolof Bay',\
                     'Inside Beach','Ferry Dock','Seldovia Point',\
                     'Schooner Beach',"Hoen's Lagoon",\
                     'Limpet Rock','4th of July Creek','Halibut Cove',\
                     'China Poot','Otter Rock']\
                    ])
    return data

def get_crab_dict(crabs_counts,crab_indicies):
    crab_dict = {}
    for crab_type in crab_indicies.keys():
        crab_dict[crab_type] = crabs_counts[crab_indicies[crab_type]]
    return crab_dict



def get_location(location):
    location = location.lower()
    location_keywords = {'outside':'Outside Beach',
                         'waterfall':'Waterfall Beach',
                         'white':'White Rock Beach',
                         'macdonald':'MacDonald Spit',
                         'jakolof':'Jakolof Bay',
                         'inside':'Inside Beach',
                         'ferry':'Ferry Dock',
                         'seldovia':'Seldovia Point',
                         'schooner':'Schooner Beach',
                         'hoen':"Hoen's Lagoon",
                         'limpet':'Limpet Rock',
                         '4th':'4th of July Creek',
                         'halibut':'Halibut Cove',
                         'otter':'Otter Rock',
                         'china':'China Poot'}
    for location_keyword in location_keywords.keys():
        if location_keyword in location:
            return location_keywords[location_keyword]                     

def get_crab_indices(crab_row):
    crabs = crab_row[2:]
    crab_indices = {}
    for index,crab in enumerate(crabs):
        crab_indices[crab] = index
    return crab_indices

def invert_grid(grid):
    inverted_grid = []
    for i in range(len(grid[0])):
        inverted_grid.append([x[i] for x in grid])
    return inverted_grid

def get_data(file):                     
    with open(file['file_name'], newline='') as csvfile:
        crab_data = cleanup(csv.reader(csvfile))
    csvfile.close()
    return crab_data
