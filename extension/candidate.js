var GalleryCandidate = function(gallery){
	this.gallery = gallery;
	this.init();
	this.self = this;
}
GalleryCandidate.prototype.previousKeyowrds = [];
GalleryCandidate.prototype.previousElements = null;
GalleryCandidate.prototype.candidateDiv = null;
GalleryCandidate.prototype.gallery = null;
GalleryCandidate.prototype.enabled = true;
GalleryCandidate.prototype.delayTimer = null;
GalleryCandidate.prototype.init = function(){
	var self = this;

	$("#input_big, #input_small").livequery('keydown click', function(e){ 
		if(!self.enabled) return;
		var parent = $(this).parents('#main_poster, .mini_form').get(0)
		if(e.keyCode == 13 || e.keyCode == 16 || $(this).val() == '' ) return; 
		clearTimeout(self.delayTimer); self.delayTimer = setTimeout(function(){ self.show(parent); } , 250); 
	});


	$("#input_big, #input_small").livequery('keydown keyup', function(e){  //按下 Enter 隱藏
		if(!self.enabled) return;
		self.candidateDiv = $(this).find(".candidate");
		if(e.keyCode == 13) self.candidateDiv.fadeOut('fast',function(){ $(this).remove()});
	});	

	setInterval(function(){
		if(!self.enabled) return;
		if($("#input_big").length && $("#input_big").val().length == 0) $("#main_poster .candidate").fadeOut('fast', function(){ $(this).remove()});
		if($("#input_small").length && $("#input_small").val().length == 0) $(".mini_form .candidate").fadeOut('fast', function(){ $(this).remove()});
	}, 200);

	$(".cmp_plurk").live('click', function(e){ 
		if(!self.enabled) return;
		self.candidateDiv = $(".candidate");
		if(e.keyCode == 13) self.candidateDiv.fadeOut('fast',function(){ $(this).remove()});
	});	

	$("#input_big, #input_small").livequery('keydown', function(e){
		if(!self.enabled) return;  
		return self.selectByKey(e, this); 
	});

	function setFocus(){
		if(!self.enabled) return;
		self.gallery.lastInputFocused = this;
	}
	$("#main_poster textarea, .mini_form textarea").livequery("focus", setFocus);

}
GalleryCandidate.prototype.destroy = function(){

}
GalleryCandidate.prototype.prepare = function(emotions, parent){

	var self = this;
	
	if(JSON.stringify(emotions) == this.previousElements && self.candidateDiv.children().length > 0){
		self.candidateDiv.removeAttr('style').show();
		return;
	}
	this.previousElements = JSON.stringify(emotions);
	
	
	var c=0
	
	var buffer = $("<div class='__emotionBuffer'/>").hide() //.appendTo('body');

	if(!emotions.length) return;

	if(emotions.length > 100) emotions.length = 100;

	_.each(emotions, function(emoticon){

		if(emoticon.skip) return true;
		if(typeof emoticon.match == 'undefined') emoticon.match = 0;
		if(typeof emoticon.type == 'undefined') emoticon.type = "custom";
		if(typeof emoticon.sortWeight == 'undefined') emoticon.sortWeight = 0;
		
		c++; if(c > 100) return false;
		
		var td = $("<div style='width:48px;text-align:center; position:relative; cursor:pointer;' />").data('emotion', emoticon).css('display', 'inline-block').appendTo(buffer);
		
		if($.inArray(emoticon.keyword, self.previousKeyowrds) == -1) td.hide().delay(25*c).fadeIn('fast');

		var tag = $("<span style='position:absolute; cursor:default; top:-15px; left:0px; font-size:12px; ; color:#ccc ;z-index:99;display:block; text-overflow:clip; overflow:hidden;white-space: nowrap; max-width:48px;'/>").appendTo(td);
		if(c < 10) tag.text("Alt + " + c).css('color', '#CF5A00');
		else tag.text(emoticon.keyword);
			
		var emo = $('<a class="a_emoticon canadite" style="position:relative" />')
			.attr('url', emoticon.url)
			.attr('alt', emoticon.keyword)
			.attr('match', emoticon.match)
			.attr('type', emoticon.type)
			.attr('isFavorite', ((typeof emoticon.favorite != 'undefined') ? "1" : "0"))
			.attr('title', emoticon.keyword + ((typeof emoticon.favorite != 'undefined') ? " \n"+__("使用頻率") +": "+emoticon.favorite+ "\n" + __("排序權重") + ": " +Math.round(emoticon.sortWeight*100)/100 : "\n" + __("排序權重") + ": " + Math.round(emoticon.sortWeight*100)/100) )
			.attr('sortWeight', Math.round(emoticon.sortWeight*100)/100 )
			.data('emotion', emoticon)
			.html("<img src='"+emoticon.url+"' style='max-width: 50px; max-height: 50px;' />")
			.appendTo(td);


		td.bind("click", function(e){  
			
			var type = $(this).find('a').attr("type");
			var isCustom = (type == "custom");
			var isDefault = (type == "default");
			var url = $(this).find('a').attr("url");
			var keyword = $(this).find('a').attr("alt");
			var match = $(this).find('a').attr("match");
			var isFavorite = $(this).find('a').attr("isFavorite") == "1";
			
			if( ((!isMac && e.ctrlKey) || isMac && e.metaKey) && e.shiftKey){ //ctrlKey delete
				if(!isFavorite) return false;
				var e = $(this).find('a');
				//var ok = confirm("從常用表情中移除 "+ keyword +" 嗎 (不會移除圖庫中的表情)");
				//if(ok) {
					EmoticonsStorage.removeFavorite(url);
					self.show(parent);
				//}
			}else if(e.shiftKey && isCustom){ //ShiftKey rename
				var e = $(this).find('a');
				var newKeyword = prompt(__("重新命名 %s").replace('%s', keyword) + " : ",  keyword );
				if(newKeyword && newKeyword != "" && newKeyword != keyword) {
					self.gallery.storage.online.removeEmotion(url, function(){	//從自訂表情刪除
						self.gallery.storage.renameEmotion(url, keyword, newKeyword, function(){
							self.show(parent);
						});
					});
					EmoticonsStorage.renameFavorite(url, newKeyword);
					self.show(parent);
				}
			}else if( ((!isMac && e.ctrlKey) || isMac && e.metaKey)  && isCustom ){ //ctrlKey delete
				var e = $(this).find('a');
				var ok = confirm( __("你確定要刪除 %s 嗎").replace('%s', keyword));
				if(ok) {
					self.gallery.storage.online.removeEmotion(url, function(){
						self.gallery.storage.deleteEmotion(keyword, function(emotions){
							$(e).animate({opacity: 0.1}, 500).unbind('click');
						});
					});
					EmoticonsStorage.removeFavorite(url);
					//
				}
			}else{
				if(e.altKey) $(this).find('a').removeAttr('match');
				var e = new Emotion($(this).data('emotion'));
				self.candidateDiv.fadeOut('fast', function(){ $(this).remove()})
				if(isCustom){ 
					EmoticonsStorage.addFavorite(e);
					self.gallery.operateEmoticonClick(emoticon, emo, function(){
						self.candidateDiv.fadeOut('fast', function(){ $(this).remove()})
					});
				}else{
					self.gallery.useDefaultSmile(keyword, match);
					self.candidateDiv.fadeOut('fast', function(){ $(this).remove()})
				}
			}
			
			return false; 
		} );
	})
					
	if(emotions.length > 0 && !emotions[0].skip) for(var i in emotions){ 
		

	}
	
	if(emotions.length == 0  ||  emotions[0].skip){ 
		self.candidateDiv.fadeOut('fast',function(){ $(this).remove()})
	}else{
		self.candidateDiv.removeAttr('style').show().empty();
		buffer.children().appendTo(self.candidateDiv);				
	}		
	
	buffer.remove();
} // End prepare

