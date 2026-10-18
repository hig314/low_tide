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

function presence_absence(val,display,is_presence_absence) {
    if ( !is_presence_absence ) {
        return val;
    } else if( !display || display === '0' ) {
        return 0;
	} else {
        return 1;
    }

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
class CrabVisualizationFrameRoot {
	
	constructor(inital_data=null) {
        this.has_canvas = false;
        this.is_active = false;
        this.is_redrawing = true;
		this.params = {}
		this.handler = this.run_canvas
		
		document.onkeydown = (event) => this.keypress(event)
		if (document.getElementById('area_select')){
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
			var files = get_filenames()
			this.files = files
        	this.data_menu = document.getElementById('area_select')
		}
        
		if (document.getElementById('file_select')){
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
		}
		
		if (document.getElementById('date_slider')){
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
		  	    this.handler()});
			this.params['years'] = [this.year_silder.noUiSlider,'get']
		}

        if (document.getElementById('val_slider')){
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
		  	    this.handler()});
			this.params['vals'] = [this.max_silder.noUiSlider,'get']
        }

        if (document.getElementById('tide_slider')){
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
		  	    this.handler()});
			this.params['tide'] = [this.tide_silder.noUiSlider,'get']
        }

        
		if (document.getElementById('options_select')){
			this.options = new MultiselectDropdown(document.getElementById('options_select'), {label: "Options",listener: (selected) => this.select_options(selected), auto_close: false});
			
			for (let option of this.options_list()){
				this.options.addOption(option[0],option[1]);
			}
			this.params['options'] = [this.options,'get']
		}
		
		if (document.getElementById('speicies_select')){
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
			this.params['speiceis'] = [this.crab_menu,'get']
		}
        
		if (document.getElementById('location_select')){
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
			this.params['locations'] = [this.location_menu,'get']
		}
        
		if (document.getElementById('visualization')){
	        if( inital_data === null ) {
	            var visualization = 0;
	        } else {
	            var visualization = inital_data['visualization'];
	        }
		
	        this.selected_visualization = "Numbers";
	        this.visualization_menu = document.getElementById('visualization')
		
			this.visualization_menu.addEventListener('change', (event) => this.handler());
			this.params['visualization_type'] = this.visualization_menu
		}
    
		if (document.getElementById('smoothing')){
	        if( inital_data === null ) {
	            var smoothing = 0;
	        } else {
	            var smoothing = inital_data['smoothing'];
	        }
	        this.selected_smoothing = "Numbers";
	        this.smoothing_menu = document.getElementById('smoothing')
		
			this.smoothing_menu.addEventListener('change', (event) => this.handler());
			this.params['smoothing_type'] = this.smoothing_menu
		}
        
		if (document.getElementById('scaling')){
	        if( inital_data === null ) {
	            var scaling = 0;
	        } else {
	            var scaling = inital_data['scaling'];
	        }
	        this.selected_scaling = "Numbers";
	        this.scaling_menu = document.getElementById('scaling')
		
			this.scaling_menu.addEventListener('change', (event) => this.handler());
			this.params['scaling_type'] = this.scaling_menu
		}

        
		if (document.getElementById('graph')){
	        if( inital_data === null ) {
	            var graph = 0;
	        } else {
	            var graph = inital_data['graph'];
	        }
	        this.selected_graph = "Numbers";
	        this.graph_menu = document.getElementById('graph')
		
			this.graph_menu.addEventListener('change', (event) => this.handler());
			this.params['graph_type'] = this.graph_menu
		}
        
		if (document.getElementById('orginaization')){
	        if( inital_data === null ) {
	            var orginization = 0;
	        } else {
	            var orginization = inital_data['orginization'];
	        }
	        this.selected_orginization = "Numbers";
	        this.orginization_menu = document.getElementById('orginaization')
		
			this.orginization_menu.addEventListener('change', (event) => this.handler());
			this.params['orginization_type'] = this.orginization_menu
		}
       
		console.log(this)
        this.canvas = new GraphCanvas(this,this.data,this.file['color_dict']);
		this.custom_menu = new SelectionFrame(this)

        // this.error = Label(self, {text: '',fg: 'red',font: [default_font.actual(), 16, "bold"] });
        // this.error.grid( {row: 4,column: 0,columnspan: 14 });
        this.has_canvas = true;
        this.is_active = true;
    }
	
	keypress(event){
	}

    run_canvas() {
        if( this.is_active ) {
			let out = {...this.params}
			console.log(out)
			for (let key of Object.keys(out)){
				console.log(key)
				out[key] = out[key].value ?? out[key][0][out[key][1]](true)
			}
            this.canvas.graph_data(out);
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
		this.handler()
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
            this.handler();
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
            this.handler();
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
        if( this.selected_visualization && this.selected_visualization in ['Percent','Percent of selected','Percent relative to average','Percent of the way to average'] && val !== '' ) {
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
 class GraphCanvasRoot {

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

    graph_data(params) {
		let page_width = document.documentElement.clientWidth;
		this.x_size = page_width-200
		this.draw.size(page_width,this.y_size+this.y_extra)
        let error = false;
		let crabs = params['speiceis']
        if( params['orginization_type'] === 'Locational' ) {
            if( params['smoothing_type'] !== 'No smoothing' ) {
                this.master.display_error('Cannot smooth while in locational');
                error = true;
            }
            if( params['graph_type'] !== 'Scatter-plot' ) {
                this.master.display_error('Must use scatter plot while in locational');
                error = true;
            }
			if (params['locations'].length === 1){
				this.master.display_error('Locational requires multiple locations');
				error = true;
			}
        }
		else if ( params['graph_type'] === 'Stacked' ){
            if( params['visualization_type'] === 'Relative to average' ) {
                this.master.display_error('Cannot stack while in relative to average');
                error = true;
            }
            if( params['visualization_type'] === 'Percent relative to average' ) {
                this.master.display_error('Cannot stack while in percent relative to average');
                error = true;
            }
		}
		if ( crabs.includes('biodiversity') ){
            if( params['visualization_type'] === 'Percent' ) {
                this.master.display_error('Biodiversity is meaningles while in percent');
                error = true;
            }
            if( params['visualization_type'] === 'Percent of selected' ) {
                this.master.display_error('Biodiversity is meaningles while in percent of selected');
                error = true;
            }
		}
		if (["Month bins","3-month bins","Year bins"].includes(params['smoothing_type'])){
			if (params['options'].includes("shapes") && params['graph_type'] === 'Scatter-plot'){
				this.master.display_error("Location shapes don't work with bining");
				error = true;
			}
		}
        if( !error ) {
            this.master.display_error(' ');
        }
        let data = structuredClone(this.data);
        this.graph_type = params['graph_type'];
        this.orginization_type = params['orginization_type'];
 	    this.draw.clear()
		if (params['locations'] != null){
			data = params['locations'].map(loc =>data[loc]).flat();
		} else {
			data = Object.keys(data).map(loc =>data[loc]).flat();
		}
        
		data.sort((a,b) => get_date_num(a['date'])-get_date_num(b['date']))
        if( params['options'] != null && params['options'].includes("requires_stndard") ) {
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
		let year_s = 0
		let year_e = 1
		if (params['years']){
			year_s = params['years'][0]
			year_e = params['years'][1]
		}
        if( set_days ) {
            days = range(Math.trunc(get_date_num(data[0]['date'])+year_s*data_range),Math.trunc(get_date_num(data[0]['date'])+year_e*data_range+1));
        } else {
            days = [0];
        }
        if( days.length === 0 ) {
            days = [0];
        }
		let tide_s = 100
		let tide_e = -100
		if (params['tide']){
			if (params['tide'][1]){
				tide_s = params['tide'][1]
			}
			if (params['tide'][0] !== -7){
				tide_e = params['tide'][0]
			}
		}
			
		
        data = structuredClone(data.filter( low_tide => days.includes(get_date_num(low_tide['date'])) && low_tide['tide'] < tide_s && low_tide['tide'] > tide_e ));
		console.log(params['orginization_type'])
		if (params['orginization_type']){
			this.organize(data,params['orginization_type'],params['locations'])
		} else {
            for( let [ i,low_tide ] of data.entries() ) {
                low_tide['date'] = get_date_num(low_tide['date']);
            }
		}

        data.sort((a,b) => get_date_num(a['date'])-get_date_num(b['date']))
        if( data.length === 0 ) {
			console.log('no data')
            return;
        }
        let speicies_list = Object.keys(data[0]['crabs']);
		
		if (params['scaling_type']){
	        for( let low_tide of data ) {
	            for( let speicies of speicies_list ) {
	                if ( params['scaling_type'] === 'square root' ) {
	                    low_tide['crabs'][speicies][0] = Math.sqrt(low_tide['crabs'][speicies][0]);
	                } else if( params['scaling_type'] === 'Logarithmic' ) {
	                    low_tide['crabs'][speicies][0] = Math.log2(low_tide['crabs'][speicies][0]+1);
					}
	            }
	        }
		}
		
        
        let x_max = days.length;
		if ( params['orginization_type'] === 'Seasonal' ) {
            x_max = 365;
        } else if( params['orginization_type'] === 'Locational' ) {
            x_max = params['locations'].length-1;
		}
        let safe_data = data.filter( low_tide => low_tide['totall'] !== 0 );
        let safe_indexes = data.entries().filter( ( [ i,low_tide ] ) => low_tide['totall'] !== 0 ).map( ( [ i,low_tide ] ) =>i );
        if( !safe_data.length ) {
			console.log('no safe')
            return;
        }
		if (params['visualization_type']){
			var li = this.run_viz(data, params['visualization_type'], crabs)
		}
		
		
		let d = 0;
		if ( ["Smoothed low","Smoothed medium","Smoothed high"].includes(params['smoothing_type'])){
	        let k;
			let r;
	        if ( params['smoothing_type'] === "Smoothed low" ) {
	            k = 40;
				r = 86
	        } else if( params['smoothing_type'] === "Smoothed medium" ) {
	            k = 70;
				r = 20
			}
	 		else if( params['smoothing_type'] === "Smoothed high" ) {
	            k = 100;
				r = 26
			}
	        if ( params['orginization_type'] === 'Seasonal' ) {
	            k /= 10;
	        }
			console.log(structuredClone(li),structuredClone(data))
			this.smooth(li,data,k,r)
		} else if (["Month bins","3-month bins","Year bins"].includes(params['smoothing_type'])){
	        if ( params['smoothing_type'] === "Month bins" ) {
	            d = 30.436875
	        } else if( params['smoothing_type'] === "3-month bins" ) {
	            d = 91.310625
			}
	 		else if( params['smoothing_type'] === "Year bins" ) {
	            d = 365.2425
			}
			[li,data] = this.bin(li,data,d,params)
			console.log(structuredClone(data))
			console.log(structuredClone(li))
		}
		
        this.run_graph(data,li,x_max,params,days,d);
        this.draw_x_scalebar(days,params);
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
					if (Math.random() < 0.001){
						console.log(Math.abs(data[j]['date']-data[j+d]['date']),k)
					}
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
	run_graph(data,li,x_max,params,days,d) {
		this.draw_graph(data,li,x_max,params,days,d)
	}

    draw_graph(data,li,x_max,params,d) {
		
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

    draw_t_scalebar(data) {
        let t_max = Math.max(...data.map( low_tide =>low_tide['temp'] ));
        let t_min = Math.min(...data.map( low_tide =>low_tide['temp'] ));
		console.log(t_min,t_max)
        let y_range = t_max-t_min;
		if (!y_range){
			return
		}
        let y_scale = this.y_size/y_range;

        let add_string = ' ºC';
		let st_size
        if( t_min ) {
            st_size = Math.max(y_range/10,0.01);
        } else {
            st_size = Math.max(Math.round(y_range/10),1);
        }
        let i = t_min;
        while( i < t_max+st_size ) {
			let v
            if( Math.abs(i) >= 1000 ) {
                v = i;
            } else {
                v = i;
            }
            let txt = (Math.round(v*10)/10).toString();
			this.draw.text(txt+add_string).font({ family: 'helvetica',  size: 14  }).attr({ 
				'text-anchor': 'middle', 
				'dominant-baseline': 'hanging' 
			}).amove(this.x_size+this.padding+36,(v*(-1)+t_max)*y_scale+16);
            i += st_size;
        }
        return t_max,t_min;
    }

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


