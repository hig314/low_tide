import functools
import itertools
from tkinter import *
import low_tide_data_procesting as low_tide_data_procesting_seldovia
import low_tide_data_procesting_coastal_studies as low_tide_data_procesting_costal
import file_initalization as file_initalization_seldovia  #_coastal_studies
import file_initalization_coastal_studies as file_initalization_costal
from tkinter import font
import copy
import math
import requests
import json

import sys

import svgwrite


low_tide_data_procesting = low_tide_data_procesting_seldovia
file_initalization = file_initalization_seldovia

def get_date_num(date):
    try:
        return float(date)
    except ValueError:
        pass
    year = int(date.split('/')[2][-2:])
    month = int(date.split('/')[0])
    day = int(date.split('/')[1])
    days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    return year*365\
           + sum(days_in_month[:month]) + day

def presence_absence(val,display,is_presence_absence):
    if not is_presence_absence:
        return val
    elif display:
        return 1
    else:
        return 0

def get_date(num):
    years = num//365
    num %= 365
    days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    days_to_reach = []
    for i in range(13):
        days_to_reach.append(sum(days_in_month[:i]))
    for month_length in days_to_reach[::-1]:
        if num >= month_length:
            months = (days_to_reach[::-1].index(month_length)-6)*(-1)+6
            days = num - month_length
            break
    return str(months)+'/'+str(days)+'/'+str(years)

def flatten(items, seqtypes=(list, tuple)):
    for i, x in enumerate(items):
        while i < len(items) and isinstance(items[i], seqtypes):
            items[i:i+1] = items[i]
    return items

class DataMaster:
    def __init__(self,files):
        self.root = Tk()
        self.root.title('Data analasys')
        self.low_tide_data_procesting = low_tide_data_procesting_seldovia
        self.file_initalization = file_initalization_seldovia
        self.frame = CrabVisualizationFrame(self.root,files,self,self.low_tide_data_procesting,self.file_initalization)
        self.frame.grid()

    def reset(self,data,data_swap):
        if data_swap:
            self.low_tide_data_procesting = [low_tide_data_procesting_seldovia,low_tide_data_procesting_costal][data_swap-1]
            self.file_initalization = [file_initalization_seldovia,file_initalization_costal][data_swap-1]
        self.frame.forget11()
        self.frame.grid_forget()
        self.root.destroy()
        self.root = Tk()
        self.root.title('Data analasys')
        self.frame = CrabVisualizationFrame(self.root,self.file_initalization.get_filenames(),self,self.low_tide_data_procesting,self.file_initalization,data)
        self.frame.grid()

    def create_custom(self,data):
        self.frame.forget11()
        self.frame.grid_forget()
        self.root.destroy()
        self.root = Tk()
        self.root.title('Data analasys')
        self.frame = SelectionFrame(self.root,self,data,self.low_tide_data_procesting,self.file_initalization)
        self.frame.grid()

class SelectionFrame(Frame):
    def __init__(self,master,data_master,data,low_tide_data_procesting,file_initalization):
        Frame.__init__(self,master)
        (self.low_tide_data_procesting,self.file_initalization) = (low_tide_data_procesting,file_initalization)
        self.master = master
        self.data = data
        self.data_master = data_master
        self.files = self.file_initalization.get_filenames()
        self.colors = {}
        self.groups = {}
        #Label(self, text= "groups must either be G which is just not part of any group\n or in the form <type><index>. Type can be
        #\n I which is part of group <index> and also just shows up normaly,\n O is the same but doesn't show up in the menu,
        #\n A,S,B are all for the menu item that is the group,\n A is average, S is sum, B is biodiversity").grid(row=0,column=0)
        for file in self.files:
            self.colors[file] = self.file_initalization.get_colors(file)
            self.groups[file] = self.file_initalization.get_groups(file)
        self.file = self.files[0]
        self.selected = {file: {name:(IntVar(value=0),self.colors[file][name],self.groups[file][name]) for name in self.file_initalization.get_names(file)} for file in self.files}
        self.speicies = SpeiciesFrame(self,self.files[0],self.selected[self.files[0]],low_tide_data_procesting,file_initalization,self.master)
        self.speicies.grid(row=1,column=0)
        self.file_menu = Menubutton(self,text="",relief=RAISED)
        self.file_selector = Menu(self.file_menu, tearoff = 0)
        for i,file in enumerate(self.files):
            self.file_selector.add_radiobutton(label=file,variable=0,
                    command=functools.partial(self.select_file,file))
        self.file_selector.invoke(0)
        self.file_menu["menu"] = self.file_selector
        self.file_menu.grid(row=2,column=0)
        self.name = Text(self,height = 1,width = 20,highlightbackground='#000')
        self.name.grid(row=3,column=0)
        self.submit_button = Button(self,text='Submit',command = self.Submit)
        self.submit_button.grid(row=4,column=0)

    def select_file(self,file):
        selected = self.speicies.get_selected()
        for species in selected[0].keys():
            self.selected[self.file][species] = (selected[0][species],selected[1][species].get("1.0",'end-1c'),selected[2][species].get("1.0",'end-1c'),selected[3][species])
        self.speicies.grid_forget()
        self.speicies = SpeiciesFrame(self,file,self.selected[file],self.low_tide_data_procesting,self.file_initalization,self.master)
        self.file_menu['text'] = file
        self.speicies.grid(row=1,column=0)
        self.file = file

    def Submit(self):
        selected = self.speicies.get_selected()
        for species in selected[0].keys():
            self.selected[self.file][species] = (selected[0][species],selected[1][species].get("1.0",'end-1c'),selected[2][species].get("1.0",'end-1c'),selected[3][species])
        self.file_initalization.generate_custom_file(self.selected,self.name.get("1.0",'end-1c'))
        self.data_master.reset(self.data,0)

    def forget11(self):
        pass

