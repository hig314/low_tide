//Copyright 2026 Katmai McKittrick

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
//documentation files (the “Software”), to deal in the Software without restriction, including without limitation the
//rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
//persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions
//of the Software.

//THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
//WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
//COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
//OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var raw_data = []
var location_data = []
var do_notes = true

function sum(list){
	return list.reduce((a, b) => a + b, 0)
}
function get_date_num(date) {
	//console.log(date)
	let val = Number(date)
	if (!isNaN(val)){
		return val;
	}
    let year = Number(date.split('/')[2].slice(-2 ));
    let month = Number(date.split('/')[0]);
    let day = Number(date.split('/')[1]);
    let days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    return year*365 + sum(days_in_month.slice( 0,month )) + day;
}

function presence_absence(val,display,is_presence_absence) {
    if ( !is_presence_absence ) {
        return val;
    } else if( !display || display === '0' ) {
        return 0;
	} else {
        return 1;
    }

}
function get_date(num) {
    let years = Math.trunc(num/365);
    num %= 365;
    let days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    let days_to_reach = [];
    for (let i = 0; i < 13; i++) {
        days_to_reach.push(sum(days_in_month.slice( 0,i )));
    }
    for( let month_length of days_to_reach.toReversed() ) {
        if( num >= month_length ) {
            var months = (days_to_reach.toReversed().indexOf(month_length)-6)*(-1)+6;
            var days = num - month_length;
            break;
        }
    }
    return String(months)+'/'+String(days)+'/'+String(years);
}

function flatten(items, seqtypes=[list, tuple]) {
    for( let [ i, x ] of items.entries() ) {
        while( i < items.length && seqtypes.some(cls => items[i] instanceof cls)) {
			items.splice(i, 0, ...items[i])
        }
    }
    return items;
}
 class SelectionFrame {
	 constructor(master) {
        this.colors = {};
        this.groups = {};
		this.master = master
		
        this.file_menu = document.getElementById('customs_file_select')
		this.file_menu.addEventListener('change', (event) => this.select_file(event.target.value));
		
		this.submit_button = document.getElementById('submit')
		this.submit_button.addEventListener("click", () => this.submit());
    }
	activate() {
		document.getElementById('custom').classList.remove('hidden');
		document.getElementById('page-overlay').classList.remove('hidden');
        this.files = get_filenames();
        this.colors = {};
        this.groups = {};
		
        //Label(self, text= "groups must either be G which is just not part of any group\n or in the form <type><index>. Type can be
        //\n I which is part of group <index> and also just shows up normaly,\n O is the same but doesn't show up in the menu,
        //\n A,S,B are all for the menu item that is the group,\n A is average, S is sum, B is biodiversity").grid(row=0,column=0)
        for( let file of this.files ) {
            this.colors[file] = get_colors(file);
            this.groups[file] = get_groups(file);
        }
        this.file = this.files[0];
        this.selected = this.files.reduce( ( __map, file ) => ( { ...__map, [file ]: get_names(file).reduce( ( __map, name ) => ( { ...__map, [name ]:[0,this.colors[file][name],this.groups[file][name]] } ), {} ) } ), {} );
        this.speicies = new SpeiciesFrame(this,this.files[0],this.selected[this.files[0]],this.master);

        this.file_menu.innerHTML = ''
        for(let i = 0; i < this.files.length; i++) {
			this.file_menu.add(new Option(this.files[i]))
        }
    }

    select_file(file) {
        let selected = this.speicies.get_selected();
		console.log(selected)
        for( let species of Object.keys(selected[0]) ) {
            this.selected[this.file][species] = [+selected[0][species].checked,selected[1][species].value,selected[2][species].value,selected[3][species]];
        }
		this.speicies.clear()
        this.speicies = new SpeiciesFrame(this,file,this.selected[file],this.master);
        this.file = file;
    }

    submit() {
        let selected = this.speicies.get_selected();
        for( let species of Object.keys(selected[0]) ) {
            this.selected[this.file][species] = [+selected[0][species].checked,selected[1][species].value,selected[2][species].value,selected[3][species]];
        }
		console.log('sdf')
        generate_custom_file(this.selected,document.getElementById('name').value);
		document.getElementById('custom').classList.add('hidden');
		document.getElementById('page-overlay').classList.add('hidden');
		this.speicies.clear()
		this.speicies = null
		document.getElementById('name').value = ''
		this.master.select_custom()
		
    }

}
class SpeiciesFrame {
	 constructor(master,file,selected,root) {
        this.root = root;
        this.names = Object.keys(selected);
		this.holders = []
        this.checkboxes = {};
        this.checkbuttons = [];
        this.color_inputs = {};
        this.color_buttons = {};
        this.group_inputs = {};
        this.types = {};
		this.ind = 0
        for( let [ i,name ] of this.names.entries() ) {
			let elem = 'custom_speiceis'
            //let elem = makeNewElement('custom_speiceis','div',{})
			makeNewElement(elem,'label',{},name)
            this.checkboxes[name] = makeNewElement(elem,'input',{'type':'checkbox'});
			this.checkboxes[name].checked = !!selected[name][0]
            let color = makeNewElement(elem,'input',{'type':'text','maxlength':7,'size':7});
            color.value = selected[name][1];
            this.color_inputs[name] = color;
            this.color_buttons[name] = makeNewElement(elem,'button',{'type':'button','style':`color: ${color.value}; background-color: #ffffff; border-width: 1px; border-radius: 2px;`},'–––––')
			this.color_buttons[name].addEventListener("click", () => this.update_prevew(name));
								
            let group = makeNewElement(elem,'input',{'type':'text','maxlength':4,'size':4});
            group.value = selected[name][2];
            this.group_inputs[name] = group;
            if (selected[name].length > 3) {
                this.types[name] = selected[name][3];
            } else {
                this.types[name] = 'normal';
            }
			this.ind ++
        }

        // this.new_group_button = Button(self, {text: 'Add new group',command: this.make_popup });
//         this.new_group_button.grid( {row: 998,column: 0,columnspan: 5 });
//
        this.no_speicies_button = document.getElementById('customs_deselect');
		this.no_speicies_button.addEventListener("click", () => this.set_speicies(false));
		
        this.all_speicies_button = document.getElementById('customs_select');
		this.all_speicies_button.addEventListener("click", () => this.set_speicies(true));
		
        this.new_group_button = document.getElementById('new_group');
		this.new_group_button.addEventListener("click", () => this.make_popup());
		
        this.group_submit_button = document.getElementById('group_submit');
		this.group_submit_button.addEventListener("click", () => this.add_group());
    }

    set_speicies(set_type) {
        for( let checkbutton of Object.values(this.checkboxes) ) {
            checkbutton.checked = set_type;
        }
    }
    make_popup() {
		document.getElementById('group_name').classList.remove('hidden');
		document.getElementById('page-overlay2').classList.remove('hidden');
        
    }

