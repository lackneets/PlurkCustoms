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
	var localVariable = new LocalVariableListener(variable);
	localVariable.listen(callback);
}

function LocalVariableListener(variable){
	if(LocalVariableListener.listeners[variable]){
		return LocalVariableListener.listeners[variable];
	}
	this.hash = Number(new Date).toString(36).toUpperCase();
	this.variable = variable;
	this.subscribe();
	LocalVariableListener.listeners[variable] = this

}
LocalVariableListener.prototype.subscribe = function(){
	localScript(function(args){
		setInterval(function(){
			try{
				sessionStorage.setItem('_variable_listener_' + args.hash + '_' + args.variable, JSON.stringify(eval(args.variable)));
			}catch(e){
				sessionStorage.setItem('_variable_listener_' + args.hash + '_' + args.variable, JSON.stringify(null));
			}
		}, 100);
	}, {variable: this.variable, hash: this.hash});

}
LocalVariableListener.prototype.listen = function(callback){
	setTimeout(function(){
		var value;
		try{
			value = JSON.parse(sessionStorage.getItem('_variable_listener_' + this.hash + '_' + this.variable));
		}catch(e){
			value = null;
		}
		callback && callback(value);
	}.bind(this), 150);
}
LocalVariableListener.listeners = {};

