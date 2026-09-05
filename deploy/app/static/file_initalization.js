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

// custom_files_loc = 'customs';
// try:
//     file = open(custom_files_loc, 'rb');
//     custom_files = pickle.load(file);
//     file.close();
// except (FileNotFoundError,EOFError):
//     custom_files = {};
var seldovia_custom_files = {}
var costal_studies_custom_files = {}
var custom_files = seldovia_custom_files
function generate_custom_file(file_data,name) {
	console.log(file_data)
    let file = [];
    for( let sub_file of Object.values(file_data) ) {
        for( let speicies of Object.keys(sub_file) ) {
            if( sub_file[speicies][0] ) {
                file.push([speicies,sub_file[speicies][1],sub_file[speicies][2],sub_file[speicies][3]]);
            }
        }
    }
    custom_files[name] = file;
	console.log(file)
}

function get_rows(){
	let row_column = invert_grid(raw_data)[0];
	return row_column.slice(0,row_column.indexOf('date')+1)
}
function get_columns(){
	let column_row = raw_data[get_rows().length];
	return column_row
}

function get_filenames() {
	let column = get_columns()
    let info_column = invert_grid(raw_data)[column.indexOf('data analasys info')];
    let filenames = [];
    for( let info of info_column ) {
        if(  !['','data analasys info'].includes(info) &&  !filenames.includes(info.split('$').at(-2))) {
            filenames.push(info.split('$').at(-2));
        }
    }
    return [...filenames,...Object.keys(custom_files)];
}

function get_names(filename) {
    if(  Object.keys(custom_files).includes(filename) ) {
        let names = [];
        for( let speices of custom_files[filename] ) {
            names.push(speices[0]);
        }
        return names;
    }
	let column = get_columns()
    let name_column = invert_grid(raw_data.slice())[column.indexOf('common name')];
    let info_column = invert_grid(raw_data.slice())[column.indexOf('data analasys info')];
    let names = [];
    let cliped_names = [];
    for( let [ i,info ] of info_column.entries() ) {
        if( !['','data analasys info'].includes(info) && info.split('$').at(-2) === filename ) {
            if( info.split('$').length === 4 ) {
                names.push(name_column[i]);
                cliped_names.push(name_column[i]);
            } else {
                names.push(info.split('$')[0]);
                cliped_names.push(info.split('$')[0]);
            }
        } else {
            names.push('');
        }
    }
    return cliped_names;
}

function get_scientific_names(filename) {
    if( Object.keys(custom_files).includes(filename) ) {
        let sci_dict = {};
        for( let speices of custom_files[filename] ) {
            sci_dict[speices[0]] = speices[1];
        }
        sci_dict['biodiversity'] = 'biodiversity';
        return sci_dict;
    }
	let column = get_columns()
    let name_column = invert_grid(raw_data.slice())[column.indexOf('common name')];
    let sci_column = invert_grid(raw_data.slice())[column.indexOf('scientific name')];
    let info_column = invert_grid(raw_data.slice())[column.indexOf('data analasys info')];
    let sci_dict = {};
    let names = get_names(filename);
    for( let [ i,info ] of info_column.entries() ) {
		let name = undefined
        if( info.split('$').length === 4 ) {
            name = name_column[i];
        } else {
            name = info.split('$')[0];
        }
        if( names.includes(name) ) {
            sci_dict[name] = sci_column[i];
        }
    }
    sci_dict['biodiversity'] = 'biodiversity';
    return sci_dict;
}

function get_loc_data(loc_sheet){
	let columns = loc_sheet[0]
	loc_sheet = loc_sheet.slice(1)
	let loc_ind = columns.indexOf('Location')
	let key_ind = columns.indexOf('Keyword')
	let shape_ind = columns.indexOf('Shape')
	let color_ind = columns.indexOf('Color')
	let loc_data = {}
	for (let loc of loc_sheet){
		loc_data[loc[loc_ind]] = {'key':loc[key_ind],'shape':loc[shape_ind],'color':loc[color_ind]}
	}
	return loc_data
}

