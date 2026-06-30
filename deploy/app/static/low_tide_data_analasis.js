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
        document.getElementById('custom_speiceis').innerHTML = ''
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
		document.getElementById('custom_speiceis').innerHTML = ''
		document.getElementById('group_name_enter').value = ''
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
		this.group_submit_button.addEventListener("click", () => this.add_group(),{ once: true });
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

    add_group(name_input) {
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

    update_prevew(name) {
		console.log(this.color_inputs[name].value)
        this.color_buttons[name].style.color = this.color_inputs[name].value;
    }
}
class CrabVisualizationFrame {
	
	constructor(inital_data=null) {
        this.has_canvas = false;
        this.is_active = false;
        this.is_redrawing = true;
		
		

        if( inital_data === null ) {
            this.data_cat = 'Seldovia';
        } else {
            this.data_cat = inital_data['data_cat'];
        }
		if (this.data_cat === 'Seldovia') {
			raw_data = seldovia_raw_data
			do_notes = true
			custom_files = seldovia_custom_files
		} else if (this.data_cat === 'Coastal studies') {
			raw_data = costal_studies_raw_data
			do_notes = false
			custom_files = costal_studies_custom_files
		}
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

        this.requires_stndard = document.getElementById('standard_group')
        if( inital_data ) {
            this.requires_stndard.checked = inital_data['requires_stndard']
        }
		this.requires_stndard.addEventListener('change', () => this.run_canvas());
		
        this.temp = document.getElementById('show_temp')
        if( inital_data ) {
            this.temp.checked = inital_data['temp']
        }
        this.temp.addEventListener('change', () => this.run_canvas());

        // this.point_count = Label(self, {text: '' });
//         this.point_count.grid( {row: 2,column: 7 });
//
//         this.mouseover_label = Label(self, {text: '' });
//         this.mouseover_label.grid( {row: 0,column: 6 });
//         this.mouseover_label2 = Label(self, {text: '' });
//         this.mouseover_label2.grid( {row: 1,column: 6 });
//         this.mouseover_label3 = Label(self, {text: '' });
//         this.mouseover_label3.grid( {row: 2,column: 6 });

        this.selected_crabs = [];
        this.crab_menu = new MultiselectDropdown(document.getElementById('speicies_select'), {label: "No crabs",listener: (selected) => this.select_crab(selected)});
        for( let [ index,label ] of this.crabs.entries() ) {
            this.crab_menu.addOption(label);
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

    run_canvas() {
        if( this.is_active ) {
			console.log('ran')
            this.canvas.graph_data(this.location_menu.get(),this.crab_menu.get(),
                               this.visualization_menu.value,this.smoothing_menu.value,this.scaling_menu.value,this.orginization_menu.value,this.graph_menu.value,
                               this.year_silder.noUiSlider.get(true)[0],this.year_silder.noUiSlider.get(true)[1],
                                this.max_silder.noUiSlider.get(true)[0],this.max_silder.noUiSlider.get(true)[1],
                               this.tide_silder.noUiSlider.get(true)[1],this.tide_silder.noUiSlider.get(true)[0],
                               this.requires_stndard.checked,this.temp.checked);
        }
    }
    select_crab(crabs) {
        if( crabs.length === 0 ) {
            this.crab_menu.updateLabel('No ' + this.file['display_name']);
        } else if( (crabs.length) === 1 ) {
            this.crab_menu.updateLabel(crabs[0]);
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
        this.file = {"display_name":file,'color_dict':get_colors(file)};
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
        for( let [ index,label ] of this.crabs.entries() ) {
            this.crab_menu.addOption(label);
        }
        for( let label of this.categorie_list ) {
            this.categories_menu.addOption(label);
        }
		
		this.canvas.update(this.data,this.file['color_dict'])
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
		} else if (this.data_cat === 'Coastal studies') {
			raw_data = costal_studies_raw_data
			do_notes = false
			custom_files = costal_studies_custom_files
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
	    this.draw = SVG().addTo('#canvas').size( page_width, 720);
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

    graph_data(locations,crabs,visualization_type,smoothing_type,scaling_type,orginization_type,graph_type,year_s,year_e,max_s,max_e,tide_s,tide_e,requres_standard,temp) {
		
		let page_width = document.documentElement.clientWidth;
		this.x_size = page_width-200
		this.draw.size(page_width,720)
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
        if( !error ) {
            this.master.display_error('');
        }
        let data = structuredClone(this.data);
        this.graph_type = graph_type;
        this.orginization_type = orginization_type;
 	    this.draw.clear()
        data = locations.map(loc =>data[loc]).flat();
		data.sort((a,b) => get_date_num(a['date'])-get_date_num(b['date']))
        if( requres_standard ) {
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
		
        if( orginization_type === 'Seasonal' ) {
            for( let [ i,low_tide ] of data.entries() ) {
                low_tide['date'] = get_date_num(low_tide['date'])%365;
            }
        }
        let dupe_dict = {};
        for( let [ i,low_tide ] of data.entries() ) {
            let date = get_date_num(low_tide['date']);
			
            dupe_dict[date] ??= [];
            dupe_dict[date].push(i);
        }
        for( let date of Object.keys(dupe_dict) ) {
            for( let [ i,index ] of dupe_dict[date].entries() ) {
				
                data[index]['date'] = parseInt(date)+i*0.001;
            }
        }
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
                } else if( scaling_type === 'logarithmic' ) {
                    low_tide['crabs'][speicies][0] = Math.log2(low_tide['crabs'][speicies][0]+1);
}
            }
        }
        let x_max = days.length;
        var avgs = range(crabs.length+1).map( i =>0 );
        let safe_data = data.filter( low_tide => low_tide['totall'] !== 0 );
        let safe_indexes = data.entries().filter( ( [ i,low_tide ] ) => low_tide['totall'] !== 0 ).map( ( [ i,low_tide ] ) =>i );
        if( !safe_data.length ) {
			console.log('no safe')
            return;
        }
        let y_min = 0;
		let y_max = 0;
        let k = 0;
        if( smoothing_type === "Smoothed low" ) {
            k = 40;
        } else if( smoothing_type === "Smoothed medium" ) {
            k = 70;
		}
 		else if( smoothing_type === "Smoothed high" ) {
            k = 100;
		}
        if( orginization_type === 'Seasonal' ) {
            k /= 10;
        }
        let factor = k/(k+1);
        if( visualization_type === 'Percent' ) {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = safe_data.map( low_tide => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0]*100/low_tide['totall'] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let j of li ) {
                        vals.push([]);
                        for( let i of range(j.length) ) {
                            let l = Math.max(0,i-13);
                            let h = Math.min(i+14,j.length);
                            let m = get_date_num(safe_data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(safe_data[l+n]['date'])-m) )),1);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(safe_data[l+n]['date'])-m)) ))/div);
                        }
                    }
                    if( graph_type === 'Stacked' ) {
                        y_max = Math.max(...range(vals[0].length).map( i =>sum( range(vals.length).map( j =>vals[j][i] )) ));
                    } else {
                        y_max = Math.max(...vals.map( val =>Math.max(...val) ));
                    }
                } else {
                    y_max = 0;
                }

            } else if( graph_type === 'Stacked' ) {
                y_max = Math.max(...safe_data.map( low_tide =>sum( Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0]*100/low_tide['totall'] )) ));
			} else {
                y_max = Math.max(...safe_data.map( low_tide => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0]*100/low_tide['totall'] ) ).flat());
            }
        } else if( visualization_type === 'Relative to average' ) {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = data.map( low_tide => Object.entries(crabs.entries).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let [ k,j ] of li.entries() ) {
                        vals.push([]);
                        let total = 0;
                        for( let i of range(j.length) ) {
                            let l = Math.max(0,i-13);
                            let h = Math.min(i+14,j.length);
                            let m = get_date_num(data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(data[l+n]['date'])-m) )),0);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(data[l+n]['date'])-m)) ))/div);
                            total += vals.at(-1)[i];
                        }
                        avgs[k] = total/vals.at(-1).length;
                    }
                    y_max = Math.max(...vals.entries().map( ( [ i,val ] ) =>Math.max(...val)-avgs[i] ));
                    y_min = -y_max;
                } else {
                    y_max = 0;
                }
            } else {
                let lii = safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    for( let [ i,j ] of li.entries() ) {
                        let total = 0;
                        for( let val of j ) {
                            total += val;
                        }
                        avgs[i] = total/j.length;
                    }
                    y_max = Math.max(...safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0]-avgs[i] ) ).flat());
                    y_min = -y_max;
                } else {
                    y_max = 0;
                }

            }
		} else if( visualization_type === 'Percent relative to average' ) {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let [ k,j ] of li.entries() ) {
                        vals.push([]);
                        let total = 0;
                        for( let i of range(j.length) ) {
                            let l = max(0,i-13);
                            let h = min(i+14,j.length);
                            let m = get_date_num(data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(data[l+n]['date'])-m) )),1);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(data[l+n]['date'])-m)) ))/div);
                            total += j[i];
                        }
                            //total += vals.at(-1).at(-1)
                        avgs[k] = total/j.length;
                    }
                    y_max = Math.max(...enumerate(vals).map( ( [ i,val ] ) =>Math.max(...val)*100/Math.max(avgs[i],0.01)-100 ));
                    y_min = -y_max;
                } else {
                    y_max = 0;
                }
            } else {
                let lii = safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    for( let [ i,j ] of li.entries() ) {
                        let total = 0;
                        for( let val of j ) {
                            total += val;
                        }
                        avgs[i] = total/j.length;
                    }
                    y_max = Math.max(...safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0]*100/Math.max(avgs[i],0.01)-100 ) ).flat());
                    y_min = -y_max;
                } else {
                    y_max = 0;
                }

            }
		} else if( visualization_type === 'Percent of the way to average' ) {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let [ k,j ] of li.entries() ) {
                        vals.push([]);
                        let total = 0;
                        for( let i of range(j.length) ) {
                            let l = Math.max(0,i-13);
                            let h = Math.min(i+14,j.length);
                            let m = get_date_num(data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(data[l+n]['date'])-m) )),1);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(data[l+n]['date'])-m)) ))/div);
							
                            total += j[i];
                        }
                            //total += vals.at(-1).at(-1)
                        avgs[k] = total/j.length;
                    }

                    if( graph_type === 'Stacked' ) {
                        y_max = Math.max(...range(vals[0].length).map( i =>sum( range(vals.length).map( j =>vals[j][i]*100/Math.max(avgs[j],0.01) )) ));
                    } else {
                        y_max = Math.max(...vals.entries().map( ( [ i,val ] ) =>Math.max(...val)*100/Math.max(avgs[i],0.01) ));
                    }
                    y_min = 0;
                } else {
                    y_max = 0;
                }

            } else if( graph_type === 'Stacked' ) {
                lii = safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    for( let [ i,j ] of li.entries() ) {
                        let total = 0;
                        for( let val of j ) {
                            total += val;
                        }
                        avgs[i] = total/j.length;
                    }
                    y_max = Math.max(...safe_data.map( low_tide =>sum( Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0]*100/Math.max(avgs[i],0.01) )) ));
                    y_min = 0;
                } else {
                    y_max = 0;
                }

			} else {
                let lii = safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    for( let [ i,j ] of li.entries() ) {
                        let total = 0;
                        for( let val of j ) {
                            total += val;
                        }
                        avgs[i] = total/j.length;
                    }
                    y_max = Math.max(...safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0]*100/Math.max(avgs[i],0.01) ) ).flat());
                    y_min = 0;
                } else {
                    y_max = 0;
                }

            }
		} else if( visualization_type === 'Percent of the way to maximum' ) {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let [ k,j ] of li.entries() ) {
                        vals.push([]);
                        for( let i of range(j.length) ) {
                            let l = Math.max(0,i-13);
                            let h = Math.min(i+14,j.length);
                            let m = get_date_num(data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(data[l+n]['date'])-m) )),0);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(data[l+n]['date'])-m)) ))/div);
                        }
                        avgs[k] = Math.max(...vals.at(-1));
                    }

                    if( graph_type === 'Stacked' ) {
                        y_max = Math.max(...range(vals[0].length).map( i =>sum( range(vals.length).map( j =>vals[j][i]*100/Math.max(avgs[j],0.01) )) ));
                    } else {
                        y_max = Math.max(...vals.entries().map( ( [ i,val ] ) =>Math.max(...val)*100/Math.max(avgs[i],0.01) ));
                    }
                    y_min = 0;
                } else {
                    y_max = 0;
                }

            } else if( graph_type === 'Stacked' ) {
                let lii = safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    for( let [ i,j ] of li.entries() ) {
                        avgs[i] = Math.max(...j);
                    }
                    y_max = Math.max(...safe_data.map( low_tide =>sum( Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0]*100/Math.max(avgs[i],0.01) )) ));
                    y_min = 0;
                } else {
                    y_max = 0;
                }

			} else {
                let lii = safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    for( let [ i,j ] of li.entries() ) {
                        avgs[i] = Math.max(...j);
                    }
                    y_max = Math.max(...safe_data.map( low_tide => Object.entries(crabs).map( ( [ i,crab ] ) =>low_tide['crabs'][crab][0]*100/Math.max(avgs[i],0.01) ) ).flat());
                    y_min = 0;
                } else {
                    y_max = 0;
                }

            }
		} else if( visualization_type === 'Percent of selected' ) {
			y_max = 100;

            // if( graph_type === 'Stacked' ) {
//                 y_max = 100;
//
//             } else if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
//                 let lii = safe_data.map( low_tide => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0] ) );
//                 let li = [];
//                 for( let i of range(lii[0].length) ) {
//                     li.push( lii.map( x =>x[i] ));
//                 }
//                 if( li.length ) {
//                     let tides = range(lii.length).map( i =>[] );
//                     for( let j of li ) {
//                         for( let i of range(j.length) ) {
//                             let l = Math.max(0,i-13);
//                             let h = Math.min(i+14,j.length);
//                             let m = get_date_num(safe_data[i]['date']);
//                             let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(safe_data[l+n]['date'])-m) )),1);
//                             tides[i].push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(safe_data[l+n]['date'])-m)) ))/div);
//                         }
//
//                     }
//                     let totals = [];
//                     let vals = [];
//                     for( let tide of tides ) {
//                         totals.push(Math.max(sum(tide),1));
//                     }
//
//                     for( let [ i,tide ] of tides.entries() ) {
//                         for( let val of tide ) {
//                             vals.push(val*100/totals[i]);
//                         }
//                     }
//                     y_max = Math.max(...vals);
//                 } else {
//                     y_max = 0;
//                 }
//
// 			} else {
//                 let totals = safe_data.map( low_tide =>Math.max(sum( Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0] )),1) );
//
//                 y_max = Math.max(...Object.entries(safe_data).map( ( [ i,low_tide ] ) => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0]*100/totals[i] ) ).flat());
//
//             }
		} else if( visualization_type === 'Presence-absence' ) {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = data.map( low_tide => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>+(!!(low_tide['crabs'][crab][2])) ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let j of li ) {
                        vals.push([]);
                        for( let i of range(j.length) ) {
                            let l = Math.max(0,i-13);
                            let h = Math.min(i+14,j.length);
                            let m = get_date_num(data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(data[l+n]['date'])-m) )),0);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>presence_absence(x,x,true)*(factor**Math.abs(get_date_num(data[l+n]['date'])-m)) ))/div);
                        }
                    }
                    if( graph_type === 'Stacked' ) {
                        y_max = Math.max(...range(vals[0].length).map( i =>sum( range(vals.length).map( j =>vals[j][i] )) ));
                    } else {
                        y_max = Math.max(...vals.map( val =>Math.max(...val) ));
                    }
                } else {
                    y_max = 0;
                }
            } else if( graph_type === 'Stacked' ) {
                y_max = Math.max(...safe_data.map( low_tide =>sum( Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],true) )) ));
			} else {
                y_max = 1;
            }

		} else {
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let lii = data.map( low_tide => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0] ) );
                let li = [];
                for( let i of range(lii[0].length) ) {
                    li.push( lii.map( x =>x[i] ));
                }
                if( li.length ) {
                    let vals = [];
                    for( let j of li ) {
                        vals.push([]);
                        for( let i of range(j.length) ) {
                            let l = Math.max(0,i-13);
                            let h = Math.min(i+14,j.length);
                            let m = get_date_num(data[i]['date']);
                            let div = Math.max(sum( range(h-l).map( n =>factor**Math.abs(get_date_num(data[l+n]['date'])-m) )),0);
                            vals.at(-1).push(sum( j.slice(l,h).entries().map( ( [ n,x ] ) =>x*(factor**Math.abs(get_date_num(data[l+n]['date'])-m)) ))/div);
                        }
                    }
                    if( graph_type === 'Stacked' ) {
                        y_max = Math.max(...range(vals[0].length).map( i =>sum( range(vals.length).map( j =>vals[j][i] )) ));
                    } else {
                        y_max = Math.max(...vals.map( val =>Math.max(...val) ));
                    }
                } else {
                    y_max = 0;
                }
            } else if( graph_type === 'Stacked' ) {
                y_max = Math.max(...safe_data.map( low_tide =>sum( Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0] )) ));
			} else {
                y_max = Math.max(...safe_data.map( low_tide => Object.keys(low_tide['crabs']).filter( crab => crabs.includes(crab) ).map( crab =>low_tide['crabs'][crab][0] ) ).flat());

            }
        }
        let t_max = Math.max(...safe_data.map( low_tide =>low_tide['temp'] ));

        let t_min = Math.min(...safe_data.map( low_tide =>low_tide['temp'] ));
        if( y_max < 1 ) {
            y_max = 1;
        }
        if( orginization_type === 'Seasonal' ) {
            x_max = 365;
        } else if( orginization_type === 'Locational' ) {
            x_max = locations.length-1;
}

        y_min += (y_max-y_min)*max_s;
        y_max *= max_e;
        if( y_max-y_min === 0 ) {
            return;
        }
        y_max,y_min = this.draw_y_scalebar(y_max,visualization_type,y_min);
