module.exports = function(app, passport) {


app.get('/', function(req, res){
    res.render('index.ejs');
});

app.get('/searchLegislator', function(req,res) {
    console.log("zip: "+req.body.zip);
    var zipcode = req.body.zip;//parseInt(req.params.zip);
    var legislators = [];
    var request = https.get("https://congress.api.sunlightfoundation.com/legislators/locate?apikey=0fadfc20cbb6484e8bf8295acce8c37d&zip="+req.body.zip, function(responce) {
        var body = '';

        responce.on('data', function(data) {
            body += data;
            console.log("body: "+body);
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



app.get('/searchBills/:first/:last', function(req,res) {
    var first_name = req.params.first;
    var last_name = req.params.last;
    var bills = [];
    var request = https.get("https://congress.api.sunlightfoundation.com/bills/search?apikey=0fadfc20cbb6484e8bf8295acce8c37d&sponsor.first_name="+first_name+"&sponsor.last_name="+last_name, function(responce) {
        for(var i = 0; i < responce.count; i++) {
            bill = {
                name: responce.results[i].official_title,
                date: responce.results[i].last_version_on,
                sponsor_first_name: first_name,
                sponsor_last_name: last_name
            }
            bills.push(bill);
        }
        responce.on('end', function() {
            res.render('billResults', {first_name: first_name, last_name: last_name, bills: bills});
        });
    });

});

app.post('/saveLegislator', function(req,res) {//use AJAX: send user_id and legislator information array
    data = req.body
    db.run("INSERT INTO legislators (first_name, last_name, twitter, party) VALUES (?,?,?,?)",
        data.leg.first_name, data.leg.last_name, data.leg.twitter, data.leg.party,
  
        function(err) {
            if (err) { throw err;}
        }
    );
    var legId;
    db.run("SELECT id from legislators WHERE first_name = "+data.leg.first_name+"AND last_name = "+data.leg.last_name, function(err, rows) {
        if (err) { throw err;}
        else {
            legId = rows[0].id;
        }
        
    })
    db.run("INSERT INTO user_leg (user_id, leg_id) VALUES (?,?)",
        data.user_id, legId, function(err) {
            if (err) { throw err;}
        }
    )
    res.write("saved");

});

app.post('/saveBill', function(req,res) {//use AJAX
    data = req.body;
    db.run("INSERT INTO bills (name, date, sponsor_first_name, sponsor_last_name) VALUES (?,?,?,?)",
        data.bill.name, data.bill.date, data.bill.sponsor_first_name, data.bill.sponsor_last_name,
  
        function(err) {
            if (err) { throw err;}
        }

    );
    var billId;
    db.run("SELECT id from bills WHERE name = "+data.bill.name, function(err, rows) {
        if (err) { throw err;}
        else {
            billId = rows[0].id;
        }
        
    })
    db.run("INSERT INTO user_bill (user_id, bill_id) VALUES (?,?)",
        data.user_id, billId, function(err) {
            if (err) { throw err;}
        }
    )
    //add to user_bill
    res.write("saved");
});

app.get('/viewSaved/:id', function(req,res) {
    var user_id = parseInt(req.params.id);
    var legIds = [];
    db.run("SELECT leg_id from user_leg WHERE user_id = "+user_id, 
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
        db.run("SELECT * from legislators WHERE id ="+legIds[i],
            function(err, rows) {
                if (err) { throw err;}
                else {
                    legislators.push(rows[0]);
                }
            });
    }//for
    ////////////////////////////////////////
    var billIds = [];
    db.run("SELECT bill_id from user_bill WHERE user_id = "+user_id, 
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
        db.run("SELECT * from bills WHERE id ="+billIds[i],
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
