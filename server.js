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
// require('./routes/routes.js')(app, passport);//(app, passport); // load our routes and pass in our app and fully configured passport


app.get('/', function(req, res){
    if (req.session.username){
    res.render('index.ejs', {welcome: req.session.username});  
    }
    else {
    res.render('index.ejs');
    }
});

app.get('/login', function(req,res){
    res.render('login.ejs', {message: req.query.message});
});

app.post('/login', function(req, res){
    data = req.body;
    console.log(data);
    db.all("SELECT * FROM users WHERE username = ? AND password = ?",
        data.username, data.password, function(err, rows) {
            if (err) { throw err; }
            else {
                if(rows[0] === undefined) {
                    res.render('login.ejs', {message: 'That username-password combination does not exist in our database.'});
                }
                else{
                    console.log(data.username);
                    req.session.username = data.username;
                    req.session.user_id = rows[0].id;
                    res.redirect('/');
                }
            }
        });
});

app.get('/register', function(req,res){
    res.render('register.ejs', {message: req.query.message});
});

app.post('/register', function(req, res){ //if the users doesn't already exist in the database, this function saves the form data sent as a new user.
    data = req.body;
    if (data.password != data.confirm_password){
        res.render('register.ejs', {message: 'Your passwords didn\'t match; try again.'});
    }
    else {
    db.all("SELECT * FROM users WHERE username = ?",
        data.username, function(err, rows) {
            if (err) { throw err;}
            else {
                if(rows[0] === undefined) {
                    insertNewUser();
                }
                else {
                    res.render('register.ejs', {message: 'That username is already taken.'});
                }
            }
        });

    function insertNewUser() {
        db.run("INSERT INTO users (userName, password) VALUES (?,?)",
            data.username, data.password,
  
            function(err) {
                if (err) { throw err;}
                res.render('login.ejs', {message: 'Congratulations! You made an account. Log in to access features.'});
            }
        );
    }//incertNewUser
    }//else
});

app.get('/searchLegislator', function(req,res) {
    console.log("zip: "+req.query.zip);
    var zipcode = req.query.zip;//parseInt(req.params.zip);
    var legislators = [];
    var request = https.get("https://congress.api.sunlightfoundation.com/legislators/locate?apikey=0fadfc20cbb6484e8bf8295acce8c37d&zip="+req.query.zip, function(responce) {
        var body = '';
        responce.on('data', function(data) {
            body += data;
        });//data

        responce.on('end', function() {
            var legislators = [];
            var data = JSON.parse(body);
            for(var i = 0; i < data.count; i++) {
                senator = {
                    first_name: data.results[i].first_name,
                    last_name: data.results[i].last_name,
                    twitter: data.results[i].twitter_id,
                    party: data.results[i].party
                }
                legislators.push(senator);
            }
            if (req.session.username){
            res.render('legislators', {welcome: req.session.username, zipcode: zipcode, legislators: legislators});
            }
            else {
            res.render('legislators', {zipcode: zipcode, legislators: legislators});
        }
        });//end
    });
});


app.get('/searchBills', function(req,res) {
    var first_name = req.query.first;
    var last_name = req.query.last;
    var bills = [];
    var request = https.get("https://congress.api.sunlightfoundation.com/bills/search?apikey=0fadfc20cbb6484e8bf8295acce8c37d&sponsor.first_name="+req.query.first+"&sponsor.last_name="+req.query.last, function(responce) {
        var body = '';
        responce.on('data', function(data) {
            body += data;
        });//data

        responce.on('end', function() {
        var bills = [];
        var data = JSON.parse(body);
        for(var i = 0; i < data.results.length; i++) {
            bill = {
                shortname: data.results[i].short_title,
                name: data.results[i].official_title,
                date: data.results[i].last_version_on,
                sponsor_first_name: first_name,
                sponsor_last_name: last_name
            }
            bills.push(bill);
        }
        if (req.session.username){
            res.render('billResults', {welcome: req.session.username, first_name: first_name, last_name: last_name, bills: bills});
        }
        else {
            res.render('billResults', {first_name: first_name, last_name: last_name, bills: bills});
        }
        });
    });
});

app.post('/saveLegislator', function(req,res) {//use AJAX: send user_id and legislator information array
    if (!req.session.username){ //if you're not logged in, you can't save a legislator; make sure you register/login!
    res.send({redirect: '/login', message: 'You need login or register before you can save legislators.'});
    }
    else {
    data = req.body;
    db.all("SELECT * FROM legislators WHERE first_name = ? AND last_name = ?",
        data.leg.first_name, data.leg.last_name, function(err, rows) {
            if (err) { throw err;}
            else {
                if(rows[0] === undefined) {
                    insertNewLeg();//function
                }
                else {
                    currentLeg(rows[0].id);
                }

            }//else1
            res.write("saved");
            res.send();
        });//firstcheck

    function insertNewLeg() {
        db.run("INSERT INTO legislators (first_name, last_name, twitter, party) VALUES (?,?,?,?)",
            data.leg.first_name, data.leg.last_name, data.leg.twitter, data.leg.party,
  
            function(err) {
                if (err) { throw err;}
            }
        );

    
        db.all("SELECT * FROM legislators WHERE first_name = ? AND last_name = ?",
            data.leg.first_name, data.leg.last_name, 
            function(err, row) {
            
                if (err) { 
                    throw err;
                    console.log(err);
                }
                else {
                    var legId = row[0].id;
                    db.run("INSERT INTO user_leg (user_id, leg_id) VALUES (?,?)",
                    req.session.user_id, legId, function(err) {
                        if (err) { throw err;}
                    });
                }
        
        });
    }//incertNewLeg

    function currentLeg(legId) {
        db.all("SELECT * FROM user_leg WHERE user_id = ? AND leg_id = ?", req.session.user_id, legId,
            function(err, pairs) {
                if (err) { throw err;}
                else {
                    if(pairs[0] === undefined) {
                        db.run("INSERT INTO user_leg (user_id, leg_id) VALUES (?,?)",
                            req.session.user_id, legId, function(err) {
                            if (err) { throw err;}
                        });
                    }
                }
            });
        
    }
}
    
    

});

