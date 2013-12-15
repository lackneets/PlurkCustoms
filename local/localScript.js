function markMuted(ids){
	if(typeof ids == 'array' || typeof ids == 'object'){
		for(var i in ids) markMuted(ids[i]);
		return;
	}
	var id = ids;
	console.log("Mute " + id);
	//if(typeof $plurks['p' + id] != 'undefined') delete $plurks['p' + id];	
	if(typeof $plurks['p' + id] != 'undefined'){
		var p = $plurks['p' + id];
		p.obj.is_unread = 2;
		p.block.is_rendered = false;
		for(i in p) if(p[i] instanceof HTMLDivElement){  console.log('delete', p[i]); delete p[i]; }
	}
	//if(typeof id == 'string' || typeof id == 'number') for(var i in $plurks) if($plurks[i].obj.plurk_id == id) ($plurks[i].obj.is_unread = 2);
}