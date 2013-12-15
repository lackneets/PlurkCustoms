if(typeof timeTag == 'undefined') var timeTag = "";

if(typeof PlurkCustoms == 'undefined') PlurkCustoms = {};

PlurkCustoms.timeTravel = function(){
	
usingjQuery(function($){
	var now = new Date();

	if(timeTag == "" || !timeTag) timeTag= now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate()/*+" "+now.getHours()+":"+now.getMinutes()+":"+now.getSeconds(); */
	timeTag = prompt(__("回朔到 YYYY/M/D 之前"), timeTag);
	if(!timeTag) return;
	if(!timeTag.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/) && !timeTag.match(/^\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)){ alert("日期格式不正確"); return ;}
	
	var _date = timeTag.split(' ')[0];
	var _time = timeTag.split(' ')[1];
	var _year = _date.split('/')[0];
	
	
		$("#filter_tab a").removeClass('filter_selected').addClass('off_tab');
		$("#filter_tab a[rel=timeMachine]").text(_date).removeClass('off_tab').addClass('filter_selected bottom_line_bg');
	

	var _month= (_date.split('/')[1]) ? _date.split('/')[1] : now.getMonth()+1;
	var _day  = (_date.split('/')[2]) ? _date.split('/')[2] : now.getDate();
	timeTag = _year+"/"+_month+"/"+_day+" "+((_time) ? _time : "23:59:59");

	TimeLine.reset();
	TimeLine.offset = new Date(timeTag);
	TimeLine.showLoading();
	TimeLine.getPlurks();
	
	timeTag = _date;
	});
}