function get_colors(filename) {
    if( Object.keys(custom_files).includes(filename) ) {
        let colors = {};
        for( let speices of custom_files[filename] ) {
            colors[speices[0]] = speices[1];
        }
        colors['biodiversity'] = '#000';
        return colors;
    }
	let column = get_columns()
    let name_column = invert_grid(raw_data.slice())[column.indexOf('common name')];
    let color_column = invert_grid(raw_data.slice())[column.indexOf('color')];
    let info_column = invert_grid(raw_data.slice())[column.indexOf('data analasys info')];
    let color_dict = {};
    let names = get_names(filename);
    for( let [ i,info ] of info_column.entries() ) {
		let name = undefined
        if( info.split('$').length === 4 ) {
            name = name_column[i];
        } else {
            name = info.split('$')[0];
        }
        if( names.includes(name) ) {
            color_dict[name] = '#'+color_column[i];
        }
    }
    color_dict['biodiversity'] = '#000';
    return color_dict;
}

function get_groups(filename) {
    if( Object.keys(custom_files).includes(filename) ) {
        let groups = {};
        for( let speices of custom_files[filename] ) {
            groups[speices[0]] = speices[2];
        }
        return groups;
    }
	let column = get_columns()
    let name_column = invert_grid(raw_data.slice())[column.indexOf('common name')];
    let info_column = invert_grid(raw_data.slice())[column.indexOf('data analasys info')];
    let names = get_names(filename);
    let group_dict = {};
    for( let [ i,info ] of info_column.entries()) {
		let name = undefined
        if( info.split('$').length === 4 ) {
            name = name_column[i];
        } else {
            name = info.split('$')[0];
        }
        if( names.includes(name) ) {
            group_dict[name] = info.split('$').at(-1);
        }
    }
    return group_dict;
}

function get_file(filename) {
	let rows = get_rows()
	let column = get_columns()
	let file = structuredClone(raw_data);
    let name_column = invert_grid(raw_data.slice())[column.indexOf('common name')];
    let info_column = invert_grid(raw_data.slice())[column.indexOf('data analasys info')];
    let cat_column = invert_grid(raw_data.slice())[column.indexOf('diet')]; 
    let info_row = raw_data[rows.indexOf('data analasys info')];
    let mid_file = [];
    let names = get_names(filename);
    let save_names = [];
	let sci_names = [];
    let save_groups = [];
    let categories = [];
    let groups = get_groups(filename);
    for( let [ i,info ] of info_column.entries() ) {
		let name
        if( info.split('$').length === 4 ) {
            name = name_column[i];
        } else {
            name = info.split('$')[0];
        }
        if( names.includes(name) ) {
            mid_file.push(file[i]);
            save_names.push(name);
            save_groups.push(groups[name]);
            categories.push(cat_column[i].split(', '));
        } else if ( i < rows.length ) {
            mid_file.push(file[i]);
}
    }
    let mid_len = mid_file[0].length;
    if( Object.keys(custom_files).includes(filename) ) {
        for( let speices of custom_files[filename] ) {
            if( speices[3] === 'group' ) {
				console.log(speices)
                mid_file.push( range(mid_len).map( i =>'' ));
                save_names.push(speices[0]);
                save_groups.push(groups[speices[0]]);
                categories.push('');
            }
        }
    }
    let out_file = [];
	let started = false
    for( let [ i,info ] of info_row.entries() ) {
		if ( ([filename,'all'].includes(info.split('$').at(-1)) && info.split('$')[1] === 'start') ){
			started = true
		}
        if ( started || ([filename,'all'].includes(info.split('$').at(-1)) && info.split('$')[1] === 'inc') ) {
            out_file.push(invert_grid(mid_file)[i]);
        }
    }
    return invert_grid([...[[...Array(rows.length).fill(''),...save_names]],...[[...Array(rows.length).fill(''),...categories]],...[[...Array(rows.length).fill(''),...save_groups]],...out_file]);
}
