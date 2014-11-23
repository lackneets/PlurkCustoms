var StorageAdapter = function(onlineStorage){
	this.online = onlineStorage;
}
StorageAdapter.prototype.online = null;
StorageAdapter.prototype.handup = false;
StorageAdapter.prototype.cache = null;

StorageAdapter.prototype.flush = function(){
	this.cache = null;
}
StorageAdapter.prototype.sendExtensionRequest = function(obj, callback){
	if(this.handup) return false;
	try{
		chrome.extension.sendRequest(obj, callback);
	}catch(e){
		this.handup = true;
		alert(__('發生錯誤：') + e);
		var c = confirm(__('無法連線到圖庫，請立即重新整理頁面看看，可能有版本更新，繼續將無法正常操作'));
		if(c) window.location.reload();
	}
}

StorageAdapter.prototype.renameEmotion = function(url, keyword, newkeyword, callback){
	var self = this;
	self.deleteEmotion(keyword, function(){
		self.saveEmotion(url, newkeyword, function(emotions){
			if(typeof callback == 'function') callback(emotions);
		});
	})
}

//將單一個自訂表情從圖庫刪除
StorageAdapter.prototype.deleteEmotion = function(keyword, callback){
	var self = this;
	if(this.handup) return false;
	this.sendExtensionRequest({deleteEmotion: true, keyword: keyword}, function(emotions){
		console.log("deleteEmotion: userEmotions has been updated");
		self.flush();
		if(typeof callback == 'function') callback(emotions);
	});
}

//將單一個自訂表情新增到圖庫
StorageAdapter.prototype.saveEmotion = function(url, keyword, callback){
	var self = this;
	if(this.handup) return false;
	this.sendExtensionRequest({saveEmotion: true, url: url, keyword: keyword}, function(emotions){
		//if(typeof emotions.slice == 'function') emotionsCache = emotions.slice(0);
		console.log("saveEmotion: userEmotions has been updated");
		self.flush();
		if(typeof callback == 'function') callback(emotions);
	});
}

//取代所有 (警告)
StorageAdapter.prototype.replaceEmotions = function(emotions, callback){
	var self = this;
	if(this.handup) return false;
	this.sendExtensionRequest({replaceEmotions: true, emotions: emotions}, function(emotions){
		console.log("emotions replaced!!!!!!");
		self.flush();
		if(typeof callback == 'function') callback(emotions);
	});
}
//合併表情
StorageAdapter.prototype.saveEmotions = function(emotions, callback){
	var self = this;
	if(this.handup) return false;
	this.sendExtensionRequest({saveEmotions: true, emotions: emotions}, function(emotions){
		console.log("emotions merged!!!!!!");
		self.flush();
		if(typeof callback == 'function') callback(emotions);
	});
}
//從圖庫載入所有表情
StorageAdapter.prototype.loadEmotions = function(callback){
	var self = this;
	if(this.handup) return false;
	if(this.cache) {
		callback && callback(this.cache.slice(0));
		return this.cache.slice(0);
	}
	this.sendExtensionRequest({loadEmotions: true}, function(emotions){
		if(typeof emotions != 'object' && typeof emotions != 'array') emotions = new Array();
		emotions = normalizeKeywordFilter(emotions);
		emotions = _.map(emotions, function(emo){return _.pick(emo, ['hash_id', 'url', 'keyword']); })
		self.cache = emotions.slice(0);
		if(typeof callback == 'function') callback(emotions.slice(0));
	});		
}
//檢查表情是否在噗浪上
StorageAdapter.prototype.isAlive = function(keyword, callback){
	if(this.handup) return false;
	//this.sendExtensionRequest({isAlive: true, keyword: keyword}, callback);
	return this.online.isAlive(keyword, callback);
}

