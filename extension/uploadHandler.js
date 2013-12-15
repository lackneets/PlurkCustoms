//監控自訂表情上傳

//$("#emo-add-field2").livequery(function(){ $(this).hide().contents().hide(); })
$("#emo-add-field2 img#emo-add-preview").livequery('load', function(){
	var img = this;
	var url = this.src; 
	var keyword = prompt(__("請為這張圖片取一個名字"), __("表情"));
	$(this).parent().hide();
	if(keyword && keyword.replace(/\s*/, '') != ""){
		gallery.storage.saveEmotion(url, keyword, function(emotions){
			reset();
		});
	}else{
		reset();
	}
	function reset(){
		$('#emo-file-form')[0].reset();
		img.src = null;
	}
	$("#emo-add-field2").hide();
});

/*$.wait(".error-msg.emo-file-error[style*='visibility: visible']", function(){
	$(".error-msg.emo-file-error").css('visibility', 'hidden');
	alert($(".error-msg.emo-file-error").text());
}, true);

$.wait(".error-msg.emo-url-error[style*='visibility: visible']", function(){
	$(".error-msg.emo-url-error").css('visibility', 'hidden');
	alert($(".error-msg.emo-url-error").text());
}, true);*/