"use strict";

class GalleryBackup{

  get Methods(){
    return {
      'Replace' : 'GalleryBackup_REPLACE_MODE',
      'Merge': 'GalleryBackup_MERGE_MODE'
    }
  }

  constructor(){
    // FIXME: laggy
    $('.text_holder:has(a[href*="paste.plurk.com"]:contains("PlurkCustomsBackup"))').livequery(function(e){
      var url = $(this).find('a[href*="paste.plurk.com"]').attr('href');
      var backup = $('<div/>', { class: 'backup',
        html: ['<b>圖庫備份還原點</b><br>',
        $('<span>', {class: 'action replace', text: '復原',     click: function(){ GalleryBackup.restoreFromPaste(url, GalleryBackup.REPLACE); return false; }}),
        $('<span>', {class: 'action merge', text: '合併',       click: function(){ GalleryBackup.restoreFromPaste(url, GalleryBackup.MERGE); return false; }}),
        //$('<span>', {class: 'action download', text: '下載',  click: function(){ GalleryBackup.downloadFromPaste(url) }})
        ]
      });
      $(this).parents('.plurk[id^=p]').addClass('backup')
      $(this).empty().append(backup);
    });
  }

  static cloudBackup(){

    if(!GalleryBackup.startProgress()){
      return false;
    }

    gallery.storage.loadEmotions(emoticons => {
      var base64 = GalleryBackup.backupPaste(emoticons, url => {
        NProgress.set(0.7);
        GalleryBackup.addPlurk(url, plurkObj => {
          NProgress.done(true);
          if(plurkObj) alert('備份完成，你會在河道看到一則還原點私噗');
        });
      });
    });
  }

  static addPlurk(url, callback){
    $.ajax({
      type: 'POST',
      url: '//www.plurk.com/TimeLine/addPlurk',
      dataType: 'html',
      data: {
        'posted':     new Date().toISOString(),
        'qualifier':  ':',
        'content':    url + ' (PlurkCustomsBackup) ' + hex_md5(url),
        'lang':     'tr_ch',
        'no_comments' : 1,
        'uid' :     user_id,
        'limited_to':   '['+user_id+', "'+user_id+'"]'
      },
      success: function(plurkObj){
        var plurk_id = plurkObj;
        callback && callback(plurkObj);
      },
      error: function(){
        alert('備份失敗！你可能剛剛備份過了？');
        callback && callback();
      }
    })
  }

  static backupPaste(emoticons, callback){
    var base64 = GalleryBackup.objectToBase64(emoticons);

    $.ajax({
      url: 'https://www.plurk.com/Shares/addPaste',
      method: 'post',
      dataType: 'json',
      data: {
        'code':         base64,
        'language':     'text',
      }
    }).success(response =>{
      if(response.error){
        alert('噗浪發生錯誤，請稍候再試一次');
        NProgress.done(true);
      }
      if(response.id){
        callback && callback(`https://paste.plurk.com/show/${response.id}/`);
      }
    }).error(xhr => {
      alert('連線發生錯誤，請稍候再試一次');
      NProgress.done(true);
    });


    return base64;
  }

  static restoreFromPaste (url, method, callback){

    if(!GalleryBackup.startProgress()){
      return false;
    }

    var id = (url.match(/show\/([\d\w]+)\/?/)||[]).pop();
    var url = url.replace('//show', '/show').replace(/https?/, 'https').replace(/\/?$/, '/');

    $.ajax({
      url,
      timeout: 3000
    }).success((html) => {
      GalleryBackup.restoreFromPasteHTML(html, method, callback);
    }).error(() =>{
      alert('連線發生錯誤，請稍候再試一次');
      NProgress.done(true);
    });

  }

  static restoreFromPasteHTML (html, method, callback){
    var base64 = $($.parseHTML(html)).find('div.code:first .syntax').text();
    var emoticons = GalleryBackup.restore(base64, 'base64', method, function(){
    NProgress.done(true);
      callback && callback(emoticons);
    });
  }

  static restore (data, datatype, method, callback){
    var emoticons = data;
    if(datatype.toLowerCase() == 'base64'){
      var json = b64_to_utf8(data);
      emoticons = JSON.parse(json);
    }else if(datatype.toLowerCase() == 'json'){
      emoticons = JSON.parse((data));
    }
    if(! emoticons instanceof Array){
      throw "TypeError: While parsing emoticons source data";
    }

    if(method === GalleryBackup.REPLACE){
      var con = confirm("警告！你確定要取代目前的圖庫嗎？ (已載入" + emoticons.length  + "張圖片)")
      if(con){
        gallery.storage.replaceEmotions(emoticons, function(emoticons){
          for(var e in emoticons) EmoticonsStorage.renameFavorite(emoticons[e].url, emoticons[e].keyword);
          alert('圖庫置換成功！');
          gallery.storage.flush();
          callback && callback(emoticons);
        })
      }else{
        callback && callback(false);
      }
    }else if(method === GalleryBackup.MERGE) {
      var con = confirm("警告！你確定要合併至目前的圖庫嗎？ (已載入" + emoticons.length  + "張圖片)")
      if(con){
        gallery.storage.saveEmotions(emoticons, function(emoticons){
          for(var e in emoticons) EmoticonsStorage.renameFavorite(emoticons[e].url, emoticons[e].keyword);
          alert('圖庫合併成功！');
          gallery.storage.flush();
          callback && callback(emoticons);
        });
      }else{
        callback && callback(false);
      }
    }else{
      callback && callback(false);
      throw "Method must specified";
    }
    return emoticons;
  }

  static objectToBase64 (object){
    var json = JSON.stringify(object);
    var b64 = utf8_to_b64( json );
    return b64;
  }

  static startProgress(){
    if(NProgress.status){
      alert(__('忙碌中請稍後再試'));
      return false;
    }

    NProgress.configure({
      minimum: 0.005 ,
      template: '<div class="bar backup" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    });
    NProgress.set(0.0);
    NProgress.start();

    return true;
  }

}


$(() => new GalleryBackup);