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
        if i > 111 or (info.split('$')[-1] == filename and info.split('$')[1] == 'inc'):
            out_file.append(invert_grid(mid_file)[i])
    return invert_grid(invert_grid(mid_file)[:2]+[['','','','','common name']+get_names(filename)[1]]+[invert_grid(mid_file)[3]]+out_file)