class SpeiciesFrame(Frame):
    def __init__(self,master,file,selected,low_tide_data_procesting,file_initalization,root):
        Frame.__init__(self,master)
        self.root = root
        (self.low_tide_data_procesting,self.file_initalization) = (low_tide_data_procesting,file_initalization)
        self.names = list(selected.keys())
        self.checkboxes = {}
        self.checkbuttons = []
        self.color_inputs = {}
        self.color_buttons = {}
        self.group_inputs = {}
        self.types = {}
        for i,name in enumerate(self.names):
            var = IntVar(value=selected[name][0].get())
            Label(self,text=name).grid(row=i,column=0)
            self.checkbuttons.append(Checkbutton(self,text='',variable=var))
            self.checkbuttons[-1].grid(row=i,column=1)
            self.checkboxes[name] = var
            color = Text(self,height = 1,width = 7)
            color.insert(END,selected[name][1])
            color.grid(row=i,column=2)
            self.color_inputs[name] = color
            self.color_buttons[name] = Button(self,text='–––––',fg=color.get("1.0",'end-1c'),
                                        width=5,bd=0,font=('Helvetica',15,'bold'),
                                command=functools.partial(self.update_prevew,name))
            self.color_buttons[name].grid(row=i,column=3)
            
            group = Text(self,height = 1,width = 2)
            group.insert(END,selected[name][2])
            group.grid(row=i,column=4)
            self.group_inputs[name] = group
            try:
                self.types[name] = selected[name][3]
            except IndexError:
                self.types[name] = 'normal'
            
        self.ind = i+1
        
        self.new_group_button = Button(self,text='Add new group',command=self.make_popup)
        self.new_group_button.grid(row=998,column=0,columnspan=5)
            
        self.no_speicies_button = Button(self,text='No ' + file,
                            command=functools.partial(self.set_speicies,False))
        self.all_speicies_button = Button(self,text='All ' + file,
                            command=functools.partial(self.set_speicies,True))
        self.no_speicies_button.grid(row=999,column=0,columnspan=2)
        self.all_speicies_button.grid(row=999,column=2,sticky=W,columnspan=3)

    def set_speicies(self,set_type):
        if set_type:
            for checkbutton in self.checkbuttons:
                checkbutton.select()
        else:
            for checkbutton in self.checkbuttons:
                checkbutton.deselect()

    def make_popup(self):
        name_menu = Toplevel(self.root)
        name_menu.title("")
        Label(name_menu, text= "Enter name").grid(row=0,column=0)
        self.name_input = Text(name_menu,height = 1,width = 20,highlightbackground='#000')
        self.name_input.grid(row=1,column=0)
        Button(name_menu,text='submit',command=functools.partial(self.add_group,self.name_input)).grid(row=2,column=0)


    def add_group(self,name_input):
        name = name_input.get("1.0",'end-1c')
        var = IntVar(value=1)
        Label(self,text=name).grid(row=self.ind,column=0)
        self.checkbuttons.append(Checkbutton(self,text='',variable=var))
        self.checkbuttons[-1].grid(row=self.ind,column=1)
        self.checkboxes[name] = var
        color = Text(self,height = 1,width = 7)
        color.insert(END,'#000000')
        color.grid(row=self.ind,column=2)
        self.color_inputs[name] = color
        self.color_buttons[name] = Button(self,text='–––––',fg=color.get("1.0",'end-1c'),
                                    width=5,bd=0,font=('Helvetica',15,'bold'),
                            command=functools.partial(self.update_prevew,name))
        self.color_buttons[name].grid(row=self.ind,column=3)
        
        group = Text(self,height = 1,width = 2)
        group.insert(END,'G')
        group.grid(row=self.ind,column=4)
        self.group_inputs[name] = group
        self.types[name] = 'group'
        self.ind += 1

    def get_selected(self):
        return self.checkboxes,self.color_inputs,self.group_inputs,self.types

    def update_prevew(self,name):
        self.color_buttons[name].configure(fg=self.color_inputs[name].get("1.0",'end-1c'))
