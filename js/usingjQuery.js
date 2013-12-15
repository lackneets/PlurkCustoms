function usingjQuery(callback){
	if(typeof jQuery == 'function'){
		if(typeof callback == 'function') callback(jQuery);
	}else{
		if(typeof window.$ != 'undefined'){
			arguments.callee.$ = window.$;
			console.log('window.$', window.$);
		}
		if(!arguments.callee.loading){
			arguments.callee.loading = true;
			var script = document.createElement('script'); 
			script.type = 'text/javascript'; 
			script.src = jQueryPath;
			document.body.appendChild(script);
		}
		
		var interval = setInterval(function(){
			if(typeof jQuery == 'function'){
				jQuery.noConflict();
				clearInterval(interval);
				if(typeof callback == 'function') callback(jQuery);
				console.log("jQuery is ready");
				arguments.callee.loading = false;
				if(typeof arguments.callee.$ != 'undefined'){
					 window.$ = arguments.callee.$;
					 arguments.callee.$ = null;
					 delete arguments.callee.$;
				}
			}else{
				console.log("Waiting jQuery....");
			}
		}, 500);
	}
}