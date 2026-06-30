// let thing = new ButtonDropdown(document.getElementById("speicies_select"),{label:'stuwertfyghff',listener: listenery,auto_close:false})
//
// thing.addOption('1 thing')
// thing.addOption('2 thing')
// thing.addOption('3 thing')
//
// //thing.set(['1 thing','3 thing'],true)
//
// function listenery(selected){
// 	thing.updateLabel(JSON.stringify(selected))
// }

this.year_silder = document.getElementById('date_slider')

noUiSlider.create( this.year_silder, {
    start: [0, 1],
    connect: false,
    range: {
        'min': 0,
        'max': 1
    },  
	tooltips: true,   
});