class CrabVisualizationFrame(Frame):
    
    def __init__(self,master,files,data_master,low_tide_data_procesting,file_initalization,inital_data=None,file11=None):
        Frame.__init__(self,master)
        self.data_master = data_master
        self.has_canvas = False
        self.is_active = False
        self.is_redrawing = True

        if inital_data == None:
            self.data_cat = 0
        else:
            self.data_cat = inital_data['data_cat']

        self.data_menu = Menubutton(self,text=['seldovia','costal studies'][self.data_cat],relief=RAISED)
        data_selector = Menu(self.data_menu, tearoff = 0)
        for i in range(2):
            data_selector.add_radiobutton(label=['seldovia','costal studies'][i],
                    variable=0,command=functools.partial(self.select_data_cat,i))
        data_selector.invoke(self.data_cat)
        self.data_menu["menu"] = data_selector
        self.data_menu.grid(row=0,column=0)

        if file11 != None:
            file = file11
        elif inital_data == None:
            file = 0
        else:
            file = inital_data['file']
            
        self.data,self.categories = low_tide_data_procesting.cleanup(file_initalization.get_file(files[file]))
        self.file = {"display_name":files[file],'color_dict'
                     :file_initalization.get_colors(files[file])}
        self.crabs = list(list(self.data.values())[0][0]['crabs'].keys())
        self.selected_file = self.file["display_name"]
        self.file_menu = Menubutton(self,text=self.file["display_name"],relief=RAISED)
        file_selector = Menu(self.file_menu, tearoff = 0)
        for i in range(len(files)):
            file_selector.add_radiobutton(label=files[i],
                    variable=0,command=functools.partial(self.select_file,
                                            files[i],files[i],i))
        file_selector.add_radiobutton(label='custom',
                    variable=0,command=functools.partial(self.select_file,
                                            'custom','custom',i+1))
        file_selector.invoke(file)
        self.file_menu["menu"] = file_selector
        self.file_menu.grid(row=1,column=0)

        Button(self,text='Save customs',command=file_initalization.save_customs).grid(row=0,column=2)
     
        if inital_data == None:
            year_s = 0
            year_e = 1
        else:
            year_s = inital_data['year_s']
            year_e = inital_data['year_e']
            
        Label(self,text='Date range').grid(row=0,column=3)

        self.year_s_silder = Scale(self, from_=0, to=1,\
                            orient=HORIZONTAL, resolution = 0.02)
        self.year_s_silder.grid(row=1,column=3)
        self.year_s_silder.set(year_s)
        self.year_s_prev = year_s
        
        self.year_e_silder = Scale(self, from_=0, to=1,\
                            orient=HORIZONTAL, resolution = 0.02)
        self.year_e_silder.grid(row=2,column=3)
        self.year_e_silder.set(year_e)
        self.year_e_prev = year_e

        if inital_data == None:
            max_s = 0
            max_e = 1
        else:
            max_s = inital_data['max_s']
            max_e = inital_data['max_e']

        Label(self,text='Value range').grid(row=0,column=4)
            
        self.max_s_silder = Scale(self, from_=0, to=1,\
                            orient=HORIZONTAL, resolution = 0.02)
        self.max_s_silder.grid(row=1,column=4)
        self.max_s_silder.set(max_s)
        self.max_s_prev = max_s
        
        self.max_e_silder = Scale(self, from_=0, to=1,\
                            orient=HORIZONTAL, resolution = 0.02)
        self.max_e_silder.grid(row=2,column=4)
        self.max_e_silder.set(max_e)
        self.max_e_prev = max_e
        
        if inital_data == None:
            tide_s = 0
            tide_e = -7
        else:
            tide_s = inital_data['tide_s']
            tide_e = inital_data['tide_e']

        Label(self,text='Tide range').grid(row=0,column=5)
        
        self.tide_s_silder = Scale(self, from_=0, to=-7,\
                            orient=HORIZONTAL, resolution = 0.1)
        self.tide_s_silder.grid(row=1,column=5)
        self.tide_s_silder.set(tide_s)
        self.tide_s_prev = tide_s
        
        self.tide_e_silder = Scale(self, from_=0, to=-7,\
                            orient=HORIZONTAL, resolution = 0.1)
        self.tide_e_silder.grid(row=2,column=5)
        self.tide_e_silder.set(tide_e)
        self.tide_e_prev = tide_e

        Label(self,text='Require standard group').grid(row=0,column=7)
        if inital_data:
            self.requires_stndard = IntVar(value=inital_data['requires_stndard'].get())
        else:
            self.requires_stndard = IntVar(value=0)
        Checkbutton(self,text='',variable=self.requires_stndard,\
                    command=self.run_canvas).grid(row=0,column=8,sticky=W)

        Label(self,text='Show temparature').grid(row=1,column=7)
        if inital_data:
            self.temp = IntVar(value=inital_data['temp'].get())
        else:
            self.temp = IntVar(value=1)
        Checkbutton(self,text='',variable=self.temp,\
                    command=self.run_canvas).grid(row=1,column=8,sticky=W)
        self.point_count = Label(self,text='')
        self.point_count.grid(row=2,column=7)
        
        self.mouseover_label = Label(self,text='')
        self.mouseover_label.grid(row=0,column=6)
        self.mouseover_label2 = Label(self,text='')
        self.mouseover_label2.grid(row=1,column=6)
        self.mouseover_label3 = Label(self,text='')
        self.mouseover_label3.grid(row=2,column=6)
        
        self.selected_crabs = []
        self.crab_menu = Menubutton(self,text="No crabs",relief=RAISED)
        self.crab_selector = Menu(self.crab_menu, tearoff = 0)
        for index,label in enumerate(self.crabs):
            self.crab_selector.add_checkbutton(label=label,
                    command=functools.partial(self.select_crab,label))
        self.set_crabs(True)
        self.crab_menu["menu"] = self.crab_selector
        self.crab_menu.grid(row=0,column=9,columnspan=2)
        self.all_crabs_button = Button(self,text='Select all',
                            command=functools.partial(self.set_crabs,True))
        self.no_crabs_button = Button(self,text='Deselect all',
                            command=functools.partial(self.set_crabs,False))
        self.no_crabs_button.grid(row=1,column=9)
        self.all_crabs_button.grid(row=1,column=10)
        
        self.categories_menu = Menubutton(self,text="Add categories",relief=RAISED)
        self.categories_selector = Menu(self.categories_menu, tearoff = 0)
        for index,label in enumerate(list(set(flatten(self.categories[:])))):
            self.categories_selector.add_command(label=label,
                    command=functools.partial(self.select_category,label))
        self.categories_menu["menu"] = self.categories_selector
        self.categories_menu.grid(row=2,column=9,columnspan=2)
        

        if inital_data == None:
            locations = list(range(len(self.data.keys())))
        else:
            locations = inital_data['locations']
        self.selected_locations = []
        self.location_menu = Menubutton(self,text="No locations",\
                                        relief=RAISED)
        self.location_selector = Menu(self.location_menu, tearoff = 0)
        for label in self.data.keys():
            self.location_selector.add_checkbutton(label=label,
                    command=functools.partial(self.select_location,label))
        for location in locations:
            self.location_selector.invoke(location)
        self.location_menu["menu"] = self.location_selector
        self.location_menu.grid(row=0,column=11)
        self.all_locations_button = Button(self,text='All locations',
                            command=functools.partial(self.set_locations,True))
        self.no_locations_button = Button(self,text='No locations',
                            command=functools.partial(self.set_locations,False))
        self.no_locations_button.grid(row=1,column=11)
        self.all_locations_button.grid(row=2,column=11)
        if inital_data == None:
            visualization = 0
        else:
            visualization = inital_data['visualization']
        self.visualizations = ['Numbers','Relative to average','Percent','Percent of selected','Percent relative to average',
                               'Percent of the way to average','Percent of the way to maximum','Presence-absence']
        self.selected_visualization = "Numbers"
        self.visualization_menu = Menubutton(self,text="Numbers",relief=RAISED)
        visualization_selector = Menu(self.visualization_menu, tearoff = 0)
        for label in self.visualizations:
            visualization_selector.add_radiobutton(label=label,variable=2,
                    command=functools.partial(self.select_visualization,label))
        visualization_selector.invoke(visualization)
        self.visualization_menu["menu"] = visualization_selector
        self.visualization_menu.grid(row=0,column=12)

        if inital_data == None:
            smoothing = 0
        else:
            smoothing = inital_data['smoothing']
        self.smoothings = ["no smoothing","smoothed low","smoothed med",\
                       "smoothed high"]
        self.selected_smoothing = "no smoothing"
        self.smoothing_menu = Menubutton(self,text="standard",relief=RAISED)
        smoothing_selector = Menu(self.smoothing_menu, tearoff = 0)
        for label in self.smoothings:
            smoothing_selector.add_radiobutton(label=label,variable=3,
                    command=functools.partial(self.select_smoothing,label))
        smoothing_selector.invoke(smoothing)
        self.smoothing_menu["menu"] = smoothing_selector
        self.smoothing_menu.grid(row=1,column=12)

        if inital_data == None:
            scaling = 0
        else:
            scaling = inital_data['scaling']
        self.scalings = ["linear","square root","logarithmic"]
        self.selected_scaling = "linear"
        self.scaling_menu = Menubutton(self,text="standard",relief=RAISED)
        scaling_selector = Menu(self.scaling_menu, tearoff = 0)
        for label in self.scalings:
            scaling_selector.add_radiobutton(label=label,variable=3,
                    command=functools.partial(self.select_scaling,label))
        scaling_selector.invoke(scaling)
        self.scaling_menu["menu"] = scaling_selector
        self.scaling_menu.grid(row=2,column=12)

        if inital_data == None:
            graph = 0
        else:
            graph = inital_data['graph']
        self.graphs = ["line-graph",'scatter-plot','stacked']
        self.selected_graph = "line-graph"
        self.graph_menu = Menubutton(self,text="line-graph",relief=RAISED)
        graph_selector = Menu(self.graph_menu, tearoff = 0)
        for label in self.graphs:
            graph_selector.add_radiobutton(label=label,variable=3,
                    command=functools.partial(self.select_graph,label))
        graph_selector.invoke(graph)
        self.graph_menu["menu"] = graph_selector
        self.graph_menu.grid(row=0,column=13)

        if inital_data == None:
            orginization = 0
        else:
            orginization = inital_data['orginization']
        
        self.orginizations = ['standard','seasonal','locational']
        self.selected_orginization = "standard"
        self.orginization_menu = Menubutton(self,text="standard",relief=RAISED)
        orginization_selector = Menu(self.orginization_menu, tearoff = 0)
        for label in self.orginizations:
            orginization_selector.add_radiobutton(label=label,variable=3,
                    command=functools.partial(self.select_orginization,label))
        orginization_selector.invoke(orginization)
        self.orginization_menu["menu"] = orginization_selector
        self.orginization_menu.grid(row=1,column=13)

        file_selector.invoke(file)

        self.canvas = GraphCanvas(self,self.data,self.file['color_dict'])
        self.canvas.grid(row=3,column=0,columnspan=14)

        default_font = font.nametofont("TkDefaultFont")
        self.error = Label(self,text='',fg='red',font=(default_font.actual(), 16, "bold"))
        self.error.grid(row=4,column=0,columnspan=14)
        self.has_canvas = True
        self.is_active = True
        self.run_canvas()
        self.loop()

    def run_canvas(self):
        if self.is_active:
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_smoothing,self.selected_scaling,self.selected_orginization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get(),\
                                self.max_s_silder.get(),self.max_e_silder.get(),\
                               self.tide_s_silder.get(),self.tide_e_silder.get(),\
                               bool(self.requires_stndard.get()),bool(self.temp.get()))

    def select_year(self,text):
        self.year_menu['text'] = text
        self.selected_year = text
        if self.is_active:
            self.run_canvas()

    def select_crab(self,crab):
        if crab in self.selected_crabs:
            self.selected_crabs.remove(crab)
        else:
            self.selected_crabs.append(crab)
        if len(self.selected_crabs) == 0:
            self.crab_menu['text'] = 'No ' + self.file['display_name']
        elif len(self.selected_crabs) == 1:
            self.crab_menu['text'] = self.selected_crabs[0]
        elif len(self.selected_crabs) in range(2,len(self.crabs)):
            self.crab_menu['text'] = 'Custom ' + self.file['display_name']
        else:
            self.crab_menu['text'] = 'All ' + self.file['display_name']
        if self.is_active and self.is_redrawing:
            self.run_canvas()

    def set_locations(self,is_all):
        self.is_redrawing = False
        for location in self.data.keys():
            if (location not in self.selected_locations) == is_all:
                self.location_selector.invoke(list(self.data.keys())\
                                              .index(location))
        self.is_redrawing = True
        if self.is_active:
            self.run_canvas()
                

    def select_location(self,text):
        if text in self.selected_locations:
            self.selected_locations.remove(text)
        else:
            self.selected_locations.append(text)
        if len(self.selected_locations) == 0:
            self.location_menu['text'] = 'No locations'
        elif len(self.selected_locations) == 1:
            self.location_menu['text'] = self.selected_locations[0]
        elif len(self.selected_locations) in range(2,len(self.data.keys())):
            self.location_menu['text'] = 'Custom locations'
        else:
            self.location_menu['text'] = 'All locations'
        if self.is_active and self.is_redrawing:
            self.run_canvas()
            
    def select_visualization(self,text):
        self.visualization_menu['text'] = text
        self.selected_visualization = text
        if self.is_active:
            self.run_canvas()

    def select_smoothing(self,text):
        self.smoothing_menu['text'] = text
        self.selected_smoothing = text
        if self.is_active:
            self.run_canvas()

    def select_scaling(self,text):
        self.scaling_menu['text'] = text
        self.selected_scaling = text
        if self.is_active:
            self.run_canvas()

    def select_orginization(self,text):
        self.orginization_menu['text'] = text
        self.selected_orginization = text
        if self.is_active:
            self.run_canvas()

    def select_graph(self,text):
        self.graph_menu['text'] = text
        self.selected_graph = text
        if self.is_active:
            self.run_canvas()

    def select_file(self,file,lable,index):
        if file == 'custom':
            self.data_master.create_custom({'file':index,
                    'year_s':self.year_s_silder.get(),
                    'year_e':self.year_e_silder.get(),
                    'max_s':self.max_s_silder.get(),
                    'max_e':self.max_e_silder.get(),
                    'tide_s':self.tide_s_silder.get(),
                    'tide_e':self.tide_e_silder.get(),
                    'locations':[list(self.data.keys()).index(location)\
                                 for location in self.selected_locations],
                    'visualization':self.visualizations.index(\
                        self.selected_visualization),
                    'requires_stndard':self.requires_stndard,
                    'temp':self.temp,
                    'graph':self.graphs.index(self.selected_graph),
                    'orginization':self.orginizations.index(self.selected_orginization),
                    'smoothing':self.smoothings.index(self.selected_smoothing),
                    'scaling':self.scalings.index(self.selected_scaling),
                    'data_cat':self.data_cat})
            return
        elif self.has_canvas:
            self.data_master.reset({'file':index,
                    'year_s':self.year_s_silder.get(),
                    'year_e':self.year_e_silder.get(),
                    'max_s':self.max_s_silder.get(),
                    'max_e':self.max_e_silder.get(),
                    'tide_s':self.tide_s_silder.get(),
                    'tide_e':self.tide_e_silder.get(),
                    'locations':[list(self.data.keys()).index(location)\
                                 for location in self.selected_locations],
                    'visualization':self.visualizations.index(\
                        self.selected_visualization),
                    'requires_stndard':self.requires_stndard,
                    'temp':self.temp,
                    'graph':self.graphs.index(self.selected_graph),
                    'orginization':self.orginizations.index(self.selected_orginization),
                    'smoothing':self.smoothings.index(self.selected_smoothing),
                    'scaling':self.scalings.index(self.selected_scaling),
                    'data_cat':self.data_cat},self.data_cat+1)
                    
        else:
            self.file_menu['text'] = lable

    def select_data_cat(self,ind):
        if self.has_canvas:
            self.data_master.reset({'file':0,
                    'year_s':self.year_s_silder.get(),
                    'year_e':self.year_e_silder.get(),
                    'max_s':self.max_s_silder.get(),
                    'max_e':self.max_e_silder.get(),
                    'tide_s':self.tide_s_silder.get(),
                    'tide_e':self.tide_e_silder.get(),
                    'locations':[list(self.data.keys()).index(location)\
                                 for location in self.selected_locations],
                    'visualization':self.visualizations.index(\
                        self.selected_visualization),
                    'requires_stndard':self.requires_stndard,
                    'temp':self.temp,
                    'graph':self.graphs.index(self.selected_graph),
                    'orginization':self.orginizations.index(self.selected_orginization),
                    'smoothing':self.smoothings.index(self.selected_smoothing),
                    'scaling':self.scalings.index(self.selected_scaling),
                    'data_cat':ind},ind+1)
        else:
            self.data_menu['text'] = ['seldovia','costal studies'][ind]
       
    def set_crabs(self,is_all):
        self.is_redrawing = False
        for crab in self.crabs:
            if (crab not in self.selected_crabs) == is_all:
                self.crab_selector.invoke(self.crabs.index(crab))

        self.is_redrawing = True
        if self.is_active:
            self.run_canvas()

    def select_category(self,name):
        self.is_redrawing = False
        for i,val in enumerate(self.categories):
            if name in val and self.crabs[i+1] not in self.selected_crabs:
                self.crab_selector.invoke(i+1)
        self.is_redrawing = True
        if self.is_active:
            self.run_canvas()
            
    def display(self,val,pre,loc,date,notes,event=None):
        try:
            if float(int(val)) == val:
                val = int(val)
        except ValueError: pass
        except IndexError: pass
        if self.selected_visualization in ('Percent','Percent of selected','Percent relative to average','Percent of the way to average') and val != '':
            post = '%'
        else:
            post = ''
        if notes != '':
            post2 = ', '
        else:
            post2 = ''
        self.mouseover_label['text'] = pre+str(val)+post+post2+notes
        self.mouseover_label2['text'] = loc
        self.mouseover_label3['text'] = date

    def display_error(self,txt):
        self.error['text'] = txt

    def update_point_count(self,count):
        self.point_count['text'] = f'{count} surveys'

    def loop(self):
        if self.year_s_prev != self.year_s_silder.get() or\
           self.year_e_prev != self.year_e_silder.get() or\
           self.max_s_prev != self.max_s_silder.get() or\
           self.max_e_prev != self.max_e_silder.get() or\
           self.tide_s_prev != self.tide_s_silder.get() or\
           self.tide_e_prev != self.tide_e_silder.get():
            if self.is_active:
                self.run_canvas()
                
        self.year_s_prev = self.year_s_silder.get()
        self.year_e_prev = self.year_e_silder.get()
        self.max_s_prev = self.max_s_silder.get()
        self.max_e_prev = self.max_e_silder.get()
        self.tide_s_prev = self.tide_s_silder.get()
        self.tide_e_prev = self.tide_e_silder.get()
        
        self.master.after(30, self.loop)

    def forget11(self):
        self.file_menu.grid_forget()
        self.year_s_silder.grid_forget()
        self.year_e_silder.grid_forget()
        self.crab_menu.grid_forget()
        self.no_crabs_button.grid_forget()
        self.all_crabs_button.grid_forget()
        self.location_menu.grid_forget()
        self.no_locations_button.grid_forget()
        self.all_locations_button.grid_forget()
        self.visualization_menu.grid_forget()
        self.graph_menu.grid_forget()
        self.canvas.grid_forget()
        self.mouseover_label.grid_forget()
            
