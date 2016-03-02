$(document).ready(function(){
  $('a').click(function(){
  var first_name = $(this).attr('first-name');
  var last_name = $(this).attr('last-name');
   window.location.href = "/searchBills?first=" + first_name + "&last=" + last_name;
});
});