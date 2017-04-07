$(".plurk img[src*='emos.plurk.com']:not([keyword])").livequery(function(){
	var $plurk = $(this).parents('.plurk');
	var pid = $plurk.attr('data-pid');
	var rid = $plurk.attr('data-rid');

	var plurk = PlurksManager.getPlurkById(pid)

	$(this).attr('keyword', '');

	if(typeof plurk == 'undefined') return;

	$.each(findKeywords(plurk), function(hash, keyword){
		$plurk.find("img[src*="+hash+"]").attr('keyword', keyword);
	});
});

$(function(){
	if(typeof BroadcastStation == 'object'){
		BroadcastStation.listen('plurk', 'reading', event => {
			$.post('/Responses/get2', {
				plurk_id: event.plurk_id,
				from_response: 0
			}).success(json => {
				json.responses.forEach(response => {
					$.each(findKeywords(response), function(hash, keyword){
						console.log(response, keyword, hash)
						$(`.plurk[data-rid=${response.id}] img[src*="${hash}"]`).attr('keyword', keyword);
					});
				})
			});
		})
	}
})


function findKeywords(plurkData){
	var RegExBrackets = /(\[[^\]]+\])/g ;
	var RegExEmosUrl = /https?:\/\/emos\.plurk\.com\/[0-9a-f]{32}_w\d+_h\d+\.\w+/g;
	var RegExEmosHash = /[0-9a-f]{32}/g;
	var emos = plurkData.content.match(RegExEmosUrl);
	var brackets = plurkData.content_raw.match(RegExBrackets);
	var nonConvertedBrackets = plurkData.content.match(RegExBrackets);
	var arr = {};
	//console.log(brackets, nonConvertedBrackets, emos);
	for(var i in nonConvertedBrackets){
		if(!brackets) break;
		var index = brackets.indexOf(nonConvertedBrackets[i]);
		if(index > -1) brackets.splice(index, 1);
	}
	for(var i in emos){
		if(!brackets) break;
		var hash = emos[i].match(RegExEmosHash)[0];
		arr[hash] = "emos" && brackets[i] && brackets[i].replace(/^\[/, '').replace(/\]$/, '');
	}

	return arr;
}
