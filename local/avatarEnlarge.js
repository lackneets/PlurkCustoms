AvatarZoomPlugin = function(){}
AvatarZoomPlugin.prototype = Object.create(Plugin.prototype); 
AvatarZoomPlugin.prototype.parent = Plugin;

AvatarZoomPlugin.prototype.enlarge = function(){
	$(this).stop(true).animate({width: 100, height: 100, top:-40, left:-40}, 500);
	$(this).css({'z-index' : '99999', 'position': 'relative', '-webkit-box-shadow' : 'rgba(0, 0, 0, 0.796875) 0px 0px 10px 0px'});
}
AvatarZoomPlugin.prototype.start = function(){
	var self = this;
	$('.plurk[id^=p] .p_img img').livequery('mouseenter', function(){
		if(!self.enabled) return;
		if( (m = $(this).attr('src').match(/(\d+)-small(\d+)/)) ){
			$(this).on('load', self.enlarge);
			$(this).attr('src', ( 'http://avatars.plurk.com/'+ m[1] +'-big'+m[2]+'.jpg' ));
		}else{ 
			self.enlarge.call(this, this);
		}
	}).livequery('mouseleave', function(){
		if(!self.enabled) return;
		$(this).stop(true).animate({width: 20, height: 20, top:0, left:0}, 500, function(){ $(this).css({'-webkit-box-shadow' : 'none'}); });
	});
}
AvatarZoomPlugin.prototype.stop = function(){
}