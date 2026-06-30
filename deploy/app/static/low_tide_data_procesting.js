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

function cleanup(data_reader) {
    //Get_temp_data.update_data(datetime.datetime.today());
	console.log(data_reader)
	let rows = get_rows()
    let max_row = data_reader.length;
    let max_column = data_reader[3].length;
    let data = [];
    for( let [ row_count,row ] of data_reader.entries() ) {
        if( row_count >= max_row ) {
            break;
        }
        row = [...row.slice( 0,max_column ).entries()].map( ( [ j, i ] ) =>i );
        data.push(row.slice( 0,max_column ));
    }
    data = invert_grid(data);
    let crab_indicies = get_crab_indices(data[0]);
    let categories = data[1].slice(rows.length);
	for (let categorie of categories){
		if (categorie[0] === ''){
			categorie[0] = 'unknown'
		}
	}
    let groups = data[2].slice(rows.length);
	console.log(data)
    data = data.slice(3 );
	if (do_notes){
	    var notes = data.filter((_, i) => i % 2 !== 0);
	    data = data.filter((_, i) => i % 2 === 0);
	} else {
		var notes = data.map(row => Array(row.length).fill(''));
	}
    
	t_temp_data = temp_data[0]
	console.log(t_temp_data.length)
	for ( let i = 1; i < t_temp_data.length; i += 1 ){
		// let start_date = new Date('2004-01-01');
// 		let current_date = new Date('2004-01-01');
// 		current_date.setDate(start_date.getDate() + i);
// 		console.log(t_temp_data[i]['date'])
// 		console.log(current_date)
		let pre_date = new Date(t_temp_data[i-1]['date']);
		let current_date = new Date(t_temp_data[i]['date']);
		if (current_date-pre_date !== 86400000){
			console.log(t_temp_data[i]['date'])
			console.log(current_date-pre_date)
		}
	}
    for ( let low_tide_index = 0; low_tide_index < data.length; low_tide_index++ ) {
		let observers_ind = rows.indexOf('observers')
		if (observers_ind !== -1){
			var pepole = data[low_tide_index][rows.indexOf('observers')].toLowerCase();
		} else {
			var pepole = ''
		}
        
        let is_standard = false;
        if( pepole.includes('erin') && ( pepole.includes('katmai') || pepole.includes('kids')) && pepole.includes('valisa') ) {
            is_standard = true;
        }
        let start_date = new Date('2004-01-01');
        let current_date = new Date(convert_date(data[low_tide_index][rows.indexOf('date')]));
        let s = 0;
        if( (current_date-start_date)/(1000 * 60 * 60 * 24) >= t_temp_data.length) {
            s = (current_date-start_date)/(1000 * 60 * 60 * 24)-t_temp_data.length+1;
        }
        data[low_tide_index] = {'location':get_location(data[low_tide_index][rows.indexOf('Location')]),
                'totall':'',
                'tide':parseFloat(data[low_tide_index][rows.indexOf('tide')]),
                'date':data[low_tide_index][rows.indexOf('date')],
                'dateTXT':data[low_tide_index][rows.indexOf('date')],
                'temp':t_temp_data[(current_date-start_date)/(1000 * 60 * 60 * 24)-s]['temp'],
                'is_standard':is_standard,
				'crabs':get_crab_dict(data[low_tide_index].slice(rows.length ),crab_indicies,notes[low_tide_index].slice(rows.length ),groups)};

        data[low_tide_index]['totall'] = sum( Object.values(data[low_tide_index]['crabs']).slice(1 ).map( val =>val[0] ));
    }
    let tdata = Object.fromEntries( ['Outside Beach','Waterfall Beach',
                     'White Rock Beach','MacDonald Spit','Jakolof Bay',
                     'Inside Beach','Ferry Dock','Seldovia Point',
                     'Schooner Beach',"Hoen's Lagoon",
                     'Limpet Rock','4th of July Creek','Halibut Cove',
                     'China Poot','Otter Rock',
                     'Loc 1  369ft',
                     'Loc 2  355ft',
                     'Loc 3  342ft',
                     'Loc 4  286ft',
                     'Loc 5  240ft',
                     'Loc 6  201ft',
                     'Loc 7  190ft',
                     'Loc 8  166ft',
                     'Loc 9  144ft',
                     'Loc 10  119ft',
                     'Loc 11  78ft',
                     'Loc 12  59ft','Loc 13  25ft'].map( key => [key, data.filter( value => value['location'] === key )] ));
    data = {};
    for( let key of Object.keys(tdata) ) {
        if( tdata[key].length !== 0 ) {
            data[key] = tdata[key];
        }
    }
    return [data,categories];
}

function convert_date(str){
	let date_list = str.split('/')
	return `20${date_list[2]}-${date_list[0]}-${date_list[1]}`
}

