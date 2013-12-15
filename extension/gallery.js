var Gallery = function(storage){
	this.storage = storage;
	this.init();
}

Gallery.prototype.storage = null;
Gallery.prototype.lazyLoader = null;
Gallery.prototype.galleryTab = null;
Gallery.prototype.emoticonsPanel = null;

Gallery.prototype.galleryFilterValue = '';
Gallery.prototype.galleryTable = null;

Gallery.prototype.tabWrapperGallery = null;
Gallery.prototype.tabWrapperBackup = null;
Gallery.prototype.tabWrapperSetting = null;

Gallery.prototype.lastInputFocused = null;
Gallery.prototype.panelScrollTop = 0;

Gallery.prototype.emotionUsed = [];
/*Gallery.prototype.emotionUplaoded = [];
Gallery.prototype.emotionRemoved = [];*/

Gallery.prototype.lazyLoaders = {};
Gallery.prototype.tabs = {};
Gallery.prototype.panelWrappers = {};

Gallery.prototype.plugins = {};

Gallery.prototype.currentClassName = '';

Gallery.prototype.init = function() { 
	var	self = this;
	$("#main_poster .smily_holder img").live("click",function(){
		self.lastInputFocused = document.getElementById('input_big');
	});
	$(".mini_form .smily_holder img").live("click",function(){
		self.lastInputFocused = document.getElementById('input_small');
	});
	
	$(".cmp_emoticon_on, .cmp_emoticon_off, #main_poster .emoticon_selecter_img_on, #main_poster .emoticon_selecter_img_off").live("click",function(){
		self.lastInputFocused = document.getElementById('input_big');
	});
	$(".cmp_emoticon_mini_on, .cmp_emoticon_mini_off, .mini_form .emoticon_selecter_img_on, .mini_form .emoticon_selecter_img_off").live("click",function(){
		self.lastInputFocused = document.getElementById('input_small');
	});
	
	$(".private_plurk_form .smily_holder img").live("click",function(){
		self.lastInputFocused = document.getElementById('input_big_private');
	});
	$(".private_plurk_form .smily_holder img").live("click",function(){
		self.lastInputFocused = document.getElementById('input_big_private');
	});

	$('.emoticon_selecter_img_off').livequery('click',function(){
		self.generateGalleryTab();
	})

	$('#emoticon_selecter').livequery(function(){
		self.generateGalleryTab();
	})
}

