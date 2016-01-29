"use strict";

function TitleCounterPlugin(){}
TitleCounterPlugin.prototype = Object.create(Plugin.prototype); /*Plugin.prototype*/;
TitleCounterPlugin.prototype.parent = Plugin;

TitleCounterPlugin.prototype.timer = null;
TitleCounterPlugin.prototype.origin = null;
TitleCounterPlugin.prototype.start = function(){

	var count_my;
	var count_responded;

	var title         = document.title;
	var titleDetail   = document.title;
	var defaultTitle  = document.title;

	this.defaultTitle = defaultTitle;

	this.timer = setInterval(function(){
		if(typeof Poll == 'undefined') return;
		Poll.counts = Poll.getUnreadCounts();
		
		count_my = Poll.counts.my;
		count_responded = Poll.counts.responded;

		var detail = '';
		
		detail += (Poll.counts.my > 0)        ? __('我 %d').replace('%d', Poll.counts.my) + ' '        : '';
		detail += (Poll.counts.responded > 0) ? __('回 %d').replace('%d', Poll.counts.responded) + ' ' : '';
		detail += (Poll.counts.priv > 0)      ? __('私 %d').replace('%d', Poll.counts.priv) + ' '      : '';
		detail += (Poll.counts.my > 0)        ? __('我 %d').replace('%d', Poll.counts.my) + ' '        : '';
		detail += (Poll.counts.all > 0)       ? __('未讀 %d').replace('%d', Poll.counts.all) + ' '     : '';

		detail = detail.replace(/^\s+/, '').replace(/\s+$/, '');

		if(detail){
			titleDetail = detail + ' - ' + TopBar.cur_page_title;
			titleDetail = titleDetail.replace(/\s{2,}/g, ' ');
		}else{
			titleDetail = TopBar.cur_page_title;
		}

		if(document.title != titleDetail){
			title = titleDetail;
			document.title = title;
		}

	}, 200);
}
TitleCounterPlugin.prototype.stop = function(){
	clearInterval(this.timer);
	document.title = this.defaultTitle;
}