import functools
import itertools
from tkinter import *
from low_tide_files import files
from low_tide_data_procesting import get_data,cleanup
import file_initalization

def get_date_num(date):
#    print(date)
    year = int(date.split('/')[2][-2:])
    month = int(date.split('/')[0])
    day = int(date.split('/')[1])
    days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    return year*365\
           + sum(days_in_month[:month]) + day

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

class DataMaster:
    def __init__(self,files):
        self.root = Tk()
        self.root.title('Data analasys')
        self.frame = CrabVisualizationFrame(self.root,files,self)
        self.frame.grid()

    def reset(self,data):
        self.frame.forget11()
        self.frame.grid_forget()
        self.root.destroy()
        self.root = Tk()
        self.root.title('Data analasys')
        self.frame = CrabVisualizationFrame(self.root,file_initalization.get_filenames(),self,data)
        self.frame.grid()

class CrabVisualizationFrame(Frame):
    
    def __init__(self,master,files,data_master,inital_data=None,file11=None):
        Frame.__init__(self,master)
        self.data_master = data_master
        self.has_canvas = False
        self.is_active = False
        self.is_redrawing = True

        if file11 != None:
            file = file11
        elif inital_data == None:
            file = 0
        else:
            file = inital_data['file']
            
        self.data = cleanup(file_initalization.get_file(files[file]))
        self.file = {"display_name":files[file],'color_dict':file_initalization.get_colors(files[file])}
        self.crabs = list(self.file['color_dict'].keys())
        
        self.selected_file = self.file["display_name"]
        self.file_menu = Menubutton(self,text=self.file["display_name"],relief=RAISED)
        file_selector = Menu(self.file_menu, tearoff = 0)
        for i in range(len(files)):
            file_selector.add_radiobutton(label=files[i],
                    variable=0,command=functools.partial(self.select_file,
                                            files[i],files[i],i))
        file_selector.invoke(file)
        self.file_menu["menu"] = file_selector
        self.file_menu.grid(row=0,column=0)
     
        if inital_data == None:
            year_s = 0
        else:
            year_s = inital_data['year_s']
        if inital_data == None:
            year_e = 1
        else:
            year_e = inital_data['year_e']

        self.year_s_silder = Scale(self, from_=0, to=1,\
                            orient=HORIZONTAL, resolution = 0.01)
        self.year_s_silder.grid(row=0,column=1)
        self.year_s_silder.set(year_s)
        self.year_s_prev = year_s
        
        self.year_e_silder = Scale(self, from_=0, to=1,\
                            orient=HORIZONTAL, resolution = 0.01)
        self.year_e_silder.grid(row=1,column=1)
        self.year_e_silder.set(year_e)
        self.year_e_prev = year_e
        
        self.selected_crabs = []
        self.crab_menu = Menubutton(self,text="No crabs",relief=RAISED)
        self.crab_selector = Menu(self.crab_menu, tearoff = 0)
        for index,label in enumerate(self.crabs):
            self.crab_selector.add_checkbutton(label=label,
                    command=functools.partial(self.select_crab,label))
        self.set_crabs(True)
        self.crab_menu["menu"] = self.crab_selector
        self.crab_menu.grid(row=0,column=2,columnspan=2)
        self.all_crabs_button = Button(self,text='All ' + self.file['display_name'],
                            command=functools.partial(self.set_crabs,True))
        self.no_crabs_button = Button(self,text='No ' + self.file['display_name'],
                            command=functools.partial(self.set_crabs,False))
        self.no_crabs_button.grid(row=1,column=2,sticky=E)
        self.all_crabs_button.grid(row=1,column=3,sticky=W)

        self.mouseover_label = Label(self,text='')
        self.mouseover_label.grid(row=0,column=4)
        self.mouseover_label2 = Label(self,text='')
        self.mouseover_label2.grid(row=1,column=4)
        self.mouseover_label3 = Label(self,text='')
        self.mouseover_label3.grid(row=2,column=4)

        if inital_data == None:
            locations = list(range(len(self.data.keys())))
        else:
            locations = inital_data['locations']
        self.selected_locations = []
        self.location_menu = Menubutton(self,text="White Rock Beach",\
                                        relief=RAISED)
        self.location_selector = Menu(self.location_menu, tearoff = 0)
        for label in self.data.keys():
            self.location_selector.add_checkbutton(label=label,
                    command=functools.partial(self.select_location,label))
        for location in locations:
            self.location_selector.invoke(location)
        self.location_menu["menu"] = self.location_selector
        self.location_menu.grid(row=0,column=5,columnspan=2)
        self.all_locations_button = Button(self,text='All locations',
                            command=functools.partial(self.set_locations,True))
        self.no_locations_button = Button(self,text='No locations',
                            command=functools.partial(self.set_locations,False))
        self.no_locations_button.grid(row=1,column=5,sticky=E)
        self.all_locations_button.grid(row=1,column=6,sticky=W)

        if inital_data == None:
            visualization = 0
        else:
            visualization = inital_data['visualization']
        self.visualizations = ['Numbers','Percent',"inverted"]
        self.selected_visualization = "Numbers"
        self.visualization_menu = Menubutton(self,text="Numbers",relief=RAISED)
        visualization_selector = Menu(self.visualization_menu, tearoff = 0)
        for label in self.visualizations:
            visualization_selector.add_radiobutton(label=label,variable=2,
                    command=functools.partial(self.select_visualization,label))
        visualization_selector.invoke(visualization)
        self.visualization_menu["menu"] = visualization_selector
        self.visualization_menu.grid(row=0,column=7)

        if inital_data == None:
            graph = 0
        else:
            graph = inital_data['graph']
        self.graphs = ["line-graph",'scatter-plot','trend','seasonal']
        self.selected_graph = "line-graph"
        self.graph_menu = Menubutton(self,text="line-graph",relief=RAISED)
        graph_selector = Menu(self.graph_menu, tearoff = 0)
        for label in self.graphs:
            graph_selector.add_radiobutton(label=label,variable=3,
                    command=functools.partial(self.select_graph,label))
        graph_selector.invoke(graph)
        self.graph_menu["menu"] = graph_selector
        self.graph_menu.grid(row=0,column=8)

        file_selector.invoke(file)
        
        self.canvas = GraphCanvas(self,self.data,self.file['color_dict'])
        self.canvas.grid(row=3,column=0,columnspan=9)
        self.has_canvas = True
        self.is_active = True
        self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())
        self.loop()

    def select_year(self,text):
        self.year_menu['text'] = text
        self.selected_year = text
        if self.is_active:
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())

    

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
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())

    def set_locations(self,is_all):
        self.is_redrawing = False
        for location in self.data.keys():
            if (location not in self.selected_locations) == is_all:
                self.location_selector.invoke(list(self.data.keys())\
                                              .index(location))
        self.is_redrawing = True
        if self.is_active:
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())
                

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
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())

    def select_visualization(self,text):
        self.visualization_menu['text'] = text
        self.selected_visualization = text
        if self.is_active:
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())

    def select_graph(self,text):
        self.graph_menu['text'] = text
        self.selected_graph = text
        if self.is_active:
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())

    def select_file(self,file,lable,index):
        if self.has_canvas:
            self.data_master.reset({'file':index,
                    'year_s':self.year_s_silder.get(),
                    'year_e':self.year_e_silder.get(),
                    'locations':[list(self.data.keys()).index(location)\
                                 for location in self.selected_locations],
                    'visualization':self.visualizations.index(\
                        self.selected_visualization),
                    'graph':self.graphs.index(self.selected_graph)})
                    
        else:
            self.file_menu['text'] = lable
       
    def set_crabs(self,is_all):
        self.is_redrawing = False
        for crab in self.crabs:
            if (crab not in self.selected_crabs) == is_all:
                self.crab_selector.invoke(self.crabs.index(crab))

        self.is_redrawing = True
        if self.is_active:
            self.canvas.graph_data(self.selected_locations,self.selected_crabs,\
                               self.selected_visualization,self.selected_graph,\
                               self.year_s_silder.get(),self.year_e_silder.get())
        

    def display(self,val,pre,loc,date):
        try:
            if float(int(val)) == val:
                val = int(val)
        except ValueError: pass
        except IndexError: pass
        if self.selected_visualization == 'Percent' and val != '':
            post = '%'
        else:
            post = ''
        self.mouseover_label['text'] = pre+str(val)+post
        self.mouseover_label2['text'] = loc
        print(date)
        self.mouseover_label3['text'] = date

    def loop(self):
        if self.year_s_prev != self.year_s_silder.get() or\
           self.year_e_prev != self.year_e_silder.get():
            if self.is_active:
                self.canvas.graph_data(self.selected_locations,\
                               self.selected_crabs,self.selected_visualization,\
                               self.selected_graph,self.year_s_silder.get(),\
                               self.year_e_silder.get())
                
        self.year_s_prev = self.year_s_silder.get()
        self.year_e_prev = self.year_e_silder.get()
        
        self.master.after(1, self.loop)

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
        Canvas.__init__(self,master,height=720,width=1460)
        self.data = data
        self.crab_colors = crab_colors
        self.data_coords = []
        self.graph_type = ''
        self.bind('<Motion>', self.handle_motion)

    def graph_data(self,locations,crabs,visualization_type,\
                   graph_type,year_s,year_e):
        self.graph_type = graph_type
        [self.delete(thing) for thing in self.find_all()]
        data = sorted(list(itertools.chain(
            *[self.data[location] for location in locations])),
            key = lambda i: get_date_num(i['date']))
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
        data = [low_tide for low_tide in data if get_date_num(low_tide['date']) in days]
        x_max = len(days)
        
        safe_data = [low_tide for low_tide in data if low_tide['totall'] != 0]
        if visualization_type == 'Percent':                
            try: y_max = max(list(itertools.chain(\
                *[[low_tide['crabs'][crab]*100/low_tide['totall']\
                   for crab in low_tide['crabs'].keys()
                   if crab in crabs]
                  for low_tide in safe_data])))
            except ValueError:
                y_max = 0
                
        else:                
            try: y_max = max(list(itertools.chain(\
                *[[low_tide['crabs'][crab] for crab in low_tide['crabs'].keys()
                   if crab in crabs]
                  for low_tide in safe_data])))
            except ValueError:
                y_max = 0
                
        if y_max == 0:
            y_max = 1

        if graph_type == 'seasonal':
            x_max = 365
            
        try: self.draw_graph(data,x_max,y_max,days,crabs,visualization_type,\
                             graph_type)
        except IndexError:
            pass
        if graph_type != 'trend':
            self.draw_y_scalebar(y_max,visualization_type,0)
        self.draw_x_scalebar(days,graph_type)

    def draw_graph(self,data,x_max,y_max,days,crabs,visualization_type,graph_type):
        x_scale = 1360/x_max
        if visualization_type == 'Percent':
            multiply = True
        else:
            multiply = False
        y_scale = 570/y_max
        self.data_coords = []
        data_coords = []
        coord_dict = {}
        location_totals = {}
        if graph_type == 'seasonal':
            year_mod = 365
        else:
            year_mod = 100000000000000

        if graph_type == 'seasonal':
            min_mul = 0
        else:
            min_mul = 1
    
        for crab_index,crab in enumerate(crabs):
            coords = []
            if multiply:
                try:
                    multi = 100/data[0]['totall']
                except ZeroDivisionError: multi = 1
            else:
                multi = 1
            curent_coords = ((get_date_num(data[0]['date'])%year_mod-min(days)*min_mul)*x_scale+40,
                             (data[0]['crabs'][crab]*multi*(-1)+y_max)*y_scale+80)
            if visualization_type == 'inverted':
                    try:
                        location_totals[get_date_num(data[0]['date'])][data[0]['location']] += data[0]['crabs'][crab]*multi
                    except KeyError:
                        try:
                            location_totals[get_date_num(data[0]['date'])][data[0]['location']] = data[0]['crabs'][crab]*multi
                        except KeyError:
                            location_totals[get_date_num(data[0]['date'])] = {}
                            location_totals[get_date_num(data[0]['date'])][data[0]['location']] = data[0]['crabs'][crab]*multi
            elif graph_type == 'trend':
                coords.append((get_date_num(data[0]['date'])-min(days),data[0]['crabs'][crab]*multi))
            data_coords.append([curent_coords,crab,data[0]['location'],data[0]['date']])

            for low_tide in data[1:]:
                if multiply:
                    try:
                        multi = 100/low_tide['totall']
                    except ZeroDivisionError: multi = 1
                else:
                    multi = 1
                new_coords = ((get_date_num(low_tide['date'])%year_mod-min(days)*min_mul)*x_scale+40,
                              (low_tide['crabs'][crab]*multi*(-1)+y_max)*y_scale+80)
                if visualization_type == 'inverted':
                    try:
                        location_totals[get_date_num(low_tide['date'])][low_tide['location']] += low_tide['crabs'][crab]*multi
                    except KeyError:
                        try:
                            location_totals[get_date_num(low_tide['date'])][low_tide['location']] = low_tide['crabs'][crab]*multi
                        except KeyError:
                            location_totals[get_date_num(low_tide['date'])] = {}
                            location_totals[get_date_num(low_tide['date'])][low_tide['location']] = low_tide['crabs'][crab]*multi
                elif graph_type == 'line-graph':
                    self.create_line((curent_coords,new_coords),
                                     fill=self.crab_colors[crab],width=2)
                elif graph_type in ('scatter-plot','seasonal'):
                    self.draw_point(curent_coords,self.crab_colors[crab],5)
                    
                elif graph_type == 'trend':
                    coords.append((get_date_num(low_tide['date'])-min(days),low_tide['crabs'][crab]*multi))
                curent_coords = new_coords
                data_coords.append([curent_coords,crab,low_tide['location'],low_tide['date']])
            if graph_type in ('scatter-plot','seasonal'):
                self.draw_point(curent_coords,self.crab_colors[crab],5)
            elif graph_type == 'trend':
                coord_dict[crab] = coords
            if graph_type != 'trend':
                self.create_text(curent_coords,fill=self.crab_colors[crab],
                             text=crab)
        try: self.data_coords = data_coords,{'multi':multi,'y_max':y_max,\
                                        'y_scale':y_scale}
        except UnboundLocalError: pass
        if graph_type == 'trend':
            self.draw_trend(coord_dict,self.crab_colors,visualization_type)

        if visualization_type == 'inverted':
            self.draw_inverted()

    def draw_x_scalebar(self,days,graph_type):
        if graph_type == 'seasonal':
            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
            days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]
            day_separ = 1360/365
            for i,month in enumerate(months):
                self.create_text(sum(days_in_month[:i+1])*day_separ+35,700,text=month)
            return
            
        date_exes = (days[-1]-days[0])%9
        date_separ = (days[-1]-days[0])/9
        pix_separ = 1360/9
        curent_x = 30
        curent_date = days[0]

        for i in range(10):
            self.create_text(curent_x,670,text=get_date(int(curent_date)))
            curent_x += pix_separ
            curent_date += date_separ
            
    def draw_y_scalebar(self,y_max,visualization_type,start_val):
        try:
            y_scale = 570/y_max
        except ZeroDivisionError:
            y_scale = 1
            
        if visualization_type == 'Percent':
            add_string = '%'
        else:
            add_string = ''
        for i in range(0,int(y_max+int(y_max/10)),int(y_max/10)+1):
            try:
                txt = str(i+start_val).split('.')[0] + '.' +\
                  str(i+start_val).split('.')[1][:1]
            except IndexError:
                txt = str(i+start_val)
            self.create_text((25,(i*(-1)+y_max)*y_scale+80),text=txt\
                             +add_string)
            self.create_line(((40,(i*(-1)+y_max)*y_scale+80),
                              (1400,(i*(-1)+y_max)*y_scale+80)))

    def handle_motion(self,event):
        if self.graph_type == 'trend':
            self.master.display('','','','')
            return
        try:
            if len(self.data_coords[0]) == 0:
                self.master.display('','','','')
                return
        except IndexError:
            self.master.display('','','','')
            return
        trans_dict = self.data_coords[1]
        min_dist = (30000,30000)
        m = 0
        for i,data_coord in enumerate(self.data_coords[0]):
            if abs(event.x - data_coord[0][0]) < min_dist[0] or\
               abs(event.y - data_coord[0][1]) < min_dist[1]:
                min_dist = (abs(event.x - data_coord[0][0]),\
                            abs(event.y - data_coord[0][1]),data_coord)
                m = i
        if min_dist[0] < 10 and min_dist[1] < 10:
            self.master.display(round(((min_dist[2][0][1]-80)/trans_dict['y_scale']\
                                -trans_dict['y_max'])*(-1)*10)/10,min_dist[2][1]+': ',
                                self.data_coords[0][m][2],self.data_coords[0][m][3])
        else: self.master.display('','','','')

    def draw_point(self,coords,color,size):
        self.create_oval(coords[0]-size,coords[1]-size,\
                         coords[0]+size,coords[1]+size,outline=color,fill=color)

    def draw_trend(self,crab_coords,crab_colors,visualization_type):
        trend_lines = {}
        maxes = []
        mins = []
        
        for crab in crab_coords.keys():
            c1 = []
            c2 = []
            c3 = []
            c4 = []
            x_avg = sum([coord[0] for coord in crab_coords[crab]])/len(crab_coords[crab])
            y_avg = sum([coord[1] for coord in crab_coords[crab]])/len(crab_coords[crab])
            for coord in crab_coords[crab]:
                c1.append(coord[0]-x_avg)
                c2.append(coord[1]-y_avg)
                c3.append(c1[-1]*c2[-1])
                c4.append(c1[-1]**2)

            try:
                slope = sum(c3)/sum(c4)
            except ZeroDivisionError:
                slope = 0
            ofset = y_avg - x_avg*slope
            
            trend_lines[crab] = (ofset,crab_coords[crab][-1][0]*slope+ofset)
            y_max_crab = max(crab_coords[crab][-1][0]*slope+ofset,ofset)
            maxes.append(y_max_crab)
            y_min_crab = min(crab_coords[crab][-1][0]*slope+ofset,ofset)
            mins.append(y_min_crab)
        try:
            y_max = max(maxes)
        except ValueError:
            y_max = 0
        try:
            y_min = min(mins)
        except ValueError:
            y_min = 0
        try:
            y_scale = 570/(y_max-y_min)
        except ZeroDivisionError:
            y_scale = 0.01
        for crab in crab_coords.keys():
            self.create_line(40,(trend_lines[crab][0]-y_min)*(-1)*y_scale+680,\
                1400,((trend_lines[crab][1]-y_min)*(-1)+y_max)*y_scale+80,\
                             fill=crab_colors[crab],width=2)
        self.draw_y_scalebar(y_max-y_min,visualization_type,y_min)

        
DataMaster(file_initalization.get_filenames())
