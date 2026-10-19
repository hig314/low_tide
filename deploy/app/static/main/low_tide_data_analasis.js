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

class CrabVisualizationFrame extends CrabVisualizationFrameRoot {
	constructor(inital_data=null) {
        super()
        this.run_canvas();
    }
	options_list() {
		return [['requires_stndard','Requires standard group'],['temp','Show temparature'],['sci_names','Use scientific names'],['shapes','Use location shapes in scatter plot']];
	}

}
 class GraphCanvas extends GraphCanvasRoot {

    constructor(master,data,crab_colors) {
		super(master,data,crab_colors)
		document.getElementById('redirect').href=`${window.location.protocol}//${window.location.host}/static/NMDS/index_NMDS.html`
		document.getElementById('info').href=`${window.location.protocol}//${window.location.host}/static/main/info.html`
    }

    draw_graph(data,li,x_max,params,days,d) { 
		let visualization_type = params['visualization_type']
		let max_s = params['vals'][0]
		let max_e = params['vals'][1]
		let crabs = params['speiceis']
		let smoothing_type = params['smoothing_type']
		let graph_type = params['graph_type']
		let orginization_type = params['orginization_type']
		let locations = params['locations']
		let options = params['options']
		if (options.includes('temp')){
			this.draw_t_scalebar(data)
		}

		
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
					} else if (li_new[i][j][0]-li_new[i][j-1][0] > 1 && i == 0) {
		                let poly = this.draw.polygon(`${li_new[i][j-1][0]},0 ${li_new[i][j][0]},0 ${li_new[i][j][0]},${this.y_size+40} ${li_new[i][j-1][0]},${this.y_size+40}`).attr({
					            'fill':'#c6c6c6',
								'fill-opacity': 0.2,
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
    
    draw_x_scalebar(days,params) {
		let graph_type = params['graph_type']
		let orginization_type = params['orginization_type']
		let locations = params['locations']
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


