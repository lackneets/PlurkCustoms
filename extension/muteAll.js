"use strict";

class MuteAllButton{

  constructor(){

    if(MuteAllButton.instance){
      return this;
    }else{
      MuteAllButton.instance = this;
    }

    this.settings = {};
    this.busy = false;
    this.init();

    return this;
  }

  init(){

    try{
      this.settings = JSON.parse(document.head.innerHTML.match(/SETTINGS\s*=\s*([^\n\r]+);/)[1]);
    } catch(e){
      console.error(e, 'MuteAllButton: Cannot parse settings from <head> JSON');
      return false;
    }

    this.$button = $("<a class='updater_link muteAll' href='#' >")
      .html("<span>✖ "+__('全部消音')+"</span>")
      .appendTo("#noti_re_actions")
      .click(() => { this.muteAll(); return false; });

    document.addEventListener('DOMNodeInserted', event => {

      if(event.srcElement.className != 'manager'){
        return false;
      }

      var $plurkManager = $(".plurk .manager:has(.delete)");

      if ($plurkManager.length) {
        if ($plurkManager.find(".mute").length == 0) {
          var $plurkBox = $plurkManager.parents(".plurk");
          var plurkId = $plurkBox.attr('id').match(/\d+/)[0];
          var muted = $plurkBox.hasClass('muted');
          var muteBtn = muted ?
            $("<a class='mute pif-volume-mute mute-on' href='#'></a>") :
            $("<a class='mute pif-volume mute-off' href='#'></a>");
          muteBtn.click(() => {
            this.mutePlurk(plurkId, !muted, () => {
              $plurkBox.toggleClass('muted');
              muteBtn.toggleClass('pif-volume-mute mute-on', !muted);
              muteBtn.toggleClass('pif-volume mute-off', muted);
            })
            return false;
          });
          muteBtn.prependTo($plurkManager);
        }
      }

    });

  }


  mutePlurk(plurk_id, mute, callback){
    var value = mute ? '2' : '0';
    $.ajax({
      url: "//www.plurk.com/TimeLine/setMutePlurk",
      data: {plurk_id: plurk_id, value: value },
      type: "POST", cache: false,
      success: function(data){
        if(callback) callback();
      }
    });
  }

  mutePlurks(ids){

    ids.sort((a,b) => b-a);

    var progress = 0;
    var total = ids.length;
    var muted = 0;

    ids.forEach((id, i) => {
      setTimeout(() => {
        $.ajax({
          url: "//www.plurk.com/TimeLine/setMutePlurk",
          data: {
            plurk_id: id,
            value: 2
          },
          type: "POST",
          cache: false,

          xhr: () => {
            var xhr = jQuery.ajaxSettings.xhr();
            if (xhr instanceof window.XMLHttpRequest) {
              xhr.addEventListener('readystatechange', () => {
                if (xhr.readyState >= 2) {
                  xhr.abort();
                  localScript('if(Plurk.getById(' + id + ')) Poll.setPlurkRead("' + id + '", Plurk.getById(' + id + ').response_count)');
                  localScript('if(Plurk.getById(' + id + ')) Plurk.getById(' + id + ').is_unread=2;');
                  localScript('Signals.sendSignal("plurk_muted","' + id + '")');
                  $("#p" + id).addClass('muted').removeClass('new').find('.manager .mute').addClass('unmute').html('Muted');

                  muted++;
                  var currentProgress = Math.round((muted / ids.length) * 100) / 100;

                  if (muted == total) {
                    this.done();
                  }

                  if ((currentProgress < 1) && (currentProgress - progress >= 0.1)) {
                    progress = currentProgress;
                    NProgress.set(currentProgress);
                  }

                }
              }, false);
            }
            return xhr;
          }
        });
      }, i * 20);
    });
  }

  muteAll(){

    if(this.busy) return false;
    if(NProgress.status){
      alert(__('忙碌中請稍後再試'));
      return false;
    }

    this.busy = true;
    this.$button.fadeOut('fast');

    NProgress.configure({ minimum: 0.005 ,
      template: '<div class="bar mute" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    });
    NProgress.start(0.3);

    $.ajax({
      url: "//www.plurk.com/Users/getUnreadPlurks",
      data: { known_friends: JSON.stringify([this.settings.user_id]) },
      type: "POST", cache: false,
      success: dataJSON => {

        var data = eval('(' + dataJSON + ')');
        console.log(data)
        for(var i=0; i < data.unread_plurks.length; i++) if(data.unread_plurks[i].owner_id == this.settings.user_id || data.unread_plurks[i].plurk_type > 1) { data.unread_plurks.splice(i,1); i--; }

        var total = data.unread_plurks.length;

        if(total == 0){
          this.done();
          return false;
        }
        var ok = confirm( __("確定要消音 %d 則未讀噗嗎? (不包含已回應過)").replace('%d', total) );
        var ids = [];
        if(!ok){
          this.done();
          return false;
        }

        for(var i in data.unread_plurks) ids.push(data.unread_plurks[i].plurk_id);
        this.mutePlurks(ids);
      }
    });
  }

  done(){
    this.busy = false;
    NProgress.done(true);
    this.$button.fadeIn('fast');
  }
}

$(() => {
  new MuteAllButton;
})


