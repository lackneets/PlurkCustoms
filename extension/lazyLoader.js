function LazyLoader(container){

	var rows = [];
	var rowHeight = 50;
	var scrollMax = 0;	
	var self = this;

	this.start = function(){
		//console.log('LazyLoader.start');
		this.calculateRows();
		this.showImages(10);
	}
	this.scrollHandler = function(e){
		var scrollTop = $(e.target).scrollTop();
		var scrollBottom = scrollTop + $(e.target).height();
		var threshold = rowHeight*1;
		var key = Math.ceil((scrollBottom+threshold)/rowHeight);
		self.showImages(key);
    }

	this.calculateRows = function(){
		var t = new Date();
		//console.trace('calculateRows');
		var self = this;
    	this.rows = [];
		$(container).find('td').each(function(){
			if(this.clientWidth < 45) return;
			var offset = this.offsetTop;
			var key = Math.ceil(offset / rowHeight);
			self.rows[key] = self.rows[key] || [];
			self.rows[key].push(this);
		});
		//console.log('rows calculated in ' + (new Date() - t));
    }
    this.showImages = function(key){
		for(var i=0;i<=key;i++){
			if(this.rows[i] instanceof Array){
				$(this.rows[i])
					.find('img')
					.on('load', function(){ $(this).fadeIn('show'); })
					.attr('src', function(){ return $(this).attr('data-src')})
					.removeAttr('data-src');
				delete this.rows[i];
			}
		}	    	
    }

    $('.switchWindowMode').livequery('click', this.calculateRows);
	window.addEventListener("resize", this.calculateRows);
	$(container).get(0).addEventListener("scroll", this.scrollHandler, true);

    //this.start();
}	