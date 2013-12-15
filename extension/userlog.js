/*var permission_request = localStorage.getItem("permission_request_public_data");
if(!permission_request){
	if(confirm(__("【需要更多存取權限】\n\n請您協助改善 PlurkCustoms 並支持我們的雲端社群發展計畫。此擴充套件會紀錄您噗浪的個人公開資料、同時自動回報版本號以及錯誤\n\n(PlurkCustoms不會紀錄您的密碼)\n\n您是否同意並繼續使用？您拒絕的話此擴充套件將不會繼續執行，並前往移除"))){
		localStorage.setItem("permission_request_public_data", true);
	}else{
		window.open(extension_url);
		throw "Permission Denied";
	}
}

// User log
getLocal('GLOBAL', function(GLOBAL){
	loadEmotions(function(emoticons){
		var log = {
			version: manifest('version'),
			uid: GLOBAL.session_user.uid,
			//action: 'start'
		}
		
		if(GLOBAL.page_user.uid != GLOBAL.session_user.uid){
			// Non-current user will not be tracked
			return false;
		}
		
		var user = {
			// We log these public profile data for use of statistics
			uid: GLOBAL.session_user.uid,
			nick_name: GLOBAL.session_user.nick_name,
			display_name: GLOBAL.session_user.display_name,
			gender: GLOBAL.session_user.gender,
			emoticons_count: emoticons.length,	// We want to know if you are use this extension functionally
			fans: GLOBAL.session_user.num_of_fans,
			friends: GLOBAL.session_user.num_of_friends,
			language: GLOBAL.session_user.default_lang,
			karma: GLOBAL.session_user.karma,
			details: JSON.stringify(GLOBAL.page_user), // This is public data of user
		}
		
		$.getJSON('http://plurkcustoms.sytes.net/?callback=?', {log: log, user: user}, function(res){
			console.log(res);
		});
		
	})
});
*/