    add_group() {
		document.getElementById('group_name').classList.add('hidden');
		document.getElementById('page-overlay2').classList.add('hidden');
        let name = document.getElementById('group_name_enter').value;
		let elem = 'custom_speiceis'
        //let elem = makeNewElement('custom_speiceis','div',{})
		makeNewElement(elem,'label',{},name)
        this.checkboxes[name] = makeNewElement(elem,'input',{'type':'checkbox'});
        let color = makeNewElement(elem,'input',{'type':'text','maxlength':7,'size':7});
        color.value = '#000000';
        this.color_inputs[name] = color;
        this.color_buttons[name] = makeNewElement(elem,'button',{'type':'button','style':`color: ${color.value}; background-color: #ffffff; border-width: 1px; border-radius: 2px;`},'–––––')
		this.color_buttons[name].addEventListener("click", () => this.update_prevew(name));
							
        let group = makeNewElement(elem,'input',{'type':'text','maxlength':4,'size':4});
        group.value = 'G';
        this.group_inputs[name] = group;
        this.types[name] = 'group'
		this.ind ++
		document.getElementById('group_name_enter').value = ''
        // Label(self, {text: name }).grid( {row: this.ind,column: 0 });
//         this.checkbuttons.push(Checkbutton(self, {text: '',variable: var }));
//         this.checkbuttons.at(-1).grid( {row: this.ind,column: 1 });
//         this.checkboxes[name] = var;
//         let color = Text(self, {height: 1,width: 7 });
//         color.insert(END,'#000000');
//         color.grid( {row: this.ind,column: 2 });
//         this.color_inputs[name] = color;
//         this.color_buttons[name] = Button(self, {text: '–––––',fg: color.get("1.0",'end-1c'),
//                                     width: 5,bd: 0,font: ['Helvetica',15,'bold'],
//                             command: functools.partial(this.update_prevew,name) });
//         this.color_buttons[name].grid( {row: this.ind,column: 3 });
//
//         let group = Text(self, {height: 1,width: 2 });
//         group.insert(END,'G');
//         group.grid( {row: this.ind,column: 4 });
//         this.group_inputs[name] = group;
//         this.types[name] = 'group';
//         this.ind += 1;
    }

    get_selected() {
        return [this.checkboxes,this.color_inputs,this.group_inputs,this.types];
    }

    update_prevew(name){
		console.log(this.color_inputs[name].value)
        this.color_buttons[name].style.color = this.color_inputs[name].value;
    }
	
	clear(){
		console.log('clear')
		document.getElementById('custom_speiceis').innerHTML = ''
		clearListeners(this.group_submit_button)
		clearListeners(this.new_group_button)
		clearListeners(this.all_speicies_button)
		clearListeners(this.no_speicies_button)
	}
}
class CrabVisualizationFrame {
	
	constructor(inital_data=null) {
        this.has_canvas = false;
        this.is_active = false;
        this.is_redrawing = true;
		this.MDS_download = false
		
		document.onkeydown = (event) => this.keypress(event)

        if( inital_data === null ) {
            this.data_cat = 'Seldovia';
        } else {
            this.data_cat = inital_data['data_cat'];
        }
		if (this.data_cat === 'Seldovia') {
			raw_data = seldovia_raw_data
			do_notes = true
			custom_files = seldovia_custom_files
			location_data = get_loc_data(seldovia_location_data)
		} else if (this.data_cat === 'Coastal studies') {
			raw_data = costal_studies_raw_data
			do_notes = false
			custom_files = costal_studies_custom_files
			location_data = get_loc_data(costal_studies_location_data)
		}
		console.log(location_data)
		document.getElementById('area_select').addEventListener('change', (event) => this.select_area(event.target.value));
		
		let files = get_filenames()
		this.files = files
        this.data_menu = document.getElementById('area_select')
//         data_selector.invoke(this.data_cat);

        if ( inital_data === null ) {
            var file = 0;
		} else {
            var file = inital_data['file'];
        }

        let [data, categories] = cleanup(get_file(files[file]));
		this.data = data
        this.file = {"display_name":files[file],'color_dict':get_colors(files[file]),'sci_names':get_scientific_names(files[file])};
        this.crabs = Object.keys(Object.values(this.data)[0][0]['crabs']);
		
		this.categorie_list = [...new Set(categories.slice().flat())]
		let index = this.categorie_list.indexOf('unknown');
		if (index !== -1) {
			this.categorie_list.splice(index, 1);
			this.categorie_list.push('unknown');
		}
		this.categories = Object.fromEntries(this.categorie_list.map(categorie => [categorie, []]));
		for ( let [ i,crab ] of this.crabs.slice(1).entries() ){
			for ( let categorie of categories[i] ){
				this.categories[categorie].push(crab)
			}
		}
		
        this.selected_file = this.file["display_name"];
        this.file_menu = document.getElementById('file_select')
        for(let i = 0; i < files.length; i++) {
			this.file_menu.add(new Option(files[i]))
        }
		this.file_menu.add(new Option('custom'))
		this.file_menu.selectedIndex = file;
		this.file_menu.addEventListener('change', (event) => this.select_file(event.target.value));

        //Button(self, {text: 'Save customs',command: file_initalization.save_customs }).grid( {row: 0,column: 2 });

        if( inital_data === null ) {
            var year_s = 0;
            var year_e = 1;
        } else {
            var year_s = inital_data['year_s'];
            var year_e = inital_data['year_e'];
        }

        this.year_silder = document.getElementById('date_slider')

		noUiSlider.create( this.year_silder, {
		    start: [year_s, year_e],
		    connect: false,
		    range: {
		        'min': 0,
		        'max': 1
		    },   
			tooltips: true,   
		});

		this.year_silder.noUiSlider.on('update', (values, handle) => {
	  	    this.run_canvas()});

        if( inital_data === null ) {
            var max_s = 0;
            var max_e = 1;
        } else {
            var max_s = inital_data['max_s'];
            var max_e = inital_data['max_e'];
        }

        this.max_silder = document.getElementById('val_slider')

		noUiSlider.create( this.max_silder, {
		    start: [max_s, max_e],
		    connect: false,
		    range: {
		        'min': 0,
		        'max': 1
		    },    
			tooltips: true,  
		});

		this.max_silder.noUiSlider.on('update', (values, handle) => {
	  	    this.run_canvas()});

        if( inital_data === null ) {
            var tide_s = 0;
            var tide_e = -7;
        } else {
            var tide_s = inital_data['tide_s'];
            var tide_e = inital_data['tide_e'];
        }

        this.tide_silder = document.getElementById('tide_slider')

		noUiSlider.create( this.tide_silder, {
		    start: [tide_e,tide_s],
		    connect: false,
		    range: {
		        'min': -7,
		        'max': 0
		    }, 
			tooltips: true,     
		});

		this.tide_silder.noUiSlider.on('update', (values, handle) => {
	  	    this.run_canvas()});
			
		this.options = new MultiselectDropdown(document.getElementById('options_select'), {label: "Options",listener: (selected) => this.select_options(selected), auto_close: false});
		this.options.addOption('requires_stndard','Requires standard group');
		this.options.addOption('temp','Show temparature');
		this.options.addOption('sci_names','Use scientific names');
		this.options.addOption('shapes','Use location shapes in scatter plot');

        this.selected_crabs = [];
        this.crab_menu = new MultiselectDropdown(document.getElementById('speicies_select'), {label: "No crabs",listener: (selected) => this.select_crab(selected)});
		if (this.options.get().includes("sci_names")){
	        for( let [ index,label ] of this.crabs.entries() ) {
	            this.crab_menu.addOption(label,this.file['sci_names'][label]);
	        }
		} else {
	        for( let [ index,label ] of this.crabs.entries() ) {
	            this.crab_menu.addOption(label);
	        }
		}
        
        this.crab_menu.set(this.crabs,[],true);
		
		this.all_crabs_button = document.getElementById('select')
		this.all_crabs_button.addEventListener("click", () => this.crab_menu.set(this.crabs,[],true));
		
		this.no_crabs_button = document.getElementById('deselect')
        this.no_crabs_button.addEventListener("click", () => this.crab_menu.set([],this.crabs,true));

        this.categories_menu = new ButtonDropdown(document.getElementById('category_select'), {label: "Add diets",listener: (cat) => this.select_category(cat) });
		console.log(this.categorie_list)
        for( let label of this.categorie_list ) {
			console.log(label)
            this.categories_menu.addOption(label);
        }

        if( inital_data === null ) {
            var locations = Object.keys(this.data);
        } else {
            var locations = inital_data['locations'];
        }
        this.selected_locations = [];
        this.location_menu = new MultiselectDropdown(document.getElementById('location_select'), {label: "No locations",listener: (selected) => this.select_location(selected)});
        for( let label of Object.keys(this.data) ) {
            this.location_menu.addOption(label);
        }
        this.location_menu.set(locations,[],true)

		this.all_locations_button = document.getElementById('all_locations')
		this.all_locations_button.addEventListener("click", () => this.location_menu.set(Object.keys(this.data),[],true));
		
		this.no_locations_button = document.getElementById('no_locations')
        this.no_locations_button.addEventListener("click", () => this.location_menu.set([],Object.keys(this.data),true));
		
        if( inital_data === null ) {
            var visualization = 0;
        } else {
            var visualization = inital_data['visualization'];
        }
		
        this.selected_visualization = "Numbers";
        this.visualization_menu = document.getElementById('visualization')
		
		this.visualization_menu.addEventListener('change', (event) => this.run_canvas());

        //visualization_selector.invoke(visualization);

        if( inital_data === null ) {
            var smoothing = 0;
        } else {
            var smoothing = inital_data['smoothing'];
        }
        this.selected_smoothing = "Numbers";
        this.smoothing_menu = document.getElementById('smoothing')
		
		this.smoothing_menu.addEventListener('change', (event) => this.run_canvas());

        if( inital_data === null ) {
            var scaling = 0;
        } else {
            var scaling = inital_data['scaling'];
        }
        this.selected_scaling = "Numbers";
        this.scaling_menu = document.getElementById('scaling')
		
		this.scaling_menu.addEventListener('change', (event) => this.run_canvas());

        if( inital_data === null ) {
            var graph = 0;
        } else {
            var graph = inital_data['graph'];
        }
        this.selected_graph = "Numbers";
        this.graph_menu = document.getElementById('graph')
		
		this.graph_menu.addEventListener('change', (event) => this.run_canvas());

        if( inital_data === null ) {
            var orginization = 0;
        } else {
            var orginization = inital_data['orginization'];
        }
        this.selected_orginization = "Numbers";
        this.orginization_menu = document.getElementById('orginaization')
		
		this.orginization_menu.addEventListener('change', (event) => this.run_canvas());

        this.canvas = new GraphCanvas(this,this.data,this.file['color_dict']);
		this.custom_menu = new SelectionFrame(this)

        // this.error = Label(self, {text: '',fg: 'red',font: [default_font.actual(), 16, "bold"] });
        // this.error.grid( {row: 4,column: 0,columnspan: 14 });
        this.has_canvas = true;
        this.is_active = true;
        this.run_canvas();
    }
	
