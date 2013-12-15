
function packer(gallery){

	var xhrArray = [];
	var busy = false;
	var cancelButton;
	var launchButton;

	$(function(){
		$("#plurk_form .icons_holder .plurkcustoms_shortcut").livequery(function(){
			//if($(this).find('img.downloadEmoticons').length > 0) return;
			launchButton = $('<a/>',{
				class: 'downloadEmoticons shortcut',
				attr: {title: __('打包下載所有表情圖案')},
				click: function(e){
					downloadEmoticons();
					return false;
				}
			}).prependTo(this);

			cancelButton = $('<a/>',{
				class: 'busy packer shortcut',
				attr: {title: __('系統正在忙碌中，點一下取消正在進行的工作')},
				click: function(e){
					cancelDownload();
					return false;
				}
			}).hide().prependTo(this);			
		})
	});

	function loadImageBinary(url, callback){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);

		xhrArray.push(xhr);

		xhr.responseType = 'arraybuffer';

		xhr.onload = function(e) {
			if (this.status == 200) {
				var uInt8Array = new Uint8Array(this.response);
				var i = uInt8Array.length;
				var binaryString = new Array(i);
				while (i--){
					binaryString[i] = String.fromCharCode(uInt8Array[i]);
				}
				var data = binaryString.join('');

				//var base64 = window.btoa(data);
				callback && callback(data);
			}
		}

		xhr.send();
	}

	var saveData = (function () {
	    var a = document.createElement("a");
	    document.body.appendChild(a);
	    a.style = "display: none";
	    return function (blob, fileName) {
	        url = URL.createObjectURL(blob);
	        a.href = url;
	        a.download = fileName;
	        a.click();
	        console.log(url, a);
	        setTimeout(function(){
	        	URL.revokeObjectURL(url);
	        }, 60*1000)
	    };
	}());

	function cancelDownload(){
		busy = false;
		for(var i=0; i<xhrArray.length;i++){
			xhrArray[i].abort();
		}
		xhrArray = [];
		NProgress.done(true);
		cancelButton.fadeOut();
	}

	window.downloadEmoticons = downloadEmoticons;
	function downloadEmoticons(){
		var zip;
		var folder = newZip();

		if(NProgress.status || busy == true){
			alert(__('忙碌中請稍後再試'));
			return false;
		}

		busy = true;
		cancelButton.fadeIn();

		NProgress.configure({ 
			minimum: 0.005 ,
			template: '<div class="bar orange" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
		});
		NProgress.set(0.0);

		try{
			gallery.storage.loadEmotions(function(emoticons) {

				try{
					var json = JSON.stringify(emoticons);
					//var b64 = utf8_to_b64( json );
					zip.file('backup.txt', json);
					
					var toDownload = emoticons.length;
					var downloaded = 0
					var progress = 0;
					var threads = [];

					for(var i=0; i< toDownload; i++){
						if(! busy ) break; //已經取消
						(function(emo){

							var t = setTimeout(function(){
								if(! busy ) {//已經取消
									for(var x=0; x<threads.length; x++) clearTimeout(threads[x]);
									return;
								}
								loadImageBinary(emo.url, function(base64){
									var ext = emo.url.match(/\.(\w+)$/)[1];
									var fileneme = emo.keyword.replace(/\\/ig, '＼')
										.replace(/\*/ig, '_')
										.replace(/\//ig, '／')
										.replace(/\:/ig, '：')
										.replace(/\</ig, '＞')
										.replace(/\>/ig, '＜')
										.replace(/\?/ig, '？')
										.replace(/\|/ig, '｜');
									downloaded++;
									var p = Math.round(downloaded/toDownload*100)/100;

									if(p - progress > 0.005){
										progress = p;
										NProgress.set(p);
									}

									folder.file(fileneme + '.' + ext, base64, {binary: true});
									if(toDownload == downloaded){ // 完成
										packfile();
										NProgress.set(1.0);
										NProgress.done(true);
										busy = false;
										xhrArray = [];
										cancelButton.hide();
									}
								});
							}, i*30);

							threads.push(t);

						})(emoticons[i]);

					}

				}catch(e){
					alert(__('發生錯誤：') + e);
					busy = false;
				}
			})		
		}catch(e){
			alert(__('發生錯誤：') + e);
			busy = false;
		}


		function newZip(){
			zip = new JSZip();
			zip.file("readme.txt", "把backup.txt拖曳到備份模式的框框可以還原。如果檔名是亂碼請嘗試使用 7-zip 開啟 http://www.7-zip.org/\n by 小耀博士 http://www.plurk.com/Lackneets");
			zip.file('Use 7-zip if you see garbled', '');
			return zip.folder("emoticons");
		}

		function packfile(){
			var d = new Date();
			var blob = zip.generate({type:'blob'});
			saveData(blob, 'PlurkCustomsBackup ' + d.getFullYear() +'_'+ (d.getMonth()+1)  +'_'+  d.getDate() + '.zip')
			//window.open(URL.createObjectURL(blob));
			folder = newZip();
		}
	}


}
