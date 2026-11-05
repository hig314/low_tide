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

let urlParams = new URLSearchParams(window.location.search);
let params = null
document.getElementById("page").src = `${window.location.protocol}//${window.location.host}${urlParams.get('path')}`

window.addEventListener("message", (event) => {
 	if (event.data?.type === "page_end") {
		console.log(event.data.value)
		params = event.data.value
  	} else if (event.data?.type === "page_begin"){
		var url = new URL(window.location.href);
		url.searchParams.set("path", event.data.value);
		window.history.pushState(null, null, url);
		if (params){
			document.getElementById('page').contentWindow.postMessage(
				{ type: "params", value: params },
			  "*"
			);
		} else {
			if (urlParams.get('area')){
				document.getElementById('page').contentWindow.postMessage(
					{ type: "area", value: urlParams.get('area') },
				  "*"
				);
			} else {
				document.getElementById('page').contentWindow.postMessage(
					{ type: "area", value: 'Seldovia' },
				  "*"
				);
			}
		}
	} else if (event.data?.type === "area"){
		var url = new URL(window.location.href);
		url.searchParams.set("area", event.data.value);
		window.history.pushState(null, null, url);
  	}
});