	keypress(event){
	    var key = event.keyCode || event.charCode;
		console.log(key)
		if (key == 18) {
			//this.MDS_download = true
			this.run_canvas()
		}
	}

    run_canvas() {
        if( this.is_active ) {
			let options = this.options.get()
            this.canvas.graph_data(this.location_menu.get(),this.crab_menu.get(),
                               this.visualization_menu.value,this.smoothing_menu.value,this.scaling_menu.value,this.orginization_menu.value,this.graph_menu.value,
                               this.year_silder.noUiSlider.get(true)[0],this.year_silder.noUiSlider.get(true)[1],
                                this.max_silder.noUiSlider.get(true)[0],this.max_silder.noUiSlider.get(true)[1],
                               this.tide_silder.noUiSlider.get(true)[1],this.tide_silder.noUiSlider.get(true)[0],
								options,this.MDS_download);
			this.MDS_download = false
        }
    }
	select_options(options){
		this.is_active = false
		if (options.includes("sci_names")){
	        for( let [ index,label ] of this.crabs.entries() ) {
	            this.crab_menu.updateTitle(label,this.file['sci_names'][label]);
	        }
		} else {
	        for( let [ index,label ] of this.crabs.entries() ) {
	            this.crab_menu.updateTitle(label,label);
	        }
		}
		this.select_crab(this.crab_menu.get())
		this.is_active = true
		this.run_canvas()
	}
    select_crab(crabs) {
        if( crabs.length === 0 ) {
            this.crab_menu.updateLabel('No ' + this.file['display_name']);
        } else if( (crabs.length) === 1 ) {
			if (this.options.get().includes("sci_names")){
		        this.crab_menu.updateLabel(this.file['sci_names'][crabs[0]]);
			} else {
		        this.crab_menu.updateLabel(crabs[0]);
			}
		} else if( (crabs.length) < this.crabs.length ) {
            this.crab_menu.updateLabel('Custom ' + this.file['display_name']);
		} else {
            this.crab_menu.updateLabel('All ' + this.file['display_name']);
        }
        if( this.is_active && this.is_redrawing ) {
            this.run_canvas();
        }
    }

    select_location(selected) {
        if( selected.length === 0 ) {
            this.location_menu.updateLabel('No locations');
        } else if( (selected.length) === 1 ) {
            this.location_menu.updateLabel(selected[0]);
		} else if( (selected.length) < Object.keys(this.data).length ) {
            this.location_menu.updateLabel('Custom locations');
		} else {
            this.location_menu.updateLabel('All locations');
        }
        if( this.is_active && this.is_redrawing ) {
            this.run_canvas();
        }
    }
	
