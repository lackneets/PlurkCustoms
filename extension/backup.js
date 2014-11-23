var GalleryBackup = function(){}

GalleryBackup.REPLACE = 'GalleryBackup_REPLACE_MODE';
GalleryBackup.MERGE = 'GalleryBackup_MERGE_MODE';
GalleryBackup.cloudBackup = function(emoticons){
	var self = this;
	console.log('backup...');

	if(NProgress.status){
		alert(__('忙碌中請稍後再試'));
		return false;
	}

	NProgress.configure({ 
		minimum: 0.005 ,
		template: '<div class="bar backup" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
	});
	NProgress.set(0.0);	
	NProgress.start();	

	gallery.storage.loadEmotions(function(emoticons){
		var base64 = self.backupPaste(emoticons, function(url){
			NProgress.set(0.7);	
			self.addPlurk(url, function(plurkObj){
				console.log(plurkObj)
				NProgress.done(true);	
				if(plurkObj) alert('備份完成，你會在河道看到一則還原點私噗');
			});
		});
	})
}
GalleryBackup.addPlurk = function(url, callback){
	$.ajax({
		type: 'POST',
		url: '//www.plurk.com/TimeLine/addPlurk',
		dataType: 'html',
		data: {
			'posted': 		new Date().toISOString(),
			'qualifier': 	':',
			'content': 		url + ' (PlurkCustomsBackup) ' + hex_md5(url),
			'lang': 		'tr_ch',
			'no_comments' : 1,
			'uid' : 		user_id,
			'limited_to': 	'['+user_id+', "'+user_id+'"]'
		},
		success: function(plurkObj){
			var plurk_id = plurkObj;
			callback && callback(plurkObj);
		},
		error: function(){
			alert('備份失敗！你可能剛剛備份過了？');
			callback && callback();
		}
	})
}
GalleryBackup.backupPaste = function(emoticons, callback){
	var base64 = this.objectToBase64(emoticons);
	$.post('//paste.plurk.com/', {
		'code': 		base64,
		'language': 	'text',
		'webpage': 		'',
		'private': 		'on'
	}, function(html){
		var href = $($.parseHTML(html)).find('#direct_link a').attr('href');
		callback && callback('//paste.plurk.com/' + href);
	});
	return base64;
}
GalleryBackup.restoreFromPaste = function(url, method, callback){
	var self = this;

	if(NProgress.status){
		alert(__('忙碌中請稍後再試'));
		return false;
	}

	NProgress.configure({ 
		minimum: 0.005 ,
		template: '<div class="bar backup" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
	});
	NProgress.set(0.0);	
	NProgress.start();	

	$.get(url, function(html){
		var base64 = $($.parseHTML(html)).find('div.code:first .syntax').text();
		var emoticons = self.restore(base64, 'base64', method, function(){
			NProgress.done(true);;
			callback && callback(emoticons);
		});
		
	})
}
GalleryBackup.restore = function(data, datatype, method, callback){
	var emoticons = data;
	if(datatype.toLowerCase() == 'base64'){
		var json = b64_to_utf8(data); 
		emoticons = JSON.parse(json);
	}else if(datatype.toLowerCase() == 'json'){
		emoticons = JSON.parse((data));
	}
	if(! emoticons instanceof Array){
		throw "TypeError: While parsing emoticons source data";
	}

	if(method === this.REPLACE){
		var con = confirm("警告！你確定要取代目前的圖庫嗎？ (已載入" + emoticons.length  + "張圖片)")
		if(con){
			gallery.storage.replaceEmotions(emoticons, function(emoticons){
				for(var e in emoticons) EmoticonsStorage.renameFavorite(emoticons[e].url, emoticons[e].keyword);
				alert('圖庫置換成功！');
				gallery.storage.flush();
				callback && callback(emoticons);
			})			
		}else{
			callback && callback(false);
		}
	}else if(method === this.MERGE) {
		var con = confirm("警告！你確定要合併至目前的圖庫嗎？ (已載入" + emoticons.length  + "張圖片)")
		if(con){
			gallery.storage.saveEmotions(emoticons, function(emoticons){
				for(var e in emoticons) EmoticonsStorage.renameFavorite(emoticons[e].url, emoticons[e].keyword);
				alert('圖庫合併成功！');
				gallery.storage.flush();
				callback && callback(emoticons);
			});	
		}else{
			callback && callback(false);
		}
	}else{
		callback && callback(false);
		throw "Method must specified";
	}
	return emoticons;

}
GalleryBackup.objectToBase64 = function(object){
	var json = JSON.stringify(object);
	var b64 = utf8_to_b64( json );
	return b64;	
}


$('.plurk[id^=p] .text_holder:has(a[href*="paste.plurk.com"]:contains("PlurkCustomsBackup"))').livequery(function(e){
	var url = $(this).find('a[href*="paste.plurk.com"]').attr('href');
	var backup = $('<div/>', { class: 'backup',
		html: ['<b>圖庫備份還原點</b><br>', 
			$('<span>', {class: 'action replace', text: '復原', 	click: function(){ GalleryBackup.restoreFromPaste(url, GalleryBackup.REPLACE); return false; }}), 
			$('<span>', {class: 'action merge', text: '合併', 		click: function(){ GalleryBackup.restoreFromPaste(url, GalleryBackup.MERGE); return false; }}), 
			//$('<span>', {class: 'action download', text: '下載', 	click: function(){ GalleryBackup.downloadFromPaste(url) }})
		]
	})
	$(this).parents('.plurk[id^=p]').addClass('backup')
	$(this).empty().append(backup);
})
