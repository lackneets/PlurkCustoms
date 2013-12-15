function localScript(scriptText, args){
	var args = JSON.stringify(args);
	if(typeof scriptText == 'function') scriptText = '(' + scriptText + ')('+args+');';
	var script = document.createElement('script'); 
	script.type = 'text/javascript'; 
	script.appendChild(document.createTextNode(scriptText));
	document.getElementsByTagName('head')[0].appendChild(script);	
	setTimeout(function(){document.getElementsByTagName('head')[0].removeChild(script);}, 200)
}
function loadScript(file){
	var xhrObj = new XMLHttpRequest();
	xhrObj.open('GET', chrome.extension.getURL(file), false);
	xhrObj.send('');
	var se = document.createElement('script');
	se.setAttribute('ref', file);
	se.type = "text/javascript";
	se.text = xhrObj.responseText;
	document.getElementsByTagName('head')[0].appendChild(se);
}
function loadStyle(file){
	var xhrObj = new XMLHttpRequest();
	xhrObj.open('GET', chrome.extension.getURL(file), false);
	xhrObj.send('');
	var style = document.createElement('style');
	style.type = 'text/css';

	if (style.styleSheet){
	  style.styleSheet.cssText = xhrObj.responseText;
	} else {
	  style.appendChild(document.createTextNode(xhrObj.responseText));
	}
	document.getElementsByTagName('head')[0].appendChild(style);
}

function createStyle(targetDocument, style){
	var eStyle = targetDocument.createElement('style');
	eStyle.setAttribute("type", "text/css");

	if (eStyle.styleSheet) {   // IE
	    eStyle.styleSheet.cssText = style;
	} else {                // the world
	    var tStyle = targetDocument.createTextNode(style);
	    eStyle.appendChild(tStyle);
	}
	var eHead = targetDocument.getElementsByTagName('head')[0];
	eHead.appendChild(eStyle);
	return eStyle;
}

function getLocal(variable, callback){
	var id = '__getLocal__' + (new Date()).getTime();
	var container = $('#__getLocal__protocal').get(0) || $('<div id="__getLocal__protocal">').appendTo(document.body).get(0);
	localScript(function(args){
		var e = document.createElement('div');
		var t = document.createTextNode(JSON.stringify(eval(args.variable)));
		e.id = args.id;
		e.style.display = 'none';
		e.appendChild(t);
		document.getElementById('__getLocal__protocal').appendChild(e);

	}, {variable: variable, id: id})
	function retrive(){
		var e = document.getElementById(id);
		if(e){
			callback(JSON.parse(e.firstChild.nodeValue));
			document.getElementById('__getLocal__protocal').removeChild(e);
		}else{
			setTimeout(retrive, 200);
		}
	}
	setTimeout(retrive, 200);
}