    select_file(file) {
		if (file === 'custom'){
			this.custom_menu.activate()
			return
		}
		this.crab_menu.removeAll()
		this.categories_menu.removeAll()
        let [data, categories] = cleanup(get_file(file));
		this.data = data
        this.file = {"display_name":file,'color_dict':get_colors(file),'sci_names':get_scientific_names(file)};
        this.crabs = Object.keys(Object.values(this.data)[0][0]['crabs']);
		
		this.categorie_list = [...new Set(categories.slice().flat())]
		let index = this.categorie_list.indexOf('unknown');
		if (index !== -1) {
			this.categorie_list.splice(index, 1);
			this.categorie_list.push('unknown');
		}
		this.categories = Object.fromEntries(this.categorie_list.map(categorie => [categorie, []]));
		for ( let [ i,crab ] of this.crabs.slice(1).entries() ){
			for ( let categorie of categories[i] ){
				this.categories[categorie].push(crab)
			}
		}
		
        this.selected_file = this.file["display_name"];
		if (this.options.get().includes("sci_names")){
	        for( let [ index,label ] of this.crabs.entries() ) {
	            this.crab_menu.addOption(label,this.file['sci_names'][label]);
	        }
		} else {
	        for( let [ index,label ] of this.crabs.entries() ) {
	            this.crab_menu.addOption(label);
	        }
		}

        for( let label of this.categorie_list ) {
            this.categories_menu.addOption(label);
        }
		
		this.canvas.update(this.data,this.file['color_dict'])
		let locs = this.location_menu.get()
		this.location_menu.removeAll()
        for( let label of Object.keys(this.data) ) {
            this.location_menu.addOption(label);
        }
		console.log(locs)
        this.location_menu.set(locs,[],false)
        if( locs.length === 0 ) {
            this.location_menu.updateLabel('No locations');
        } else if( (locs.length) === 1 ) {
            this.location_menu.updateLabel(locs[0]);
		} else if( (locs.length) < Object.keys(this.data).length ) {
            this.location_menu.updateLabel('Custom locations');
		} else {
            this.location_menu.updateLabel('All locations');
        }
        this.crab_menu.set(this.crabs,[],true);
    }
	reset(ind){
		let files = get_filenames()
		this.files = files
		
        let file = ind
			
        let [data, categories] = cleanup(get_file(files[file]));
		this.data = data
        this.file = {"display_name":files[file],'color_dict':get_colors(files[file])};
        this.crabs = Object.keys(Object.values(this.data)[0][0]['crabs']);
		
		this.categorie_list = [...new Set(categories.slice().flat())]
		let index = this.categorie_list.indexOf('unknown');
		if (index !== -1) {
			this.categorie_list.splice(index, 1);
			this.categorie_list.push('unknown');
		}
		this.categories = Object.fromEntries(this.categorie_list.map(categorie => [categorie, []]));
		for ( let [ i,crab ] of this.crabs.slice(1).entries() ){
			for ( let categorie of categories[i] ){
				this.categories[categorie].push(crab)
			}
		}
		
        this.selected_file = this.file["display_name"];
        this.file_menu = document.getElementById('file_select')
		this.file_menu.innerHTML = ''
        for(let i = 0; i < files.length; i++) {
			this.file_menu.add(new Option(files[i]))
        }
		this.file_menu.add(new Option('custom'))
		this.file_menu.selectedIndex = file;
		
	}
	select_custom(){
		this.reset(this.files.length)
		this.select_file(this.file['display_name'])
	}
	select_area(area){
		console.log(area)
		this.data_cat = area
		if (this.data_cat === 'Seldovia') {
			raw_data = seldovia_raw_data
			do_notes = true
			custom_files = seldovia_custom_files
			location_data = get_loc_data(seldovia_location_data)
		} else if (this.data_cat === 'Coastal studies') {
			raw_data = costal_studies_raw_data
			do_notes = false
			custom_files = costal_studies_custom_files
			location_data = get_loc_data(costal_studies_location_data)
		}
		this.reset(0)
		this.location_menu.removeAll()
        for( let label of Object.keys(this.data) ) {
            this.location_menu.addOption(label);
        }
        this.location_menu.set(Object.keys(this.data),[],false)
		this.location_menu.updateLabel('All locations');
		this.select_file(this.file['display_name'])
	}
    // select_data_cat(ind) {
//         if( this.has_canvas ) {
//             this.data_master.reset({'file':0,
//                     'year_s':this.year_s_silder.get(),
//                     'year_e':this.year_e_silder.get(),
//                     'max_s':this.max_s_silder.get(),
//                     'max_e':this.max_e_silder.get(),
//                     'tide_s':this.tide_s_silder.get(),
//                     'tide_e':this.tide_e_silder.get(),
//                     'locations': this.selected_locations.map( location =>list(this.data.keys()).index(location) ),
//                     'visualization':this.visualizations.index(\
//                         this.selected_visualization),
//                     'requires_stndard':this.requires_stndard,
//                     'temp':this.temp,
//                     'graph':this.graphs.index(this.selected_graph),
//                     'orginization':this.orginizations.index(this.selected_orginization),
//                     'smoothing':this.smoothings.index(this.selected_smoothing),
//                     'scaling':this.scalings.index(this.selected_scaling),
//                     'data_cat':ind},ind+1);
//         } else {
//             this.data_menu['text'] = ['seldovia','costal studies'][ind];
//         }
//
//     }
    select_category(category) {
        this.crab_menu.set(this.categories[category],[],true)
    }
    display(val,pre,loc,date,notes,event=null) {
        // try {
//             if( float(int(val)) === val ) {
//                 let val = int(val);
//             }
//         } catch( e ) /* ValueError */ {
//             /* /* pass */ */
//         }
//         except IndexError:
//             /* /* pass */ */
        if( this.selected_visualization in ['Percent','Percent of selected','Percent relative to average','Percent of the way to average'] && val !== '' ) {
            var post = '%';
        } else {
            var post = '';
        }
        if( notes !== '' ) {
            var post2 = ', ';
        } else {
            var post2 = '';
        }
		if (!val && !pre && !loc && !date && !notes ){
			document.getElementById("mouseover_container").style.display = "none";
		} else {
			document.getElementById("mouseover_container").style.display = "flex";
		}
        document.getElementById("mouseover0").innerHTML = pre+String(val)+post+post2+notes;
        document.getElementById("mouseover1").innerHTML = loc;
        document.getElementById("mouseover2").innerHTML = date;
    }
//
    display_error(txt) {
        document.getElementById("error").innerHTML = txt;
    }

