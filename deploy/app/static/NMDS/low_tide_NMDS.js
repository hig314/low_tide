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

class CrabVisualizationFrame extends CrabVisualizationFrameRoot {
	
	constructor(inital_data=null) {
		super()
		this.handler = this.activate
		this.shapes = new BetterDropdown(document.getElementById('shapes_select'), {label: "Shapes: none",listener: (selected) => this.select_shapes(selected)});
		this.shapes.addOption('none','None');
		this.shapes.addOption('locations','Locations');
		this.params['shapes'] = [this.shapes,'get']
		
		this.colors = new BetterDropdown(document.getElementById('colors_select'), {label: "Colors: none",listener: (selected) => this.select_colors(selected)});
		this.colors.addOption('none','None');
		this.colors.addOption('locations','Locations');
		this.colors.addOption('cont_date','Continuos date');
		this.colors.addOption('year','Year');
		this.colors.addOption('cont_season','Continuos season');
		this.colors.addOption('quarter','Quarter');
		this.colors.addOption('tide','Tide');
		this.params['colors'] = [this.colors,'get']
		document.getElementById('generate').addEventListener("click", () => this.run());
		document.getElementById('redirect').href=`http://${window.location.host}/static/main/index_lt.html`
		document.getElementById('info').href=`http://${window.location.host}/static/NMDS/info.html`
    }
	
	activate(){
		document.getElementById('generate').style.borderColor='#ff0000'
		document.getElementById('generate').style.borderWidth='2px'
		document.getElementById('generate').style.fontWeight='bold'
	}
	run(){
		document.getElementById('generate').style.borderColor='#000000'
		document.getElementById('generate').style.borderWidth='1px'
		document.getElementById('generate').style.fontWeight='normal'
		this.run_canvas()
	}
	
	keypress(event){
	    var key = event.keyCode || event.charCode;
		console.log(key)
		if (key == 18) {
			//this.MDS_download = true
			this.run_canvas()
		}
	}
	select_shapes(shape){
		this.shapes.updateLabel(`Shapes: ${shape}`)
		this.handler()
	}
	
	select_colors(color){
		let lable_txt = {'none':'none','locations':'locations','cont_date':'continuos date','cont_season':'continuos season','quarter':'quarter','year':'year','tide':'tide'}
		this.colors.updateLabel(`Colors: ${lable_txt[color]}`)
		this.handler()
	}
	
