function Plugin(){
	this.constructor.plugins.push(this);
	this.id = '_Plugin_' + this.constructor.plugins.length;
	console.log('Plugin Created', this.title, this.id);
	this.init();
}

Plugin.id = 0;
Plugin.plugins = [];
Plugin.prototype.enabled = true;
Plugin.prototype.title = '#空外掛模組#';
Plugin.prototype.init = function(){
	//console.log('plugins', this.constructor, this.constructor.toString());
};
Plugin.prototype.start = function(){};
Plugin.prototype.stop = function(){};
Plugin.prototype.time = 0;
Plugin.prototype.enable = function(time){
	//this.onenable && this.onenable();
	if(time && time == this.time) return false;
	this.enabled = true;
	this.time = time || new Date().getTime();
	this.start();
};
Plugin.prototype.disable = function(time){
	//this.ondisable && this.ondisable();
	if(time && time == this.time) return false;
	this.enabled = false;
	this.time = time || new Date().getTime();
	this.stop();
};


//控制local端的轉接器
function LocalPluginAdapter(className, title){
	var self = this;
	this.title = title || this.title;
	this.className = className || this.className;
	this.controlId = '_LocalPluginAdapter_' + new Date().getTime();

	this.parent();
}

LocalPluginAdapter.prototype = Object.create(Plugin.prototype);
LocalPluginAdapter.prototype.parent = Plugin;

LocalPluginAdapter.prototype.className = 'Plugin';
LocalPluginAdapter.prototype.title = '#外掛模組轉接器#';
LocalPluginAdapter.prototype.init = function(){

	var self = this;

	//初始化 local 端 plugin
	localScript('window._localPlugins_ = window._localPlugins_ || {};');
	localScript('window._localPlugins_["'+this.controlId+'"] = new '+this.className+'();');
	localScript('window._localPlugins_["'+this.controlId+'"].init();');

	setInterval(function(){
		getLocal('window._localPlugins_["'+self.controlId+'"].enabled', function(enabled){
			getLocal('window._localPlugins_["'+self.controlId+'"].time', function(time){
				if(enabled != self.enabled && time > self.time){
					if(enabled){
						self.enabled = true;
						this.onenable && this.onenable();
						self.enable(time);
						console.log('#外掛狀態監測', self.title, self.enabled, time);
					} else{
						self.enabled = false;
						this.ondisable && this.ondisable();
						self.disable(time);
						console.log('#外掛狀態監測', self.title, self.enabled, time);
					} 
					
				}
			});
		});
	}, 300);
	
};
LocalPluginAdapter.prototype.start = function(){
	localScript('window._localPlugins_["'+this.controlId+'"].start();');
};
LocalPluginAdapter.prototype.stop = function(){
	localScript('window._localPlugins_["'+this.controlId+'"].stop();');
};
LocalPluginAdapter.prototype.enable = function(time){
	if(time && time == this.time) return false;
	localScript('window._localPlugins_["'+this.controlId+'"].enable('+time+');');
	this.onenable && this.onenable();
	this.time = time || new Date().getTime();
	this.enabled = true;
	this.start();
	return this.time;
};
LocalPluginAdapter.prototype.disable = function(time){
	if(time && time == this.time) return false;
	localScript('window._localPlugins_["'+this.controlId+'"].disable('+time+');');
	this.ondisable && this.ondisable();
	this.enabled = false;
	this.time = time || new Date().getTime();
	this.stop();
	return this.time;
};