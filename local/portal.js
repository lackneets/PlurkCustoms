

var LANG = "zh_Hant";
LANG = $("select[name=language] option[selected]").val();

loadScript('languages.js');

localScript(function(args){
	window.jQueryPath		 	= args.jQueryPath;
	window.plurkCustoms_key 	= args.plurkCustoms_key;
	window.plurkCustoms_path 	= args.plurkCustoms_path;
	//window.LANG					= args.LANG;
	window.$extension = function(url){
		return args.plurkCustoms_path + url;
	}

}, {
	jQueryPath 			: chrome.extension.getURL('jquery.min.js'),
	plurkCustoms_key 	: chrome.extension.getURL('').replace('chrome-extension://', '').replace('/', ''),
	plurkCustoms_path 	: chrome.extension.getURL(''),
	LANG				: LANG,
});

loadScript('local/loader.js');
localScript('var _jQuery = jQuery.noConflict(true); ');
loadScript('js/jquery.min.js');
localScript('var $ = jQuery.noConflict(true); jQuery = _jQuery;');
loadScript('js/jquery-migrate-1.2.1.js');
loadScript('js/usingjQuery.js');
loadScript('js/jquery.wait.js');
loadScript('js/jquery.livequery.js');
localScript('$.fn.livequery = jQuery.fn.livequery');
loadScript('js/sprintf.js');

loadScript('extension/plugin.js');

loadScript('local/localScript.js');
loadScript('local/avatarEnlarge.js');
loadScript('local/titleCounter.js');
loadScript('local/notification.js');
loadScript('local/plurkBox.js');
loadScript('local/keywordDetector.js');
loadScript('local/ui.js');
loadScript('local/blockads.js');

loadStyle('lib/nprogress.css');
loadStyle('lib/dropzone.css');

//時光機
$.wait("#filter_tab span:contains((0))", function(element){
	$(this).html('')
}, true);

$.wait("#filter_tab", function(element){
	loadScript('js/timeMachine.js');
	$("<a href='#' title='" + __('瀏覽以前的噗') + "' class='off_tab timeMachine' rel='timeMachine'>"+ __('時光機') +"</a>").click(function(){
		localScript('PlurkCustoms.timeTravel();');
	}).wrap('<li/>').appendTo(this);
});