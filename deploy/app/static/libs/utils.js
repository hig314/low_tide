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

function makeNewElement(div, type, atributes, txt) {
	if (typeof div === 'string'){
		div = document.getElementById(div);
	}
	var content = document.createElement(type);
	var atibute_keys = Object.keys(atributes);
	for (atibute_key of atibute_keys) {
		content.setAttribute(atibute_key, atributes[atibute_key]);
	}
	div.appendChild(content);
	if (txt != null) {
		content.innerHTML = txt
	}
	return content
}

function sum(array) {
	return array.reduce((a, b) => a + b, 0)
}

function invert_grid(grid) {
    let inverted_grid = [];
    for( let i = 0; i < grid[0].length; i++ ) {
        inverted_grid.push( grid.map( x =>x[i] ));
    }
    return inverted_grid;
}

function isNum(str){
	return /^[-]?\d+(\.\d+)?$/.test(str)
}
function range(a, b=null){
	if (b !== null){
		return Array.from({ length: b - a}, (_, i) => a + i);
	} else {
		return Array.from({ length: a}, (_, i) => i);
	}
	
}
function arrayIndex(matrix,target){
	return matrix.findIndex(innerArray => innerArray.length === target.length && innerArray.every((value, index) => value === target[index]));
}
function arrayIncludes(matrix,target){
	return matrix.some(innerArray => innerArray.length === target.length && innerArray.every((value, index) => value === target[index]));
}
function clearListeners(element){
	const new_elem = element.cloneNode(true);
	element.parentNode.replaceChild(new_elem, element);
}
console.log(isNum('+63.1'))