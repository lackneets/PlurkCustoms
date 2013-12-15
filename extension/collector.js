function CollectorPlugin(gallery){
	this.gallery = gallery
	this.title =  __('表符收集器');
	this.parent();
}
CollectorPlugin.prototype =  Object.create(Plugin.prototype) /* new Plugin()*/ /*Plugin.prototype*/;
CollectorPlugin.prototype.parent = Plugin;

CollectorPlugin.prototype.start = function(){
	var self = this;
	$(document).on('mouseover', ".plurk img[src*='emos.plurk.com']:not(.new):not(.exist), #emotiland img[src*='emos.plurk.com']:not(.new):not(.exist)", function(event){
		//console.log(this, self);
		self.collectable.apply(self, [$(event.currentTarget)]);
	});
}
CollectorPlugin.prototype.stop = function(){
	$(document).off('mouseover', ".plurk img[src*='emos.plurk.com']:not(.new):not(.exist), #emotiland img[src*='emos.plurk.com']:not(.new):not(.exist)");
}
CollectorPlugin.prototype.collectable = function(img){
	var self = this;
	this.gallery.storage.loadEmotions(function(emoticons){
		for(var i in emoticons) if(img.attr('src').match(emoticons[i].hash_id)){
			img.addClass('exist');
			img.attr('title', emoticons[i].keyword);
			return;
		}
		img.addClass('new').attr('title', __('點選以蒐集這張圖片')).unbind('click').bind('click', function(){
			var url = img.attr('src');
			var defaultKeyword = img.attr('keyword');
			var keyword = prompt(__("請為這張圖片取一個名字"), defaultKeyword || __("表情"));
			if(keyword && keyword.replace(/\s*/, '') != ""){
				self.gallery.storage.saveEmotion(url, keyword, function(emotions){
					img.removeAttr('title').removeClass('new').unbind('click');
					img.attr('title', keyword);
				});
			}
		});	
	});
}