GalleryCandidate.prototype.show = function(parent){

	var self = this;
	var parent = $(parent);
	var input = self.gallery.lastInputFocused;
	var value = input.value.substr(0, input.selectionStart).replace(/^\s*/, '')/*.replace(/\s*$/, '')*/;

	self.candidateDiv = parent.find(".candidate").length ? parent.find(".candidate") : $("<div class='candidate' />")
			.css({
				'width' 	: '99%',
				'z-index'	: '199',
				'background': 'white'
			}).appendTo(parent.find(".input_holder")).hide();
			

	self.candidateDiv.find('div').each(function(){
		self.previousKeyowrds.push($(this).find('a').attr('alt'));
	});
	
	
	//show favorite
	if(input.value.substr(0, input.selectionStart).match(/\s+$/)){
		self.prepare(EmoticonsStorage.getFavorites().slice(0, 60), parent);
		return;
	}
	
	// Process keywords
	var keywords = [];
	for( i = value.length-1; i > value.length-8; i--){
		var k = value.substr(i, value.length);
		if(k == keywords[keywords.length]) break;
		if(k.length == 1 && k.match(/^[0-9a-zA-Z]{1}$/)) continue;
		if(k.length > 1 && k.match(/[ㄦㄢㄞㄚㄧㄗㄓㄐㄍㄉㄅㄣㄟㄛㄨㄘㄔㄑㄎㄊㄆㄤㄠㄜㄩㄙㄕㄒㄏㄋㄇㄥㄡㄝㄖㄌㄈ]$/)) keywords.push(k.substr(0, k.length-1));
		keywords.push(k);
	};

	if(keywords.length == 0) return false;
	
	//show keyword-filtered
	self.getDefaultSmiles(function(defaultSmiles){
		self.gallery.storage.loadEmotions(function(emotions){
			for(var i in defaultSmiles){ 
				//defaultSmiles[i].alive = true;
				defaultSmiles[i].type = "default";
				defaultSmiles[i].hash_id = "";
			}
			
			for(var i in emotions) emotions[i].type = 'custom';
			emotions = emotions.concat(defaultSmiles);
			
			var favEmotions = EmoticonsStorage.getFavorites();
			
			var maxFav = (favEmotions.length) ? favEmotions[0].favorite : 1;
			for(var i in emotions){ 
				emotions[i].match = emotions[i].sortWeight = 0;
				for(var k in keywords){ // for all keyword patterns
					var kw = keywords[k].toLowerCase(); if(kw.match(/^\s*$/)) continue; // skip empty keyword match
					var ek = emotions[i].keyword.toLowerCase();
					var ea = (typeof emotions[i].alias == 'string') ? emotions[i].alias.toLowerCase() : "";
					try{
						//Matches a new keyword pattern and the pattern longer then previous one
						if(Math.max(ek.indexOf(kw), ea.indexOf(kw)) != -1 && kw.length > emotions[i].match){
							emotions[i].match = kw.length;
							emotions[i].sortWeight = Math.max(emotions[i].match*2.5 - (Math.max(ek.indexOf(kw), ea.indexOf(kw)) + 1)*emotions[i].match*0.2, emotions[i].sortWeight);
						}
							emotions[i].skip = (emotions[i].match == 0) ? true : false;
					}catch(e){
						console.log(emotions[i]);
					}
				}
				for(var f in favEmotions){
					if(!emotions[i].skip && emotions[i].url == favEmotions[f].url){
						emotions[i].sortWeight *= (1.8 + (favEmotions[f].favorite/maxFav));
						break;
					} 
				}
			}
			
			
			function sortByWeight(a, b){
				if(a.sortWeight == b.sortWeight) return 0;
				return  a.sortWeight > b.sortWeight ? -1 : 1;
			}

			emotions.sort(sortByWeight);
			self.prepare(emotions, parent); 
		});	
	})

}

