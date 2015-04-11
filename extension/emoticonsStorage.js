var Emotion = function(emotion_data){
	for(var i in this.__proto__){
		this[i] = emotion_data[i];
	}
	this.url = this.url.replace(/https?:/, '');
}
Emotion.prototype = {
	keyword	: "",
	hash_id	: "",
	url		: "",
}


EmoticonsStorage = function(){};
EmoticonsStorage.getFavorites = function(){
	var fav = localStorage.getItem("emotions_favorites");
	try{ fav = JSON.parse(fav); }catch(e){ fav = new Array();; }
	if(typeof fav != 'object' && typeof fav != 'array') fav = new Array();
	if(fav == null) fav = new Array();
	fav = normalizeKeywordFilter(fav);
	return arrayClone(fav);
}
EmoticonsStorage.getCollection = function(){
	var fav = localStorage.getItem("emotions_collection");
	try{ fav = JSON.parse(fav); }catch(e){ fav = new Array();; }
	if(typeof fav != 'object' && typeof fav != 'array') fav = new Array();
	if(fav == null) fav = new Array();
	fav = normalizeKeywordFilter(fav);
	return arrayClone(fav);
}
EmoticonsStorage.removeCollection = function(url){
	if(! typeof emotion == 'Emotion') throw("EmoticonsStorage.addFavorite(): Emotion expected");

	var emoticons = _.reject(this.getCollection(), function(e){ return e.url == url;});
	localStorage.setItem("emotions_collection", JSON.stringify(emoticons));	
}
EmoticonsStorage.addCollection = function(emoticon){
	if(! typeof emotion == 'Emotion') throw("EmoticonsStorage.addFavorite(): Emotion expected");

	var now = new Date().getTime();

	var emoticons = this.getCollection();
	var exist = _.findWhere(emoticons, {hash_id: emoticon.hash_id});
	emoticon =  exist || emoticon;
	emoticon.count = emoticon.count || 0;
	emoticon.time = emoticon.time || 0;

	if(now - emoticon.time > 1000*60*10){
		emoticon.count++;
		emoticon.time = now;
	}


	if(! exist ){
		emoticons.push(emoticon);
	}

	emoticons = _.map(emoticons, function(emo){ emo.time = emo.time || 0; return emo; });

	emoticons = _.sortBy(emoticons, function(e){ return now - e.time; });

	if(emoticons.length > 3000) emoticons.length = 3000;

	
	localStorage.setItem("emotions_collection", JSON.stringify(emoticons));	
}
EmoticonsStorage.addFavorite = function(emotion){
	if(! typeof emotion == 'Emotion') throw("EmoticonsStorage.addFavorite(): Emotion expected");
	
	var emotions = this.getFavorites();
	emotions.sort(sortFavorite);
	
	
	var high = (emotions.length > 0) ? emotions[0].favorite : 0;
	
	// Find the same
	var exist;
	for(var i in emotions) if(emotions[i].hash_id == emotion.hash_id){
		emotion = emotions[i];
		exist = true;
		break;
	}
	if(! exist ) emotions.push(emotion);
	
	function stdDev(a){
		function mean(a){ var sum=eval(a.join("+")); return sum/a.length; }
		var m=mean(a);
		var sum=0;
		var l=a.length;
		for(var i=0;i<l;i++){
			var dev=a[i]-m;
			sum+=(dev*dev);
		}
		return Math.sqrt(sum/(l-1));
	}
	
	
	function array_mid(arr, attr){var s=0; for(i in arr) s+= arr[i][attr]; return s/arr.length; }

	if( typeof emotion.favorite != 'number') emotion.favorite = 0;

	if(emotion.hash_id == emotions[0].hash_id){
		//已經是第一個
	} else if(emotion.favorite == emotions[0].favorite){
		//最高權值但不是第一個
		emotion.favorite += 2;
		
	} else if(emotion.favorite < 256){
		function fav_arr(emotions){  var e = []; for(i in emotions) e.push(emotions[i]['favorite']); return e; };
		
		var mid = Math.ceil(array_mid(emotions, 'favorite')); if(mid < 2) mid = 2;
		var max = Math.max.apply( Math, fav_arr(emotions) );
		var min = Math.min.apply( Math, fav_arr(emotions) );
		var std = stdDev(fav_arr(emotions));
		var inc = Math.ceil(Math.max(min, 1) + std/4);
		//emotion.favorite += inc;
		if(emotion.favorite < mid)  emotion.favorite += inc;
		else emotion.favorite += Math.ceil(Math.max(std/4, 2)) ;
		
	} else {
		for(i in emotions){
			emotions[i].favorite--;
			if(emotions[i].favorite > 255) emotions[i].favorite = 255;
		}
	}
	
	emotion.favorite = Math.min(255, Math.ceil(emotion.favorite));
	
	emotions.sort(sortFavorite);
	
	if(emotions.length > 200) emotions.splice(emotions.length-200, emotions.length); 
	
	function sortFavorite(a, b){ return b.favorite - a.favorite; }
	
	localStorage.setItem("emotions_favorites", JSON.stringify(emotions));	
}
EmoticonsStorage.renameFavorite = function(url, keyword){
	var emotions = this.getFavorites();
	for(i in emotions) if(emotions[i].url == url) emotions[i].keyword = keyword;
	localStorage.setItem("emotions_favorites", JSON.stringify(emotions));
}

EmoticonsStorage.removeFavorite = function(url){
	var emotions = this.getFavorites();
	for(i in emotions) if(emotions[i].url == url) emotions.splice(i, 1);
	localStorage.setItem("emotions_favorites", JSON.stringify(emotions));
}

function collect(img){
	var emoticon = new Emotion({
		keyword: $(img).attr('keyword') || __('表情'),
		hash_id: PlurkEmotiland.urlHash($(img).attr('src')),
		url: $(img).attr('src')
	});
	EmoticonsStorage.addCollection(emoticon);
}
$(".plurk_box ").livequery(function(){
	var imgs = $(this).find("img[src*='emos.plurk.com']:not(.collected):not(.exist)");
	imgs.addClass('collected').each(function(){
		collect(this);
	})
	
});
$(".plurk img[src*='emos.plurk.com']:not(.collected):not(.exist)").livequery(function(){
	$(this).addClass('collected').each(function(){
		collect(this);
	})
})
