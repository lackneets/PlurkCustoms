
	function trace(info){
		chrome.tabs.getSelected(null, function(tab) {
			alert(info);
			console.log('Trace: ', info);
		});
	}


	chrome.extension.onRequest.addListener( 
		function(request, sender, sendResponse) { 
			console.log('request', request);
			if(request.saveEmotions){
				var type = request.type ? request.type : 'merge';
			//	console.log("saveEmotions:" + type);
				saveEmotions(request.emotions, type , function(emotions){
					sendResponse(emotions);
				});
			}

			if(request.replaceEmotions){
			//	console.log("replaceEmotions");
				saveEmotions(request.emotions, "replace" , function(emotions){
					sendResponse(emotions);
				});
				
			}
			
			if(request.saveEmotion){
			//	console.log("save single emotion");
				saveEmotion(request.url, request.keyword, function(emotions){
					console.log("emotion stored");
					sendResponse(emotions);
				});
				
			}
			if(request.deleteEmotion){
			//	console.log("delete single emotion");
				deleteEmotion(request.keyword, function(emotions){
					console.log("emotion deleted");
					sendResponse(emotions);
				});
				
			}
			if(request.loadEmotions){
				
				loadEmotions(function(emotions){
					console.log('sendResponse(emotions)', emotions);
					sendResponse(emotions);
				});
			}
			
			/*if(request.isAlive){
				console.log('request.isAlive', request);
				loadEmotions(function(stored_emotions){
					for(var s in stored_emotions){  
						if(request.keyword == stored_emotions[s].keyword && stored_emotions[s].alive == true){
							console.log('sendResponse', true);
							sendResponse(true);
							return ;
						}
					 }
					 console.log('sendResponse', false);
					 sendResponse(false);
					 return ;
				});
			}*/

	});
	
	function saveEmotion(url, keyword, callback){
		loadEmotions(function(emotions){
			var hash_id = url.match(/plurk\.com\/([0-9a-zA-Z]+)/)[1];
			emotion = {keyword: keyword, url: url, hash_id: hash_id};
			emotions.push(emotion);
			saveEmotions(emotions, "merge", callback);
		});
	}
	
	function deleteEmotion(keyword, callback){
		loadEmotions(function(emotions){
			var newEmotions = [];
			for(var e in emotions){
				if(emotions[e].keyword != keyword) newEmotions.push(emotions[e]);
			}
			saveEmotions(newEmotions, "replace", callback);
		});
	}
	
	function urlDecode(str){
	    str=str.replace(new RegExp('\\+','g'),' ');
	    return unescape(str);
	}
	function urlEncode(str){
	    str=escape(str);
	    str=str.replace(new RegExp('\\+','g'),'%2B');
	    return str.replace(new RegExp('%20','g'),'+');
	}
	
	
	
	chrome.tabs.onRemoved.addListener(function(windowId) {
		bufferedEmotions = null;
	});
	
	
	function fixEmotionsStructure(emotions){
		var cleanEmoticons = new Array();
		var hashes = new Array();

		if(!emotions.length) return new Array();
		if(! typeof emotions.push == 'function') return new Array();
		for(i=0; i<emotions.length; i++){
			if(!emotions[i] || !emotions[i].keyword || !emotions[i].url) console.log('an unexpected item found', emotions[i] , ' in emotions['+i+']');
			if(typeof emotions[i].keyword != 'string' ) emotions.splice(i, 1) & i--;
			else if(typeof emotions[i].url != 'string' ) emotions.splice(i, 1) & i--;
		}
		//殺掉雙胞胎表情
		for(i=0; i<emotions.length; i++){ 
			if(hashes.indexOf(emotions[i].hash_id) == -1) cleanEmoticons.push(emotions[i]);
			//console.log('殺掉雙胞胎表情', emotions[i], hashes.indexOf(emotions[i].hash_id));
			hashes.push(emotions[i].hash_id)
		}
		return cleanEmoticons;
	}
	
	var bufferedEmotions;
	
	function loadEmotions(callback){
		
		console.log('loadEmotions');
		
		var emotions;
		
		if(bufferedEmotions){
			console.log('bookmark loaded from buffer', bufferedEmotions, bufferedEmotions.length);
			callback(arrayClone(bufferedEmotions));
			return;
		}
		
		if (typeof(localStorage) == "undefined" ) {
			trace("Your browser does not support HTML5 localStorage. Try upgrading.");
		} else {
			try {
				emotions = localStorage.getItem("plurkCustoms_emotions");
				try{
					emotions = JSON.parse(emotions);
					bufferedEmotions = arrayClone(fixEmotionsStructure(emotions));
					if(typeof emotions[0].url != 'undefined') return callback(arrayClone(bufferedEmotions));					
				}catch(e) {
					emotions = [];
					bufferedEmotions = [];
					return callback(bufferedEmotions);
				}
				
			} catch (e) {
				trace("cannot load emotions from localstorage");
			}
		}

	} // end loadEmotions
	
	function arrayClone(arr){
		if(typeof arr == 'object') return arr.slice(0);
		else return arr;
	}
	
	function saveEmotions(emotions, type, callback){
		var plurkCustoms;
		
		loadEmotions( function(bookmark){

			try{
				
				stored_emotions = {};
				original_emotions = {};
				
				if(bookmark){
					original_emotions = arrayClone(bookmark);
					stored_emotions = arrayClone(bookmark);
				}
				
			
				function resolveConflict(keyword, emotions){	// name => name_1
					var maxId = 0;
					if(keyword.match(/(.+)_(\d+)$/)) keyword = keyword.match(/(.+)_(\d+)$/)[1];
					for(var e in emotions){
						if(emotions[e].keyword.indexOf(keyword) == 0){
							id = emotions[e].keyword.replace(keyword, '').match(/_(\d+)$/);
							if(id && id[1] > maxId){
								maxId = parseInt(id[1]);
							}
						}
					}
					console.log("conflict keyword resolved as " + keyword + "_" + (maxId + 1));
					return keyword + "_" + (maxId + 1);
				}
				
				
				if(type == "merge" || type == "onlineMerge"){
				
					//merge	
					//if(type == "onlineMerge") for(var s in stored_emotions){  stored_emotions[s].alive = false;  }

					for(var e in emotions){
						var exist = false;
											
						for(var s in stored_emotions){ 

							//相同名稱衝突
							if(emotions[e].keyword == stored_emotions[s].keyword){ //conflict
								exist = true; 
								console.log('remove conflict: ', emotions[e].keyword, emotions[e].hash_id, stored_emotions[s].keyword, stored_emotions[s].hash_id);
								if(emotions[e].hash_id == stored_emotions[s].hash_id){	// 完全符合
									stored_emotions[s] = emotions[e];
									//if(type == "onlineMerge") stored_emotions[s].alive = true; // 標記為在線上	
									//else stored_emotions[s].alive = (typeof emotions[e].alive == 'undefined') ? stored_emotions[s].alive : emotions[e].alive;
								}else{	// 撞名的不同圖片
									emotions[e].keyword = resolveConflict(emotions[e].keyword, stored_emotions);
									//emotions[e].alive = false; 
									stored_emotions.push(emotions[e]);
									
								}
								break;
							} 
							
							//不撞名的相同圖片
							if(emotions[e].hash_id == stored_emotions[s].hash_id){ 
								console.log('find exist from online', emotions[e].hash_id, emotions[e].keyword, stored_emotions[s].keyword);
								// do not merge
								//stored_emotions[s].alive = false;
								exist = true;
								break; 
							}
							
						}
						if(exist) continue;
						
						
						// new added
						console.log('new emotion merged:' + emotions[e].keyword );
						/*if(type == "onlineMerge") emotions[e].alive = true; 
						else emotions[e].alive = false; */
						stored_emotions.push(emotions[e]);
					}
				}else{ // type == replace
					console.log('stored_emotions = emotions', type);
					stored_emotions = emotions;
				}
				function trim(str){ return str.replace(/^\s*/ig, '').replace(/\s*$/ig, '').replace(/[\n\r]*$/ig, '').replace(/^[\n\r]*$/ig, '');}
				
				//update
				
				//resolveConflict
				for(var s1 = 0 ; s1 < stored_emotions.length; s1++){
					for(var s2 = 0 ; s2 < stored_emotions.length; s2++){
					
						if(s2 <= s1) continue;
						
						//相同圖片
						if(stored_emotions[s1].url == stored_emotions[s2].url){
							stored_emotions.splice(s2, 1); 
							console.log('resolveConflict: ', stored_emotions[s1].keyword, stored_emotions[s1].hash_id, stored_emotions[s2].keyword, stored_emotions[s2].hash_id);
							s1--; break;
						}
						//相同名稱
						if(stored_emotions[s1].keyword == stored_emotions[s2].keyword){ 
							stored_emotions[s1].keyword = resolveConflict(stored_emotions[s1].keyword, stored_emotions);
							//stored_emotions[s1].alive = false;
							console.log('resolveConflict: ', stored_emotions[s1].keyword, stored_emotions[s1].hash_id, stored_emotions[s2].keyword, stored_emotions[s2].hash_id);
							continue;
						}
					} 
				} 

				console.log(stored_emotions.length, stored_emotions)
				
				//SORT
				stored_emotions.sort(function(a, b){
					return (a.keyword > b.keyword) ? 1 : -1;
				});
				
	
				//Save to localstorage
				if (typeof(localStorage) == "undefined" ) {
					trace("Your browser does not support HTML5 localStorage. Try upgrading.");
				} else {
					try {
						localStorage.setItem("plurkCustoms_emotions", JSON.stringify(stored_emotions)); //saves to the database, “key”, “value”
						console.log('stored to localsotrage');
					} catch (e) {
						if (e == QUOTA_EXCEEDED_ERR) {
							trace("Quota exceeded!"); // data wasn’t successfully saved due to quota exceed so throw an error
						}else{
							trace("無法儲存表情至 local storage")
						}
					}
				}
				bufferedEmotions = arrayClone(fixEmotionsStructure(stored_emotions));
				
				
				// end backup
				
				callback(arrayClone(stored_emotions));
				
			}catch(e){
				trace(e);
			}
				
		});	//End loadEmotions()
		
	}	//End saveEmotions
