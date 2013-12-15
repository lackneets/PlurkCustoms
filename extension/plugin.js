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
Plugin.prototype.enable = function(){
	//this.onenable && this.onenable();
	this.enabled = true;
	this.time = new Date().getTime();
	this.start();
};
Plugin.prototype.disable = function(){
	//this.ondisable && this.ondisable();
	this.enabled = false;
	this.time = new Date().getTime();
	this.stop();
};



function LocalPluginAdapter(className, title){
	var self = this;
	this.title = title || this.title;
	this.className = className || this.className;
	this.controlId = '_LocalPluginAdapter_' + new Date().getTime();
	localScript('window._localPlugins_ = window._localPlugins_ || {};');
	localScript('window._localPlugins_["'+this.controlId+'"] = new '+this.className+'();');
	setInterval(function(){
		getLocal('window._localPlugins_["'+self.controlId+'"].enabled', function(enabled){
			getLocal('window._localPlugins_["'+self.controlId+'"].time', function(time){
				if(enabled != self.enabled && time > self.time){
					if(enabled){
						self.enabled = true;
						this.onenable && this.onenable();
						this.time = time;
						//self.enable(time);
						console.log('#外掛狀態監測', self.title, self.enabled);
					} else{
						self.enabled = false;
						this.ondisable && this.ondisable();
						this.time = time;
						//self.disable(time);
						console.log('#外掛狀態監測', self.title, self.enabled);
					} 
					
				}
			});
		});
	}, 300);
	this.parent();
}

LocalPluginAdapter.prototype = Object.create(Plugin.prototype);
LocalPluginAdapter.prototype.parent = Plugin;

LocalPluginAdapter.prototype.className = 'Plugin';
LocalPluginAdapter.prototype.title = '#外掛模組轉接器#';
LocalPluginAdapter.prototype.init = function(){
	localScript('window._localPlugins_["'+this.controlId+'"].init();');
};
LocalPluginAdapter.prototype.start = function(){
	localScript('window._localPlugins_["'+this.controlId+'"].start();');
};
LocalPluginAdapter.prototype.stop = function(){
	localScript('window._localPlugins_["'+this.controlId+'"].stop();');
};
LocalPluginAdapter.prototype.enable = function(time){
	localScript('window._localPlugins_["'+this.controlId+'"].enable();');
	this.onenable && this.onenable();
	this.time = time || new Date().getTime();
	this.enabled = true;
	this.start();
};
LocalPluginAdapter.prototype.disable = function(time){
	localScript('window._localPlugins_["'+this.controlId+'"].disable();');
	this.ondisable && this.ondisable();
	this.enabled = false;
	this.time = time || new Date().getTime();
	this.stop();
};