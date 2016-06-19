//監控自訂表情上傳

(function(){

  $(document).on('click', '#emo-panel-add', function(){
    newEmoticonKeyword = $('#emo-panel-kw-editor').val() || __("表情");
    if(newEmoticonKeyword && newEmoticonKeyword.replace(/\s*/, '') != ""){
      var src = $('#emo-panel-emo').attr('src');
      if(String(src).match(/plurk\.com\/([0-9a-zA-Z]+)/)){
        gallery.storage.saveEmotion($('#emo-panel-emo').attr('src'), newEmoticonKeyword, function(emotions){
          console.info('「'+newEmoticonKeyword+'」已儲存到噗浪卡卡圖庫');
        });        
      }
    }
  });

  $(document).on('click', '.uploader #emo-panel-add', function(){
    setTimeout(function(){
      emotiland.cache = [];
      emotiland.getStorageLimit(function(limit){
        console.info('檢查新表符');
        gallery.reduceOnlineEmoticons(limit - 5);
      });
    }, 1500);
  });

})();