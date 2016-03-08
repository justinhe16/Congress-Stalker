$(document).ready(function(){
  $('.billbutton').click(function(){
  var first_name = $(this).attr('first-name');
  var last_name = $(this).attr('last-name');
   window.location.href = "/searchBills?first=" + first_name + "&last=" + last_name;
});
 
 $('.savebutton').click(function() { //saves a legislator 
  	var postData = {
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
    	success: function(data) {
        if(typeof data.redirect == 'string'){
          window.location = data.redirect + "?message=" + data.message;
        }
    	}
	}).done(function() {
	});
  });

  $('.deletebutton').click(function() { //deletes a legislator
  $.ajax({
      url : "/deleteLeg/" + $(this).attr('id'),
      type: "DELETE",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
      }
  }).done(function() {
  });
  window.location.reload();
  });

$('.billsavebutton').click(function() {
	var name;
	if(!$(this).attr('shortname')) {
		name = $(this).attr('name');
	}
	else {
		name = $(this).attr('shortname');
	}
  console.log(name);
	var postData = {
		bill: {
			name: name,
			date: $(this).attr('date'),
			sponsor_first_name: $(this).attr('sponsor-first-name'),
			sponsor_last_name: $(this).attr('sponsor-last-name')
		}
	}
	postString = JSON.stringify(postData);
	$.ajax({
	    url : "/saveBill",
	    type: "POST",
	    data : postString,//stringified object that is being sent
	    contentType: "application/json; charset=utf-8",
    	dataType: "json",
    	success: function(data) {
    		if(typeof data.redirect == 'string'){
          window.location = data.redirect + "?message=" + data.message;
        }
    	}
	}).done(function() {
	});
});

  $('.billdeletebutton').click(function() { //deletes a bill
  $.ajax({
      url : "/deleteBill/" + $(this).attr('id'),
      type: "DELETE",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function(data) {
      }
  }).done(function() {
  });
  window.location.reload();
  });


});




  