//         t_max,t_min = this.draw_t_scalebar(t_max,visualization_type,t_min);
        let do_svg = false;
        this.draw_graph(data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,
                         graph_type,orginization_type,locations,avgs,factor,temp);
        this.draw_x_scalebar(days,graph_type,orginization_type,locations);
    }

    draw_graph(data,x_max,y_min,y_max,t_min,t_max,days,crabs,visualization_type,smoothing_type,graph_type,orginization_type,locations,avgs,factor,temp) {
        this.master.update_point_count(data.length);
        let x_scale = this.x_size/x_max;
		let multiply
        if( visualization_type === 'Percent' ) {
            multiply = 1;
        } else if( visualization_type === 'Percent relative to average' ) {
            multiply = 2;
		} else if( ['Percent of the way to average','Percent of the way to maximum'].includes(visualization_type) ) {
            multiply = 3;
		} else {
            multiply = 0;
        }
        if( y_max === y_min ) {
            y_min -= y_max/100;
        }
        let y_scale = this.y_size/(y_max-y_min);
        let t_scale = this.y_size/(t_max-t_min);

        this.data_coords = [];
        let data_coords = [];
        let coord_dict = {};
        let location_totals = {};
		let min_mul
        if( orginization_type === 'Seasonal' ) {
            min_mul = 0;
        } else {
            min_mul = 1;
        }
		let do_presence_absence
        if( visualization_type === 'Presence-absence' ) {
            do_presence_absence = true;
        } else {
            do_presence_absence = false;
        }
        var prev_coords = range(data.length).map( i =>0 );
        let prev_true_coords = range(data.length).map( i => y_max*y_scale+40 );
        let tides = data.map( i => ({}) );
        //print(data.length)
        let dot_size=5;
        let count = 0;
		let multi = 0
		let sub = 0
        for( let [ crab_index,crab ] of crabs.entries() ) {
            let coords_rec = [];
            let true_coords_rec = [];
            let coords = [];
            if( multiply === 1 ) {
                sub = 0;
                if (data[0]['totall']) {
                    multi = 100/data[0]['totall'];
                } else {
                    multi = 1;
                }
            } else if( multiply === 2 ) {
                if (avgs[crab_index]) {
                    multi = 100/avgs[crab_index];
                } else {
                    multi = 1;
                }
                sub = 100/multi;
			} else {
                sub = avgs[crab_index];
                multi = 1;
            }
            var coords_list = [];
            var coords_list_record = [];
            for( let [ i,low_tide ] of data.entries() ) {
                if( multiply === 1 ) {
                    sub = 0;
                    if (low_tide['totall']) {
                        multi = 100/low_tide['totall'];
                    } else {
                        multi = 1;
                    }

                } else if( multiply === 2 ) {
                    if (avgs[crab_index]) {
                        multi = 100/avgs[crab_index];
                    } else {
                        multi = 1;
                    }
                    sub = 100/multi;
				} else if( multiply === 3 ) {
                    if (avgs[crab_index]) {
                        multi = 100/avgs[crab_index];
                    } else {
                        multi = 1;
                    }
                    sub = 0;
				} else {
                    sub = avgs[crab_index];
                    multi = 1;
                }

                if( visualization_type === 'Percent of selected' ) {
                    coords_list.push([(get_date_num(low_tide['date'])-Math.min(...days)*min_mul)*x_scale+this.padding+10,
                              low_tide['crabs'][crab][0],dot_size]);
                } else if( orginization_type === 'Locational' ) {
                    coords = [(locations.indexOf(low_tide['location']))*x_scale+this.padding+10,
                              ((presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)-sub)*multi*(-1)+y_max)*y_scale+40,3];
                    if( arrayIncludes(coords_list_record,coords.slice( 0,2 )) ) {
                        let ind = arrayIndex(coords_list_record,coords.slice( 0,2 ));
                        if( coords_list[ind][2] < 8 ) {
                            coords_list[ind][2] += 0.5;
                        }
                    } else {
                        coords_list.push(coords);
                        coords_list_record.push(coords.slice( 0,2 ));
                    }

				} else if( graph_type === 'Stacked' ) {
                    coords_list.push([(get_date_num(low_tide['date'])-Math.min(...days)*min_mul)*x_scale+this.padding+10,
                              ((presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)*multi+prev_coords[i])*(-1)+y_max)*y_scale+40,dot_size]);
                    coords_rec.push(presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)*multi);
				} else {
                    if( low_tide['crabs'][crab][0] ) {
                        count += 1;
                    }
					//console.log(get_date_num(low_tide['date']))
                    coords_list.push([(get_date_num(low_tide['date'])-Math.min(...days)*min_mul)*x_scale+this.padding+10,
                              ((presence_absence(low_tide['crabs'][crab][0],low_tide['crabs'][crab][2],do_presence_absence)-sub)*multi*(-1)+y_max)*y_scale+40,dot_size]);
                }
                if( !["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                    data_coords.push([coords_list.at(-1),crab,low_tide['location'],low_tide['dateTXT'],low_tide['crabs'][crab][1],low_tide['crabs'][crab][2]]);
                    true_coords_rec.push(coords_list.at(-1)[1]);
                }
                coords_list.at(-1).push((t_max-low_tide['temp'])*t_scale+40);
            }
			var curent_coords
            if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                let div = Math.max(sum( coords_list.slice( 0,14 ).entries().map( ( [ n,x ] ) =>factor**(x[0]/x_scale-coords_list[0][0]/x_scale) )),0);
                curent_coords = [coords_list[0][0],sum( coords_list.slice( 0,14 ).entries().map( ( [ n,x ] ) =>x[1]*factor**(x[0]/x_scale-coords_list[0][0]/x_scale) ))/div,dot_size,coords_list[0][3]];
                data_coords.push([curent_coords,crab,data[0]['location'],data[0]['dateTXT'],data[0]['crabs'][crab][1],data[0]['crabs'][crab][2]]);
                true_coords_rec.push(curent_coords[1]);
            } else {
                curent_coords = coords_list[0];
            }
            var new_coords = []
            for( let [ i,coords ] of coords_list.slice(1 ).entries() ) {
                let xxx = i;
                if( ["Smoothed low","Smoothed medium","Smoothed high"].includes(smoothing_type) ) {
                    let l = Math.max(0,i-12);
                    let h = Math.min(i+15,coords_list.length);
                    let m = coords[0];
                    let div = Math.max(sum( coords_list.slice( l,h ).entries().map( ( [ n,x ] ) =>factor**Math.abs(x[0]/x_scale-m/x_scale) )),0);
                    new_coords = [coords[0],sum( coords_list.slice( l,h ).entries().map( ( [ n,x ] ) =>x[1]*factor**Math.abs(x[0]/x_scale-m/x_scale) ))/div,dot_size,coords[3]];
                    data_coords.push([new_coords,crab,data[i+1]['location'],data[i+1]['dateTXT'],data[i+1]['crabs'][crab][1],data[i+1]['crabs'][crab][2]]);
                    true_coords_rec.push(new_coords[1]);
                } else {
                    new_coords = coords;
                }
                if( visualization_type === 'Percent of selected' ) {
                    tides[xxx][crab] = curent_coords;
                } else if( graph_type === 'Line-graph' ) {
                    if( temp ) {
                        this.draw.line(curent_coords[0],curent_coords[3],new_coords[0],new_coords[3]).stroke({color: '#ff0000',width: 1 });
                    }
                    this.draw.line(...curent_coords.slice( 0,2 ),...new_coords.slice( 0,2 )).stroke({color: this.crab_colors[crab],width: 2 });
				} else if( graph_type === 'Stacked' ) {
                    let poly = this.draw.polygon(`${curent_coords[0]},${curent_coords[1]} ${new_coords[0]},${new_coords[1]} ${new_coords[0]},${prev_true_coords[i+1]} ${curent_coords[0]},${prev_true_coords[i]}`).attr({
				            'fill':this.crab_colors[crab],
				            'shape-rendering':'crispEdges',
				            'stroke-width': 0
				        });
					poly.on('mouseover', (event) => {
						this.master.display('',crab,'','','')
					})
					poly.on('mouseout', (event) => {
						this.master.display('','','','','') 
					})
                    if( temp ) {
                        this.draw.line(curent_coords[0],curent_coords[3],new_coords[0],new_coords[3]).stroke({color: '#ff0000',width: 1 });
                    }
				} else if( graph_type === 'Scatter-plot' ) {
                    this.draw_point(curent_coords.slice( 0,2 ),this.crab_colors[crab],curent_coords[2]);
                    if( temp ) {
                        this.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2);
                    }
				}
                curent_coords = new_coords;
            }
            
            if( visualization_type === 'Percent of selected' ) {
                tides.at(-1)[crab] = curent_coords;
            } else if( graph_type === 'Scatter-plot' ) {
                this.draw_point(curent_coords.slice( 0,2 ),this.crab_colors[crab],curent_coords[2]);
                if( temp ) {
                    this.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2);
				}
            }
            for( let [ i,val ] of coords_rec.entries() ) {
                prev_coords[i] += val;
            }
            prev_true_coords = true_coords_rec.slice();
        }

        if( visualization_type === 'Percent of selected' ) {
            data_coords = [];
            let totals = [];
            for( let tide of tides ) {
                let total = 0;
                for( let point of Object.values(tide) ) {
                    total += point[1];
                }
                if( total === 0 ) {
                    total = 1;
                }
                totals.push(total);
            }
            prev_coords = range(data.length).map( i =>0 );
            prev_true_coords = range(data.length).map( i =>650 );
            for( let [ crab_index,crab ] of crabs.entries() ) {
                let coords_rec = [];
                let true_coords_rec = [];
                let coords = [];
                let coords_list_record = [];
                let curent_coords = [tides[0][crab][0],(((tides[0][crab][1]+prev_coords[0])*100/totals[0])*(-1)+y_max)*y_scale+40,tides[0][crab][2],tides[0][crab][3]];
                coords_rec.push(tides[0][crab][1]);
                true_coords_rec.push(curent_coords[1]);
                data_coords.push([curent_coords,crab,data[0]['location'],data[0]['dateTXT'],data[0]['crabs'][1],data[0]['crabs'][2]]);
                for( let [ i,coords ] of tides.slice(1 ).entries() ) {
                    let new_coords = [coords[crab][0],(((coords[crab][1]+prev_coords[i+1])*100/totals[i+1])*(-1)+y_max)*y_scale+40,coords[crab][2],coords[crab][3]];
                    coords_rec.push(coords[crab][1]);
                    true_coords_rec.push(new_coords[1]);
                    data_coords.push([new_coords,crab,data[i+1]['location'],data[i+1]['dateTXT'],data[i+1]['crabs'][crab][1],data[i+1]['crabs'][crab][2]]);
                    if( graph_type === 'Line-graph' ) {
                        if( temp ) {
                            this.draw.line(curent_coords[0],curent_coords[3],new_coords[0],new_coords[3]).stroke({color: '#ff0000',width: 1 });
                        }
                        this.draw.line(...curent_coords.slice( 0,2 ),...new_coords.slice( 0,2 )).stroke({color: this.crab_colors[crab],width: 2 });
                    } else if( graph_type === 'Stacked' ) {
	                    let poly = this.draw.polygon(`${curent_coords[0]},${curent_coords[1]} ${new_coords[0]},${new_coords[1]} ${new_coords[0]},${prev_true_coords[i+1]} ${curent_coords[0]},${prev_true_coords[i]}`).attr({
					            'fill':this.crab_colors[crab],
					            'shape-rendering':'crispEdges',
					            'stroke-width': 0
					        });
						poly.on('mouseover', (event) => {
							this.master.display('',crab,'','','')
						})
						poly.on('mouseout', (event) => {
							this.master.display('','','','','') 
						})
	                    if( temp ) {
	                        this.draw.line(curent_coords[0],curent_coords[3],new_coords[0],new_coords[3]).stroke({color: '#ff0000',width: 1 });
	                    }
					}
 				   else if( graph_type === 'Scatter-plot' ) {
                        this.draw_point(curent_coords.slice( 0,2 ),this.crab_colors[crab],curent_coords[2]);
                        if( temp ) {
                            this.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2);
                        }
					}
                    curent_coords = new_coords;
                }

                if( graph_type === 'scatter-plot' ) {
                    this.draw_point(curent_coords.slice( 0,2 ),this.crab_colors[crab],curent_coords[2]);
                    if( temp ) {
                        this.draw_point([curent_coords[0],curent_coords[3]],'#ff0000',curent_coords[2]/2);
                    }
                } // else if( graph_type === 'line-graph' ) {
 //                    this.create_text(curent_coords.slice( 0,2 ), {fill: this.crab_colors[crab],
 //                                 text: crab });
 // 				}
                if( graph_type === 'Stacked' ) {
                    for( let [ i,val ] of coords_rec.entries() ) {
                        prev_coords[i] += val;
                    }
                    prev_true_coords = true_coords_rec;
                }
            }
        }
		this.data_coords = [data_coords,{'multi':multi,'y_max':y_max,'y_scale':y_scale}];

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
            if( Math.abs(x - data_coord[0][0]+10)+Math.abs(y - data_coord[0][1]-10)
               < min_dist[0]+min_dist[1] ) {
                min_dist = [Math.abs(x - data_coord[0][0]+10),
                            Math.abs(y - data_coord[0][1]-10),data_coord];
                m = i;
            }
        }
		
        if( min_dist[0] + min_dist[1] < 12 ) {
            /*self.master.display(round(((min_dist[2][0][1]-40)/trans_dict['y_scale']\
                                -trans_dict['y_max'])*(-1)*10)/10,min_dist[2][1]+': ',
                                self.data_coords[0][m][2],self.data_coords[0][m][3],self.data_coords[0][m][4])*/
            this.master.display(this.data_coords[0][m][5],min_dist[2][1]+': ',
                                this.data_coords[0][m][2],this.data_coords[0][m][3],this.data_coords[0][m][4]);
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