GalleryCandidate.prototype.getDefaultSmiles = function(callback){
	return this.gallery.storage.online.getDefaultSmiles(callback);
}

GalleryCandidate.prototype.selectByKey =  function(e, parent){
	//var candidateDiv = $(parent).find(".candidate"); 
	var candidateDiv = $(parent).siblings('.candidate');
	var key = Keycode.getValueByEvent(e);
	var self = this;
	if((e.altKey) &&  new String(key).match(/[0-9]/)){
		evt = $.Event("click");
		if( ((!isMac && e.ctrlKey) || isMac && e.metaKey)  ) evt.altKey = true;
		clearTimeout(self.delayTimer);
		candidateDiv.find('div').eq(parseInt(key)-1).trigger(evt)
		candidateDiv.fadeOut('fast', function(){ $(this).remove()});
		return false;
	}
}


function CandidatePlugin(gallery){
	this.gallery = gallery
	this.title =  __('表符快速輸入法 (不建議關閉)');
	this.parent();
}

CandidatePlugin.prototype =  Object.create(Plugin.prototype) 
CandidatePlugin.prototype.parent = Plugin;

CandidatePlugin.prototype.gallery = null;
CandidatePlugin.prototype.candidate = null;
CandidatePlugin.prototype.start = function(){
	this.candidate = this.candidate || new GalleryCandidate(this.gallery);
	this.candidate.enabled = true;
}
CandidatePlugin.prototype.stop = function(){
	this.candidate.enabled = false;
	$("#main_poster .candidate, .mini_form .candidate").fadeOut('fast', function(){ $(this).remove()});
}

