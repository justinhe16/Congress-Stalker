//DEPENDENCIES 
var https = require('https');
var express  = require('express');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var methodOverride = require('method-override');
var session      = require('express-session');
var app      = express();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('congress_stalker.db');
db.run("PRAGMA foreign_keys = ON;");
//HEADERS

// configuration ===============================================================
// require('./config/passport')(passport); // pass passport for configuration

app.use(express.static("static")); // sets standard files things. i.e /public/imgs will be /imgs
app.use('/bower_components', express.static("bower_components")); // sets standard files things. i.e /public/imgs will be /imgs

    app.use(morgan('dev')); // log every request to the console
    app.use(cookieParser()); // read cookies (needed for auth)
    app.use(bodyParser.json()); // get information from html forms
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
    app.use(methodOverride());

    app.set('view engine', 'ejs'); // set up ejs for templating

    // required for passport
    app.use(session({ secret: 'w0qkASIDJ9aoskdsad020' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages storedn session

// routes ======================================================================
require('./routes/routes.js')(app, passport);//(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});