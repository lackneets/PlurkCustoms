function NotificationSoundPlugin(){
	var self = this;
	this.shortcutSwitch = $('<li/>', { class: 'switch notification',
		attr: {'title' :  __('開啟/關閉 通知音效')},
		html: $('<a/>', {class: 'off_tab'}),
		click: function(){
			if(self.enabled){
				self.disable();
			}else{
				self.enable();
			}
			$(this).removeClass('on off').addClass( self.enabled ? 'on' : 'off');
		}
	}).prependTo("#filter_tab");
}
NotificationSoundPlugin.prototype = Object.create(Plugin.prototype);
NotificationSoundPlugin.prototype.parent = Plugin;
NotificationSoundPlugin.prototype.constructor = NotificationSoundPlugin;

NotificationSoundPlugin.prototype.className = 'NotificationSoundPlugin';
NotificationSoundPlugin.prototype.title = '通知音效localPlugin';

NotificationSoundPlugin.prototype.timer = null;
NotificationSoundPlugin.prototype.shortcutSwitch = null;
NotificationSoundPlugin.prototype.start = function(){

	var self = this;
	var unreads = Object.values(Poll.newResponsesPoll.getUnreadPlurks());
	var counts  = {
		all: unreads.length,
		own: unreads.filter(p => p.own).length,
		responded: unreads.filter(p => p.responded).length,
		private: unreads.filter(p => p.limited).length,
		mentioned: unreads.filter(p => p.mentioned).length,
	}

	this.shortcutSwitch.removeClass('on off').addClass( this.enabled ? 'on' : 'off');

	clearInterval(this.timer);
	this.timer = setInterval(function(){

		unreads = Object.values(Poll.newResponsesPoll.getUnreadPlurks());
		let new_counts = {
			all: unreads.length,
			own: unreads.filter(p => p.own).length,
			responded: unreads.filter(p => p.responded).length,
			private: unreads.filter(p => p.limited).length,
			mentioned: unreads.filter(p => p.mentioned).length,
		}

		if(new_counts.own > counts.own || new_counts.responded > counts.responded || new_counts.mentioned > counts.mentioned){
			self.alertSound();
		}

		counts = new_counts;

	}, 800);

}
NotificationSoundPlugin.prototype.stop = function(){
	clearInterval(this.timer);
	this.shortcutSwitch.removeClass('on off').addClass( this.enabled ? 'on' : 'off');
}
NotificationSoundPlugin.prototype.alertSound = function(){
	if(this.enabled){
		var audio = document.createElement('audio');
		audio.setAttribute('src', this.constructor.getDefaultAudio());
		audio.play();
	}
}

NotificationSoundPlugin.getDefaultAudio = function(){
	return localStorage.getItem("NotificationSoundPlugin_defaultAudio") || $extension('notification.mp3');
}
NotificationSoundPlugin.setDefaultAudio = function(base64URL){
	localStorage.setItem("NotificationSoundPlugin_defaultAudio", base64URL);
	var audio = document.createElement('audio');
		audio.setAttribute('src', base64URL);
		audio.play();
}

NotificationSoundPlugin.attachUploader = function(){
	$('#changeNotificationSoundFile').get(0).addEventListener('change', handleFileSelect, false);
	console.log('attach event');
}


//$('#changeNotificationSoundFile').livequery('change', handleFileSelect);
function handleFileSelect(evt) {
	var file = evt.target.files[0]; // FileList object

	if((file.size / 1024) > 200){
		alert(__('請選擇小於 200KB 的檔案'));
		return false;
	}
	if(!String(file.type).match(/.*audio.*/)){
		alert(__('這不是一個有效的音效檔'));
		return false;
	}

	var reader = new FileReader();
	reader.onload =  function(e) {
		NotificationSoundPlugin.setDefaultAudio(e.target.result);
		alert(__('更換成功'));
	}
	reader.readAsDataURL(file);

}
