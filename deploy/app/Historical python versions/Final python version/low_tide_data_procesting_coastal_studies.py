import csv
import statistics

def cleanup(data_reader):
    data_reader = list(data_reader)
    max_row = len(data_reader)
    
    max_column = len(data_reader[3])
    data = []
    bad_columns = 2,3,5,6
    bad_rows = 2,3
    for row_count,row in enumerate(data_reader):
        if row_count >= max_row:
            break
        row = [i for j, i in enumerate(row[:max_column])\
               if j not in bad_columns]
        if row_count not in bad_rows:
            data.append(row[:max_column])
    data = invert_grid(data)
    crab_indicies = get_crab_indices(data[0])
    groups = data[1][3:]
    data = data[3:]
    for low_tide_index in range(len(data)):
        pepole = data[low_tide_index][1].lower()
        is_standard = True
        try: data[low_tide_index] = {'location':get_location(data\
                                                        [low_tide_index][1]),\
                    'totall':'',
                    'tide':float(data[low_tide_index][2]),\
                    'date':data[low_tide_index][0],\
                    'is_standard':is_standard,\
                    'crabs':get_crab_dict(data[low_tide_index][3:],\
                                          crab_indicies,groups),
                    'notes':''}
        except ValueError:
            print(data[low_tide_index-1],'ab')
            print(data[low_tide_index],'a')
            raise Exception
        
        data[low_tide_index]['totall'] = sum([val[0] for val in list(data[low_tide_index]['crabs'].values())[:-1]])
    data = dict([(key,[value for value in data if value['location'] == key])
                 for key in ['China Poot','Otter Rock']])
    return data,[]

def get_crab_dict(crabs_counts,crab_indicies,groups):
    crab_dict = {'biodiversity':[0,'']}
    group_dict = {}
    for crab_type in crab_indicies.keys():
        crab_index = crab_indicies[crab_type]
        if groups[crab_index][0] in ['G','I']:
            count,was_seen = get_count(crabs_counts[crab_index])
            if was_seen:
                crab_dict['biodiversity'][0] += 1
            crab_dict[crab_type] = [count,'']
        elif groups[crab_index][0] in ['S','A']:
            group_dict[groups[crab_index][1]] = [[get_count(crabs_counts[crab_index])[0],''],1,
                                                 groups[crab_index][0],crab_type]
        elif groups[crab_index][0] in ['B']:
            
            group_dict[groups[crab_index][1]] = [[int(bool(get_count(crabs_counts[crab_index])[0])),''],1,
                                                 groups[crab_index][0],crab_type]
    for crab_type in crab_indicies.keys():
        crab_index = crab_indicies[crab_type]
        if groups[crab_index][0] in ['I','O']:
            if group_dict[groups[crab_index][1]][2] == 'B':
                group_dict[groups[crab_index][1]][0][0] += int(bool(get_count(crabs_counts[crab_index])[0]))
            else:
                group_dict[groups[crab_index][1]][0][0] += get_count(crabs_counts[crab_index])[0]
                if group_dict[groups[crab_index][1]][2] == 'A':
                    group_dict[groups[crab_index][1]][1] += 1     
    for group in group_dict.values():
        group[0][0] /= group[1]
        crab_dict[group[3]] = group[0]
    return crab_dict

def get_count(val):
    try:
        count = int(val)
        if count != 0:
            return count,True
        return count,False
    except ValueError:
        if val in\
            ['1-5','3-5','5-10','10-20']:
            return int(statistics.mean([int(part) for part in\
                     val.split('-')])),True
                    
        elif val == '>100':
            return 100,True

        elif val == '20-100':
            return 40,True
                    
        else: return 0,False

def get_location(location):
    location = location.lower()
    location_keywords = {'otter':'Otter Rock',
                         'china':'China Poot'}
    for location_keyword in location_keywords.keys():
        if location_keyword in location:
            return location_keywords[location_keyword]

def get_crab_indices(crab_column):
    crabs = crab_column[3:]
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