class GraphCanvas(Canvas):

    def __init__(self,master,data,crab_colors):
        Canvas.__init__(self,master,height=720,width=1660)
        self.data = data
        self.crab_colors = crab_colors
        self.data_coords = []
        self.orginization_type = ''
        self.graph_type = ''
        self.bind('<Motion>', self.handle_motion)

    def graph_data(self,locations,crabs,visualization_type,smoothing_type,scaling_type,orginization_type,\
                   graph_type,year_s,year_e,max_s,max_e,tide_s,tide_e,requres_standard,temp):

        error = False
        if orginization_type == 'locational':
            if smoothing_type != 'no smoothing':
                self.master.display_error('Cannot smooth while in locational')
                error = True
                
            if graph_type != 'scatter-plot':
                self.master.display_error('Must use scatter plot while in locational')
                error = True

        if not error:
            self.master.display_error('')

        data = copy.deepcopy(self.data)
        self.graph_type = graph_type
        self.orginization_type = orginization_type
        [self.delete(thing) for thing in self.find_all()]
        data = list(itertools.chain(
            *[data[location] for location in locations]))
        data = sorted(data,key = lambda i: get_date_num(i['date']))
        if requres_standard:
            data = [low_tide for low_tide in data if low_tide['is_standard']]
        set_days = True
        try: data_range = get_date_num(data[-1]['date'])-get_date_num(data[0]['date'])
        except IndexError:
            data_range = 0
            set_days = False
        try:
            if set_days:
                days = list(range(int(get_date_num(data[0]['date'])+\
                               year_s*data_range),
                          int(get_date_num(data[0]['date'])+\
                               year_e*data_range+1)))
            else:
                raise ValueError
        except ValueError:
            days = [0]
        if len(days) == 0:
            days = [0]
        data = [low_tide for low_tide in data if get_date_num(low_tide['date']) in days and \
                low_tide['tide'] < tide_s and low_tide['tide'] > tide_e]

        if orginization_type == 'seasonal':
            dupe_dict = {}
            for i,low_tide in enumerate(data):
                low_tide['date'] = get_date_num(low_tide['date'])%365
        dupe_dict = {}
        for i,low_tide in enumerate(data):
            date = get_date_num(low_tide['date'])
            dupe_dict[date] = dupe_dict.get(date,[])
            dupe_dict[date].append(i)
        for date in dupe_dict.keys():
            for i,index in enumerate(dupe_dict[date]):
                data[index]['date'] = date+i*0.001
        data = sorted(data,key = lambda i: get_date_num(i['date']))
        if len(data) == 0:
            return
            
        speicies_list = data[0]['crabs'].keys()
        for low_tide in data:
            for speicies in speicies_list:
                if scaling_type == 'square root':
                    low_tide['crabs'][speicies][0] = math.sqrt(low_tide['crabs'][speicies][0])
                elif scaling_type == 'logarithmic':
                    low_tide['crabs'][speicies][0] = math.log2(low_tide['crabs'][speicies][0]+1)
        x_max = len(days)
        avgs = [0 for i in range(len(crabs)+1)]
        safe_data = [low_tide for low_tide in data if low_tide['totall'] != 0]
        safe_indexes = [i for i,low_tide in enumerate(data) if low_tide['totall'] != 0]
        if not len(safe_data):
            return
        y_min = 0
        k = 0
        if smoothing_type == "smoothed low":
            k = 40
        elif smoothing_type == "smoothed med":
            k = 70
        elif smoothing_type == "smoothed high":
            k = 100
        if orginization_type == 'seasonal':
            k /= 10
        factor = k/(k+1)
        if visualization_type == 'Percent':
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0]*100/low_tide['totall']\
                       for crab in low_tide['crabs'].keys()
                       if crab in crabs]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for j in li:
                        vals.append([])
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(safe_data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(safe_data[l+n]['date'])-m) for n in range(h-l)]),1)
                            vals[-1].append(sum([x*(factor**abs(get_date_num(safe_data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                    if graph_type == 'stacked':
                        y_max = max([sum([vals[j][i] for j in range(len(vals))]) for i in range(len(vals[0]))])
                    else:
                        y_max = max([max(val) for val in vals])
                else:
                    y_max = 0

            elif graph_type == 'stacked':
                try: y_max = max([sum([low_tide['crabs'][crab][0]*100/low_tide['totall']\
                        for crab in low_tide['crabs'].keys() if crab in crabs])\
                                      for low_tide in safe_data])
                except ValueError:
                    y_max = 0
            else:
                try: y_max = max(list(itertools.chain(\
                    *[[low_tide['crabs'][crab][0]*100/low_tide['totall']\
                       for crab in low_tide['crabs'].keys()
                       if crab in crabs]
                      for low_tide in safe_data])))
                except ValueError:
                    y_max = 0

        elif visualization_type == 'Relative to average':
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for k,j in enumerate(li):
                        vals.append([])
                        total = 0
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(data[l+n]['date'])-m) for n in range(h-l)]),0)
                            vals[-1].append(sum([x*(factor**abs(get_date_num(data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                            total += vals[-1][i]
                        avgs[k] = total/len(vals[-1])
                    y_max = max([max(val)-avgs[i] for i,val in enumerate(vals)])
                    y_min = -y_max
                else:
                    y_max = 0
            else:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    for i,j in enumerate(li):
                        total = 0
                        for val in j:
                            total += val
                        avgs[i] = total/len(j)
                    y_max = max(list(itertools.chain(\
                        *[[low_tide['crabs'][crab][0]-avgs[i]\
                           for i,crab in enumerate(crabs)]
                          for low_tide in safe_data])))
                    y_min = -y_max
                else:
                    y_max = 0

        elif visualization_type == 'Percent relative to average':
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for k,j in enumerate(li):
                        vals.append([])
                        total = 0
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(data[l+n]['date'])-m) for n in range(h-l)]),1)
                            vals[-1].append(sum([x*(factor**abs(get_date_num(data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                            total += j[i]
                            #total += vals[-1][-1]
                        avgs[k] = total/len(j)
                    y_max = max([max(val)*100/max(avgs[i],0.01)-100 for i,val in enumerate(vals)])
                    y_min = -y_max
                else:
                    y_max = 0
            else:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    for i,j in enumerate(li):
                        total = 0
                        for val in j:
                            total += val
                        avgs[i] = total/len(j)
                    y_max = max(list(itertools.chain(\
                        *[[low_tide['crabs'][crab][0]*100/max(avgs[i],0.01)-100\
                           for i,crab in enumerate(crabs)]
                          for low_tide in safe_data])))
                    y_min = -y_max
                else:
                    y_max = 0

        elif visualization_type == 'Percent of the way to average':
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for k,j in enumerate(li):
                        vals.append([])
                        total = 0
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(data[l+n]['date'])-m) for n in range(h-l)]),1)
                            vals[-1].append(sum([x*(factor**abs(get_date_num(data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                            total += j[i]
                            #total += vals[-1][-1]
                        avgs[k] = total/len(j)

                    if graph_type == 'stacked':
                        y_max = max([sum([vals[j][i]*100/max(avgs[j],0.01) for j in range(len(vals))]) for i in range(len(vals[0]))])
                    else:
                        y_max = max([max(val)*100/max(avgs[i],0.01) for i,val in enumerate(vals)])
                    y_min = 0
                else:
                    y_max = 0

            elif graph_type == 'stacked':
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    for i,j in enumerate(li):
                        total = 0
                        for val in j:
                            total += val
                        avgs[i] = total/len(j)
                    y_max = max([sum([low_tide['crabs'][crab][0]*100/max(avgs[i],0.01)\
                           for i,crab in enumerate(crabs)])
                          for low_tide in safe_data])
                    y_min = 0
                else:
                    y_max = 0
            
            else:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    for i,j in enumerate(li):
                        total = 0
                        for val in j:
                            total += val
                        avgs[i] = total/len(j)
                    y_max = max(list(itertools.chain(\
                        *[[low_tide['crabs'][crab][0]*100/max(avgs[i],0.01)\
                           for i,crab in enumerate(crabs)]
                          for low_tide in safe_data])))
                    y_min = 0
                else:
                    y_max = 0

        elif visualization_type == 'Percent of the way to maximum':
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for k,j in enumerate(li):
                        vals.append([])
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(data[l+n]['date'])-m) for n in range(h-l)]),0)
                            vals[-1].append(sum([x*(factor**abs(get_date_num(data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                        avgs[k] = max(vals[-1])

                    if graph_type == 'stacked':
                        y_max = max([sum([vals[j][i]*100/max(avgs[j],0.01) for j in range(len(vals))]) for i in range(len(vals[0]))])
                    else:
                        y_max = max([max(val)*100/max(avgs[i],0.01) for i,val in enumerate(vals)])
                    y_min = 0
                else:
                    y_max = 0

            elif graph_type == 'stacked':
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    for i,j in enumerate(li):
                        avgs[i] = max(j)
                    y_max = max([sum([low_tide['crabs'][crab][0]*100/max(avgs[i],0.01)\
                           for i,crab in enumerate(crabs)])
                          for low_tide in safe_data])
                    y_min = 0
                else:
                    y_max = 0
            
            else:
                lii = [[low_tide['crabs'][crab][0]\
                       for i,crab in enumerate(crabs)]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    for i,j in enumerate(li):
                        avgs[i] = max(j)
                    y_max = max(list(itertools.chain(\
                        *[[low_tide['crabs'][crab][0]*100/max(avgs[i],0.01)\
                           for i,crab in enumerate(crabs)]
                          for low_tide in safe_data])))
                    y_min = 0
                else:
                    y_max = 0
                    
        elif visualization_type == 'Percent of selected':
            
            if graph_type == 'stacked':
                y_max = 100
                
            elif smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0]\
                       for crab in low_tide['crabs'].keys()
                       if crab in crabs]
                      for low_tide in safe_data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    tides = [[] for i in range(len(lii))]
                    for j in li:
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(safe_data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(safe_data[l+n]['date'])-m) for n in range(h-l)]),1)
                            tides[i].append(sum([x*(factor**abs(get_date_num(safe_data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)

                    totals = []
                    vals = []
                    for tide in tides:
                        totals.append(max(sum(tide),1))
                        
                    for i,tide in enumerate(tides):
                        for val in tide:
                            vals.append(val*100/totals[i])
                    y_max = max(vals)
                else:
                    y_max = 0
                
            else:
                try:
                    totals = [max(sum([low_tide['crabs'][crab][0]\
                        for crab in low_tide['crabs'].keys() if crab in crabs]),1)\
                                      for low_tide in safe_data]

                    y_max = max(list(itertools.chain(\
                            *[[low_tide['crabs'][crab][0]*100/totals[i] for crab in low_tide['crabs'].keys()
                               if crab in crabs]
                              for i,low_tide in enumerate(safe_data)])))
                except ValueError:
                    y_max = 0

        elif visualization_type == 'Presence-absence':
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[int(bool(low_tide['crabs'][crab][2])) for crab in low_tide['crabs'].keys()
                   if crab in crabs]
                  for low_tide in data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for j in li:
                        vals.append([])
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(data[l+n]['date'])-m) for n in range(h-l)]),0)
                            vals[-1].append(sum([presence_absence(x,x,True)*(factor**abs(get_date_num(data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                    if graph_type == 'stacked':
                        y_max = max([sum([vals[j][i] for j in range(len(vals))]) for i in range(len(vals[0]))])
                    else:
                        y_max = max([max(val) for val in vals])
                else:
                    y_max = 0
            elif graph_type == 'stacked':
                try: y_max = max([sum([presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],True)\
                        for crab in low_tide['crabs'].keys() if crab in crabs])\
                                      for low_tide in safe_data])
                except ValueError:
                    y_max = 0
            else:
                y_max = 1
                
        else:
            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                lii = [[low_tide['crabs'][crab][0] for crab in low_tide['crabs'].keys()
                   if crab in crabs]
                  for low_tide in data]
                li = []
                for i in range(len(lii[0])):
                    li.append([x[i] for x in lii])
                if len(li):
                    vals = []
                    for j in li:
                        vals.append([])
                        for i in range(len(j)):
                            l = max(0,i-13)
                            h = min(i+14,len(j))
                            m = get_date_num(data[i]['date'])
                            div = max(sum([factor**abs(get_date_num(data[l+n]['date'])-m) for n in range(h-l)]),0)
                            vals[-1].append(sum([x*(factor**abs(get_date_num(data[l+n]['date'])-m)) for n,x in enumerate(j[l:h])])/div)
                    if graph_type == 'stacked':
                        y_max = max([sum([vals[j][i] for j in range(len(vals))]) for i in range(len(vals[0]))])
                    else:
                        y_max = max([max(val) for val in vals])
                else:
                    y_max = 0
            elif graph_type == 'stacked':
                try: y_max = max([sum([low_tide['crabs'][crab][0]\
                        for crab in low_tide['crabs'].keys() if crab in crabs])\
                                      for low_tide in safe_data])
                except ValueError:
                    y_max = 0
            else:
                try: y_max = max(list(itertools.chain(\
                    *[[low_tide['crabs'][crab][0] for crab in low_tide['crabs'].keys()
                       if crab in crabs]
                      for low_tide in safe_data])))
                except ValueError:
                    y_max = 0
        
        try: t_max = max([low_tide['temp'] for low_tide in safe_data])
        except ValueError:
            t_max = 1
            
        try: t_min = min([low_tide['temp'] for low_tide in safe_data])
        except ValueError:
            t_min = 0
            
        if y_max == 0:
            y_max = 1

        if orginization_type == 'seasonal':
            x_max = 365
        elif orginization_type == 'locational':
            x_max = len(locations)-1
        
        y_min += (y_max-y_min)*max_s
        y_max *= max_e
        if y_max-y_min == 0:
            return
        y_max,y_min = self.draw_y_scalebar(y_max,visualization_type,y_min)
        t_max,t_min = self.draw_t_scalebar(t_max,visualization_type,t_min)
        do_svg = False
        try:
            self.draw_graph(data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,\
                             graph_type,orginization_type,locations,avgs,factor,temp)
            if do_svg:
                self.generate_svg(data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,\
                             graph_type,orginization_type,locations,avgs,factor,temp)
        except IndexError:
            pass
        self.draw_x_scalebar(days,graph_type,orginization_type,locations)

    def draw_graph(self,data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,graph_type,orginization_type,locations,avgs,factor,temp):
        self.master.update_point_count(len(data))
        x_scale = 1560/x_max
        if visualization_type == 'Percent':
            multiply = 1
        elif visualization_type == 'Percent relative to average':
            multiply = 2
        elif visualization_type in ['Percent of the way to average','Percent of the way to maximum']:
            multiply = 3
        else:
            multiply = 0
        if y_max == y_min:
            y_min -= y_max/100
        y_scale = 610/(y_max-y_min)
        t_scale = 610/(t_max-t_min)

        self.data_coords = []
        data_coords = []
        coord_dict = {}
        location_totals = {}
        
        if orginization_type == 'seasonal':
            min_mul = 0
        else:
            min_mul = 1
            
        if visualization_type == 'Presence-absence':
            do_presence_absence = True
        else:
            do_presence_absence = False
        prev_coords = [0 for i in range(len(data))]
        prev_true_coords = [650 for i in range(len(data))]
        tides = [{} for i in data]
        #print(len(data))
        dot_size=5
        count = 0
        for crab_index,crab in enumerate(crabs):
            coords_rec = []
            true_coords_rec = []
            coords = []
            if multiply == 1:
                sub = 0
                try:
                    multi = 100/data[0]['totall']
                except ZeroDivisionError: multi = 1
            elif multiply == 2:
                try:
                    multi = 100/avgs[crab_index]
                except ZeroDivisionError: multi = 1
                sub = 100/multi
            else:
                sub = avgs[crab_index]
                multi = 1
            coords_list = []
            coords_list_record = []
            for i,low_tide in enumerate(data):
                if multiply == 1:
                    sub = 0
                    try:
                        multi = 100/low_tide['totall']
                    except ZeroDivisionError: multi = 1
                    
                elif multiply == 2:
                    try:
                        multi = 100/avgs[crab_index]
                    except ZeroDivisionError: multi = 1
                    sub = 100/multi
                elif multiply == 3:
                    try:
                        multi = 100/avgs[crab_index]
                    except ZeroDivisionError: multi = 1
                    sub = 0
                else:
                    sub = avgs[crab_index]
                    multi = 1

                if visualization_type == 'Percent of selected':
                    coords_list.append([(get_date_num(low_tide['date'])-min(days)*min_mul)*x_scale+40,
                              low_tide['crabs'][crab][0],dot_size])
                elif orginization_type == 'locational':
                    coords = [(locations.index(low_tide['location']))*x_scale+40,
                              ((presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)-sub)*multi*(-1)+y_max)*y_scale+40,3]
                    if coords[:2] in coords_list_record:
                        index = coords_list_record.index(coords[:2])
                        if coords_list[index][2] < 8:
                            coords_list[index][2] += 0.5
                    else:
                        coords_list.append(coords)
                        coords_list_record.append(coords[:2])
                        
                elif graph_type == 'stacked':
                    coords_list.append([(get_date_num(low_tide['date'])-min(days)*min_mul)*x_scale+40,
                              ((presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)*multi+prev_coords[i])*(-1)+y_max)*y_scale+40,dot_size])
                    coords_rec.append(presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)*multi)
                    
                else:
                    if low_tide['crabs'][crab][0]:
                        count += 1
                    coords_list.append([(get_date_num(low_tide['date'])-min(days)*min_mul)*x_scale+40,
                              ((presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)-sub)*multi*(-1)+y_max)*y_scale+40,dot_size])
                if smoothing_type not in ["smoothed low","smoothed med","smoothed high"]:
                    data_coords.append([coords_list[-1],crab,low_tide['location'],low_tide['dateTXT'],low_tide['crabs'][crab][1],low_tide['crabs'][crab][2]])
                    true_coords_rec.append(coords_list[-1][1])
                coords_list[-1].append((t_max-low_tide['temp'])*t_scale+40)

            if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                div = max(sum([factor**(x[0]/x_scale-coords_list[0][0]/x_scale) for n,x in enumerate(coords_list[:14])]),0)
                curent_coords = (coords_list[0][0],sum([x[1]*factor**(x[0]/x_scale-coords_list[0][0]/x_scale) for n,x in enumerate(coords_list[:14])])/div,dot_size,coords_list[0][3])
                data_coords.append([curent_coords,crab,data[0]['location'],data[0]['dateTXT'],data[0]['crabs'][crab][1],data[0]['crabs'][crab][2]])
                true_coords_rec.append(curent_coords[1])
            else:
                curent_coords = coords_list[0]
            #print('')
            for i,coords in enumerate(coords_list[1:]):
                xxx = i
                if smoothing_type in ["smoothed low","smoothed med","smoothed high"]:
                    l = max(0,i-12)
                    h = min(i+15,len(coords_list))
                    m = coords[0]
                    div = max(sum([factor**abs(x[0]/x_scale-m/x_scale) for n,x in enumerate(coords_list[l:h])]),0)
                    new_coords = coords[0],sum([x[1]*factor**abs(x[0]/x_scale-m/x_scale) for n,x in enumerate(coords_list[l:h])])/div,dot_size,coords[3]
                    data_coords.append([new_coords,crab,data[i+1]['location'],data[i+1]['date'],data[i+1]['crabs'][crab][1],data[i+1]['crabs'][crab][2]])
                    true_coords_rec.append(new_coords[1])
                    if new_coords[1] < 0:
                        pass
                        #print(new_coords)
                else:
                    new_coords = coords
                if visualization_type == 'Percent of selected':
                    tides[xxx][crab] = curent_coords
                    if i > len(coords_list)-8:
                        pass
                        #print(tides[i-1][crab])
                elif graph_type == 'line-graph':
                    if temp:
                        self.create_line(([curent_coords[0],curent_coords[3]],[new_coords[0],new_coords[3]]),
                                         fill='#ff0000',width=1)
                    self.create_line((curent_coords[:2],new_coords[:2]),
                                     fill=self.crab_colors[crab],width=2)
                    
                elif graph_type == 'stacked':
                    poly = self.create_polygon(curent_coords[:2],new_coords[:2],
                                    (new_coords[0],prev_true_coords[i+1]),
                                    (curent_coords[0],prev_true_coords[i]),
                                     fill=self.crab_colors[crab],width=2)
                    self.tag_bind(poly, '<Enter>', functools.partial(self.master.display,'',crab,'','',''))
                    self.tag_bind(poly, '<Leave>', functools.partial(self.master.display,'','','','',''))
                    if temp:
                        self.create_line(([curent_coords[0],curent_coords[3]],[new_coords[0],new_coords[3]]),
                                         fill='#ff0000',width=1)
                elif graph_type == 'scatter-plot':
                    self.draw_point(curent_coords[:2],self.crab_colors[crab],curent_coords[2])
                    if temp:
                        self.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2)
                curent_coords = new_coords
                
            if visualization_type == 'Percent of selected':
                tides[-1][crab] = curent_coords
            elif graph_type == 'scatter-plot':
                self.draw_point(curent_coords[:2],self.crab_colors[crab],curent_coords[2])
                if temp:
                    self.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2)
            elif graph_type == 'line-graph':
                #self.create_text(curent_coords[:2],fill=self.crab_colors[crab],
                  #           text=crab)
                  pass
            for i,val in enumerate(coords_rec):
                prev_coords[i] += val
            prev_true_coords = true_coords_rec

        if visualization_type == 'Percent of selected':
            data_coords = []
            totals = []
            for tide in tides:
                total = 0
                for point in tide.values():
                    total += point[1]
                if total == 0:
                    total = 1
                totals.append(total)
            prev_coords = [0 for i in range(len(data))]
            prev_true_coords = [650 for i in range(len(data))]
            for crab_index,crab in enumerate(crabs):
                coords_rec = []
                true_coords_rec = []
                coords = []
                coords_list_record = []
                curent_coords = tides[0][crab][0],(((tides[0][crab][1]+prev_coords[0])*100/totals[0])*(-1)+y_max)*y_scale+40,tides[0][crab][2],tides[0][crab][3]
                coords_rec.append(tides[0][crab][1])
                true_coords_rec.append(curent_coords[1])
                data_coords.append([curent_coords,crab,data[0]['location'],data[0]['dateTXT'],data[0]['crabs'][1],data[0]['crabs'][2]])
                for i,coords in enumerate(tides[1:]):
                    new_coords = coords[crab][0],(((coords[crab][1]+prev_coords[i+1])*100/totals[i+1])*(-1)+y_max)*y_scale+40,coords[crab][2],coords[crab][3]
                    coords_rec.append(coords[crab][1])
                    true_coords_rec.append(new_coords[1])
                    data_coords.append([new_coords,crab,data[i+1]['location'],data[i+1]['dateTXT'],data[i+1]['crabs'][crab][1],data[i+1]['crabs'][crab][2]])
                    if graph_type == 'line-graph':
                        if temp:
                            self.create_line(([curent_coords[0],curent_coords[3]],[new_coords[0],new_coords[3]]),
                                         fill='#ff0000',width=1)
                        self.create_line((curent_coords[:2],new_coords[:2]),
                                         fill=self.crab_colors[crab],width=2)
                        
                    elif graph_type == 'stacked':
                        poly = self.create_polygon(curent_coords[:2],new_coords[:2],
                                        (new_coords[0],prev_true_coords[i+1]),
                                        (curent_coords[0],prev_true_coords[i]),
                                         fill=self.crab_colors[crab],width=2)
                        self.tag_bind(poly, '<Enter>', functools.partial(self.master.display,'',crab,'','',''))
                        self.tag_bind(poly, '<Leave>', functools.partial(self.master.display,'','','','',''))
                        if temp:
                            self.create_line(([curent_coords[0],curent_coords[3]],[new_coords[0],new_coords[3]]),
                                         fill='#ff0000',width=1)
                    elif graph_type == 'scatter-plot':
                        self.draw_point(curent_coords[:2],self.crab_colors[crab],curent_coords[2])
                        if temp:
                            self.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2)
                    curent_coords = new_coords
                    
                if graph_type == 'scatter-plot':
                    self.draw_point(curent_coords[:2],self.crab_colors[crab],curent_coords[2])
                    if temp:
                        self.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2)
                elif graph_type == 'line-graph':
                    self.create_text(curent_coords[:2],fill=self.crab_colors[crab],
                                 text=crab)
                if graph_type == 'stacked':
                    for i,val in enumerate(coords_rec):
                        prev_coords[i] += val
                    prev_true_coords = true_coords_rec
        try: self.data_coords = data_coords,{'multi':multi,'y_max':y_max,\
                                        'y_scale':y_scale}
        except UnboundLocalError: pass

    def generate_svg(self,data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,graph_type,orginization_type,locations,avgs,factor,temp):
        print(len(data))
        print('generate_svg')
        x_scale = 1560/x_max
        if visualization_type == 'Percent':
            multiply = 1
        elif visualization_type == 'Percent relative to average':
            multiply = 2
        elif visualization_type in ['Percent of the way to average','Percent of the way to maximum']:
            multiply = 3
        else:
            multiply = 0
        if y_max == y_min:
            y_min -= y_max/100
        y_scale = 610/(y_max-y_min)
        t_scale = 610/(t_max-t_min)
        print(t_max,t_min,t_scale)
        coord_dict = {}
        location_totals = {}
        
        if orginization_type == 'seasonal':
            min_mul = 0
        else:
            min_mul = 1
            
        if visualization_type == 'Presence-absence':
            do_presence_absence = True
        else:
            do_presence_absence = False
        prev_coords = [0 for i in range(len(data))]
        prev_true_coords = [650 for i in range(len(data))]
        tides = [{} for i in data]
        #print(len(data))
        dot_size=5
        count = 0
        print(len(crabs))
        
        for crab_index,crab in enumerate(crabs):
            
            dwg = svgwrite.Drawing(f'speiceis_svgs/{crab}.svg')
            bin_list = [[0,0]]
            bin_num = int(get_date_num(data[0]['date'])//30.417)
            
            for i,low_tide in enumerate(data):
                quarter = int(get_date_num(low_tide['date'])//30.417)
                if quarter == bin_num:
                    bin_list[-1][0] += low_tide['crabs'][crab][0]
                    bin_list[-1][1] += 1
                else:
                    for j in range(quarter-bin_num):
                        bin_list.append([0,0])
                    bin_num = quarter
                    bin_list[-1][0] += low_tide['crabs'][crab][0]
                    bin_list[-1][1] += 1
                
            for i,bar in enumerate(bin_list):
                width = 10
                if bar[1]:
                    hight = 10*bar[0]/bar[1]
                    dwg.add(dwg.rect((width*i, 400-hight), (width, hight), fill = '#00ff00'))
                else:
                    hight = 100
                    dwg.add(dwg.rect((width*i, 400-hight), (width, hight), fill = '#fd00a0'))
            dwg.save()
            
            

        

    def draw_x_scalebar(self,days,graph_type,orginization_type,locations):
        if orginization_type == 'seasonal':
            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
            days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
            day_separ = 1560/365
            for i,month in enumerate(months):
                self.create_text(sum(days_in_month[:i+1])*day_separ+35,690,text=month)
            return
        
        elif orginization_type == 'locational':
            loc_separ = 1560/(len(locations)-1)
            for i,location in enumerate(locations):
                self.create_text(i*loc_separ+40,690,text=location,font=('Helvetica',12))
            return   
            
        date_exes = (days[-1]-days[0])%9
        date_separ = (days[-1]-days[0])/9
        pix_separ = 1560/9
        curent_x = 30
        curent_date = days[0]

        for i in range(10):
            self.create_text(curent_x,690,text=get_date(int(curent_date)))
            curent_x += pix_separ
            curent_date += date_separ
            
    def draw_y_scalebar(self,y_max,visualization_type,start_val):
        y_range = y_max-start_val
        try:
            y_scale = 610/y_range
        except ZeroDivisionError:
            y_scale = 1
            
        if visualization_type in ('Percent','Percent of selected','Percent relative to average','Percent of the way to average','Percent of the way to maximum'):
            add_string = '%'
        else:
            add_string = ''
        if start_val:
            st_size = max(y_range/10,0.01)
        else:
            st_size = max(round(y_range/10),1)
        i = start_val
        while i < y_max+st_size:
            if abs(i) >= 1000:
                v = int(i)
            else:
                v = round(i,1)
            if v == int(v):
                v = int(v)
            txt = str(v)
            self.create_text((25,(v*(-1)+y_max)*y_scale+40),text=txt\
                             +add_string)
            self.create_line(((40,(v*(-1)+y_max)*y_scale+40),
                              (1600,(v*(-1)+y_max)*y_scale+40)))
            i += st_size
        return y_max,start_val

    def draw_t_scalebar(self,y_max,visualization_type,start_val):
        y_range = y_max-start_val
        try:
            y_scale = 610/y_range
        except ZeroDivisionError:
            y_scale = 1
            
        add_string = ' ºC'
            
        if start_val:
            st_size = max(y_range/10,0.01)
        else:
            st_size = max(round(y_range/10),1)
        i = start_val
        while i < y_max+st_size:
            if abs(i) >= 1000:
                v = int(i)
            else:
                v = round(i,1)
            if v == int(v):
                v = int(v)
            txt = str(v)
            self.create_text((1620,(v*(-1)+y_max)*y_scale+40),text=txt\
                             +add_string)
            i += st_size
        return y_max,start_val

    def handle_motion(self,event):
        if self.graph_type == 'stacked':
            return
        try:
            if len(self.data_coords[0]) == 0:
                if self.graph_type != 'stacked':
                    self.master.display('','','','','')
                return
        except IndexError:
            if self.graph_type != 'stacked':
                self.master.display('','','','','')
            return
        trans_dict = self.data_coords[1]
        min_dist = (30000,30000)
        m = 0
        for i,data_coord in enumerate(self.data_coords[0]):
            if abs(event.x - data_coord[0][0])+abs(event.y - data_coord[0][1])\
               < min_dist[0]+min_dist[1]:
                min_dist = (abs(event.x - data_coord[0][0]),\
                            abs(event.y - data_coord[0][1]),data_coord)
                m = i
        if min_dist[0] < 10 and min_dist[1] < 10:
            '''self.master.display(round(((min_dist[2][0][1]-40)/trans_dict['y_scale']\
                                -trans_dict['y_max'])*(-1)*10)/10,min_dist[2][1]+': ',
                                self.data_coords[0][m][2],self.data_coords[0][m][3],self.data_coords[0][m][4])'''
            self.master.display(self.data_coords[0][m][5],min_dist[2][1]+': ',
                                self.data_coords[0][m][2],self.data_coords[0][m][3],self.data_coords[0][m][4])
        else:
            if self.graph_type != 'stacked':
                self.master.display('','','','','')

    def draw_point(self,coords,color,size):
        self.create_oval(coords[0]-size,coords[1]-size,\
                         coords[0]+size,coords[1]+size,outline=color,fill=color)

        
DataMaster(file_initalization.get_filenames())
