import csv
import pickle

def merge_files():
    with open("Otter Rock & China Poot Biodiversity Checklists- Historical Data Spreadsheet through 2020.xlsx - China Poot Bay.csv", newline='') as csvfile:
        china_poot = list(csv.reader(csvfile))
    csvfile.close()
    with open("Otter Rock & China Poot Biodiversity Checklists- Historical Data Spreadsheet through 2020.xlsx - Otter Rock.csv", newline='') as csvfile:
        otter_rock = list(csv.reader(csvfile))
    csvfile.close()
    merged_file = china_poot[:5]
    china_poot = china_poot[5:]
    otter_rock = otter_rock[5:]
    otter_row = 0
    otter_len = len(otter_rock)
    for row in china_poot:
        try:
            cpnum = get_date_num(row[0])
        except IndexError:
            continue
        while otter_row < otter_len:
            try:
                ornum = get_date_num(otter_rock[otter_row][0])
            except IndexError:
                otter_row += 1
                continue
            if ornum > cpnum:
                break
            else:
                merged_file.append(otter_rock[otter_row])
                otter_row += 1
        merged_file.append(row)
        
    while otter_row < otter_len:
        merged_file.append(otter_rock[otter_row])
        otter_row += 1
                
    with open("costal_studies_data.csv", 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
    
        # Write all rows at once
        writer.writerows(merged_file)
    
            
def get_date_num(date):
    year = int(date.split('/')[2][-2:])
    month = int(date.split('/')[0])
    day = int(date.split('/')[1])
    days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    return year*365\
           + sum(days_in_month[:month]) + day

merge_files()