    update_point_count(count) {
        document.getElementById("surveys").innerHTML = `${count} surveys`;
    }

}
 class GraphCanvas {

    constructor(master,data,crab_colors) {
		let page_width = document.documentElement.clientWidth;
		this.master = master
		this.x_size = page_width-200
		this.y_size = 600
		this.padding = 50
		this.y_extra = 90
	    this.draw = SVG().addTo('#canvas').size( page_width, this.y_size+this.y_extra);
	    this.draw.attr({
	        'shape-rendering':'crispEdges'
	    });
        this.data = data;
        this.crab_colors = crab_colors;
        this.data_coords = [];
        this.orginization_type = '';
        this.graph_type = '';
		this.stuff = []
		document.getElementById("canvas").addEventListener('mousemove', (e) => {
			e.stopPropagation();
			let rect = e.currentTarget.getBoundingClientRect();

			let x = e.clientX - rect.left;
			let y = e.clientY - rect.top;
			this.handle_motion(x,y)
		});
		window.addEventListener('mousemove', (e) => {
			this.master.display('','','','','') 
		});
    }

	update(data,crab_colors){
        this.data = data;
        this.crab_colors = crab_colors;
	}

    graph_data(locations,crabs,visualization_type,smoothing_type,scaling_type,orginization_type,graph_type,year_s,year_e,max_s,max_e,tide_s,tide_e,options,MDS_download) {
		console.log(MDS_download)
		let page_width = document.documentElement.clientWidth;
		this.x_size = page_width-200
		this.draw.size(page_width,this.y_size+this.y_extra)
        let error = false;
        if( orginization_type === 'Locational' ) {
            if( smoothing_type !== 'No smoothing' ) {
                this.master.display_error('Cannot smooth while in locational');
                error = true;
            }
            if( graph_type !== 'Scatter-plot' ) {
                this.master.display_error('Must use scatter plot while in locational');
                error = true;
            }
			if (locations.length === 1){
				this.master.display_error('Locational requires multiple locations');
				error = true;
			}
        }
		else if ( graph_type === 'Stacked' ){
            if( visualization_type === 'Relative to average' ) {
                this.master.display_error('Cannot stack while in relative to average');
                error = true;
            }
            if( visualization_type === 'Percent relative to average' ) {
                this.master.display_error('Cannot stack while in percent relative to average');
                error = true;
            }
		}
		if ( crabs.includes('biodiversity') ){
            if( visualization_type === 'Percent' ) {
                this.master.display_error('Biodiversity is meaningles while in percent');
                error = true;
            }
            if( visualization_type === 'Percent of selected' ) {
                this.master.display_error('Biodiversity is meaningles while in percent of selected');
                error = true;
            }
		}
		if (["Month bins","3-month bins","Year bins"].includes(smoothing_type)){
			if (options.includes("shapes") && graph_type === 'Scatter-plot'){
				this.master.display_error("Location shapes don't work with bining");
				error = true;
			}
		}
        if( !error ) {
            this.master.display_error('');
        }
        let data = structuredClone(this.data);
        this.graph_type = graph_type;
        this.orginization_type = orginization_type;
 	    this.draw.clear()
        data = locations.map(loc =>data[loc]).flat();
		data.sort((a,b) => get_date_num(a['date'])-get_date_num(b['date']))
        if( options.includes("requires_stndard") ) {
            data = data.filter( low_tide => low_tide['is_standard'] );
        }
        let set_days = true;
		let data_range
        if (data.length) {
            data_range = get_date_num(data.at(-1)['date'])-get_date_num(data[0]['date']);
        } else {
            data_range = 0;
            set_days = false;
        }
		let days
        if( set_days ) {
            days = range(Math.trunc(get_date_num(data[0]['date'])+year_s*data_range),Math.trunc(get_date_num(data[0]['date'])+year_e*data_range+1));
        } else {
            days = [0];
        }
        if( days.length === 0 ) {
            days = [0];
        }
        data = structuredClone(data.filter( low_tide => days.includes(get_date_num(low_tide['date'])) && low_tide['tide'] < tide_s && low_tide['tide'] > tide_e ));
		
		this.organize(data,orginization_type,locations)
		
        //let dupe_dict = {};
        // for( let [ i,low_tide ] of data.entries() ) {
//             let date = low_tide['date'];
//
//             dupe_dict[date] ??= [];
//             dupe_dict[date].push(i);
//         }
//         for( let date of Object.keys(dupe_dict) ) {
//             for( let [ i,index ] of dupe_dict[date].entries() ) {
//
//                 data[index]['date'] = parseInt(date)+i*0.001;
//             }
//         }
        data.sort((a,b) => get_date_num(a['date'])-get_date_num(b['date']))
        if( data.length === 0 ) {
			console.log('no data')
            return;
        }
        let speicies_list = Object.keys(data[0]['crabs']);
		
        for( let low_tide of data ) {
            for( let speicies of speicies_list ) {
                if( scaling_type === 'square root' ) {
                    low_tide['crabs'][speicies][0] = Math.sqrt(low_tide['crabs'][speicies][0]);
                } else if( scaling_type === 'Logarithmic' ) {
                    low_tide['crabs'][speicies][0] = Math.log2(low_tide['crabs'][speicies][0]+1);
}
            }
        }
        let x_max 
		if ( orginization_type === 'Standard' ){
			x_max = days.length;
		} else if( orginization_type === 'Seasonal' ) {
            x_max = 365;
        } else if( orginization_type === 'Locational' ) {
            x_max = locations.length-1;
		}
        let safe_data = data.filter( low_tide => low_tide['totall'] !== 0 );
        let safe_indexes = data.entries().filter( ( [ i,low_tide ] ) => low_tide['totall'] !== 0 ).map( ( [ i,low_tide ] ) =>i );
        if( !safe_data.length ) {
			console.log('no safe')
            return;
        }
		
		let li = this.run_viz(data, visualization_type, crabs)
		
		let d = 0;
		if ( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type)){
	        let k;
			let r;
	        if ( smoothing_type === "Smoothed low" ) {
	            k = 40;
				r = 86
	        } else if( smoothing_type === "Smoothed medium" ) {
	            k = 70;
				r = 20
			}
	 		else if( smoothing_type === "Smoothed high" ) {
	            k = 100;
				r = 26
			}
	        if ( orginization_type === 'Seasonal' ) {
	            k /= 10;
	        }
			this.smooth(li,data,k,r)
		} else if (["Month bins","3-month bins","Year bins"].includes(smoothing_type)){
	        if ( smoothing_type === "Month bins" ) {
	            d = 30.436875
	        } else if( smoothing_type === "3-month bins" ) {
	            d = 91.310625
			}
	 		else if( smoothing_type === "Year bins" ) {
	            d = 365.2425
			}
			[li,data] = this.bin(li,data,d)
			console.log(structuredClone(data))
			console.log(structuredClone(li))
		}
        
		
		if (MDS_download){
	        this.download_MDS(data,li,crabs);
		}
		
        this.draw_graph(data,li,x_max,max_s,max_e,days,crabs,visualization_type,smoothing_type,
                         graph_type,orginization_type,locations,options,d);
        this.draw_x_scalebar(days,graph_type,orginization_type,locations);
        let do_svg = false;
		
    }
	
	organize(data,orginization_type,locations){
        if( orginization_type === 'Standard' ) {
            for( let [ i,low_tide ] of data.entries() ) {
                low_tide['date'] = get_date_num(low_tide['date']);
            }
        } else if( orginization_type === 'Seasonal' ) {
            for( let [ i,low_tide ] of data.entries() ) {
                low_tide['date'] = get_date_num(low_tide['date'])%365;
            }
        } else if( orginization_type === 'Locational' ) {
            for( let [ i,low_tide ] of data.entries() ) {
                low_tide['date'] = locations.indexOf(low_tide['location']);
            }
        }
	}
	
	run_viz(data,visualization_type,crabs){
        let lii = data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
        let li = [];
        for( let i of range(lii[0].length) ) {
            li.push( lii.map( x =>x[i] ));
        }
        if( !li.length ) {
			console.log('no species')
            return;
        }
		if ( ['Relative to average','Percent relative to average','Percent of the way to average'].includes(visualization_type) ) {
			var avgs = range(crabs.length).map( i => Math.max(sum(li[i])/li[i].length,0.000001));
		}
		if (['Percent of the way to maximum'].includes(visualization_type)){
			var maxes = range(crabs.length).map( i => Math.max(...li[i],1));
		}
		if (['Percent of selected'].includes(visualization_type)){
			var selected_totals = range(li[0].length).map( i => sum(li.map( l => l[i] )));
		}
		if ( visualization_type === 'Numbers' ) {
			
		} else if( visualization_type === 'Percent' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
					if (data[j]['totall']){
						li[i][j] *= 100/data[j]['totall']
					}
		        }
	        }
	        
        } else if( visualization_type === 'Relative to average' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
		        	li[i][j] -= avgs[i]
		        }
	        }
		} else if( visualization_type === 'Percent relative to average' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
		        	li[i][j] = (li[i][j]/avgs[i]-1)*100
		        }
	        }
		} else if( visualization_type === 'Percent of the way to average' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
		        	li[i][j] = (li[i][j]/avgs[i])*100
		        }
	        }
		} else if( visualization_type === 'Percent of the way to maximum' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
		        	li[i][j] = (li[i][j]/maxes[i])*100
		        }
	        }
		} else if( visualization_type === 'Percent of selected' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
					if (selected_totals[j]){
						li[i][j] = (li[i][j]/selected_totals[j])*100
					}
		        }
	        }
		} else if( visualization_type === 'Presence-absence' ) {
	        for ( let i of range(li.length) ) {
		        for ( let j of range(data.length) ) {
		        	li[i][j] = presence_absence(0,data[j]['crabs'][crabs[i]][2],true)
		        }
	        }
		}
		return li
	}
	
	smooth(li,data,k,r){
		console.log(sum(li[0]))
		function falloff(d,k){
			return (k/(k+1))**d
		}
		let lock = 0
		let li_save = structuredClone(li)
		for (let i = 0; i < li_save.length; i++){
			for (let j = 0; j < li_save[i].length; j++){
				li[i][j] *= lock
			}
		}
		for (let i = 0; i < li_save.length; i++){
			for (let j = 0; j < li_save[i].length; j++){
				let s = -Math.min(r,j)
				let e = Math.min(r,li_save[i].length-j-1)
				let mult = 0
				for (let d = s; d <= e; d++){
					mult += falloff(Math.abs(data[j]['date']-data[j+d]['date']),k)
				}
				for (let d = s; d <= e; d++){
					//li[i][j+d] += li_save[i][j]*(1-lock)*falloff(Math.abs(data[j]['date']-data[j+d]['date']),k)/mult
					
					li[i][j] += li_save[i][j+d]*(1-lock)*falloff(Math.abs(data[j]['date']-data[j+d]['date']),k)/mult
				}
			}
		}
		console.log(sum(li[0]))
		
	}
	bin(li,data,d){
		console.log(data)
		let data_n = []
		let li_n = []
		for (let i = 0; i < li.length; i++){
			li_n.push([])
			let bin_num = ~~(data[0]['date']/d);
			let bin_end = (bin_num+1)*d
			li_n[i].push([0,0])
			for (let j = 0; j < li[i].length; j++){
				if (data[j]['date'] >= bin_end){
					if (!i){
						data_n.push(structuredClone(data[j]))
						data_n.at(-1)['date'] = Math.round((bin_num+0.5)*d)
						data_n.at(-1)['dateTXT'] = get_date(Math.floor((bin_num)*d)) + '-' + get_date(Math.floor((bin_num+1)*d))
						data_n.at(-1)['location'] = `${li_n[i].at(-1)[1]} surveys`
					}
					li_n[i][li_n[i].length-1] = li_n[i].at(-1)[0]/li_n[i].at(-1)[1]
					bin_num = ~~(data[j]['date']/d);
					bin_end = (bin_num+1)*d
					li_n[i].push([0,0])
				}
				li_n[i][li_n[i].length-1][0] += li[i][j]
				li_n[i][li_n[i].length-1][1] += 1
			}
			if (!i){
				data_n.push(structuredClone(data.at(-1)))
				data_n.at(-1)['date'] = Math.round((bin_num+0.5)*d)
				data_n.at(-1)['dateTXT'] = get_date(Math.floor((bin_num)*d)) + '-' + get_date(Math.floor((bin_num+1)*d))
				data_n.at(-1)['location'] = `${li_n[i].at(-1)[1]} surveys`
			}
			li_n[i][li_n[i].length-1] = li_n[i].at(-1)[0]/li_n[i].at(-1)[1]
		}
		console.log(structuredClone(data_n))
		console.log(structuredClone(li_n))
		return [li_n,data_n]
	}
	
	do_graph_changes(li,graph_type){
		if (graph_type == 'Stacked'){
			for (let i = 1; i < li.length; i++){
				for (let j = 0; j < li[i].length; j++){
					li[i][j] += li[i-1][j]
				}
			}
		}
		
	}

    draw_graph(data,li,x_max,max_s,max_e,days,crabs,visualization_type,smoothing_type,graph_type,orginization_type,locations,options,d) {
		console.log(data)
		this.master.update_point_count(data.length);
		let li_save = structuredClone(li)
		this.do_graph_changes(li,graph_type)
        let t_max = Math.max(...data.map( low_tide =>low_tide['temp'] ));
        let t_min = Math.min(...data.map( low_tide =>low_tide['temp'] ));
		
        let y_max = Math.max(...li.map( sub => Math.max(...sub) ));
		let y_min = 0
		if (visualization_type == 'Percent of selected'){
			y_max = 100
		}
		if (['Relative to average','Percent relative to average'].includes(visualization_type)){
			y_min = -y_max
		}
        y_min += (y_max-y_min)*max_s;
        y_max *= max_e;
        if( y_max-y_min <= 0 ) {
            return;
        }
		y_max,y_min = this.draw_y_scalebar(y_max,visualization_type,y_min);
        let x_scale = this.x_size/x_max;
        let y_scale = this.y_size/(y_max-y_min);
        let t_scale = this.y_size/(t_max-t_min);
		
		let min_mul
        if ( ['Seasonal','Locational'].includes(orginization_type) ) {
            min_mul = 0;
        } else {
            min_mul = 1;
        }
        this.data_coords = [];
        let data_coords = [];
		let dot_size = 5
		if (orginization_type === 'Locational'){
			dot_size = 3
		}
		let li_new = []
		console.log(data)
		for (let i = 0; i < li.length; i++){
			let save = []
			li_new.push([])
			for (let j = 0; j < li[i].length; j++){
				if (d && graph_type !== 'Scatter-plot'){
					li_new[i].push([(Math.max(get_date_num(data[j]['date'])-Math.min(...days)*min_mul-d/2,0))*x_scale+this.padding+10,
							(y_max-li[i][j])*y_scale+40,dot_size,(t_max-data[j]['temp'])*t_scale+40,1])
					li_new[i].push([(Math.min(get_date_num(data[j]['date'])-Math.min(...days)*min_mul+d/2,x_max))*x_scale+this.padding+10,
							(y_max-li[i][j])*y_scale+40,dot_size,(t_max-data[j]['temp'])*t_scale+40,1])
				} else {
					li_new[i].push([(get_date_num(data[j]['date'])-Math.min(...days)*min_mul)*x_scale+this.padding+10,
							(y_max-li[i][j])*y_scale+40,dot_size,(t_max-data[j]['temp'])*t_scale+40,1])
				}
				
				if (orginization_type === 'Locational'){
					if (arrayIncludes(save,li_new[i][j].slice( 0,2 ))){
						li_new[i][j][2] = Math.min(li_new[i][arrayLastIndex(save,li_new[i][j].slice( 0,2 ))][2]+0.5,8)
						li_new[i][j][4] = li_new[i][arrayLastIndex(save,li_new[i][j].slice( 0,2 ))][4]+1
					}
					save.push(li_new[i][j].slice( 0,2 ))
					data_coords.push([li_new[i][j],crabs[i],data[j]['location'],li_new[i][j][4],data[j]['crabs'][crabs[i]][1],data[j]['crabs'][crabs[i]][2],0]);
				} else {
					if (d){
						let p = 2
						if (graph_type !== 'Scatter-plot'){
							data_coords.push([li_new[i][j*2],crabs[i],data[j]['location'],data[j]['dateTXT'],'',`avg ${li_save[i][j].toFixed(p)}`,li_new[i][j*2+1][0]-li_new[i][j*2][0]]);
						} else {
							data_coords.push([li_new[i][j],crabs[i],data[j]['location'],data[j]['dateTXT'],'',`avg ${li_save[i][j].toFixed(p)}`,0]);
						}
						
					} else {
						data_coords.push([li_new[i][j],crabs[i],data[j]['location'],data[j]['dateTXT'],data[j]['crabs'][crabs[i]][1],data[j]['crabs'][crabs[i]][2],0]);
					}
					
				}
				
			}
		}
		let data_coords_t = structuredClone(data_coords)
		console.log(li_new)
		for (let i = 0; i < li_new.length; i++){
			let crab = crabs[i]
			if ( graph_type === 'Scatter-plot' ) {
				if (options.includes("shapes")){
					this.draw.path(location_data[data[0]['location']]['shape']).attr({
					            'fill':this.crab_colors[crab],
					            'shape-rendering':'crispEdges',
					            'stroke-width': 0
					        }).scale(li_new[i][0][2],0,0).translate(li_new[i][0][0],li_new[i][0][1]); //
				} else {
					this.draw_point(li_new[i][0].slice( 0,2 ),this.crab_colors[crab],li_new[i][0][2]); //
				}
                if( options.includes("temp") ) {
                    this.draw_point([li_new[i][0][0],li_new[i][0][3]],'#ff0000',li_new[i][0][2]/2);
                }
			}
			for (let j = 1; j < li_new[i].length; j++){
				if ( graph_type === 'Line-graph') {
					if (!d || j%2){
		                if ( options.includes("temp") ) {
		                    this.draw.line(li_new[i][j-1][0],li_new[i][j-1][3],li_new[i][j][0],li_new[i][j][3]).stroke({color: '#ff0000',width: 1 });
		                }
		                this.draw.line(...li_new[i][j-1].slice( 0,2 ),...li_new[i][j].slice( 0,2 )).stroke({color: this.crab_colors[crab],width: 2 });
					}
	                
				} else if( graph_type === 'Stacked' ) {
					if (!d || j%2){
						if (i === 0){
							var prev = [y_max*y_scale+40,y_max*y_scale+40]
						}
						else {
							var prev = [li_new[i-1][j-1][1],li_new[i-1][j][1]]
						}
						let gaps = 0.1
		                let poly = this.draw.polygon(`${li_new[i][j-1][0]+gaps/2},${li_new[i][j-1][1]} ${li_new[i][j][0]-gaps/2},${li_new[i][j][1]} ${li_new[i][j][0]-gaps/2},${prev[1]} ${li_new[i][j-1][0]+gaps/2},${prev[0]}`).attr({
					            'fill':this.crab_colors[crab],
					            'shape-rendering':'crispEdges',
					            'stroke-width': 0
					        });
						if (d){
							poly.on('mouseover', (event) => {
								this.master.display(data_coords[(j-1)/2+i*li[i].length][5],data_coords[(j-1)/2+i*li[i].length][1]+': ',
		                    			data_coords[(j-1)/2+i*li[i].length][2],data_coords[(j-1)/2+i*li[i].length][3],data_coords[(j-1)/2+i*li[i].length][4]);
							})
						} else {
							poly.on('mouseover', (event) => {
								this.master.display('',crab,'','','')
							})
						}
						
						poly.on('mouseout', (event) => {
							this.master.display('','','','','') 
						})
		                if( options.includes("temp") ) {
		                    this.draw.line(li_new[i][j-1][0],li_new[i][j-1][3],li_new[i][j][0],li_new[i][j][3]).stroke({color: '#ff0000',width: 1 });
		                }
					} else if (li_new[i][j][0]-li_new[i][j-1][0] > 1) {
		                let poly = this.draw.polygon(`${li_new[i][j-1][0]},0 ${li_new[i][j][0]},0 ${li_new[i][j][0]},${this.y_size+40} ${li_new[i][j-1][0]},${this.y_size+40}`).attr({
					            'fill':'#dddddd',
								'fill-opacity': 0.04,
					            'shape-rendering':'crispEdges',
					            'stroke-width': 0
					        });
						poly.on('mouseover', (event) => {
							this.master.display('','No data','','','')
						})
						
						poly.on('mouseout', (event) => {
							this.master.display('','','','','') 
						})
					}
				} else if( graph_type === 'Scatter-plot' ) {
					if (options.includes("shapes")){
						this.draw.path(location_data[data[j]['location']]['shape']).attr({
						            'fill':this.crab_colors[crab],
						            'shape-rendering':'crispEdges',
						            'stroke-width': 0
						        }).scale(li_new[i][j][2],0,0).translate(li_new[i][j][0],li_new[i][j][1]); //
					} else {
						this.draw_point(li_new[i][j].slice( 0,2 ),this.crab_colors[crab],li_new[i][j][2]); //
					}
	                if( options.includes("temp") ) {
	                    this.draw_point([li_new[i][j][0],li_new[i][j][3]],'#ff0000',li_new[i][j][2]/2);
	                }
				}
			}
		}
		data_coords_t.reverse()
 		this.data_coords = [data_coords_t,{'y_max':y_max,'y_scale':y_scale,'orginization_type':orginization_type,'d':d}];

    }
    download_MDS(data,li,crabs) {
		let MDS_data = []
		console.log(location_data)
		for (let i = 0; i < data.length; i++){
			MDS_data.push([[],'#' + location_data[data[i]['location']]['color']])
			for (let j = 0; j < crabs.length; j++){
				MDS_data[i][0].push(li[j][i])
			}
		}
		var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(MDS_data));
		var dlAnchorElem = document.getElementById('downloadAnchorElem');
		dlAnchorElem.setAttribute("href",     dataStr     );
		dlAnchorElem.setAttribute("download", "MDS.json");
		dlAnchorElem.click();
    }
    // generate_svg(data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,graph_type,orginization_type,locations,avgs,factor,temp) {
