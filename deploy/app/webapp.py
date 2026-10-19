"""
Copyright 2023 Ground Truth Alaska

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the “Software”), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

# prototype Flask app server
# Copyright (C) 2021 HWITW project
#

from flask import Flask, render_template, request, Response, send_from_directory, redirect
import html
import json
import MDS
from flask_cors import CORS
import lzw

app = Flask(__name__)
CORS(app) # CORS headers to make devel easier


# return var data as json
@app.route('/requests/NMDS', methods = ['GET', 'POST'])
def getwxvarjson():
        data = MDS.NMDS(lzw.lzw_decode(request.get_json()))
        resp = Response( json.dumps(data.tolist()), mimetype='application/json')
        #resp.headers['Access-Control-Allow-Origin'] = '*' # get around CORS during development
        return resp

# return reading/weather variables as json
@app.route('/wxapp/wxvars')
def wxvarsjson():
	json_data = json.dumps( wxdata.get_wxvar_list() )
	resp = Response( json_data, mimetype='application/json')
	resp.headers['Access-Control-Allow-Origin'] = '*' # get around CORS during development
	print(resp)	#debug
	return resp

# redirect to root route
@app.route('/')
def approute():
    return redirect('/static/main/index_lt.html')

# With debug=True, Flask server will auto-reload 
# when there are code changes
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5000, debug=True)