function normalizeKeywordFilter(emoticons){
	return _.map(emoticons, function(emo, i){
		emo.keyword = emo.keyword || ('_未命名_'+(i+1));
		emo.keyword = emo.keyword.replace(/'/ig, '');
		emo.keyword = emo.keyword.replace(/[\[\]]]/ig, '_');
		emo.keyword = emo.keyword.replace(/[\[\]]]/ig, '_');
		return emo;
	});
}


var PlurkEmotiland = function(){
	var self = this;
	this.getOnlineEmoticons(function(emoticons){
		self.cache = emoticons.slice(0);
	});
}

PlurkEmotiland.urlHash = function(url){
	return String(url).match(/plurk\.com\/([0-9a-zA-Z]+)/)[1];
}
PlurkEmotiland.prototype.cache = [];
PlurkEmotiland.prototype.hangup = false;
PlurkEmotiland.prototype.getUserEmoticons = function(callback){
	return this.getOnlineEmoticons(callback);
}
PlurkEmotiland.prototype.isAlive = function(keyword, callback){
	var alive =  _.findWhere(this.cache, {keyword: keyword});
	callback && callback(alive);
	return alive;
}
PlurkEmotiland.prototype.getOnlineEmoticons = function(callback){
	var self = this;
	if(self.cache.length) {
		callback && callback(self.cache.slice(0));
	}else{
		$.ajax({ url: "//www.plurk.com/EmoticonManager/getUserEmoticons",
			data: {token: token},
			dataType: 'json',
			type: 'POST',
			success: function(onlineEmotions){
				self.cache = onlineEmotions.slice(0);
				callback && callback(onlineEmotions);
			},
			error: function(){
				if(!self.hangup && (self.hangup = true)) alert(__("無法存取您的噗浪自訂表情，請確認您有填寫100%個人資料開啟自訂表情功能"));
			}
		});		
	}
}

//將一個表情上傳到噗浪
PlurkEmotiland.prototype.addEmotion = function(url, keyword, callback){
	var self = this;
	var hash_id = this.constructor.urlHash(url);
	var exitst = _.findWhere(this.cache, {hash_id: hash_id});
	if(exitst){
		callback && callback();
	}else{
		$.ajax({ url: "//www.plurk.com/EmoticonDiscovery/addEmoticon",
			data: {form_token: token, url: url,  hash_id: hash_id, keyword: keyword},
			type: 'POST',
			success:function(response){
				self.cache.push({
					hash_id: hash_id,
					keyword: keyword,
					url: url
				});		
				callback && callback(response);
			}
		});

	}
}

