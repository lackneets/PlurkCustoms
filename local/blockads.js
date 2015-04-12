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
    thisArg.enabled && $(this).hide();
  }
}