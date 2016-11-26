"use strict";

class FaviconCounter {
  constructor(){

    this.favicon = document.querySelector('link[rel*="icon"]');
    this.img = document.createElement('img');
    this.img.src = 'https://www.plurk.com/favicon.ico';
    this.imgload = false;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    if(!CanvasRenderingContext2D.prototype.roundRect){
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x+r, y);
        this.arcTo(x+w, y,   x+w, y+h, r);
        this.arcTo(x+w, y+h, x,   y+h, r);
        this.arcTo(x,   y+h, x,   y,   r);
        this.arcTo(x,   y,   x+w, y,   r);
        this.closePath();
        return this;
      }
    }

    this.img.addEventListener('load', () => {
      this.imgload = true;
    });

  }
  setCount(count){
    if(count && parseInt(count) > 0){
      if(this.imgload){
        this.draw(count);
      }else{
        this.img.addEventListener('load', () => this.draw(count));
      }
    }else{
      this.favicon.href = this.img.src;
    }

  }

  draw(count){
    let txt = String(count);
    this.canvas.width = this.img.naturalWidth;
    this.canvas.height = this.img.naturalHeight;
    this.ctx.drawImage(this.img, 0, 0, this.img.naturalWidth*0.7, this.img.naturalHeight*0.7);
    this.ctx.font = "bold 16px Arial";
    this.ctx.fillStyle = '#EA3730';
    this.ctx.fillText(txt, this.img.naturalWidth-this.ctx.measureText(txt).width, this.img.naturalWidth);
    this.favicon.href = this.canvas.toDataURL('image/png');
  }
}

function TitleCounterPlugin(){}
TitleCounterPlugin.prototype = Object.create(Plugin.prototype); /*Plugin.prototype*/;
TitleCounterPlugin.prototype.parent = Plugin;

TitleCounterPlugin.prototype.timer = null;
TitleCounterPlugin.prototype.origin = null;
TitleCounterPlugin.prototype.start = function(){

  var count_my;
  var count_responded;

  var title           = document.getElementById('page_title').innerHTML || document.title;
  var titleDetail     = document.getElementById('page_title').innerHTML || document.title;
  var defaultTitle    = document.getElementById('page_title').innerHTML || document.title;
  var faviconCounter  = new FaviconCounter;

  this.defaultTitle = defaultTitle;

  this.timer = setInterval(function(){
    if(typeof Poll == 'undefined') return;
    Poll.counts = Poll.getUnreadCounts();

    count_my = Poll.counts.my;
    count_responded = Poll.counts.responded;

    var detail = '';
    var totalCount = Object.values(Poll.counts).reduce((a, b) => a + b);

    faviconCounter.setCount(totalCount);

    detail += (Poll.counts.my > 0)        ? __('我 %d').replace('%d', Poll.counts.my) + ' '        : '';
    detail += (Poll.counts.responded > 0) ? __('回 %d').replace('%d', Poll.counts.responded) + ' ' : '';
    detail += (Poll.counts.priv > 0)      ? __('私 %d').replace('%d', Poll.counts.priv) + ' '      : '';
    detail += (Poll.counts.all > 0)       ? __('未 %d').replace('%d', Poll.counts.all) + ' '     : '';

    detail = detail.replace(/^\s+/, '').replace(/\s+$/, '');

    if(detail){
      titleDetail = detail + ' - ' + defaultTitle;
      titleDetail = titleDetail.replace(/\s{2,}/g, ' ');
    }else{
      titleDetail = defaultTitle;
    }

    if(document.title != titleDetail){
      title = titleDetail;
      document.title = title;
    }

  }, 200);
}

TitleCounterPlugin.prototype.stop = function(){
  clearInterval(this.timer);
  document.title = this.defaultTitle;
}
