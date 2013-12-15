
$(function(){
	
	function addImage(info, tab) {
		
		chrome.tabs.getSelected(null, function(tab) {
			//console.log(tab);
			//console.log(info.srcUrl);
			if(emo = info.srcUrl.match(/emos\.plurk\.com\/([0-9a-zA-Z]+)\_w(\d+)\_h(\d+)/)){
				//var keyword = info.getAttribute('keyword');
				var keyword = prompt(__("請為這張圖片取一個名字"), __("表情"));
				if(keyword && keyword.replace(/\s*/, '') != ""){
					saveEmotion(info.srcUrl, keyword, function(emotions){
						console.log("saveEmotion done");
					});
					//if(reloadTabsNextTime) reloadTabsNextTime();
				}
			}else{
				alert(__("這個不是噗浪自訂表情圖案"));
			}
		});
	}

	
	chrome.contextMenus.create({
		"title"		: "新增到噗浪表情圖庫",
		"contexts"	:["image"],
		"onclick"	: addImage});
})

