$(".plurk img[src*='emos.plurk.com']:not([keyword])").livequery(function(){
	var id = $(this).parents('[data-pid], [data-rid]').attr('id');
	var plurk = $(this).parents('.plurk');
	var pid = plurk.attr('data-pid');
	var rid = plurk.attr('data-rid');

	id = (id || (rid && 'm'+rid) || (pid && 'p'+pid));
	
	$(this).attr('keyword', '');
	if(typeof $plurks[id] == 'undefined') return;
	$.each(findKeywords($plurks[id].obj), function(hash, keyword){
		plurk.find("img[src*="+hash+"]").attr('keyword', keyword);
	});	
})

function findKeywords(plurkData){
	var RegExBrackets = /(\[[^\]]+\])/g ;
	var RegExEmosUrl = /http:\/\/emos\.plurk\.com\/[0-9a-f]{32}_w\d+_h\d+\.\w+/g;
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