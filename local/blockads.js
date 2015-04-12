function BlockAdsPlugin(){
  this.selector = [];
  this.selector.push('#plurk_ads');
  this.selector.push('.adv');
  this.selector.push('.adsense');
  this.selector.push('.cbox_ads');
  //this.selector.push('iframe:not([src*=plurk])');
  this.selector = this.selector.join(', ');
}
BlockAdsPlugin.prototype = Object.create(Plugin.prototype); /*Plugin.prototype*/;
BlockAdsPlugin.prototype.parent = Plugin;

BlockAdsPlugin.prototype.start = function(){
  $(this.selector).livequery(this.hideAd(this));
}
BlockAdsPlugin.prototype.stop = function(){
  $(this.selector).show();
}
BlockAdsPlugin.prototype.hideAd = function(thisArg){
  return function(){
    if(thisArg.enabled){
      $(this).hide();
      fixCboxEmpty(this);
    }
  }
}

function fixCboxEmpty(element){
  if($(element).is('.cbox_ads')){
    setTimeout(function(){fixBlockHeight($(element).siblings('.cbox_response'))}, 200);
    setTimeout(function(){fixBlockHeight($(element).siblings('.cbox_response'))}, 300);
    setTimeout(function(){fixBlockHeight($(element).siblings('.cbox_response'))}, 500);
  }
}

function fixBlockHeight(element){
  var siblingsHeight = 0;

  if($(element).length == 0){
    return false;
  }

  $(element).siblings().each(function(){
    if(window.getComputedStyle(this).display == 'block' && window.getComputedStyle(this).position != 'absolute'){
      siblingsHeight += $(this).outerHeight(true);
    }
  });

  var paddings = parseFloat($(element).css('padding-top')) + parseFloat($(element).css('padding-bottom'));
  $(element).height($(element).parent().height() - siblingsHeight - paddings);
}