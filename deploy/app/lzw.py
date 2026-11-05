'''
Copyright 2026 Katmai McKittrick

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
'''

def lzw_encode(s):
    tdict = {}
    data = list(str(s))
    print(data)
    out = []
    phrase = data[0]
    code = 256
    for i in range(1,len(data)):
        currChar=data[i]
        if phrase + currChar in tdict and tdict[phrase + currChar]:
            phrase += currChar
        
        else:
            if len(phrase) > 1:
                out.append(tdict[phrase])
            else:
                out.append(ord(phrase))
            tdict[phrase + currChar] = code
            code += 1
            phrase=currChar
        
    
    if len(phrase) > 1:
        out.append(tdict[phrase])
    else:
        out.append(ord(phrase))
    for i in range(len(out)):
        out[i] = chr(out[i])
    
    return "".join(out)


def lzw_decode(s):
    tdict = {}
    data = list(s)
    currChar = data[0]
    oldPhrase = currChar
    out = [currChar]
    code = 256
    phrase = ''
    for i in range(1,len(data)):
        currCode = ord(data[i][0])
        if currCode < 256:
            phrase = data[i]
        else:
            if currCode in tdict and tdict[currCode]:
                phrase = tdict[currCode]
            else:
                phrase = (oldPhrase + currChar)
            
        out.append(phrase)
        currChar = phrase[0]
        tdict[code] = oldPhrase + currChar
        code += 1
        oldPhrase = phrase
    return ''.join(out)




