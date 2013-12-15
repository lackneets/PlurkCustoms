/*if(! Element.prototype.hasDOMAttrModified ){
	Element.prototype.hasDOMAttrModified = true;
	Element.prototype._setAttribute = Element.prototype.setAttribute
	Element.prototype.setAttribute = function(name, val) { 
		var prev = this.getAttribute(name); 
		this._setAttribute(name, val);
		if(name.match(/^(class|id|href|src)$/)){
			var e = document.createEvent("MutationEvents"); 
			e.initMutationEvent("DOMAttrModified", true, true, null, prev, val, name, 2);
			this.dispatchEvent(e);
		}
	}	
}*/

$.wait = function(selector, callback, continuous){

	var foundElements = [];
	var obj = $(selector);
	var delayTime = 0;

	if( obj.length > 0  && typeof callback == 'function' ) {
		callback.call(obj.get(0), obj);
	}else{
		var delay = function(){
			var now = new Date().getTime();
			if(now - delayTime < 500){
				return true;
			}else{
				delayTime = now;
				return false;
			}
		}
		var childrenFinder = function(e){
			var obj = $(e.target).find(selector);
			//console.log('childrenFinder', e.target, e);
			if(obj.length == 0) return;
			var found = hasFound(obj);
			if(delay()) return;
			//if(found) return false;
			clearAllListener();
			callback.call(obj, obj);
		}
		var listener = function(e){
			var obj = $(e.currentTarget);
			var found = hasFound(obj);
			if(delay()) return;
			//if(found) return false;
			clearAllListener();
			callback.call(obj, obj);
		}
		var hasFound = function(element){
			var found = false;
			element = element instanceof jQuery ? element.get(0) : element;
			$.each(foundElements, function(){
				if(this === element) {
					found = true;
					return false;
				}
			})
			if(found){
				return true;
			}else{
				foundElements.push(element);
				return false;
			}
		}
		var subtreeListener = function(e){
			var obj = $(e.currentTarget);
			var found = hasFound(obj);
			if(found) return false;
			clearAllListener();	
			callback.call(obj, obj);
		}
		var attrListener = function(e){
			var obj = $(e.currentTarget);
			var found = hasFound(obj);
			if(found) return false;
			clearAllListener();
			callback.call(obj, obj);	
		}
		var clearAllListener = function(){
			if(! continuous ) $(document).off('DOMNodeInserted', selector, listener);
			if(! continuous ) $(document).off('DOMNodeInserted', childrenFinder);
			//if(! continuous ) $(document).off('DOMSubtreeModified', selector, subtreeListener);
			if(! continuous ) $(document).off('DOMAttrModified', selector, attrListener);			
		}
		$(document).on('DOMNodeInserted', selector, listener);	
		$(document).on('DOMNodeInserted', childrenFinder);	
		//$(document).on('DOMSubtreeModified', selector, subtreeListener);
		$(document).on('DOMAttrModified', selector, attrListener);	
	}
}
/*
 Old Quick version
$.wait = function(selector, callback, loop){
	var i = setInterval(function(){
		if($(selector).length > 0 && typeof callback == 'function'){
			var obj = $(selector);
			if(! loop ) clearInterval(i);
			callback.call(obj, obj);
		} 
	}, 50);
}

*/