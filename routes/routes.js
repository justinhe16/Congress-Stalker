module.exports = function(app, passport) {

app.get('/', function(req, res){
  res.render('index.ejs');
});

}

// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
 res.redirect('/unauthorized');

}

function isVerified(req, res, next) {

    //if user is verified, carry on
    if (req.user.local.verified == 'true'){
        return next();
    }

    //if they aren't, redirect them to the home page
    res.redirect('/unauthorized');
}