//         let x_scale = 1560/x_max;
//         if( visualization_type === 'Percent' ) {
//             let multiply = 1;
//         } else if( visualization_type === 'Percent relative to average' ) {
//             multiply = 2;
// } else if( visualization_type in ['Percent of the way to average','Percent of the way to maximum'] ) {
//             multiply = 3;
// } else {
//             multiply = 0;
//         }
//         if( y_max === y_min ) {
//             y_min -= y_max/100;
//         }
//         let y_scale = 610/(y_max-y_min);
//         let t_scale = 610/(t_max-t_min);
//         console.log[t_max,t_min,t_scale];
//         let coord_dict = {};
//         let location_totals = {};
//
//         if( orginization_type === 'seasonal' ) {
//             let min_mul = 0;
//         } else {
//             min_mul = 1;
//         }
//
//         if( visualization_type === 'Presence-absence' ) {
//             let do_presence_absence = true;
//         } else {
//             do_presence_absence = false;
//         }
//         let prev_coords = range(data.length).map( i =>0 );
//         let prev_true_coords = range(data.length).map( i =>650 );
//         let tides = data.map( i =>{} );
//         //print(data.length)
//         let dot_size=5;
//         let count = 0;
//         console.log(len(crabs));
//
//         for( let [ crab_index,crab ] of crabs.entries() ) {
//
//             let dwg = svgwrite.Drawing(f'speiceis_svgs/{crab}.svg');
//             let bin_list = [[0,0]];
//             let bin_num = int(get_date_num(data[0]['date'])//30.417);
//
//             for( let [ i,low_tide ] of enumerate(data) ) {
//                 let quarter = int(get_date_num(low_tide['date'])//30.417);
//                 if( quarter === bin_num ) {
//                     bin_list.at(-1)[0] += low_tide['crabs'][crab][0];
//                     bin_list.at(-1)[1] += 1;
//                 } else {
//                     for( let j of range(quarter-bin_num) ) {
//                         bin_list.push([0,0]);
//                     }
//                     bin_num = quarter;
//                     bin_list.at(-1)[0] += low_tide['crabs'][crab][0];
//                     bin_list.at(-1)[1] += 1;
//                 }
//
//             }
//             for( let [ i,bar ] of enumerate(bin_list) ) {
//                 let width = 10;
//                 if( bar[1] ) {
//                     let hight = 10*bar[0]/bar[1];
//                     dwg.add(dwg.rect([width*i, 400-hight], [width, hight], { fill: '#00ff00' }));
//                 } else {
//                     hight = 100;
//                     dwg.add(dwg.rect([width*i, 400-hight], [width, hight], { fill: '#fd00a0' }));
//                 }
//             }
//             dwg.save();
//         }
//
//     }
    draw_x_scalebar(days,graph_type,orginization_type,locations) {
        if( orginization_type === 'Seasonal' ) {
            let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ];
            let days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31];
            let day_separ = this.x_size/365;
            for( let [ i,month ] of months.entries() ) {
				this.draw.text(month).font({ family: 'helvetica',  size: 14  }).attr({ 'text-anchor': 'middle', 'dominant-baseline': 'hanging' }).amove(sum(days_in_month.slice( 0,i+1 ))*day_separ+this.padding+5,this.y_size+40);
            }
            return;
        } else if( orginization_type === 'Locational' ) {
            let loc_separ = this.x_size/(locations.length-1);
            for( let [ i,location ] of locations.entries() ) {
				this.draw.text(location).attr({ 'text-anchor': 'middle', 'dominant-baseline': 'hanging' }).amove(i*loc_separ+this.padding+10,this.y_size+40).font({ family: 'helvetica',  size: 14  });
            }
            return;
}

        let date_exes = (days.at(-1)-days[0])%9;
        let date_separ = (days.at(-1)-days[0])/9;
        let pix_separ = this.x_size/9;
        let curent_x = this.padding-10;
        let curent_date = days[0];

        for( let i of range(10) ) {
			this.draw.text(get_date(parseInt(curent_date))).amove(curent_x,this.y_size+40).font({ family: 'helvetica',  size: 14  });
            curent_x += pix_separ;
            curent_date += date_separ;
        }

    }
    draw_y_scalebar(y_max,visualization_type,start_val) {
        let y_range = y_max-start_val;
        if (y_range) {
            var y_scale = this.y_size/y_range;
        } else {
            var y_scale = 1;
        }

        if( ['Percent','Percent of selected','Percent relative to average','Percent of the way to average','Percent of the way to maximum'].includes(visualization_type) ) {
            var add_string = '%';
        } else {
            var add_string = '';
        }
        if( start_val ) {
            var st_size = Math.max(y_range/10,0.01);
        } else {
            var st_size = Math.max(Math.round(y_range/10),1);
        }
        let i = start_val;
        while( i < y_max+st_size ) {
            if( Math.abs(i) >= 1000 ) {
                var v = Math.trunc(i);
            } else {
                var v = Math.round(i);
            }
            let txt = String(v);
			this.draw.text(txt+add_string).attr({
    			'text-anchor': 'end',
    			'dominant-baseline': 'central'
  		    	}).amove(this.padding,(v*(-1)+y_max)*y_scale+21).font({ family: 'helvetica',  size: 14  });
            this.draw.line(this.padding+10,(v*(-1)+y_max)*y_scale+40,this.x_size+this.padding+10,(v*(-1)+y_max)*y_scale+40).stroke({color: '#000000',width: 1 });
            i += st_size;
        }
        return y_max,start_val;
    }
