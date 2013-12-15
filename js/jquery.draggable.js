jQuery.fn.draggable = function(options){

	if(!options) options = {}
	var _opt = $(this).data('options') || {};
	for(var i in options){ _opt[i] = options[i]; }
	options = _opt;
	$(this).data('options', options);
	
	console.log(options);
	

	var mTarget = $(this).get(0);
	var eTarget = options.attachTo ? $(this).find(options.attachTo).get(0) : mTarget;
	
	if(options.disabled == true){
		$(mTarget).data('_disabled', 'true');
		$(eTarget).css('cursor', 'auto');
	}else{
		$(mTarget).data('_disabled', 'false');
		if(options.cursor) $(eTarget).css('cursor', options.cursor);
	}
	
	if($(mTarget).data('_draggable') == 'enabled') return false;
	
	$(mTarget).data('_draggable', 'enabled')
	$(mTarget).css('position', 'absolute')
	
	
	
	function int(x){ var i = parseInt(x); return isNaN(i) ? 0: i; }
	function blockevent(e){
		var e = e ? e : window.event;
		
		e.stopPropagation();
		e.returnValue = false;
		return false;
	}
	function dragStart(e){
		var e = e ? e : window.event;
		var o = e.target ? e.target : e.srcElement;
		
		if($(mTarget).data('_disabled') == 'true') return false;
		
		$(mTarget).data('_x', (e.clientX - int(mTarget.style.left)));
		$(mTarget).data('_y', (e.clientY - int(mTarget.style.top)));
		$(mTarget).addClass('ondrag');
		$(eTarget).addClass('ondrag');
		
		$(document).data('_drag', 'true');
		$(document).data('_dragObj', mTarget);
		
		e.stopPropagation();
		e.returnValue = false;
		return false;
	}
	function dragEnd(e){
		var e = e ? e : event;
		var o = e.target ? e.target : e.srcElement;
		
		var mTarget = $(document).data('_dragObj');
		$(eTarget).removeClass('ondrag');
		$(mTarget).removeClass('ondrag');
		
		$(document).data('_drag', 'false');
	}
	function dragMove(e){
		var e = e ? e : event;
		
		if($(document).data('_drag') != 'true'){
		}else{
			
			var o = $(document).data('_dragObj');

			var _x = e.clientX - int($(o).data('_x'));
			var _y = e.clientY - int($(o).data('_y'));
			
			if(o.offsetParent){
				if( ( o.offsetWidth + _x )  > o.offsetParent.offsetWidth ) _x = o.offsetParent.offsetWidth - o.offsetWidth
				if( ( o.offsetHeight + _y )  > o.offsetParent.offsetHeight ) _y = o.offsetParent.offsetHeight - o.offsetHeight
				if( _x < 0) _x = 0;
				if( _y < 0) _y = 0;
			}
			
			o.style.left = _x + 'px '
			o.style.top = _y + 'px '
		}
	}
	
	if(options.ignore) $(eTarget).find( options.ignore ).each(function(){
		with($(this).get(0)){
			addEventListener('mousedown', blockevent);
		}
	})
	
	with(eTarget){
		addEventListener('mousedown', dragStart);
		addEventListener('mousemove', dragMove);
		addEventListener('mouseup', dragEnd);
	}
	with(document){
		addEventListener('mousemove', dragMove)
		addEventListener('mouseup', dragEnd)
	}
	return $(this);
}