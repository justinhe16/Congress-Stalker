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
    res.render('index.ejs');
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

            res.render('legislators', {zipcode: zipcode, legislators: legislators});
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
            res.render('billResults', {first_name: first_name, last_name: last_name, bills: bills});
        });
    });
});

app.post('/saveLegislator', function(req,res) {//use AJAX: send user_id and legislator information array
    data = req.body;
    db.all("SELECT * FROM legislators WHERE first_name = ? AND last_name = ?",
        data.leg.first_name, data.leg.last_name, function(err, rows) {
            if (err) { throw err;}
            else {
                if(rows === undefined) {
                    insertNewLeg();//function
                }
                else {
                    currentLeg(rows[0].id)
                }

            }//else1
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
                    data.user_id, legId, function(err) {
                        if (err) { throw err;}
                    });
                }
        
        });
    
    }//incertNewLeg

    function currentLeg(legId) {
        db.run("INSERT INTO user_leg (user_id, leg_id) VALUES (?,?)",
            data.user_id, legId, function(err) {
                if (err) { throw err;}
        });
    }
    
    res.write("saved");

});

app.post('/saveBill', function(req,res) {//use AJAX
    data = req.body;
    db.all("SELECT id FROM bills WHERE name = ?",data.bill.name, function(err, rows) {
        if (err) { throw err;}
        else {
            if(rows === undefined) {
                insertNewBill();
            }
            else {
                currentBill(rows[0]);
            }
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
        db.all("SELECT id FROM bills WHERE name = ?",data.bill.name, function(err, row) {
            if (err) { throw err;}
            else {
                var billId = row[0].id;
                db.run("INSERT INTO user_bill (user_id, bill_id) VALUES (?,?)",
                data.user_id, billId, function(err) {
                    if (err) { throw err;}
                });
            }
        
        });//add to user_bill
    }//insertNewBill

    function currentBill(billId) {
        db.run("INSERT INTO user_bill (user_id, bill_id) VALUES (?,?)",
            data.user_id, billId, function(err) {
                if (err) { throw err;}
        });
    }//currentBill
    
    res.write("saved");
});

app.get('/viewSaved/:id', function(req,res) {
    var user_id = parseInt(req.params.id);
    var legIds = [];
    db.run("SELECT leg_id FROM user_leg WHERE user_id = "+user_id, 
        function(err, rows) {
            if (err) { throw err;}
            else {
                for (i = 0; i < rows.length; i++) {
                    legIds.push(rows[i].leg_id);
                }
            }
        });
    legislators = [];
    for(i = 0; i < legIds.length; i++) {
        db.run("SELECT * FROM legislators WHERE id ="+legIds[i],
            function(err, rows) {
                if (err) { throw err;}
                else {
                    legislators.push(rows[0]);
                }
            });
    }//for
    ////////////////////////////////////////
    var billIds = [];
    db.run("SELECT bill_id FROM user_bill WHERE user_id = "+user_id, 
        function(err, rows) {
            if (err) { throw err;}
            else {
                for (i = 0; i < rows.length; i++) {
                    billIds.push(rows[i].leg_id);
                }
            }
        });
    bills = [];
    for(i = 0; i < billIds.length; i++) {
        db.run("SELECT * FROM bills WHERE id ="+billIds[i],
            function(err, rows) {
                if (err) { throw err;}
                else {
                    bills.push(rows[0]);
                }
            });
    }//for
    res.render("userPage", {legislators: legislators, bills: bills});
});

app.delete('/deleteLeg/:id', function(req,res) {
    ID = parseInt(req.params.id);
    db.run("DELETE FROM user_leg WHERE leg_id = ?", ID, function(err) {
        if (err) { throw err;}
    });
})

app.delete('deleteBill/:id', function(req,res) {
    ID = parseInt(req.params.id);
    db.run("DELETE FROM user_bill WHERE bill_id = ?", ID, function(err) {
        if (err) { throw err;}
    });
});

// launch ======================================================================
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});