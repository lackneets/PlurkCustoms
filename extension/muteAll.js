(function($){
	
	var token;
	var uid;
	var busy = false;
	var muteAllButton;
	
	try{
		token = $("body").html().match(/token=([\d\w]+)/)[1];
		uid = $("body").html().match(/user_id=([\d]+)/)[1];
	}catch(e){
		return false;
	}
	
	function localScript(scriptText, args){
		var args = JSON.stringify(args);
		//if(typeof scriptText == 'function') scriptText = '(function(args){(' + scriptText + ')();})('+args+');';
		if(typeof scriptText == 'function') scriptText = '(' + scriptText + ')('+args+');';
		var script = document.createElement('script'); 
		script.type = 'text/javascript'; 
		script.appendChild(document.createTextNode(scriptText));
		document.body.appendChild(script);	
		setTimeout(function(){
			document.body.removeChild(script);
		}, 300)
	}	
	
	function mutePlurk(plurk_id, mute, callback){
		var value = mute ? '2' : '0';
		$.ajax({
			url: "//www.plurk.com/TimeLine/setMutePlurk",
			data: {plurk_id: plurk_id, value: value },
			type: "POST", cache: false,
			success: function(data){
				if(callback) callback();
			}
		});
	}

	function done(){
		busy = false;
		NProgress.done(true);
		muteAllButton.fadeIn('fast');
	}

	function muteAll(){

		if(busy) return false;
		if(NProgress.status){
			alert(__('忙碌中請稍後再試'));
			return false;
		}

		busy = true;
		muteAllButton.fadeOut('fast');

		NProgress.configure({ minimum: 0.005 ,
			template: '<div class="bar mute" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
		});
		NProgress.start(0.3);
		
		$.ajax({
			url: "//www.plurk.com/Users/getUnreadPlurks",
			data: {known_friends: JSON.stringify([uid]) },
			type: "POST", cache: false,
			success: function(dataJSON){

				var data = eval('(' + dataJSON + ')'); 
				for(var i=0; i < data.unread_plurks.length; i++) if(data.unread_plurks[i].owner_id == uid || data.unread_plurks[i].plurk_type > 1) { data.unread_plurks.splice(i,1); i--; }	
				
				var total = data.unread_plurks.length; 
				
				if(total == 0){ 
					done();
					return false;
				}
				var ok = confirm( __("確定要消音 %d 則未讀噗嗎? (不包含已回應過)").replace('%d', total) ); 
				var ids = [];
				if(!ok){ 
					done();
					return false;
				}
				
				for(var i in data.unread_plurks) ids.push(data.unread_plurks[i].plurk_id);
				mutePlurks(ids);
			}
		});
	}	
	
	function mutePlurks(ids){

		ids.sort(function(a,b){return b-a});

		var progress = 0;
		var total = ids.length;
		var muted = 0;
		for(var i in ids) { (function(id){
			setTimeout(function(){
				$.ajax({
					url: "//www.plurk.com/TimeLine/setMutePlurk",
					data: {
						plurk_id: id,
						value: 2 
					},
					type: "POST", cache: false,

					xhr: function() {
				        var xhr = jQuery.ajaxSettings.xhr();
				        if(xhr instanceof window.XMLHttpRequest) {
							xhr.addEventListener('readystatechange', function(){
								if(xhr.readyState >=2){
									xhr.abort();
									localScript('if(Plurk.getById('+id+')) Poll.setPlurkRead("'+id+'", Plurk.getById('+id+').response_count)');
									localScript('if(Plurk.getById('+id+')) Plurk.getById('+id+').is_unread=2;');
									localScript('Signals.sendSignal("plurk_muted","'+id+'")');
									$("#p" + id).addClass('muted').removeClass('new').find('.manager .mute').addClass('unmute').html('Muted');

									muted++; 
									var currentProgress = Math.round((muted / ids.length)*100)/100;

									if(muted == total){
										done();
									}

									if((currentProgress < 1) && (currentProgress - progress >= 0.1)){
										progress = currentProgress;
										NProgress.set(currentProgress);
									}

								}
							}, false);

				        }
				        return xhr;
					}
				});				
			}, i*20)
		})(ids[i])}
	}


	setInterval(function(){

		if($("#noti_re_actions .updater_link").length == 2 ){
			muteAllButton = $("<a class='updater_link muteAll' href='#' >")
				.css('margin-left', '15px')
				.html("<span>✖ "+__('全部消音')+"</span>")
				.appendTo("#noti_re_actions")
				.click(function(){ muteAll(); return false; });
		}
		
		var plurkManager = $(".plurk .manager:has(.delete)");
		if(plurkManager.length){
			
			if(plurkManager.find(".mute").length == 0){
				var plurkBox = plurkManager.parents(".plurk");
				var plurkId = plurkBox.attr('id').match(/\d+/)[0];
				var muted = plurkBox.hasClass('muted');
				var muteBtn = muted 
					? $("<a class='mute delete unmute' href='#'>"+__("解除消音")+"</a>")
					: $("<a class='mute delete' href='#'>"+__("消音")+"</a>");
				muteBtn.click(function(){
					mutePlurk(plurkId, !muted, function(){
						muteBtn.text(!muted ? __("解除消音") : __("消音"))
						plurkBox.toggleClass('muted');
					})
					return false;
				});
				muteBtn.prependTo(plurkManager);
			}
		}

	}, 200);

})(jQuery);