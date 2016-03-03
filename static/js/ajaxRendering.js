$(document).ready(function(){
  $('.billbutton').click(function(){
  var first_name = $(this).attr('first-name');
  var last_name = $(this).attr('last-name');
   window.location.href = "/searchBills?first=" + first_name + "&last=" + last_name;
});
 
 $('.savebutton').click(function() {
  	var postData = {
		user_id: 1,
		leg: {
			first_name: $(this).attr('first-name'),
			last_name: $(this).attr('last-name'),
			twitter: $(this).attr('twitter'),
			party: $(this).attr('party')
		}
	}
	postString = JSON.stringify(postData);
	$.ajax({
	    url : "/saveLegislator",
	    type: "POST",
	    data : postString,//stringified object that is being sent
	    contentType: "application/json; charset=utf-8",
    	dataType: "json",
    	success: function() {
    		alert("success");
    	}
	});
  });

$('.billsavebutton').click(function() {
	var postData = {
		user_id: user_id,
		bill: {
			name: $(this).attr('name'),
			date: $(this).attr('date'),
			sponsor_first_name: $(this).attr('sponsor_first_name'),
			sponsor_last_name: $(this).attr('sponsor_last_name')
		}
	}
	postString = JSON.stringify(postData);
	$.ajax({
	    url : "/saveBill",
	    type: "POST",
	    data : postString,//stringified object that is being sent
	    contentType: "application/json; charset=utf-8",
    	dataType: "json",
    	success: function() {
    		alert("success");
    	}
	});
});

});




  