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
function arrayLastIndex(matrix,target){
	return matrix.findLastIndex(innerArray => innerArray.length === target.length && innerArray.every((value, index) => value === target[index]));
}
function arrayIncludes(matrix,target){
	return matrix.some(innerArray => innerArray.length === target.length && innerArray.every((value, index) => value === target[index]));
}
function clearListeners(element){
	const new_elem = element.cloneNode(true);
	element.parentNode.replaceChild(new_elem, element);
}

function hsvToRgb(h, s, vl){
	let v = 1
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
	console.log(r,g,b)
	console.log(vl)
	r = Math.trunc(r*255*vl[0])
	g = Math.trunc(g*255*vl[1])
	b = Math.trunc(b*255*vl[2])
	
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
function colorAvg(c0,c1,weight){
	var c0 = [parseInt(c0.slice(1,3),16),parseInt(c0.slice(3,5),16),parseInt(c0.slice(5),16)]
	var c1 = [parseInt(c1.slice(1,3),16),parseInt(c1.slice(3,5),16),parseInt(c1.slice(5),16)]
	var color = '#'
	for (var i = 0; i < 3; i++){
		var color_part = componentToHex(parseInt((c1[i]-c0[i])*weight+c0[i]))
		color += color_part
	}
	return color
}

function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

function get_date(num) {
    // let years = Math.trunc(num/365);
//     num %= 365;
	let years = 0
	let done = false
	let ind = 0
	while (!done){
		let len = 365 + !(ind%4)
		if (num <= len){
			done = true
		} else {
			years ++
			ind ++
			num -= len
		}
	}
    let days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    let days_to_reach = [];
    for (let i = 0; i < 13; i++) {
        days_to_reach.push(sum(days_in_month.slice( 0,i )));
    }
    for( let month_length of days_to_reach.toReversed() ) {
        if( num > month_length ) {
            var months = (days_to_reach.toReversed().indexOf(month_length)-6)*(-1)+6;
            var days = num - month_length;
            break;
        }
    }
	let pre = ''
	if (years < 10){
		pre = '0'
	}

    return String(months)+'/'+String(days)+'/'+pre+String(years);
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
    return Math.ceil(year*365.25) + sum(days_in_month.slice( 0,month )) + day;
}