	options_list() {
		return [['requires_stndard','Requires standard group'],['sci_names','Use scientific names'],['shapes','Use location shapes in scatter plot']];
	}

}
 class GraphCanvas extends GraphCanvasRoot {

    constructor(master,data,crab_colors) {
		super(master,data,crab_colors)
		this.waiting = false
    }

	update(data,crab_colors){
        this.data = data;
        this.crab_colors = crab_colors;
	}

    async run_graph(data,li,x_max,params,days,d) {
		if (this.waiting){
			return
		}
		this.waiting = true
		let MDS_data = []
		for (let i = 0; i < data.length; i++){
			MDS_data.push([])
			for (let j = 0; j < params['speiceis'].length; j++){
				MDS_data[i].push(li[j][i])
			}
		}
		let cred_str = 'weird:weather'
		//data=${encodeURIComponent(lzw_encode(JSON.stringify(MDS_data)))
		const response = await fetch(`/requests/NMDS` , {   method:'POST',
		                headers: {'Content-Type': 'application/json','Authorization': 'Basic ' + btoa(cred_str)}, body: JSON.stringify(lzw_encode(JSON.stringify(MDS_data)))})
		if (!response.ok){
			console.warn('Problem with fetch. Status Code: ' + response.status );
		} 
		let NMDS = await response.json()
		this.draw_graph(data,NMDS,params['speiceis'],params['locations'],params['options'],params['shapes'],params['colors'])
		this.waiting = false
		
		
		// fetch(`http://192.168.194.103:5001/requests/NMDS?data=${encodeURIComponent(JSON.stringify(MDS_data))}` , {   method:'GET',
// 		                        headers: {'Authorization': 'Basic ' + btoa(cred_str)}
// 		                    }
// 		).then(
// 		    function( response ) {
// 		        if ( response.status !== 200 ) {
// 		            console.warn('Problem with fetch wxgrid. Status Code: ' + response.status );
// 		            return;
// 		        }
//
// 		        response.json().then((NMDS) => this.draw_graph(data,NMDS,crabs,locations,options)));
// 		    }
// 		)
// 		.catch(function(err) {
// 		    console.error('Fetch Error -', err);
// 		});
		// var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(MDS_data));
// 		var dlAnchorElem = document.getElementById('downloadAnchorElem');
// 		dlAnchorElem.setAttribute("href",     dataStr     );
// 		dlAnchorElem.setAttribute("download", "MDS.json");
// 		dlAnchorElem.click();
		
    }
	
	
	bin(li,data,d,params){
		console.log(params)
		if (params['shapes'] === 'locations' || params['colors'] === 'locations'){
			let data_n = {}
			let li_n = {}
			let bin_ns = {}
			let lasts = {}
			for (let i = 0; i < li.length; i++){
				for (let j = 0; j < li[i].length; j++){
					let loc = data[j]['location']
					if (!(loc in data_n)){
						data_n[loc] = []
						li_n[loc] = []
					}
					if (!(loc in bin_ns)){
						bin_ns[loc] = ~~(data[j]['date']/d)
					}
					if (li_n[loc].length == i){
						li_n[loc].push([[0,0]])
					}
					let bin_num = bin_ns[loc]
					let bin_end = (bin_num+1)*d
					if (data[j]['date'] >= bin_end){
						if (!i){
							data_n[loc].push(structuredClone(data[j]))
							data_n[loc].at(-1)['date'] = Math.round((bin_num+0.5)*d)
							data_n[loc].at(-1)['dateTXT'] = get_date(Math.floor((bin_num)*d)) + '-' + get_date(Math.floor((bin_num+1)*d))
						}
						li_n[loc][i][li_n[loc][i].length-1] = li_n[loc][i].at(-1)[0]/li_n[loc][i].at(-1)[1]
						bin_ns[loc] = ~~(data[j]['date']/d);
					
						li_n[loc][i].push([0,0])
					}
					lasts[loc] = data[j]
					li_n[loc][i].at(-1)[0] += li[i][j]
	 				li_n[loc][i].at(-1)[1] += 1
				}
				for (let loc of Object.keys(data_n)){
					if (!i){
						data_n[loc].push(structuredClone(lasts[loc]))
						data_n[loc].at(-1)['date'] = Math.round((bin_ns[loc]+0.5)*d)
						data_n[loc].at(-1)['dateTXT'] = get_date(Math.floor((bin_ns[loc])*d)) + '-' + get_date(Math.floor((bin_ns[loc]+1)*d))
					}
					li_n[loc][i][li_n[loc][i].length-1] = li_n[loc][i].at(-1)[0]/li_n[loc][i].at(-1)[1]
				}
				bin_ns = {}
			}
			let data_out = []
			let li_out = []
			for (let i = 0; i < li.length; i++){
				li_out.push([])
			}
			for (let loc of Object.keys(data_n)){
				data_out.push(...data_n[loc])
				for (let i = 0; i < li.length; i++){
					li_out[i].push(...li_n[loc][i])
				}
			}
			return [li_out,data_out]
		}
		else {
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
			return [li_n,data_n]
		}
	}

    draw_graph(data,NMDS,crabs,locations,options,shapes,colors) {
		console.log(NMDS)
		this.master.update_point_count(data.length);
		
        let x_max = Math.max(...NMDS.map( tide => tide[0] ));
		let x_min = Math.min(...NMDS.map( tide => tide[0] ));
		
        let y_max = Math.max(...NMDS.map( tide => tide[1] ));
		let y_min = Math.min(...NMDS.map( tide => tide[1] ));
		
        let date_max = Math.max(...data.map( low_tide => low_tide['date'] ));
		let date_min = Math.min(...data.map( low_tide => low_tide['date'] ));
		
        let tide_max = Math.max(...data.map( low_tide => low_tide['tide'] ));
		let tide_min = Math.min(...data.map( low_tide => low_tide['tide'] ));
		
        let scale = Math.min(this.x_size/(x_max-x_min),this.y_size/(y_max-y_min));
		
        this.data_coords = [];
        let data_coords = [];
		let dot_size = 5
		let li = []
		console.log(data)
		for (let i = 0; i < NMDS.length; i++){
			li.push([(NMDS[i][0]-x_min)*scale+40+this.padding+10,(NMDS[i][1]-y_min)*scale+40,dot_size])

			data_coords.push([li[i],data[i]['location'],data[i]['dateTXT'],data[i]['tide']]);
		}
		let data_coords_t = structuredClone(data_coords)
		for (let i = 0; i < li.length; i++){
			let p
			if (shapes === 'none'){
				p = 'M -1 0 Q -1 1, 0 1 Q 1 1, 1 0 Q 1 -1, 0 -1 Q -1 -1, -1 0'
			} else if (shapes === 'locations'){
				p = location_data[data[i]['location']]['shape']
			}
			let c
			let reTXT = get_date(data[i]['date'])
			if (colors === 'none'){
				c = '#000000'
			} else if (colors === 'locations'){
				c = `#${location_data[data[i]['location']]['color']}`
			} else if (colors === 'cont_date'){
				let gap = 0.15
				c = hsvToRgb((data[i]['date']-date_min)*(1-gap)/(date_max-date_min)+gap,1,[0.8,0.8,1])
			} else if (colors === 'year'){
				let reTXT_s = get_date(date_min)
				let reTXT_e = get_date(date_max)
				c = hsvToRgb((parseInt(reTXT.slice(-2))-parseInt(reTXT_s.slice(-2)))*0.8/(parseInt(reTXT_e.slice(-2))-parseInt(reTXT_s.slice(-2)))+0.2,1,[0.8,0.8,1])
			} else if (colors === 'cont_season'){
				c = hsvToRgb((1.51-get_date_num(`${reTXT.slice(0,-2)}0`)/(365))%1,1,[0.8,0.8,1])
			} else if (colors === 'quarter'){
				c = hsvToRgb((1.5-Math.trunc((parseInt(reTXT.slice(0,-5))-1)/3)/4)%1,1,[0.8,0.8,1])
			} else if (colors === 'tide'){
				c = colorAvg('#0000ff','#ff0000',(data[i]['tide']-tide_min)/(tide_max-tide_min))
			}
			this.draw.path(p).attr({
			            'fill':c,
			            'shape-rendering':'crispEdges',
			            'stroke-width': 0
			        }).scale(li[i][2],0,0).translate(li[i][0],li[i][1]); //
		}
		data_coords_t.reverse()
 		this.data_coords = [data_coords_t,{'y_max':y_max,'scale':scale}];

    }
    
    draw_x_scalebar(days,graph_type,orginization_type,locations) {
    }
    draw_y_scalebar(y_max,visualization_type,start_val) {
    }

    handle_motion(x,y) {
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
            if ( Math.abs(x - data_coord[0][0]+10)+Math.abs(y - data_coord[0][1]-10)
               < min_dist[0]+min_dist[1] ) {
                min_dist = [Math.abs(x - data_coord[0][0]+10),
                            Math.abs(y - data_coord[0][1]-10),data_coord];
                m = i;
			}
            
        }
		let r = 12
        if( min_dist[0] + min_dist[1] < r ) {
			this.master.display(this.data_coords[0][m][1],'',
                	this.data_coords[0][m][2],'',this.data_coords[0][m][3]);
        } else {
            if( this.graph_type !== 'Stacked' ) {
                this.master.display('','','','','');
            }
        }
    }



}
window.addEventListener('pointermove', (e) => {
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});

new CrabVisualizationFrame();


