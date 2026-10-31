import csv
import pickle

custom_files_loc = 'customs_costal'
try:
    file = open(custom_files_loc, 'rb')
    custom_files = pickle.load(file)
    file.close()
except (FileNotFoundError,EOFError):
    custom_files = {}

def generate_custom_file(file_data,name):
    file = []
    for sub_file in file_data.values():
        for speicies in sub_file.keys():
            if sub_file[speicies][0].get():
                file.append((speicies,sub_file[speicies][1],sub_file[speicies][2],sub_file[speicies][3]))
    custom_files[name] = file

def get_filenames():
    with open("costal_studies_data.csv", newline='') as csvfile:
        info_column = list(csv.reader(csvfile))[3]
    csvfile.close()
    filenames = []
    for info in info_column:
        if info.split('$')[-1] not in filenames+['']:
            filenames.append(info.split('$')[-1])
    return filenames+list(custom_files.keys())
    

def invert_grid(grid):
    grid = list(grid)
    inverted_grid = []
    for i in range(len(grid[0])):
        inverted_grid.append([x[i] for x in grid])
    return inverted_grid

def get_names(filename):
    if filename in custom_files.keys():
        names = []
        for speices in custom_files[filename]:
            names.append(speices[0])
        return names
    with open("costal_studies_data.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        name_column = reader[4]
        info_column = reader[3]
    csvfile.close()
    names = []
    cliped_names = []
    for i,info in enumerate(info_column):
        if info.split('$')[-1] == filename:
            if len(info.split('$')) == 3:
                names.append(name_column[i])
                cliped_names.append(name_column[i])
            else:
                names.append(info.split('$')[0])
                cliped_names.append(info.split('$')[0])
        else:
            names.append('')
    return cliped_names

def get_colors(filename):
    if filename in custom_files.keys():
        colors = {}
        for speices in custom_files[filename]:
            colors[speices[0]] = speices[1]
        colors['biodiversity'] = '#000'
        return colors
    with open("costal_studies_data.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        name_column = reader[4]
        color_column = reader[2]
        info_column = reader[3]
    csvfile.close()
    color_dict = {}
    names = get_names(filename)
    for i,info in enumerate(info_column):
        if len(info.split('$')) == 3:
            name = name_column[i]
        else:
            name = info.split('$')[0]
        if name in names:
            color_dict[name] = '#'+color_column[i]
    color_dict['biodiversity'] = '#000'
    return color_dict

def get_groups(filename):
    if filename in custom_files.keys():
        groups = {}
        for speices in custom_files[filename]:
            groups[speices[0]] = speices[2]
        return groups
    with open("low tide checklist - Master list of observations and species.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        file = invert_grid(reader[:])
        name_column = reader[4]
        info_column = reader[3]
    csvfile.close()
    names = get_names(filename)
    group_dict = {}
    for name in names:
        group_dict[name] = 'G'
    return group_dict

def get_file(filename):
    with open("costal_studies_data.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        file = invert_grid(reader[:])
        name_column = reader[4]
        info_column = reader[3]
        info_row = invert_grid(reader[:])[3]
    csvfile.close()
    mid_file = []
    names = get_names(filename)
    save_names = []
    save_groups = []
    groups = get_groups(filename)
    for i,info in enumerate(info_column):
        if len(info.split('$')) == 3:
            name = name_column[i]
        else:
            name = info.split('$')[0]
        if name in names:
            mid_file.append(file[i])
            save_names.append(name)
            save_groups.append(groups[name])
        elif i < 5:
            mid_file.append(file[i])
    mid_len = len(mid_file[0])
    if filename in custom_files.keys():
        for speices in custom_files[filename]:
            if speices[3] == 'group':
                mid_file.append(['' for i in range(mid_len)])
                save_names.append(speices[0])
                save_groups.append(groups[speices[0]])

    out_file = []
    for i,info in enumerate(info_row):
        out_file.append(invert_grid(mid_file)[i])
    return invert_grid([['','','','','common name']+save_names]+[['','','','','']+save_groups]+out_file)

def save_customs():
    try:
        file = open(custom_files_loc, 'rb')
        customs = {**pickle.load(file), **custom_files}
        file.close()
    except (FileNotFoundError,EOFError):
        customs = custom_files
    file = open(custom_files_loc, 'wb')
    pickle.dump(customs, file)
    file.close()


################################################################################
'''
import csv

def get_filenames():
    with open("low tide checklist - Master list of observations and species.csv", newline='') as csvfile:
        info_column = invert_grid(csv.reader(csvfile))[5]
    csvfile.close()
    filenames = []
    for info in info_column:
        if info.split('$')[-1] not in filenames+['','data analasys info']:
            filenames.append(info.split('$')[-1])
    return filenames
    

def invert_grid(grid):
    grid = list(grid)
    inverted_grid = []
    for i in range(len(grid[0])):
        inverted_grid.append([x[i] for x in grid])
    return inverted_grid

def get_names(filename):
    with open("low tide checklist - Master list of observations and species.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        name_column = invert_grid(reader[:])[2]
        info_column = invert_grid(reader[:])[5]
    csvfile.close()
    names = []
    cliped_names = []
    for i,info in enumerate(info_column):
        if info.split('$')[-1] == filename:
            if len(info.split('$')) == 3:
                names.append(name_column[i])
                cliped_names.append(name_column[i])
            else:
                names.append(info.split('$')[0])
                cliped_names.append(info.split('$')[0])
                             
        else:
            names.append('')
    return names,cliped_names

def get_colors(filename):
    with open("low tide checklist - Master list of observations and species.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        color_column = invert_grid(reader[:])[4]
        info_column = invert_grid(reader[:])[5]
    csvfile.close()
    color_dict = {}
    names = get_names(filename)[0]
    for i,info in enumerate(info_column):
        if info.split('$')[-1] == filename:
            color_dict[names[i]] = '#'+color_column[i]
    color_dict['biodiversity'] = '#000'
    return color_dict

def get_file(filename):
    with open("low tide checklist - Master list of observations and species.csv", newline='') as csvfile:
        reader = list(csv.reader(csvfile))
        file = reader[:]
        info_column = invert_grid(reader[:])[5]
        info_row = reader[3]
    csvfile.close()
    mid_file = []
    for i,info in enumerate(info_column):
        if info.split('$')[-1] == filename or (i < 5 and i != 'l'):
            mid_file.append(file[i])
#    mid_file = invert_grid(mid_file)
    out_file = []
    for i,info in enumerate(info_row):
        if i > 111 or (info.split('$')[-1] in [filename,'all'] and info.split('$')[1] == 'inc'):
            out_file.append(invert_grid(mid_file)[i])
    return invert_grid(invert_grid(mid_file)[:2]+[['','','','','common name']+get_names(filename)[1]]+[invert_grid(mid_file)[3]]+out_file)
'''


