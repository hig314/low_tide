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

class MultiselectDropdown {
	constructor(container, {listener = null, style = null, auto_close = true, label = ''}){
		this.container = container
		this.button_div = makeNewElement(this.container,'div',{'class':'selectBox'})
		this.button_div.addEventListener('click', () => this.toggleMenu());
		
		this.select = makeNewElement(this.button_div,'select',{'class':'header-button'})
		this.header = makeNewElement(this.select,'option',{'class':'header-button'},label)
		this.over_select = makeNewElement(this.button_div,'div',{'class':'overSelect'})
		this.menu = makeNewElement(this.container,'div',{'style':"display: none;",'class':'menu'})
		
		this.listener = listener
		this.auto_close = auto_close
		this.open = false
		this.checkboxes = []
		this.labels = []
		this.names = []
		this.selected = []
		this.length = 0
		
		document.addEventListener('click', (event) => {
		    if (!this.container.contains(event.target) && this.open) {
		        this.toggleMenu()
		    }
		});
	}
	toggleMenu(){
		if (this.open){
			this.menu.style.display = 'none';
		} else {
			this.menu.style.display = 'grid';
		}
		this.open = !this.open
	}
	addOption(title){
		let label = makeNewElement(this.menu,'label',{'class':'dropdownlabel'})
		this.labels.push(label)
		this.names.push(title)
		let checkbox = makeNewElement(label,'input',{'class':'dropdownbox','type':'checkbox'})
		label.append(title);
		const l = this.length
		checkbox.addEventListener('change', () => this.handeler(title));
		this.checkboxes.push(checkbox)
		this.length ++
	}
	removeOption(name){
		let i = this.selected.indexOf(name);
		let ind = this.names.indexOf(name);
		if (i > -1) {
		  this.selected.splice(i, 1);
		}
		this.labels[ind].remove()
		this.checkboxes.splice(ind, 1);
		this.labels.splice(ind, 1);
		this.names.splice(ind, 1);
		this.length --
	}
	removeAll(){
		for (let i = this.names.length-1; i>=0; i--){
			this.removeOption(this.names[i])
		}
	}
	handeler(ind){
		let i = this.selected.indexOf(ind);
		if (i > -1) {
		  this.selected.splice(i, 1);
		} else {
			this.selected.push(ind)
		}
		if (this.auto_close){
			this.toggleMenu()
		}
		if (this.listener){
			this.listener(this.selected)
		}
	}
	set(on,off,run_event=false){
		for (let i = 0; i < this.checkboxes.length; i++){
			if (on.includes(this.names[i]) && !this.selected.includes(this.names[i])){
				this.checkboxes[i].checked = true;
				this.selected.push(this.names[i])
			} else if (off.includes(this.names[i]) && this.selected.includes(this.names[i])) {
				this.checkboxes[i].checked = false;
				let j = this.selected.indexOf(this.names[i]);
				if (j > -1) {
				  this.selected.splice(j, 1);
				}
			}
		}
		if (run_event && this.listener){
			this.listener(this.selected)
		}
	}
	get(){
		return this.selected
	}
	updateLabel(label){
		this.header.innerHTML = label
	}
}

class ButtonDropdown {
	constructor(container, {listener = null, style = null, auto_close = true, label = ''}){
		this.container = container
		this.button_div = makeNewElement(this.container,'div',{'class':'selectBox'})
		this.button_div.addEventListener('click', () => this.toggleMenu());
		
		this.select = makeNewElement(this.button_div,'select',{'class':'header-button'})
		this.header = makeNewElement(this.select,'option',{'class':'header-button'},label)
		this.over_select = makeNewElement(this.button_div,'div',{'class':'overSelect'})
		this.menu = makeNewElement(this.container,'div',{'style':"display: none;",'class':'menu'})
		
		this.listener = listener
		this.auto_close = auto_close
		this.open = false
		this.checkboxes = []
		this.labels = []
		this.names = []
		this.length = 0
		
		document.addEventListener('click', (event) => {
		    if (!this.container.contains(event.target) && this.open) {
		        this.toggleMenu()
		    }
		});
	}
	toggleMenu(){
		if (this.open){
			this.menu.style.display = 'none';
		} else {
			this.menu.style.display = 'grid';
		}
		this.open = !this.open
	}
	addOption(title){
		let label = makeNewElement(this.menu,'label',{},title)
		this.labels.push(label)
		this.names.push(title)
		const l = this.length
		label.addEventListener('click', () => this.handeler(title));
		this.length ++
	}
	removeOption(name){
		let ind = this.names.indexOf(name);
		this.labels[ind].remove()
		this.checkboxes.splice(ind, 1);
		this.labels.splice(ind, 1);
		this.names.splice(ind, 1);
		this.length --
	}
	removeAll(){
		for (let i = this.names.length-1; i>=0; i--){
			this.removeOption(this.names[i])
		}
	}
	handeler(ind){
		if (this.auto_close){
			this.toggleMenu()
		}
		if (this.listener){
			this.listener(ind)
		}
	}
	updateLabel(label){
		this.header.innerHTML = label
	}
}