//
//     draw_t_scalebar(y_max,visualization_type,start_val) {
//         let y_range = y_max-start_val;
//         try {
//             let y_scale = 610/y_range;
//         } catch( e ) /* ZeroDivisionError */ {
//             y_scale = 1;
//         }
//
//         let add_string = ' ºC';
//
//         if( start_val ) {
//             let st_size = max(y_range/10,0.01);
//         } else {
//             st_size = max(round(y_range/10),1);
//         }
//         let i = start_val;
//         while( i < y_max+st_size ) {
//             if( abs(i) >= 1000 ) {
//                 let v = int(i);
//             } else {
//                 v = round(i,1);
//             }
//             if( v === int(v) ) {
//                 v = int(v);
//             }
//             let txt = str(v);
//             this.create_text([1620,(v*(-1)+y_max)*y_scale+40], {text: txt\
//                              +add_string });
//             i += st_size;
//         }
//         return y_max,start_val;
//     }

    handle_motion(x,y) {
        if( this.graph_type === 'Stacked' ) {
            return;
        }
        if (this.data_coords.length) {
            if( this.data_coords[0].length === 0 ) {
                this.master.display('','','','','');
                return;
            }
        } else {
            if( this.graph_type !== 'Stacked' ) {
                this.master.display('','','','','');
            }
            return;
        }
        let trans_dict = this.data_coords[1];
        let min_dist = [30000,30000];
        let m = 0;
	
        for( let [ i,data_coord ] of this.data_coords[0].entries() ) {
			if (trans_dict['d']){
	            if( (Math.abs(x - data_coord[0][0]+10)+Math.abs(x - (data_coord[0][0]+data_coord[6]) + 10)-data_coord[6])/2+Math.abs(y - data_coord[0][1]-10)
	               < min_dist[0]+min_dist[1] ) {
	                min_dist = [(Math.abs(x - data_coord[0][0]+10)+Math.abs(x - (data_coord[0][0]+data_coord[6]) + 10)-data_coord[6])/2,
	                            Math.abs(y - data_coord[0][1]-10),data_coord];
	                m = i;
	            }
			} else {
	            if( Math.abs(x - data_coord[0][0]+10)+Math.abs(y - data_coord[0][1]-10)
	               < min_dist[0]+min_dist[1] ) {
	                min_dist = [Math.abs(x - data_coord[0][0]+10),
	                            Math.abs(y - data_coord[0][1]-10),data_coord];
	                m = i;
	            }
			}
            
        }
		let r = 12
		if (trans_dict['d'] && this.graph_type !== 'Scatter-plot'){
			r = 6
		}
        if( min_dist[0] + min_dist[1] < r ) {
            /*self.master.display(round(((min_dist[2][0][1]-40)/trans_dict['y_scale']\
                                -trans_dict['y_max'])*(-1)*10)/10,min_dist[2][1]+': ',
                                self.data_coords[0][m][2],self.data_coords[0][m][3],self.data_coords[0][m][4])*/
			if (this.data_coords[1]['orginization_type'] === 'Locational'){
				this.master.display(`${this.data_coords[0][m][5]} x${this.data_coords[0][m][3]}`,min_dist[2][1]+': ',
                    	`${this.data_coords[0][m][2]}`,'','');
			} else {
				this.master.display(this.data_coords[0][m][5],min_dist[2][1]+': ',
                    	this.data_coords[0][m][2],this.data_coords[0][m][3],this.data_coords[0][m][4]);
			}
        } else {
            if( this.graph_type !== 'Stacked' ) {
                this.master.display('','','','','');
            }
        }
    }
    draw_point(coords,color,size) {
        this.draw.circle(size*2).fill(color).move(coords[0]-size,coords[1]-size);
    }


}
window.addEventListener('pointermove', (e) => {
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});

new CrabVisualizationFrame();