app.post('/saveBill', function(req,res) {//use AJAX
    if (!req.session.username){ //if you're not logged in, you can't save a legislator; make sure you register/login!
    res.send({redirect: '/login', message: 'You need login or register before you can save bills.'});
    }
    else {
    data = req.body;
    db.all("SELECT * FROM bills WHERE name = ?",data.bill.name, function(err, rows) {
        if (err) { throw err;}
        else {
            if(rows[0] === undefined) {
                insertNewBill();
            }
            else {
                currentBill(rows[0].id);
            }
        res.write("saved");
        res.send();
        }//else1
        
    });//firstcheck

    function insertNewBill() {
        db.run("INSERT INTO bills (name, date, sponsor_first_name, sponsor_last_name) VALUES (?,?,?,?)",
            data.bill.name, data.bill.date, data.bill.sponsor_first_name, data.bill.sponsor_last_name,
  
            function(err) {
                if (err) { throw err;}
            }

        );
        var billId;
        db.all("SELECT * FROM bills WHERE name = ?",data.bill.name, function(err, row) {
            if (err) { throw err;}
            else {
                var billId = row[0].id;
                db.run("INSERT INTO user_bill (user_id, bill_id) VALUES (?,?)",
                req.session.user_id, billId, function(err) {
                    if (err) { throw err;}
                });
            }
        
        });//add to user_bill
    }//insertNewBill

    function currentBill(billId) {

        db.all("SELECT * FROM user_bill WHERE user_id = ? AND bill_id = ?", req.session.user_id, billId,
            function(err, pairs) {
                if (err) { throw err;}
                else {
                    if(pairs[0] === undefined) {
                        db.run("INSERT INTO user_bill (user_id, bill_id) VALUES (?,?)",
                            req.session.user_id, billId, function(err) {
                            if (err) { throw err;}
                        });
                    }
                }
            });
    
    }//currentBill
    }
    
});

app.get('/viewSaved', function(req,res) {
    var user_id = req.session.user_id;
    var legIds = [];
    var billIds = [];
    db.all("SELECT * FROM user_leg WHERE user_id = ?", user_id, 
        function(err, rows) {
            if (err) { throw err;}
            else {
                for (i = 0; i < rows.length; i++) {
                    legIds.push(rows[i].leg_id);
                }
                selectLeg();
                
            }
        });
    function selectLeg() {
        legislators = [];
        for(i = 0; i < legIds.length; i++) {
            db.all("SELECT * FROM legislators WHERE id =?", legIds[i],
                function(err, rows2) {
                    if (err) { throw err;}
                    else {
                        legislators.push(rows2[0]);

                    }
            });
        }//for
        selectBillIds();
    }
    ////////////////////////////////////////
    function selectBillIds() {
        
        db.all("SELECT * FROM user_bill WHERE user_id = ?", user_id, 
        function(err, rows3) {
            if (err) { throw err;}
            else {
                for (i = 0; i < rows3.length; i++) {
                    billIds.push(rows3[i].bill_id);
                }
                selectBills();
                
            }
        });
    }
    function selectBills() {
        bills = [];
        if(billIds.length == 0) {
            renderPage();
        }
        
        for(i = 0; i < billIds.length; i++) {
            db.all("SELECT * FROM bills WHERE id = ?",billIds[i],
                function(err, rows4) {
                    if (err) { throw err;}
                    else {
                        bills.push(rows4[0]);
                        if(rows4[0].id == billIds[billIds.length-1]) {
                            renderPage();
                        }
                    }

            });
        }//for
        
    }//selectBills
    function renderPage() {
        console.log(legislators);
        console.log(bills);
        res.render("userPage", {welcome: req.session.username, legislators: legislators, bills: bills});
    }
});//newViewSaved

app.delete('/deleteLeg/:id', function(req,res) {
    ID = parseInt(req.params.id);
    userID = req.session.user_id;
    db.run("DELETE FROM user_leg WHERE leg_id = ? AND user_id = ?", ID, userID, function(err) {
        if (err) { throw err;}
        else { res.end(); }
    });
});

app.delete('/deleteBill/:id', function(req,res) {
    ID = parseInt(req.params.id);
    userID = req.session.user_id;
    db.run("DELETE FROM user_bill WHERE bill_id = ? AND user_id = ?", ID, userID, function(err) {
        if (err) { throw err;}
        else { res.end(); }
    });
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

// launch ======================================================================
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});