//從噗浪上刪除一個表情
PlurkEmotiland.prototype.removeEmotion = function(url, callback){
	var self = this;
	var hash_id = url.match(/plurk\.com\/([0-9a-zA-Z]+)/)[1];
	$.ajax({ url: "//www.plurk.com/EmoticonDiscovery/removeEmoticon",
		data: {form_token: token, hash_id: hash_id},
		type: 'POST',
		success:function(response){
			console.log("removeEmotion: " + url + " has been removed from plurk");
			self.cache = _.reject(self.cache, function(e){ return e.hash_id == hash_id; });
			callback && callback();
		}
	});
}
PlurkEmotiland.prototype.getDefaultSmiles = function(callback){
	var self = this;
	if(self.defaultSmilesCache) {
		callback && callback(self.defaultSmilesCache);
		return self.defaultSmilesCache;
	}
	localScript("var _Emoticons = _Emoticons || {basic:EmoticonsList.basic, silver:EmoticonsList.silver, platinum:EmoticonsList.platinum, gold:EmoticonsList.gold, platinum_2:EmoticonsList.platinum_2, karma100:EmoticonsList.karma100};");
	getLocal('GLOBAL', function(GLOBAL){
		getLocal('_Emoticons', function(Emoticons){
			var u = GLOBAL.session_user;
			var e = u&&u.recruited||0;
			var c = u&&u.karma||0;
			var a = []; 
			a=a.concat(Emoticons.basic);
			if(c>=25) a=a.concat(Emoticons.silver);
			if(e>=10) a=a.concat(Emoticons.platinum);
			if(c>=50) a=a.concat(Emoticons.gold);
			if(c>=81) a=a.concat(Emoticons.platinum_2);
			if(c>=100) a=a.concat(Emoticons.karma100);
			var emoticons = [
				{url: "//s.plurk.com/47d20905d017c396d67b4a30c9ac9b10.png", keyword: "(goal)"       , alias: "ball"},
				{url: "//s.plurk.com/5a2a63fa773e68797ec69a1303bfa3b9.png", keyword: "(bzzz)"       , alias: "buzz"},
				{url: "//s.plurk.com/7256dae81d56d150120ccd0c96dd2197.gif", keyword: "(fireworks)"} ,
				{url: "//s.plurk.com/4ad099fba019942f13058610ff3fc568.gif", keyword: "(dance_bzz)"  , alias: "buzz"},
				{url: "//s.plurk.com/deda4d9f78ad528d725e3a6bfbf6352f.gif", keyword: "(Русский)"    , alias: "(Pyccknn)"},
				{url: "//s.plurk.com/0efc4d55d28704f4370ef874ae906161.gif", keyword: "(code)"},
				{url: "//s.plurk.com/4c40d16a0d369b895c08f2e33d062ec8.gif", keyword: "(yarr)"},
				{url: "//s.plurk.com/1a5f23ed863e70e52f239b045a48e6fb.gif", keyword: "(xmas1)"      , alias: "christ"},
				{url: "//s.plurk.com/f5dbd5fdf5f5df69cfb024d6be76a76b.gif", keyword: "(xmas2)"      , alias: "christ"},
				{url: "//s.plurk.com/e902170e97aee14836b5df6b0fe61ba2.gif", keyword: "(xmas3)"      , alias: "christ"},
				{url: "//s.plurk.com/e476574723d5042f24658fa36866bd92.gif", keyword: "(xmas4)"      , alias: "christ"},
				{url: "//s.plurk.com/a555399b40c379adca5b6f5bad5bf732.gif", keyword: "(dance_okok)" , alias: "okok"},
				{url: "//s.plurk.com/bb1e3fed482959a00013f7f1efcc17a0.gif", keyword: "(music_okok)" , alias: "okok"},
				{url: "//s.plurk.com/bac8c8392f7ca8f5ac74612be4d08b74.gif", keyword: "(wave_okok)"  , alias: "okok"},
				{url: "//s.plurk.com/71acd802cc931649dd9a371ccf70bad2.gif", keyword: "(hungry_okok)", alias: "okok"},
				{url: "//s.plurk.com/3acbaf42504fff32c5eac4f12083ce56.gif", keyword: "(yar_okok)"   , alias: "okok"},
				{url: "//s.plurk.com/fcd28d7d78ec1f828c76930fa63270e6.gif", keyword: "(gym_okok)"   , alias: "okok"},
				{url: "//s.plurk.com/8855f56400a936db07f348d9290adaac.gif", keyword: "(code_okok)"  , alias: "okok"},
				{url: "//s.plurk.com/feb43dbbbf2763905571060be9a496d1.gif", keyword: "(no_dance)"   , alias: "dance"},
				{url: "//s.plurk.com/5b51892d7d1f392d93ea7fe26e5100f4.gif", keyword: "(banana_gym)" , alias: "dance"},
				{url: "//s.plurk.com/6de58c967f1c2797d250a713ba50eddd.gif", keyword: "(dance_yarr)" , alias: "dance"},
				{url: "//s.plurk.com/88fac5a4b99110a35d4e4794dad58ab4.gif", keyword: "(taser_okok)" , alias: "okok"},
				{url: "//s.plurk.com/6675254cd7449b1847a93b0024127eae.gif", keyword: "(angry_okok)" , alias: "okok"},
				{url: "//s.plurk.com/b3b9856e557fcc2700fd41c53f9d4910.gif", keyword: "(droid_dance)", alias: "dance"},
				{url: "//s.plurk.com/cfdd2accc1188f5fbc62e149074c7f29.png", keyword: "(fuu)"        , alias: "rage"},
				{url: "//s.plurk.com/828b9819249db696701ae0987fba3638.png", keyword: "(gfuu)"       , alias: "rage"},
				{url: "//s.plurk.com/1bd653e166492e40e214ef6ce4dd716f.png", keyword: "(yay)"        , alias: "rage"},
				{url: "//s.plurk.com/3fe6cf919158597d7ec74f8d90f0cc9f.png", keyword: "(gyay)"       , alias: "rage"},
				{url: "//s.plurk.com/9c5c54081547d2ad903648f178fcc595.png", keyword: "(bah)"        , alias: "rage"},
				{url: "//s.plurk.com/2da76999ca3716fb4053f3332270e5c9.png", keyword: "(gbah)"       , alias: "rage"},
				{url: "//s.plurk.com/f73b773aa689647cb09f57f67a83bb89.png", keyword: "(troll)"      , alias: "rage"},
				{url: "//s.plurk.com/45beda260eddc28c82c0d27377e7bf42.png", keyword: "(gtroll)"     , alias: "rage"},
				{url: "//s.plurk.com/8590888362ae83daed52e4ca73c296a6.png", keyword: "(aha)"        , alias: "rage"},
				{url: "//s.plurk.com/c7551098438cc28ec3b54281d4b09cc3.png", keyword: "(gaha)"       , alias: "rage"},
				{url: "//s.plurk.com/cfd84315ebceec0c4389c51cf69132bd.png", keyword: "(whatever)"   , alias: "rage"},
				{url: "//s.plurk.com/0e0bf1ec2c2958799666f3995ef830ca.png", keyword: "(gwhatever)"  , alias: "rage"},
				{url: "//s.plurk.com/e2998ca75f80c1c4a5508c549e3980a6.png", keyword: "(pokerface)"  , alias: "rage"},
				{url: "//s.plurk.com/c6ad1c4f9e11f6859a1ba39c4341ef8b.png", keyword: "(gpokerface)" , alias: "rage"},
				{url: "//s.plurk.com/4a61085f1c6a639f028cd48ae97d07d0.png", keyword: "(yea)"        , alias: "rage"},
				{url: "//s.plurk.com/53253ca60f5831f0812954213a2e9bb3.png", keyword: "(gyea)"       , alias: "rage"},
				{url: "//s.plurk.com/6928f3117658cc38d94e70519a511005.png", keyword: "(jazzhands)"  , alias: "rage"},
				{url: "//www.plurk.com/static/emoticons/valentine/lingerie.png", keyword: "v_shy"},
				{url: "//www.plurk.com/static/emoticons/valentine/tiffany-box.png", keyword: "v_tiffany"},
				{url: "//www.plurk.com/static/emoticons/valentine/heart-love.png", keyword: "v_love"},
				{url: "//www.plurk.com/static/emoticons/valentine/perfume.png", keyword: "v_perfume"},
				{url: "//www.plurk.com/static/emoticons/valentine/envelope.png", keyword: "v_mail"},
				{url: "//www.plurk.com/static/emoticons/lantern/lantern-love.png", keyword: "lantern_love"},
				{url: "//www.plurk.com/static/emoticons/lantern/lantern-well.png", keyword: "latern_well"},
				{url: "//www.plurk.com/static/emoticons/lantern/lantern-peace.png", keyword: "lantern_peace"},
				{url: "//www.plurk.com/static/emoticons/lantern/lantern-health.png", keyword: "lantern_health"},
				{url: "//www.plurk.com/static/emoticons/lantern/lantern-fortune.png", keyword: "lantern_fortune"},
				{url: "//www.plurk.com/static/emoticons/lantern/lantern-happy.png", keyword: "lantern_happy"}, 
			]
			for(var i in a) emoticons.push({ url: a[i][1], keyword: a[i][2] });		
			self.defaultSmilesCache = emoticons;
			callback && callback(emoticons);	
		})
	});	
}
