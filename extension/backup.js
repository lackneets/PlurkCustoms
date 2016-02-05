var GalleryBackup = function(){}

GalleryBackup.REPLACE = 'GalleryBackup_REPLACE_MODE';
GalleryBackup.MERGE = 'GalleryBackup_MERGE_MODE';
GalleryBackup.cloudBackup = function(emoticons){
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

	gallery.storage.loadEmotions(function(emoticons){
		var base64 = self.backupPaste(emoticons, function(url){
			NProgress.set(0.7);	
			self.addPlurk(url, function(plurkObj){
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

	if(location.protocol.match('https')){
		var jb = new Jailbreaker();
			jb.request('backupPaste', {
			code: base64
		}, function(html){
			jb.closeAgent();
			var href = $($.parseHTML(html)).find('#direct_link a').attr('href');
			callback && callback('//paste.plurk.com' + href);
		}, function(){
			NProgress.done(true);
		});
		return true;
	}

	$.post('//paste.plurk.com/', {
		'code':         base64,
		'language':     'text',
		'webpage':      '',
		'private':      'on'
	}, function(html){
		var href = $($.parseHTML(html)).find('#direct_link a').attr('href');
		callback && callback('//paste.plurk.com' + href);
	}).error(function(){
		alert('連線發生錯誤，請稍候再試一次');
		NProgress.done(true);
	});

	return base64;
}
GalleryBackup.restoreFromPaste = function(url, method, callback){
	var self = this;
 
	if(NProgress.status){
		alert(__('忙碌中請稍後再試'));
		return false;
	}
 
	var id = (url.match(/show\/([\d\w]+)\/?/)||[]).pop();
	var url = url.replace('//show', '/show');

	NProgress.configure({ 
		minimum: 0.005 ,
		template: '<div class="bar backup" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
	});
	NProgress.set(0.0); 
	NProgress.start(); 
 
	if(location.protocol.match('https')){
		var jb = new Jailbreaker();
		jb.request('loadPaste', {
			url: url
		}, function(response){
			jb.closeAgent();
			GalleryBackup.restoreFromPasteHTML(response, method, callback);
		}, function(){
			NProgress.done(true);
		});
		return false;
	}

	$.get(url, function(html){
		 GalleryBackup.restoreFromPasteHTML(html, method, callback);
	}).error(function(){
		alert('連線發生錯誤，請稍候再試一次');
		NProgress.done(true);
	});
}
GalleryBackup.restoreFromPasteHTML = function(html, method, callback){
	var base64 = $($.parseHTML(html)).find('div.code:first .syntax').text();
	var emoticons = GalleryBackup.restore(base64, 'base64', method, function(){
	NProgress.done(true);
		callback && callback(emoticons);
	});
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
			$('<span>', {class: 'action replace', text: '復原',     click: function(){ GalleryBackup.restoreFromPaste(url, GalleryBackup.REPLACE); return false; }}), 
			$('<span>', {class: 'action merge', text: '合併',       click: function(){ GalleryBackup.restoreFromPaste(url, GalleryBackup.MERGE); return false; }}), 
			//$('<span>', {class: 'action download', text: '下載',  click: function(){ GalleryBackup.downloadFromPaste(url) }})
		]
	})
	$(this).parents('.plurk[id^=p]').addClass('backup')
	$(this).empty().append(backup);
});
 
/* HTTPS solution */
 
function Jailbreaker(){
	this.tasks = {};
	this.role = 'nothing';
	this.master = null;
	this.agent = null
 
	if(location.protocol.match('https')){
		this.role = 'master';
	}else if(window.opener){
		this.role = 'agent';
		this.master = window.opener;
	}
 
	this.init();
}
Jailbreaker.prototype.init = function(){
	if(this.role == 'agent'){
		this.master.postMessage({
			from: 'Jailbreaker',
			action: 'agentReady',
		}, '*');
		window.addEventListener("message", function (event) {
			if(event.data instanceof Object && event.data.from == 'Jailbreaker' && event.data.action == 'request' ){
				this.silent();
				this.handleRequest(event.data.request);
			}
		}.bind(this), false);
	}else{
		window.addEventListener("message", function (event) {
		if(event.data instanceof Object && event.data.from == 'Jailbreaker'){
			if(event.data.action == 'agentReady'){
				this.agent = event.source;
			}
		}
		}.bind(this), false);
	}
}
Jailbreaker.prototype.handleRequest = function(request){
	if(this.role == 'agent'){
		if(this.tasks[request.taskname] instanceof Function){
			this.tasks[request.taskname].bind(this, request.args, function(response){
				this.postResponse(request.id, response);
			}.bind(this), function(){
				this.postResponse(request.id, null, true);
			}.bind(this))();
		}       
	}
}
Jailbreaker.prototype.postResponse = function(id, resposne, error){
	if(this.role == 'agent'){
		this.master.postMessage({
			from: 'Jailbreaker',
			action: 'response',
			response: {
				id: id,
				data: resposne,
				error: error
			}
		}, '*');
	}
}
Jailbreaker.prototype.addTask = function(taskname, operation){
	if(this.role == 'agent'){
		this.tasks[taskname] = operation
	}
}
Jailbreaker.prototype.request = function(taskname, args, callback, onError){
	if(this.role == 'master'){
		this.jailbreak(function(agent){
			var id = new Date().getTime();
			agent.postMessage({
				from: 'Jailbreaker',
				action: 'request',
				request: {
					taskname,
					id: id,
					args: args
				}
			}, '*');
			this.waitResponse(id, callback, onError || function(){});
		}.bind(this));
	}
}
Jailbreaker.prototype.waitResponse = function(id, callback, onError){
	if(this.role == 'master'){
		var connection = setInterval(function(){
			if(!this.agent.window){
				clearInterval(connection);
				onError.bind(this)();
			}
		}.bind(this), 200);
		window.addEventListener("message", function (event) {
			if(event.data instanceof Object && event.data.from == 'Jailbreaker' && event.data.action == 'response' && event.data.response.id == id){
				if(event.data.response.error){
					return onError.bind(this)(event.data.response.error, event);
				}
				callback.bind(this)(event.data.response.data, event);
				clearInterval(connection);
			}
		}.bind(this), false);
	}
}
Jailbreaker.prototype.jailbreak = function(callback){
	if(this.role == 'master'){
		if(!this.agent){
			window.open(window.location.toString().replace(/^https/, 'http'), "jailbreak", "width=400, height=300, toolbar=no, scrollbars=no, resizable=no");
			var wait = setInterval(function(){
				if(this.agent){
					clearInterval(wait);
					callback.bind(this)(this.agent);
				}
			}.bind(this), 1000);
		}else{
			callback.bind(this)(this.agent);
		}
	}
}
Jailbreaker.prototype.closeAgent = function(agent){
	if(this.agent && this.agent.close){
		this.agent.close();
	}
}
Jailbreaker.prototype.silent = function(){
	document.documentElement.className += ' jailbreaker-agent';
	Array.from(document.body.childNodes).forEach(function(child){
		document.body.removeChild(child);
	});
	var loading = " \
		<div class=\"loading-mask\"> \
			<div class=\"sk-cube-grid\"> \
				<div class=\"sk-cube sk-cube1\"></div> \
				<div class=\"sk-cube sk-cube2\"></div> \
				<div class=\"sk-cube sk-cube3\"></div> \
				<div class=\"sk-cube sk-cube4\"></div> \
				<div class=\"sk-cube sk-cube5\"></div> \
				<div class=\"sk-cube sk-cube6\"></div> \
				<div class=\"sk-cube sk-cube7\"></div> \
				<div class=\"sk-cube sk-cube8\"></div> \
				<div class=\"sk-cube sk-cube9\"></div> \
			</div> \
		</div> \
	";
	document.body.innerHTML += loading;
}
 
var jb = new Jailbreaker();

jb.addTask('loadPaste', function(args, callback, onError){
	$.get(args.url, function(html){
		callback && callback(html);
	}).error(function(){
		alert('連線發生錯誤，請稍候再試一次');
		onError();
		window.close();
	});
});

jb.addTask('backupPaste', function(args, callback, onError){
	$.post('//paste.plurk.com/', {
		'code':         args.code,
		'language':     'text',
		'webpage':      '',
		'private':      'on'
	}, function(html){
		callback(html);
	}).error(function(){
		alert('連線發生錯誤，請稍候再試一次');
		onError();
		window.close();
	});
});