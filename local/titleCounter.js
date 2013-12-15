TitleCounterPlugin = function(){}
TitleCounterPlugin.prototype = Object.create(Plugin.prototype); /*Plugin.prototype*/;
TitleCounterPlugin.prototype.parent = Plugin;

TitleCounterPlugin.prototype.timer = null;
TitleCounterPlugin.prototype.origin = null;
TitleCounterPlugin.prototype.start = function(){
	var self = this;
	this.origin = document.title;
	this.timer = setInterval(function(){
		if(typeof Poll == 'undefined') return;
		Poll.counts = Poll.getUnreadCounts();
		
		//if(typeof arguments.callee.my == 'undefined' && (Poll.counts.my + Poll.counts.responded) > 0) notificationSound();
		if(typeof arguments.callee.my == 'undefined') arguments.callee.my = Poll.counts.my;
		if(typeof arguments.callee.responded == 'undefined') arguments.callee.responded = Poll.counts.responded;
		
		/*if(arguments.callee.my < Poll.counts.my || arguments.callee.responded < Poll.counts.responded){
			notificationSound();
			console.log('notificationSound');
		}*/
		arguments.callee.my = Poll.counts.my;
		arguments.callee.responded = Poll.counts.responded;
		
		var defaultTitle = document.title, title = "", detail = "";
		if(Poll.counts.my) detail 			+= " " + __("我 %d").replace('%d', Poll.counts.my) + " ";	
		if(Poll.counts.responded) detail 	+= " " + __("回 %d").replace('%d', Poll.counts.responded) + " ";
		if(Poll.counts.priv) detail 		+= " " + __("私 %d").replace('%d', Poll.counts.priv) + " ";
		detail = detail.replace(/^\s+/, '').replace(/\s+$/, '');
		if(detail) title = title + " " + detail + "";
		if(Poll.counts.all) title 			+= " " + __("未讀 %d").replace('%d', Poll.counts.all) + " ";
		
		if(title) document.title = title + " - " + TopBar.cur_page_title;
		else document.title = defaultTitle;
	}, 200);
}
TitleCounterPlugin.prototype.stop = function(){
	clearInterval(this.timer);
	document.title = this.origin ;
}