Gallery.prototype.getPanel = function(){

	var self = this;
	//this.generateGalleryTab();

	// 隱藏官方面板
	$('#emoticon_selecter #emoticon_holder_super_parent').hide();

	if(self.emoticonsPanel){
		this.loading.show();
		return self.emoticonsPanel.show().children(':not(.loading)').hide().end();
	}else{
		var panel = self.emoticonsPanel = $($('#emoticons_show').get(0) || $('<div id="emoticons_show" />').css('height', '250px').prependTo('#emoticon_selecter')).show().children().hide().end();
		var loading = self.loading = self.loading || $('<div/>', { class: 'loading',
			text: 'Loading...'
		}).appendTo(panel).show();

		//RPlurkSmileys 會把它刪掉
		if(loading.parent().length == 0){
			loading.appendTo(panel).show();
		}

		$('#emoticons_tabs li[id^=emo_]').click(function(){
			$('#emoticon_selecter #emoticon_holder_super_parent').show();
			$('#emoticons_show').hide();
		});
		$(panel).css({'position': 'relative'});
		$(panel).click(function(e){ 
			e.stopPropagation();
		});
		self.galleryTab = panel;
		return self.emoticonsPanel;
	}
}
Gallery.prototype.registerPlugin = function(plugin, id){
	if(plugin instanceof Plugin){
		this.plugins[id] = plugin;
		if(localStorage.getItem("gallery_plugin_"+id) == null){
			localStorage.setItem("gallery_plugin_"+id, plugin.enabled ? 'true' : 'false');
			plugin.start();
		} else if(localStorage.getItem("gallery_plugin_"+id) == 'true'){
			plugin.start();
		} else {
			plugin.disable();
		}
		plugin.ondisable = function(){
			localStorage.setItem("gallery_plugin_"+id, 'false');
		}
		plugin.onenable = function(){
			localStorage.setItem("gallery_plugin_"+id, 'true');
		}
	}
}
Gallery.prototype.registerTab = function(className, opener, label){
	var self = this;

	$("#emoticons_tabs ul:first").livequery(function(){
		console.log('registerTab', className, label);
		if(self.tabs[className]){
			return false;
		}
		var wrapper = self.panelWrappers[className] = self.panelWrappers[className] || $('<div/>', { class: 'tabWrapper'})
		.addClass(className)
		.appendTo(self.getPanel());

		var tabsContainer = $(this);
		self.tabs[className] = $('<li>', {
			class: className,
			attr: {title: label, alt: label},
			html: $('<a/>'),
			click: function(e){
				e.preventDefault();
				wrapper.siblings().hide();
				self.currentClassName = className;

				//RPlurkSmileys 會把它刪掉
				if(wrapper.parent().length == 0){
					wrapper.appendTo('#emoticons_show');
				}
				
				//wrapper.show();
				//self.getPanel();
				$(this).siblings().removeClass('current').end().addClass('current');
				// 隱藏官方面板
				$('#emoticon_selecter #emoticon_holder_super_parent').hide();
				$('#emoticons_show').show();

				opener.apply(self, [wrapper.show(), self.loading.show()]);

				self.lazyLoaders[self.currentClassName] && self.lazyLoaders[self.currentClassName].start();
				return false;
			}
		}).appendTo(this);
	});
}
Gallery.prototype.operateEmoticonClick = function(smile, wrapper, callback) { 

	var self = this;

	if( smile.keyword ){
		var keyword 	= smile.keyword;
		var url			= smile.url;
		var match 		= smile.match;
	}else{
		var keyword = $(smile).attr("alt");;
		var url = smile.find('img').attr('src');
		var match = $(smile).attr("match"); if(! match ) match = 0;
	}

	this.emotionUsed = findUsedKeywords($(this.lastInputFocused).val());
	this.emotionUsed.push(keyword);


	if(this.storage.online.isAlive(keyword)){
		self.useEmoticon(keyword, match);
		callback && callback();
		return true;
	}

	this.getRemovableEmoticons(function(removable){
		wrapper.addClass('uploading');

		removable = _.reject(removable, function(e){ 
			return _.contains(self.emotionUsed, e.keyword); 
		});

		if(removable.length + self.emotionUsed.length > 50){
			var toRemove = removable.pop();
			self.storage.online.removeEmotion(toRemove.url, function(){
				uploadAndUse(keyword, url, function(){ wrapper.removeClass('uploading'); });
			});
		}else{
			wrapper.addClass('uploading');
			uploadAndUse(keyword, url, function(){ wrapper.removeClass('uploading'); });
		}
	});

	function uploadAndUse(keyword, url, callback){
		self.storage.online.addEmotion(url, keyword, function(){
			console.log('已上傳', keyword, url);
			self.useEmoticon(keyword, match);
			callback && callback();
		});
	}

	function findUsedKeywords(text){
		var RegExBrackets = /\[([^\]]+)\]/g ;
		var RegExEmosUrl = /http:\/\/emos\.plurk\.com\/[0-9a-f]{32}_w\d+_h\d+\.\w+/g;
		var RegExEmosHash = /[0-9a-f]{32}/g;
		//var brackets = text.match(RegExBrackets);
		var keywords = [];
		while(match = RegExBrackets.exec(text)){
			keywords.push(match[1]);
		}
		return keywords;
	}
}
Gallery.prototype.useEmoticon = function(keyword, backward){
	var self = this;
	if(!backward) backward = 0;
	if ( !this.lastInputFocused  ) this.lastInputFocused = document.getElementById('input_big');
	
	var s = this.lastInputFocused.selectionStart;
	
	if(backward) this.lastInputFocused.value = this.lastInputFocused.value.substr(0, this.lastInputFocused.selectionStart-backward) + this.lastInputFocused.value.substr(this.lastInputFocused.selectionStart, this.lastInputFocused.value.length)
	if(backward) s = s-backward;
	var t = this.lastInputFocused.value;
	var k = "[" + keyword + "]";
	var x = t.substr(0, s) + k + t.substr(s, t.length);
	
	this.lastInputFocused.value = x;
	this.lastInputFocused.setSelectionRange(s + k.length, s + k.length);
}
Gallery.prototype.useDefaultSmile = function(keyword, backward){
	var self = this;
	if(!backward) backward = 0;
	if ( !this.lastInputFocused  ) this.lastInputFocused = document.getElementById('input_big');
	
	var s = this.lastInputFocused.selectionStart;
	
	if(backward) this.lastInputFocused.value = this.lastInputFocused.value.substr(0, this.lastInputFocused.selectionStart-backward) + this.lastInputFocused.value.substr(this.lastInputFocused.selectionStart, this.lastInputFocused.value.length)
	if(backward) s = s-backward;
	var t = this.lastInputFocused.value;
	var k = keyword ;
	var x = t.substr(0, s) + k + t.substr(s, t.length);
	
	this.lastInputFocused.value = x;
	this.lastInputFocused.setSelectionRange(s + k.length, s + k.length);
}
Gallery.prototype.createNewTab = function(){
}
Gallery.prototype.syncFavorites = function(){

	var self = this;


	if(NProgress.status){
		alert(__('忙碌中請稍後再試'));
		return false;
	}

	NProgress.configure({ 
		minimum: 0.005 ,
		template: '<div class="bar sync" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
	});
	NProgress.set(0.0);	
	NProgress.start();	


	self.storage.online.getOnlineEmoticons(function(onlineEmoticons) {
		//console.log(22, onlineEmoticons);
		var favorites = EmoticonsStorage.getFavorites();

		var pool = {};
		var toRemove = [];
		var toUpload = [];

		favorites.length = 50;


		_.each(onlineEmoticons, function(online){
			if(!_.findWhere(favorites, {hash_id: online.hash_id, keyword: online.keyword})){
				toRemove.push(online);
			}
		});

		_.each(favorites, function(favorite){
			if(!_.findWhere(onlineEmoticons, {hash_id: favorite.hash_id, keyword: favorite.keyword})){
				toUpload.push(favorite);
			}
		});


		var process = toRemove.length + toUpload.length;
		var finished = 0;
		var progress = 0;

		if(process == 0){
			NProgress.done(true);
			self.switchTab('gallery online')
		}

		function removePhase(){
			_.each(toRemove, function(emo, i){
				setTimeout(function(){
					self.storage.online.removeEmotion(emo.url, proceed);
				}, i*120);
			});			
		}
		function uploadPhase(){
			_.each(toUpload, function(emo, i){
				setTimeout(function(){
					self.storage.online.addEmotion(emo.url, emo.keyword, proceed);
				}, i*120);
			});			
		}

		function proceed(){
			finished++;
			//console.log(finished, process);
			if(finished == toRemove.length){
				uploadPhase();
			}
			if(finished == process){
				NProgress.done(true);
				self.switchTab('gallery online')
			}else{
				var p = (finished / process);
				if(p - progress > 0.02) {
					progress = p;
					NProgress.set(p);
				}
			}
		}

		if(toRemove.length){
			removePhase();
		}else{
			uploadPhase();
		}

	});
}
Gallery.prototype.switchTab = function(className){
	if(this.panelWrappers[className].is(':not(:visible)')){
		this.tabs[className] && this.tabs[className].click();
	}
}
Gallery.prototype.open = function(className, inputTarget){
	var self = this;
	inputTarget = inputTarget || 'input_big';
	this.lastInputFocused = $('.plurkForm').find('#' + inputTarget).get(0);
	$('#emoticon_selecter .tabWrapper').hide();
	$('#emoticons_tabs').livequery(function(){
		console.log('open:live', className);
		setTimeout(function(){
			console.log('open:click', className);
			self.switchTab(className);
		}, 150);
	})
	localScript("Emoticons.toggle('"+inputTarget+"');");
	self.generateGalleryTab.apply(self, arguments);
}
Gallery.prototype.openGallery = function(){
	var self = this;
	$('#emoticons_tabs li.gallery').livequery(function(){
		self.switchTab('gallery local');
	})
}
Gallery.prototype.showGalleryDefault = function(wrapper, loading){
	var self = this;
	wrapper.empty();
	self.storage.online.getDefaultSmiles(function(emoticons){

		var table = self.generateGalleryTable(emoticons, function(event, emoticon){
			var td 		= $(event.currentTarget);
			var img 	= $(event.currentTarget).find('img');
			var emoWrapper = $(event.currentTarget).find('a');
			var keyword = emoticon.keyword;
			var url 	= emoticon.url;
			self.useDefaultSmile(keyword); 

		}, false);
		wrapper.html(table);
		table.lazyLoader.start();
		loading.fadeOut();

	});
}
Gallery.prototype.showGalleryOnline = function(wrapper, loading){
	var self = this;
	wrapper.empty();
	self.storage.online.getUserEmoticons(function(emoticons){

		var table = self.generateGalleryTable(emoticons, function(event, emoticon){
			var td 		= $(event.currentTarget);
			var img 	= $(event.currentTarget).find('img');
			var emoWrapper = $(event.currentTarget).find('a');
			var keyword = emoticon.keyword;
			var url 	= emoticon.url;
			if((!isMac && event.ctrlKey) || isMac && event.metaKey){
				emoWrapper.addClass('uploading');
				self.storage.online.removeEmotion(url, function(){
					emoWrapper.animate({opacity: 0.1}, 500);
					emoWrapper.removeClass('uploading');
					console.log('已移除', keyword, url);
				});
			}else{
				//self.useDefaultSmile(keyword); 
				self.operateEmoticonClick(emoticon, emoWrapper);
			}

		}, __('%s + 點選刪除 (不會影響圖庫)').replace('%s', (isMac? "⌘" : "Ctrl")));
		wrapper.html(table);
		table.lazyLoader.start();
		loading.fadeOut();

	});
}
Gallery.prototype.showGalleryFavorite = function(wrapper, loading){
	var self = this;
	var favorites = EmoticonsStorage.getFavorites();
	if(favorites.length > 500) favorites.length = 500;
	wrapper.empty();

	var table = self.generateGalleryTable(favorites, function(event, emoticon){
		var td 		= $(event.currentTarget);
		var img 	= $(event.currentTarget).find('img');
		var emoWrapper = $(event.currentTarget).find('a');
		var keyword = emoticon.keyword;
		var url 	= emoticon.url;

		if( ((!isMac && event.ctrlKey) || isMac && event.metaKey) && event.shiftKey){ //ctrlKey delete
			EmoticonsStorage.removeFavorite(url);
			emoWrapper.animate({opacity: 0.1}, 500);
			td.unbind('click');
		}else{
			self.operateEmoticonClick(emoticon, emoWrapper); 
		}
	}, __('%s + Shift + 點選清除 (不會影響圖庫)').replace('%s', (isMac? "⌘" : "Ctrl")));
	wrapper.html(table);
	table.lazyLoader.start();
	loading.fadeOut();
}
Gallery.prototype.showGallerySeen = function(wrapper, loading){
	var self = this;
	var emoticons = EmoticonsStorage.getCollection();
	wrapper.empty();

	this.storage.loadEmotions(function(localEmoticons){

		var now = new Date().getTime();

		emoticons = _.reject(emoticons, function(e){ return _.findWhere(localEmoticons, {hash_id: e.hash_id}); });

		emoticons = _.sortBy(emoticons, function(e){ return (now - e.time)/e.count; });

		if(emoticons.length > 1000) emoticons.length = 1000;

		emoticons = _.map(emoticons, function(emo){
			if( _.where(emoticons, {keyword: emo.keyword}).length > 1){
				emo.keyword = emo.keyword + '_' + emo.hash_id.substr(emo.hash_id.length-5, 5).toUpperCase();
			}
			return emo;
		});		

		var table = self.generateGalleryTable(emoticons, function(event, emoticon){

			var td 		= $(event.currentTarget);
			var img 	= $(event.currentTarget).find('img');
			var emoWrapper = $(event.currentTarget).find('a');
			var keyword = emoticon.keyword;
			var url 	= emoticon.url;


			if( ((!isMac && event.ctrlKey) || isMac && event.metaKey) && event.shiftKey){ //ctrlKey delete
				EmoticonsStorage.removeCollection(url);
				emoWrapper.animate({opacity: 0.1}, 500).unbind('click');
			}else if(event.shiftKey){
				var defaultKeyword = keyword;
				var newKeyword = prompt(__("請為這張圖片取一個名字"), defaultKeyword || __("表情"));
				if(keyword && keyword.replace(/\s*/, '') != ""){
					self.storage.saveEmotion(url, newKeyword, function(emotions){
						emoWrapper.animate({opacity: 0.1}, 500);
						td.unbind('click');
					});
				}
			}else{
				self.operateEmoticonClick(emoticon, emoWrapper); 
			}
		}, __('%s + Shift + 點選清除 / Shift + 點選加到圖庫').replace('%s', (isMac? "⌘" : "Ctrl")));
		wrapper.html(table);
		table.lazyLoader.start();
		loading.fadeOut();

	});
}
Gallery.prototype.showGalleryTab = function(wrapper, loading){

	var self = this;
	var target = self.getPanel();

	self.storage.loadEmotions(function(emotions){

		var json = JSON.stringify(emotions);
		var notModified = self._galleryTabJson && (self._galleryTabJson == json);
		
		self._galleryTabJson = json;

		if( notModified ){
			loading.hide();
			wrapper.show();
			wrapper.table.focusFilter();
			return false;
		}else{
			
			loading.show();
			wrapper.empty();
			var table = self.generateGalleryTable(emotions, function(event, emoticon){
				var td 		= $(event.currentTarget);
				var img 	= $(event.currentTarget).find('img');
				var emoWrapper = $(event.currentTarget).find('a');
				var keyword = emoticon.keyword;
				var url 	= emoticon.url;
				
				if(event.shiftKey){ //ShiftKey rename
					var newKeyword = prompt(__("重新命名 %s").replace('%s', keyword) + " : ",  keyword );
					if(newKeyword && newKeyword != "" && newKeyword != keyword) {
						self.storage.online.removeEmotion(url, function(){ // remove form online
							self.storage.renameEmotion(url, keyword, newKeyword, function(){
								emoWrapper.attr('alt', newKeyword).attr('title', newKeyword + " ("+__('已重新命名')+")").end().addClass('highlighted');
								emoticon.keyword = keyword = newKeyword;
							})
						});
						EmoticonsStorage.renameFavorite(url, newKeyword);
					}
				}else if( ((!isMac && event.ctrlKey) || isMac && event.metaKey) ){ //ctrlKey delete
					var ok = confirm(__("你確定要刪除 %s 嗎").replace('%s', keyword));
					if(ok) {
						self.storage.online.removeEmotion(url, function(){
							self.storage.deleteEmotion(keyword, function(emotions){
								emoWrapper.animate({opacity: 0.1}, 500).unbind('click');
							});
						});
						EmoticonsStorage.removeFavorite(url);
					}
				}else{
					EmoticonsStorage.addFavorite(emoticon);
					self.operateEmoticonClick(emoticon, emoWrapper); 
					return false; 
				}
			});
			
			wrapper.table = table;
			wrapper.show().html(table);
			table.focusFilter();
			table.lazyLoader.start();
			loading.fadeOut();
		}
	});
}
Gallery.prototype.showToolsTab = function(wrapper, loading){
	var self = this;

	var footer = $('<div/>', { class: 'footer',
		css: { 'text-align': 'right' },
		html: [
			"PlurkCustoms " + manifest('version') + " © 2011-2013 噗浪卡卡"
		]
	});

	if(wrapper.children().length){
		loading.hide();
	}else{

		var soundUploader = $('<input/>', {
			attr: {id: 'changeNotificationSoundFile', type: 'file', title: __('更換通知音效')},
			css: {
				cursor: 'pointer',
				position: 'absolute',
				opacity:0
			}
		});

		wrapper.html([
			$('<div>', { class: 'controls',
			html : [
				$('<div>', { class: 'item audio',
					attr: { title: __('更換通知音效') },
					html: [soundUploader],
					css: {overflow: 'hidden' },
					click: function(){
						//localScript('notificationSound()');
						//alert('功能開發中，請期待');
					},
					mousemove: function(e){
						if(e.currentTarget != e.target) return false
						//console.log(e.pageX, e.pageY, e.offsetX-10, e.offsetY-10, e.currentTarget, e.target);
						soundUploader.css({
							top: e.offsetY-10,
							left: e.offsetX-10,
						});
					}
				}),
				$('<div>', { class: 'item sync',
					attr: { title: __('同步處理線上表情') },
					click: function(){
						//alert('功能開發中，請期待');
						self.syncFavorites();
					}
				}),			
				$('<div>', { class: 'item pack', 
					attr: { title: __('打包下載所有表情圖案') },
					click: function(){
						if(downloadEmoticons){
							downloadEmoticons();
						}else{
							alert(__('找不到套件'));
						}
					}
				}),
				$('<div>', { class: 'item backup', 
					attr: { title: __('雲端備份到噗浪') },
					click: function(){
						GalleryBackup.cloudBackup();
					}
				}),				


				//$('<div>', { class: 'item none' , click: function(){ GalleryBackup.test(); }}),
				$('<div>', { class: 'item none' }),
				$('<div>', { class: 'item none' }),
				$('<div>', { class: 'item none' }),			

				$('<div>', { class: 'item author',
					attr: { title: __('作者：小耀博士') },
					click: function(){
						window.open('http://www.plurk.com/Lackneets', '_author');
						return false;
					}
				})
			]
		}),
		footer
		]);

		localScript("NotificationSoundPlugin.attachUploader();");
		loading.fadeOut();


		//$("input[type=checkbox]").switchButton();
	}
}
Gallery.prototype.showSettingTab = function(wrapper, loading){
	var self = this;

	function newSwitch(status, plugin, id){
		var t = plugin.id;
		var el = $('<div class="onoffswitch"><input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="onoffswitch'+t+'" '+(status ? 'checked': '')+'><label class="onoffswitch-label" for="onoffswitch'+t+'"><div class="onoffswitch-inner"></div><div class="onoffswitch-switch"></div></label></div>');
		return el.find('input').change(function(){
			if(this.checked){
				plugin.enable();
			}else{
				plugin.disable();
			}
			localStorage.setItem("gallery_plugin_"+id, plugin.enabled ? 'true' : 'false');
		}).end();
	}

	var controls = $('<div/>', { class: 'controls'});

	var footer = $('<div/>', { class: 'footer',
		css: { 'text-align': 'right' },
		html: [
			"PlurkCustoms " + manifest('version') + " © 2011-2013 噗浪卡卡"
		]
	});

	_.each(this.plugins, function(plugin, id){

		$('<div/>', { class: 'item row', 
			html : [plugin.title, newSwitch(plugin.enabled, plugin, id)]
		}).appendTo(controls);

	});
	wrapper.html([controls, footer]);
	loading.hide();
}
Gallery.prototype.showBackupTab = function(wrapper, loading){
	var self = this;
	wrapper.empty();

	

	self.storage.loadEmotions(function(emotions){
		
		var json = JSON.stringify(emotions);
		var b64 = utf8_to_b64( json );
		var blob = createTextBlob(json);

		var saveData = function (blob, fileName) {
			var url = window.URL.createObjectURL(blob);
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.style = "display: none";
			a.href = url;
			a.download = fileName;
			a.click();
			setTimeout(function(){
	        	URL.revokeObjectURL(url);
	        }, 60*1000)
		};		

		var exportFile = $('<a/>', { class: 'icon_export',
			text: __("%d 張圖片").replace('%d', emotions.length),
			href: "data:text/plain;charset=utf-8; base64," + b64,
			attr: {
				title: __("另存此檔案"),
				download: __("%d 張圖片").replace('%d', emotions.length)+'_backup.txt'
			},
			click: function(){
				console.log();
				saveData(blob, __("%d 張圖片").replace('%d', emotions.length)+'_backup.txt');
				return false;
			}
		});

		function createTextBlob(json){
			return new Blob([json], {type : 'text/plain'});
		}


		var method = $('<select/>', { class: 'method',
			html: [
				'<option value="replace">'+__('取代模式')+'</option>',
				'<option value="merge">'+__('合併模式')+'</option>'
			]
		});

		var dropZone = $('<div/>', { class: 'dropZone',
			html: [
				exportFile,
				//$('<p/>', { text: __('備份方式：將上方的檔案圖示拖曳至桌面儲存，或點選右鍵另存') }),
				$('<p/>', { text: __('還原方式：將備份的檔案拖曳到虛線框中') }),
				$('<p/>', { text: __('取代模式：圖庫將被完全刪除並置換成檔案的內容') }),
				$('<p/>', { text: __('合併模式：從備份的檔案中補足圖庫中缺少的圖片') }),
				method
			],
			click: function(e){
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
		}).appendTo(wrapper);

		loading.fadeOut();
		
		
		function handleFileSelect(evt) {
			
		    evt.stopPropagation();
		    evt.preventDefault();

		    var files = evt.dataTransfer.files || evt.target.files; 
		    
		    for (var i = 0, f; f = files[i]; i++) {
		    	
				var reader = new FileReader();
				reader.onload = (function(theFile) {
					return function(e) {
						var data = e.target.result;
						var emotions = {};
						if(data.indexOf('[InternetShortcut]') == 0){ 
							try{
								b64 = data.replace(/[\n\r]*/ig, '').replace('[InternetShortcut]', '').replace('URL=data:text/plain;charset=utf-8; base64,', '');
								emotions = JSON.parse(b64_to_utf8(b64));
							}catch(e){
								console.log(e);
								alert("這不是有效的圖庫備份檔案！")
								return false;
							}
						}else{
							try{
								emotions = JSON.parse(data);
							}catch(e){
								console.log(e);
								alert("這不是有效的圖庫備份檔案！")
								return false;
							}
						}
						
						for(var i=0, e ; e = emotions[i]; i++ ){
							if((e.url && e.keyword && e.hash_id) == false) {
								alert("這不是有效的圖庫備份檔案！")
								return false;
							}
						}
						
						if(method.val() == 'replace'){
							var con = confirm("警告！你確定要取代目前的圖庫嗎？ (已載入" + emotions.length  + "張圖片)")
							if(con) self.storage.replaceEmotions(emotions, function(emotions){
								for(var e in emotions) EmoticonsStorage.renameFavorite(emotions[e].url, emotions[e].keyword);
								//getUserEmoticons();
								alert('圖庫置換成功！');
								//getUserEmoticons.emotions = null;
								self.storage.flush();
								//backupEmotionsTab.trigger('click');
								self.showBackupTab(wrapper, loading);
							})
						}else{
							var con = confirm("警告！你確定要合併至目前的圖庫嗎？ (已載入" + emotions.length  + "張圖片)")
							if(con) self.storage.saveEmotions(emotions, function(emotions){
								for(var e in emotions) EmoticonsStorage.renameFavorite(emotions[e].url, emotions[e].keyword);
								//getUserEmoticons();
								alert('圖庫合併成功！');
								//getUserEmoticons.emotions = null;
								self.storage.flush();
								self.showBackupTab(wrapper, loading);
								//backupEmotionsTab.trigger('click');
							})
						}
					};
				})(f);
				reader.readAsText(f)
		    }
		  }
		  
		function handleDragEnd(evt) {
		}

		function handleDragOver(evt) {
			evt.stopPropagation();
			evt.preventDefault();
		}
		// Setup the dnd listeners.
		$(dropZone).get(0).addEventListener('dragover', handleDragOver, false);
		$(dropZone).get(0).addEventListener('dragend', handleDragEnd, false);
		$(dropZone).get(0).addEventListener('drop', handleFileSelect, false);
	});
}
Gallery.prototype.deprecateDefaultTab = function(){
	return false;
	$("#emo_my").bind('click' ,function(){
		var t = setInterval(function(){
			$(".emoticons_my #emoticons_my_holder")
			.find('.gallery:not(:Event(click))').click( function(){ $(".emoticon_selecter.plurkCustoms.gallery").click(); return false; }).end()
			.find('.showMyEmotions:not(:Event(click))').click( function(){
				$(this).parents('#emoticons_my_holder').find('.protect').hide();
				$(this).parents('#emoticons_my_holder').find('.protected').addClass('forced').show();
				return false;
			 }).end();
			
			if($(".emoticons_my #emoticons_my_holder table:not(.protected)").length == 0) {
				return;
			}else{
				clearInterval(t);
			}
			
			$(".emoticons_my #emoticons_my_holder")
			.find('table').addClass('protected').hide().end()
			.append(
				$("<ol class='protect' style='margin:20px auto;color:#555;width:350px;'></ol>")
				.append($("<li style='margin:20px 0px;'/>").html(__("PlurkCustoms 已經代管噗浪自訂表情<br> 您應該從「<a class='gallery'>圖庫</a>」來使用表符")))
				.append($("<li style='margin:20px 0px;'/>").html(__("您可以按上方的「新增...」來上傳圖片到圖庫")))
				.append($("<li style='margin:20px 0px;'/>").html(__("或者也可以點選任何他人的自訂表情新增到圖庫")))
				.append($("<li style='margin:20px 0px;'/>").html(__("如果仍需要顯示線上的自訂表情請按一下<a class='showMyEmotions'>這裡</a>")))
			)
			.find('a').css({'cursor' : 'pointer'}).end()
			.find('.gallery:not(:Event(click))').click( function(){ $(".emoticon_selecter.plurkCustoms.gallery").click(); return false; }).end()
			.find('.showMyEmotions:not(:Event(click))').click( function(){
				$(this).parents('#emoticons_my_holder').find('.protect').hide();
				$(this).parents('#emoticons_my_holder').find('.protected').addClass('forced').show();
				return false;
			 }).end();
		}, 200);
	})	
}
Gallery.prototype.showPanel = function(panel){
}
Gallery.prototype.generateGalleryTab = function(){

	var self = this;
	if(this.galleryTab) return;
	
	self.deprecateDefaultTab();

	var doc = document; 
	createStyle(doc, ".emoticon_selecter.delete.current{ background:red !important; }	.emoticon_selecter.delete.current a{ color:white !important;}");
	createStyle(doc, ".emoticon_selecter.rename.current{ background:green !important; }	.emoticon_selecter.rename.current a{ color:white !important;}");
	createStyle(doc, ".emoticon_selecter.backup.current{ background:#CF5A00 !important; }	.emoticon_selecter.backup.current a{ color:white !important;}");
	
	//add tab
	function switchTab(e){
		$(this).siblings().removeClass("current");
		$(this).addClass("current");

		var panel = self.getPanel();
		return self.getPanel();
	}


	$("<a class='switchWindowMode' style='float:right;height:9px;width:9px; margin:8px; padding:2px; background:url(http://emos.plurk.com/633e54d3723da4e8c1acc48288e952bc_w8_h8.gif) no-repeat; cursor:pointer;' title='切換視窗大小'></a>").toggle(function(){
		$(this).parents('#emoticon_selecter').addClass('large').draggable({ disabled: true });
		$('body').addClass('large_emoticon_selecter');
		$('.tableWrapper').scrollTop(0);
		/*_.each(self.lazyLoaders, function(loader){
			loader.start();
		});*/
		self.lazyLoaders[self.currentClassName] && self.lazyLoaders[self.currentClassName].start();

	},function(){
		$(this).parents('#emoticon_selecter').removeClass('large').draggable({ disabled: false });
		$('body').removeClass('large_emoticon_selecter');
		$('.tableWrapper').scrollTop(0);
		/*_.each(self.lazyLoaders, function(loader){
			loader.start();
		});*/
		self.lazyLoaders[self.currentClassName] && self.lazyLoaders[self.currentClassName].start();
	}).insertAfter("#emoticons_tabs a.bn_close");

	this.registerTab('gallery default', this.showGalleryDefault, __('基本'));
	this.registerTab('gallery online', this.showGalleryOnline, __('線上'));
	this.registerTab('gallery local', this.showGalleryTab, __('圖庫'));

	
	this.registerTab('gallery favorite', this.showGalleryFavorite, __('最常用的'));
	this.registerTab('gallery seen', this.showGallerySeen, __('蒐集者之眼'));
	this.registerTab('backup', this.showBackupTab, __('備份'));
	
	this.registerTab('setting', this.showSettingTab, __('設定'));
	this.registerTab('tools', this.showToolsTab, __('工具'));


	//Make it draggable
	$("#emoticon_selecter").draggable({attachTo: "#emoticons_tabs", ignore: "a, li", "cursor": "move" })
	createStyle(doc, "#emoticon_selecter.ondrag {opacity: 0.5;}");
	createStyle(doc, "#emoticon_selecter {-webkit-box-shadow: rgba(0, 0, 0, 0.8) 2px 2px 5px 0px;-webkit-transition: opacity 0.2s linear;}");
	//createStyle(doc, "#emoticon_selecter #emoticons_tabs {cursor: move ;}");	
}
Gallery.prototype.createGalleryFilter = function(table, callback){

	var self = this;

	if(typeof self.galleryFilterValue == 'undefined') self.galleryFilterValue = "";
	var delayTimer;
	var filter = $("<input class='filter' type='text' placeholder='"+ __('快速找到相關的表情') + "' />")
		.keyup(function(){
			var val = $(this).val();
			val = val.replace(/^[\s　]+/, '').replace(/[\s　]+$/, '');

			clearInterval(delayTimer);
			
			self.galleryFilterValue = val;
			
			var tds = $(table).find("td");

			//show all if empty
			if(val.length == 0) {
				//restore 
				tds.css({'max-width': '80px', 'max-height': '80px', 'opacity' : '1', 'display': ''});
				setTimeout(function(){
					callback && callback();
				}, 300);
				return false;
			}
			
			var matched = tds.filter(function(){
				var alt = $(this).find('a').attr('alt').toLowerCase();
				return (alt.indexOf(val.toLowerCase()) != -1);
			});
			
			
			if(matched.length == 0 && val.match(/[ㄦㄢㄞㄚㄧㄗㄓㄐㄍㄉㄅㄣㄟㄛㄨㄘㄔㄑㄎㄊㄆㄤㄠㄜㄩㄙㄕㄒㄏㄋㄇㄥㄡㄝㄖㄌㄈ]$/)){
				return false;
			}
	
			delayTimer = setTimeout(function(){
				//show matched
				matched.addClass('matched').css({'max-width': '80px', 'max-height': '80px', 'opacity' : '1', 'display': ''});
				
				//hide others
				var animated = tds.not(matched).filter(':visible').filter(':lt(25)').css({'max-width': '0', 'max-height': '0', 'opacity' : '0', 'display': ''})
				tds.not(matched).not(animated).attr('style', 'display:none !important;')
				//don't know why this not work
				//tds.not(matched).not(animated).css('display', 'none');
				
				//make first 25 hidden element animated next time
				tds.not(matched).not(":visible").filter(':lt(25)').css({'opacity' : '1', 'display': '', 'max-width': '0', 'max-height': '0'});
				setTimeout(function(){
					callback && callback();
				}, 300);
			}, 200)

		})
		.trigger('keyup')
		.css({width: '100%'})
		.click(function(){this.select();})
	return filter;
}
Gallery.prototype.generateGalleryTable = function(emoticons, clickHandler, headerText){

	var self = this;
	var startTime = new Date();
	var totalPics = emoticons.length;

	var table = $('<table/>', { class: 'flexible plurkCustoms gallery'});
	var filter = self.createGalleryFilter(table, function(){
		wrapper.lazyLoader.start();
	});

	var wrapper 		= $('<div/>', { class: ''});
	var filterWrapper 	= $('<div/>', { class: 'filterWrapper', html: [filter]});
	var tableWrapper 	= $('<div/>', { class: 'tableWrapper',
		html: [$('<div/>', { class: 'help',
			text: headerText || __('Shift + 點選重新命名 / %s + 點選刪除').replace('%s', (isMac? "⌘" : "Ctrl"))
		}), table]
	});

	if(headerText == false){
		$(tableWrapper).find('.help').remove();
	}

	var row;
	var line = 0;
	_.each(emoticons, function(emoticon, i){
		if(i%8==0){
			line++;
			row = $("<tr/>", {
				attr: {
					'data-line': line, 
					'data-number': ((i+1) + '-' + (i+8))
				}
			}).appendTo(table);		
		}
		var td = $('<td/>', {
			click : function(event){
				clickHandler && clickHandler.apply(this, [event, emoticon]);
			}
		}).appendTo(row);

		var imgWrapper = $('<a/>', { class: 'a_emoticon lazy',
			attr: 	{
				url: 	emoticon.url,
				alt: 	emoticon.keyword,
				title: 	emoticon.keyword,
			},
			html: $('<img/>', {
				attr: { 'data-src': emoticon.url },
			}).hide()
		}).appendTo(td);

	}); // end each

	var spendTime = (Math.round((new Date() - startTime) /10) /100) + 's';
	var footer = $('<div/>', { class: 'footer',
		css: {color: '#555'},
		html: [
			__('共 %d 張圖片').replace('%d', totalPics) +" ("+spendTime+")",
			$('<span/>', {
				css: { float: 'right' },
				html: [
					"PlurkCustoms " + manifest('version') + " © 2011-2013 噗浪卡卡"
				]

			}),
			$('<div/>', {
				css: { color:'#999', margin:'5px 0' },
				text: __('※請勿自行刪除重新安裝以免圖庫遺失，如需更新請重新啟動瀏覽器')
			})
		] 
	});
	
	tableWrapper.get(0).addEventListener('scroll',function(){
		wrapper.tableScrollTop = this.scrollTop;
	});

	wrapper.lazyLoader = new LazyLoader(tableWrapper);

	//self.lazyLoaders.push(wrapper.lazyLoader);
	self.lazyLoaders[self.currentClassName] = wrapper.lazyLoader;

	wrapper.focusFilter = function(){
		filter.focus().select();
		return wrapper;
	}
	wrapper.restoreScroll = function(){
		tableWrapper.scrollTop(wrapper.tableScrollTop);
		return tabWrapper;
	}

	return wrapper.html([filterWrapper, tableWrapper.append([footer])]);
}
Gallery.prototype.reduceOnlineEmoticons = function(max, callback){
	var self = this;
	console.log('縮減線上表情', max);
	self.getRemovableEmoticons(function(removeable){
		self.storage.loadEmotions(function(emoticons){
			_.each(removeable, function(toRemove, i){
				if( ! _.findWhere(emoticons, {hash_id: toRemove.hash_id}) ){ //不在圖庫內
					console.log('偵測到新圖片', toRemove.keyword);
					self.storage.saveEmotion(toRemove.url, toRemove.keyword); // 保存到圖庫
				}
				if(i >= max) setTimeout(function(){
					self.storage.online.removeEmotion(toRemove.url, function(){});
				}, (i-max)*120);
			});
		});
	});
}
Gallery.prototype.getRemovableEmoticons = function(callback){
	var self = this;
	self.storage.online.getOnlineEmoticons(function(onlineEmoticons){
		var favEmotions = EmoticonsStorage.getFavorites();
		var removeable = _.map(onlineEmoticons, function(emo){
			var f = _.findWhere(favEmotions, {hash_id: emo.hash_id});
			emo.favorite = f ? f.favorite : -1;
			return emo;
		});
		removeable = _.sortBy(removeable, function(emo){
			return emo.favorite;
		}).reverse();
		callback && callback(removeable);
	});
}


function AdvancedGalleryPlugin(gallery){
	this.gallery = gallery
	this.title =  __('進階版圖庫');
	this.parent();
	

}
AdvancedGalleryPlugin.prototype =  Object.create(Plugin.prototype);
AdvancedGalleryPlugin.prototype.parent = Plugin;

AdvancedGalleryPlugin.prototype.start = function(){
	var self = this;
	$('#emo_my, #emo_extra, #emo_basic').livequery(function(){
		$('#emoticons_tabs').find('.gallery.default, .gallery.online').show();
		$(this).hide();
	});
	$('.emoticon_selecter_img_off').livequery('click', function(){
		setTimeout(function(){
			self.gallery.switchTab('gallery default');
		}, 100);
	})
}
AdvancedGalleryPlugin.prototype.stop = function(){
	$('#emo_my, #emo_extra, #emo_basic').livequery(function(){
		$('#emoticons_tabs').find('.gallery.default, .gallery.online').hide();
		$(this).show();
	});
	$('.emoticon_selecter_img_off').expire('click');
}
