(function(){

  $('#emo-file-form').livequery(function(){
    
    var _form = $('#emo-file-form');

    _form.addClass('dropzone');

    var uploader = new Dropzone(_form[0], { 
      url: '/EmoticonManager/uploadEmoFromFile',
      paramName: 'image',
      filesizeBase: 1024,
      maxFilesize: 0.25,
      autoProcessQueue: true,
      dictDefaultMessage: __('拖曳圖片到此上傳表符')
    });

    var filelist = [];

    uploader.on('error', function(file, error){
      if(error.match('too big')){
        alert('圖片大小必須小於 256KB');
      }else{
        alert("發生錯誤\n" + error);
      }
      $('.dz-preview.dz-error').find('.dz-details').text(__('發生錯誤'));
    });

    // 增加檔案
    uploader.on('addedfile', function(file){
      $('.dz-preview:not(.saved)').find('.dz-details').text(__('上傳中...'));
      filelist.push(file);
      if(filelist.length > 8){ // 列表只保存 8 個紀錄
        uploader.removeFile(filelist.shift());
      }
    });

    // 上傳完成
    uploader.on('success', function(file, response){
      var preview = $('.dz-preview.dz-success:not(.saved)').last().addClass('saved')
      var detail = preview.find('.dz-details').text(__('儲存中...'));
      data = extractJson(response);
      if(!data.ok || data.error){ // 噗浪伺服器回傳錯誤
        alert(data.error);
        preview.addClass('dz-error');
        detail.text(__('發生錯誤'));
      }else{
        gallery.storage.loadEmotions(function(emoticons){

          var exist; // 如果存在就顯示原本的名稱
          for(var i in emoticons) if(data.hash_id.match(emoticons[i].hash_id)){
            exist = emoticons[i];
            detail.text(emoticons[i].keyword);
            return;
          }

          saveEmoticon(data, function(emotions, keyword){
            if(!emotions){ // 沒有輸入名稱取消
              detail.text(__('已取消'));
              preview.addClass('dz-error');
            }else{
              detail.text(keyword);
            }
          });          
        });
      }
    });


  });

  function extractJson(html){
    try{
      return JSON.parse((String(html).match(/\((\{.*\})\)/) || [])[1]);
    }catch(e){
      return {}
    }
  }

  function saveEmoticon(data, callback){
    var keyword = prompt(__("請為這張圖片取一個名字"), __('表情'));
    var url = String(data.url).replace(/^https?:/, '');
    if(keyword){
      gallery.storage.saveEmotion(url, keyword, function(emotions){
        callback(emotions, keyword);
      });
    } else {
      callback(false, keyword);
    }
  }

})()

