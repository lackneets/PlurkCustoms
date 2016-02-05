
function PlurkBoxAdvancedPlugin(){

}
PlurkBoxAdvancedPlugin.prototype = Object.create(Plugin.prototype); /*Plugin.prototype*/;
PlurkBoxAdvancedPlugin.prototype.parent = Plugin;

PlurkBoxAdvancedPlugin.prototype.start = function(){
	var self = this;
	$('.plurk[id^=p].display').livequery(function(e){
		if(! self.enabled ) return;
		var div = $(this);
		var id = $(this).attr('id');
		var time = div.find('.posted');
		var href = get_permalink(id.match(/\d+/));
		var info = div.find('.td_info').show(); div.find('.tr_info').show();

		var replurkers = $plurks[id].obj.replurkers;
		var liker = $plurks[id].obj.favorers;

		if(time.length == 0){
			time = $('<a class="posted clock"></a>');
			time.css({
				'color' : '#333',
				'flaot' : 'right',
				'cursor': 'pointer'
			});
			time.attr('href', href);
			time.attr('target', '_blank');
			time.click(function(){window.open(href)});
			time.html(countTime($plurks[id].obj.posted)).attr('title', dateString($plurks[id].obj.posted));
			time.appendTo(info);
		}

		// if(replurkers.length > 0 && div.find('.replurk').length == 0){
		// 	var replurkers_list = "";
		// 	var replurkers_more = 0;
		// 	for(var i in replurkers){
		// 		if((name = getDisplayname(replurkers[i]))) replurkers_list += name + "\n";
		// 		else replurkers_more++;
		// 	}
		// 	replurkers_list = replurkers_list.replace(/\n$/, '');

		// 	if(replurkers_list == "") replurkers_list = __("%d 個人轉噗").replace('%d', replurkers_more);
		// 	else if(replurkers_more) replurkers_list += "\n" + __("以及其他 %d 個人都分享了此訊息").replace('%d', replurkers_more);
		// 	else replurkers_list += "\n" + __("分享了此訊息");
		// 	var replurk_info = $(_('<a class="replurk" style="cursor:default; color:#333;" >'+__('%d 個轉噗')+'</a>').replace('%d', replurkers.length)).attr('title', replurkers_list);	

		// 	replurk_info.appendTo(info);		
		// }

		// if(liker.length > 0 && div.find('.likes').length == 0){
		// 	var liker_list = "";
		// 	var like_info = $(_('<a class="likes" style="cursor:default; color:#333;" >'+__('%d 個讚')+'</a>').replace('%d', liker.length));	
		// 	like_info.appendTo(info);
		// }	
	});	
}
PlurkBoxAdvancedPlugin.prototype.stop = function(){
	$('.plurk[id^=p] .td_info').hide();
}

function isMine(user_id){
	return SETTINGS.user_id == user_id;
}

function getDisplayname(uid){
	if(typeof USERS[uid] != 'undefined') return USERS[uid].display_name;
	else return null;
}

function base_convert(number, frombase, tobase) {
  return parseInt(number + '', frombase | 0).toString(tobase | 0);
}

function get_permalink($plurk_id)
{
    return "http://www.plurk.com/p/" + base_convert($plurk_id, 10, 36);
}


function dateString(_d){ 
	//function td(d){ return (new String(d).match(/^d{1}$/)) '0' + d : d; }
	var y = _d.getFullYear();
	var m = _d.getMonth() +1;
	var d = _d.getDate();
	var h = _d.getHours();
	var i = _d.getMinutes();
	var s = _d.getSeconds();
	var a = (_d.getHours() < 12 ) ? __("早上") : __("下午");
	var h12 = h%12;
	//if(y == new Date().getFullYear()) return sprintf('%02d:%02d %d/%d', h, i, m, d);
	return sprintf('%s %02d:%02d %d/%d/%d', a, h12, i, y, m, d);
}
function countTime($time){
	$sec = (new Date().getTime() - ($time).getTime()) /1000; 
				
	if($sec < 60)
		return __("剛剛");
		
	else if($sec < 60*60)
		return sprintf(__("%s 分鐘前"), Math.round($sec /60));
		
	else if($sec < 86400)
		return sprintf(__("%s 小時前"), Math.round($sec /(60*60)));
		
	else if($sec > 86400 && $sec < 86400*2)
		return __("昨天");
			
	else if($sec > 86400 && $sec < 86400*7)
		return sprintf(__("%s 天前"), Math.round($sec /(60*60*24)));
		
	else if($sec < 86400*30)
		return sprintf(__("%s 星期前"), Math.round($sec /(60*60*24*7)));
		
	else 
		return dateString($time);
}