function get_crab_dict(crabs_counts,crab_indicies,notes,groups) {
    let crab_dict = {'biodiversity':[0,'',0]};
    let group_dict = {};
    for( let crab_type of Object.keys(crab_indicies) ) {
        let crab_index = crab_indicies[crab_type];
        if( ['G','I'].includes(groups[crab_index][0]) ) {
            let [count,was_seen,returntype] = get_count(crabs_counts[crab_index]);
            if( was_seen ) {
                crab_dict['biodiversity'][0] += 1;
                crab_dict['biodiversity'][2] += 1;
            }
            let display_val = crabs_counts[crab_index];
            if( !display_val ) {
                display_val = '0';
            }
            crab_dict[crab_type] = [count,notes[crab_index],display_val];
        } else if( ['S','A'].includes(groups[crab_index][0]) ) {
            group_dict[groups[crab_index][1]] = [[get_count(crabs_counts[crab_index])[0],notes[crab_index]],1,
                                                 groups[crab_index][0],crab_type];
		} else if( groups[crab_index][0] == 'B' ) {

			group_dict[groups[crab_index][1]] = [[get_count(crabs_counts[crab_index])[1],notes[crab_index]],1,
				groups[crab_index][0],crab_type];
		}
    }
    for( let crab_type of Object.keys(crab_indicies) ) {
        crab_index = crab_indicies[crab_type];
        if( ['I','O'].includes(groups[crab_index][0]) ) {
            if( group_dict[groups[crab_index][1]][2] === 'B' ) {
                group_dict[groups[crab_index][1]][0][0] += get_count(crabs_counts[crab_index])[1];
            } else {
                group_dict[groups[crab_index][1]][0][0] += get_count(crabs_counts[crab_index])[0];
                if( group_dict[groups[crab_index][1]][2] === 'A' ) {
                    group_dict[groups[crab_index][1]][1] ++
                }
            }
        }
    }
    for( let group of Object.values(group_dict) ) {
        group[0][0] /= group[1];
        group[0].push(group[0][0]);
        crab_dict[group[3]] = group[0];
    }
    return crab_dict;
}

function get_count(val) {
    if (isNum(val)) {
        let count = parseInt(val);
        if( count !== 0 ) {
            return [count,true,true];
        }
        return [count,false,true];
    } else {
        val = val.toLowerCase();
        if( ['1-5','3-5','3-10','5-10','10-20','10-30'].includes(val) ) {
            return [parseInt(sum(val.split('-').map( part =>parseInt(part)))/2),true,false];
        } else if( val === '>100' ) {
            return [100,true,false];
		} else if( val === '20-100' ) {
            return [40,true,false];
		} else if( val === '30-100' ) {
            return [50,true,false];
		} else if( val === 'p' ) {
            return [0,true,false];
		} else {
            if( val ) {
                console.log(val);
            }
            return [0,false,false];
        }

    }
}
function get_location(loc) {
    loc = loc.toLowerCase();
    let location_keywords = {'outside':'Outside Beach',
                         'waterfall':'Waterfall Beach',
                         'white':'White Rock Beach',
                         'macdonald':'MacDonald Spit',
                         'jakolof':'Jakolof Bay',
                         'inside':'Inside Beach',
                         'ferry':'Ferry Dock',
                         'seldovia':'Seldovia Point',
                         'schooner':'Schooner Beach',
                         'hoen':"Hoen's Lagoon",
                         'limpet':'Limpet Rock',
                         '4th':'4th of July Creek',
                         'halibut':'Halibut Cove',
                         'otter':'Otter Rock',
                         'china':'China Poot',
                         '369ft':'Loc 1  369ft',
                         '355ft':'Loc 2  355ft',
                         '342ft':'Loc 3  342ft',
                         '286ft':'Loc 4  286ft',
                         '240ft':'Loc 5  240ft',
                         '201ft':'Loc 6  201ft',
                         '190ft':'Loc 7  190ft',
                         '166ft':'Loc 8  166ft',
                         '144ft':'Loc 9  144ft',
                         '119ft':'Loc 10  119ft',
                         '78ft':'Loc 11  78ft',
                         '59ft':'Loc 12  59ft',
                         '25ft':'Loc 13  25ft'};
    for( let location_keyword of Object.keys(location_keywords) ) {
        if( loc.includes(location_keyword) ) {
            return location_keywords[location_keyword];
        }
    }
	console.log(loc)
}
function get_crab_indices(crab_column) {
	let rows = get_rows()
    let crabs = crab_column.slice(rows.length);
    let crab_indices = {};
    for( let [ index,crab ] of crabs.entries() ) {
        crab_indices[crab] = index;
    }
    return crab_indices;
}