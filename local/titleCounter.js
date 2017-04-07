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


  var title           = document.getElementById('page_title').innerText || document.title || 'Plurk';
  var titleDetail     = document.getElementById('page_title').innerText || document.title || 'Plurk';
  var defaultTitle    = document.getElementById('page_title').innerText || document.title || 'Plurk';
  var faviconCounter  = new FaviconCounter;

  this.defaultTitle = defaultTitle;

  this.timer = setInterval(function(){
    if(typeof Poll == 'undefined') return;
    // Poll.counts = Poll.getUnreadCounts();

    var unreads = Object.values(Poll.newResponsesPoll.getUnreadPlurks());
    var counts  = {
      all: unreads.length,
      own: unreads.filter(p => p.own).length,
      responded: unreads.filter(p => p.responded).length,
      private: unreads.filter(p => p.limited).length,
      mentioned: unreads.filter(p => p.mentioned).length,
    }

    var detail = '';

    faviconCounter.setCount(counts.all);

    detail += (counts.own > 0)        ? __('我 %d').replace('%d', counts.own) + ' '        : '';
    detail += (counts.mentioned > 0)  ? __('提 %d').replace('%d', counts.mentioned) + ' '        : '';
    detail += (counts.responded > 0)  ? __('回 %d').replace('%d', counts.responded) + ' ' : '';
    detail += (counts.private > 0)    ? __('私 %d').replace('%d', counts.private) + ' '      : '';
    detail += (counts.all > 0)        ? __('未 %d').replace('%d', counts.all) + ' '     : '';

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
