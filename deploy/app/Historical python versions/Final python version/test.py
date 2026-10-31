import csv
import statistics
import Get_temp_data
import datetime
import pickle

def cleanup(data_reader):
    Get_temp_data.update_data(datetime.datetime.today())
    data_reader = list(data_reader)
    max_row = len(data_reader)
    max_column = len(data_reader[3])
    data = []
    for row_count,row in enumerate(data_reader):
        if row_count >= max_row:
            break
        row = [i for j, i in enumerate(row[:max_column])]
        if row_count != 3:
            data.append(row[:max_column])
    data = invert_grid(data)
    crab_indicies = get_crab_indices(data[0])
    categories = data[1][4:]
    groups = data[2][4:]
    data = data[3:]
    notes = data[1::2]
    data = data[::2]
    file = open("Temp_data", 'rb')
    temp_data,start_date = pickle.load(file)
    file.close()
    for low_tide_index in range(len(data)):
        #print(notes)
        pepole = data[low_tide_index][1].lower()
        is_standard = False
        if 'erin' in pepole and ('katmai' in pepole or 'kids' in pepole) and 'valisa' in pepole:
            is_standard = True
        try:
            
            start_date = datetime.datetime.strptime('20160101','%Y%m%d')
            current_date = datetime.datetime.strptime(data[low_tide_index][3],'%m/%d/%y')
            s = 2
            if current_date == datetime.datetime.today():
                s = 3
            data[low_tide_index] = {'location':get_location(data\
                                                        [low_tide_index][0]),\
                    'totall':'',
                    'tide':float(data[low_tide_index][2]),\
                    'date':data[low_tide_index][3],\
                    'dateTXT':data[low_tide_index][3],\
                    'temp':temp_data[(current_date-start_date).days-s]['temp'],\
                    'is_standard':is_standard,\
                    'crabs':get_crab_dict(data[low_tide_index][4:],\
                                          crab_indicies,notes[low_tide_index][4:],groups)}
        except ValueError:
            print(data[low_tide_index-1])
            print(data[low_tide_index])
            data[low_tide_index] = {'location':get_location(data\
                                                        [low_tide_index][0]),\
                    'totall':'',
                    'tide':float(data[low_tide_index][2]),\
                    'date':data[low_tide_index][3],\
                    'dateTXT':data[low_tide_index][3],\
                    'is_standard':is_standard,\
                    'crabs':get_crab_dict(data[low_tide_index][4:],\
                                          crab_indicies,notes[low_tide_index][4:],groups)}
            raise Exception
        
        data[low_tide_index]['totall'] = sum([val[0] for val in list(data[low_tide_index]['crabs'].values())[1:]])
    tdata = dict([(key,[value for value in data if value['location'] == key])
                 for key in ['Outside Beach','Waterfall Beach',\
                     'White Rock Beach','MacDonald Spit','Jakolof Bay',\
                     'Inside Beach','Ferry Dock','Seldovia Point',\
                     'Schooner Beach',"Hoen's Lagoon",\
                     'Limpet Rock','4th of July Creek','Halibut Cove',\
                     'China Poot','Otter Rock',\
                     'Loc 1  369ft',\
                     'Loc 2  355ft',\
                     'Loc 3  342ft',\
                     'Loc 4  286ft',\
                     'Loc 5  240ft',\
                     'Loc 6  201ft',\
                     'Loc 7  190ft',\
                     'Loc 8  166ft',\
                     'Loc 9  144ft',\
                     'Loc 10  119ft',\
                     'Loc 11  78ft',\
                     'Loc 12  59ft','Loc 13  25ft']\
                    ])
    data = {}
    for key in tdata.keys():
        if tdata[key] != []:
            data[key] = tdata[key]
    return data,categories

def get_crab_dict(crabs_counts,crab_indicies,notes,groups):
    crab_dict = {'biodiversity':[0,'']}
    group_dict = {}
    for crab_type in crab_indicies.keys():
        crab_index = crab_indicies[crab_type]
        if groups[crab_index][0] in ['G','I']:
            count,was_seen = get_count(crabs_counts[crab_index])
            if was_seen:
                crab_dict['biodiversity'][0] += 1
            crab_dict[crab_type] = [count,notes[crab_index]]
        elif groups[crab_index][0] in ['S','A']:
            group_dict[groups[crab_index][1]] = [[get_count(crabs_counts[crab_index])[0],notes[crab_index]],1,
                                                 groups[crab_index][0],crab_type]
        elif groups[crab_index][0] in ['B']:
            
            group_dict[groups[crab_index][1]] = [[int(bool(get_count(crabs_counts[crab_index])[0])),notes[crab_index]],1,
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