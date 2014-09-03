var express = require('express');
var bcrypt  = require('bcrypt');
var router  = express.Router();

/* GET web pages. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Task B' });
});

router.get('/treemap', function(req, res) {
  res.render('treemap', { title: 'Budget-Vis Test' });
});

router.get('/budgetmap', function(req, res){
    res.render('index', {
        title: "Task B",
    });
});

router.get('/explore', function(req, res) {
    res.render('explore', {title: 'Task C'});
});

router.get('/empty', function(req, res) {
    res.render('empty', {title: 'Task A'});
});

router.post('/logout', function(req, res){
    req.session.useremail = null;
    res.json({code: 0, message: "Logout Success"});
});

router.post('/signin', function(req, res){
    var db = req.db;
    var email = req.body.email;
    var password = req.body.password;
    //if user found 
    db.collection('users').find({email: email}).toArray(function(err, items){
        if (err){
            return console.log('insert error', err);
        }

        if (items.length==0){
            res.json({ code: 1, message: "No Such Email Found!" });
        }
        var user = items[0]; // there must be one user matching the email
        bcrypt.compare(password, user.password, function(err, result) {
            if (result==true){
                //session start
                req.session.useremail = email;
                res.json({ code: 0, message: "Sign In Success!", user: user});
            }else{
                res.json({ code: 2, message: "Password is Not Correct!" });
            }
        });
    });
})

router.post('/register', function(req, res){
    var db = req.db;
    var email = req.body.email;
    var password = req.body.password;
    var nickname = req.body.nickname;

    //duplicate email check
    db.collection('users').find({email: email}).toArray(function(err, items){
        if (err){
            return console.log(new Date(), 'insert error', err);
        }
        if (items.length>0){
            res.json({ code: 1, message: "Email Already Exists!" });
        }
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
                var newUser = {email: email, password: hash, nickname:nickname};
                db.collection('users').insert(newUser, function(err, result) {
                    if (err) {
                        return console.log(new Date(), 'insert error', err);
                    }
                    if (result) {
                        res.json({ code: 0, message: 'Successfully Created!', user: result[0]});
                    }

                });
            });
        });
    });
});

/* RESTFUL DATA API : ISSUES */
router.route('/issues/:id')
    //get issue by budget name
    .get(function(req, res){
        console.log(new Date(), req.session.useremail);
        var db = req.db;
        var budget_id = req.toObjectID(req.params.id);

        db.collection('issues').find({budgets:budget_id}).toArray(function(err, items){
            items.sort(function(a, b){
                return b.budgets.length - a.budgets.length;
            });
            res.json(items);
        });
    })
    //update issue with new budgets linked to it
    .post(function(req, res){
        console.log(new Date(), req.session.useremail);
        var db = req.db;
        var issue_id = req.toObjectID(req.params.id);
        var budgets = [];
        for (var i in req.body.budgets){ // convert to objectID
            budgets.push(req.toObjectID(req.body.budgets[i]));
        }
        console.log(new Date(), 'update', budgets);

        //update issue
        
        db.collection('issues').update({_id: issue_id}, { '$set': { budgets: budgets} }, function(err, result){
            if (err) {
                return console.log(new Date(), 'insert error', err);
            }
            
            if (result) {
                res.json({ message: 'successfully updated!'});
            }            
        });
    })
    .delete(function(req, res){
        console.log(new Date(), req.session.useremail);
        var db = req.db;
        var issue_id = req.toObjectID(req.params.id);
        db.collection('issues').remove({_id: issue_id}, function(err, result){
            if (err) {
                return console.log(new Date(), 'insert error', err);
            }
            
            if (result) {
                res.json({ message: 'successfully updated!'});
            }            
        });
    });


router.route('/issues')
    //retrieve all the issues
    .get(function(req, res){
        if (req.session.useremail){
            console.log('treemap', new Date(), req.session.useremail, "lists all issues");
        }
        var db = req.db;
        db.collection('issues').find().toArray(function(err, items){
            items.sort(function(a, b){
                return b.budgets.length - a.budgets.length;
            });
            res.json(items);
        });
    })
    //create a new issue
    .post(function(req, res){
        if (req.session.useremail){
            console.log('treemap', new Date(), req.session.useremail, "created a new issue");
        }
        var db = req.db;
        var budgets = [], related = [], unrelated = [];
        if (req.body.budgets){ 
            for (var i in req.body.budgets){ // convert to objectID
                budgets.push(req.toObjectID(req.body.budgets[i]));
                console.log(budgets);
            }
        }
        if (req.body.related) {
            for (var i in req.body.related) {
                budgets.push(req.toObjectID(req.body.related[i]));
            }
        }
        if (req.body.unrelated) {
            for (var i in req.body.unrelated) {
                budgets.push(req.toObjectID(req.body.unrelated[i]));
            }
        }
        console.log(budgets);
        var new_issue = {
            name: req.body.name,
            year: req.body.year,
            budgets: budgets,
            related: related,
            unrelated: unrelated
        };
        db.collection('issues').insert(new_issue, function(err, result) {
            if (err) {
                return console.log(new Date(), 'insert error', err);
            }
            
            if (result) {
                res.json({ message: 'successfully created!', result: result});
            }

        });
    });


/* RESTFUL DATA API : BUDGETS */

//update budget with new issues added
router.post('/budgets/:id',function(req, res){
    if (req.session.useremail){
        console.log('treemap', new Date(), req.session.useremail, "created a new issue");
    }
    var db = req.db;
    var budget_id = req.toObjectID(req.params.id);    
    var issues = [];
    for (var i in req.body.issues){ // convert to objectID
        issues.push(req.toObjectID(req.body.issues[i]));
    }
    //update budget
    //console.log(issues);
    db.collection('budgets').update({_id: budget_id}, { '$set': { issues: issues} }, function(err, result){
        if (err) {
            return console.log(new Date(), 'insert error', err);
        }
        //console.log(result);
        if (result) {
            res.json({ message: 'successfully updated!'});
        }      
    });
});
router.get('/budgets', function(req, res){
    if (req.session.useremail){
        console.log('treemap', new Date(), req.session.useremail, "created a new issue");
    }
    var db = req.db;
    var date = new Date();
    var currYear = date.getFullYear();
    var prevYear = currYear-1;
    currYear = currYear.toString();
    prevYear = prevYear.toString();
    db.collection('budgets').find({ year: { '$in': [ prevYear, currYear ] } }).toArray(function(err, items){
        console.log(new Date(), items.length + ' budget records returned');
        
        var seoulBudget = {
            name: "seoul-budget-"+currYear,
            size: 0,           
            issue_size: 0,
            serv_size: 0,
            children: []
        };

        //aggregate by category_three 
        var cat3 = {};
        var tempMap = {};
        var svmap = {};
        for (var i in items){ 
            var budget = items[i];
            if (budget.budget_assigned==0) continue; // do not consider budget==0

            // category 3
            var node = cat3[budget.year + budget.category_three]
            if (node==null){
                node = cat3[budget.year + budget.category_three] = {
                    category1: budget.category_one,
                    category2: budget.category_two,
                    name: budget.category_three,
                    year: budget.year,
                    size: 0,
                    issue_size: 0,
                    serv_size: 0
                };
            }
            node.size       += budget.budget_assigned;
            node.issue_size += budget.issues!=null? budget.issues.length : 0;
            node.serv_size  += 1;


            // resolve duplicate service names
            if (tempMap[budget.year + budget.service]==null){//duplicate found
                tempMap[budget.year + budget.service] = [];               
            }
            tempMap[budget.year + budget.service].push(budget);
        }
        for (var i in tempMap){
            if (tempMap[i].length>1){
                for (var j in tempMap[i]){
                    var budget = tempMap[i][j];
                    budget.service += ("("+budget.department + "," + budget.team+")-"+j);
                }
            }
        }
        for (var i in items){ 
            // service map by year (used later)
            svmap[budget.year + budget.service] = budget;
        }
        /* SKIP CATEGORY TWO
        // aggregate by category two
        var cat2 = {};
        for (var name in cat3){
            var cat3node = cat3[name];

            //category 2
            var node = cat2[cat3node.year + cat3node.category2];
            if (node==null){
                node = cat2[cat3node.year + cat3node.category2] = {
                    category1: cat3node.category1,
                    name: cat3node.category2,
                    year: cat3node.year,
                    size: 0,
                    children: []
                }
            }
            node.size += cat3node.size;
            node.children.push(cat3node);
        }
        */
        //aggregate by category one
        var cat1 = {};
        for (var name in cat3){
            var cat3node = cat3[name];

            //category 1
            var node = cat1[cat3node.year + cat3node.category1];
            if (node==null){
                node = cat1[cat3node.year + cat3node.category1] = {
                    name: cat3node.category1,
                    year: cat3node.year,
                    size: 0,
                    issue_size: 0,
                    serv_size: 0,
                    children: []
                }
            }
            node.size       += cat3node.size;
            node.issue_size += cat3node.issue_size;
            node.serv_size  += cat3node.serv_size;;
            node.children.push(cat3node);            
        }
        //aggregate all
        var lastYearTotal = 0;
        for (var name in cat1){
            var cat1node = cat1[name];
            if (cat1node.year != currYear)  {
                lastYearTotal +=cat1node.size;
                continue; 
            }
            seoulBudget.size        += cat1node.size
            seoulBudget.issue_size  += cat1node.issue_size;
            seoulBudget.serv_size   += cat1node.serv_size;;
            seoulBudget.children.push(cat1node);
        }
      
        //calculate budget-change ratios 
        for (var key in cat1){
            var node = cat1[key];
            if (node.year!=currYear) continue;
            var prevNode = cat1[prevYear+node.name];
            node.rate = (prevNode==null || prevNode.size==0)? 0.0 : (node.size - prevNode.size)/prevNode.size;
        }
        /* SKIP CATEGORY TWO
        for (var key in cat2){
            var node = cat2[key];
            if (node.year!=currYear) continue;
            var prevNode = cat2[prevYear+node.name];
            node.rate = (prevNode==null || prevNode.size==0)? 0.0 : (node.size - prevNode.size)/prevNode.size;
        }
        */
        for (var key in cat3){
            var node = cat3[key];
            if (node.year!=currYear) continue;
            var prevNode = cat3[prevYear+node.name];
            node.rate = (prevNode==null || prevNode.size==0)? 0.0 : (node.size - prevNode.size)/prevNode.size;
        }
        seoulBudget.rate = lastYearTotal==null? 0.0 : (seoulBudget.size-lastYearTotal)/lastYearTotal;

        // collect services by category 3
        var services = {};
        for (var i in items){ 
            var budget = items[i];
            if (budget.budget_assigned==0) continue; // do not consider budget==0
            if (budget.year!=currYear) continue;

            var prevBudget = svmap[prevYear + budget.service];

            if (services[budget.category_three]==null){
                services[budget.category_three] = [];
            }
            budget.rate = (prevBudget==null || prevBudget.budget_assigned==0)? 0.0 : (budget.budget_assigned - prevBudget.budget_assigned)/prevBudget.budget_assigned;
            budget.issues = budget.issues? budget.issues : [];
            services[budget.category_three].push(budget);
        }
        //sorting
        for (var name in services){
            services[name].sort(function(a, b){
                return b.budget_assigned - a.budget_assigned;
            });
        }
        //console.log(services)
        res.json({budget: seoulBudget, services: services});
        
    })
});

/*
 * Explorer task functions
 * VERSION 14-08-26: Pure random
 * VERSION 14-08-28: Pure random + remove service=='기본경비'
 * VERSION 14-09-02: Remove budget==0
 */

router.pass = function(req, res, hint) {
    var db = req.expl;
    var date = new Date();
    var currYear = date.getFullYear().toString();

    if (hint) {
        db.collection('budgets').findOne({year: currYear, _id: req.toObjectID(hint)}, function(err, item) {
            var new_candidate = {
                '_id': item._id,
                'one': item.category_one,
                'three': item.category_three,
                'service': item.service,
                'department': item.department,
                'team': item.team,
                'budget': item.budget_assigned
            }
            res.json(new_candidate);
        });
    } else {
        db.collection('budgets').find({year: currYear}).toArray(function(err, items) {
            var rand_idx;
            do {
                rand_idx = Math.floor(Math.random() * items.length);
            } while (items[rand_idx].service.indexOf('기본경비') == 0
                || items[rand_idx].budget_assigned == 0);
            var item = items[rand_idx];
            var new_candidate = {
                '_id': item._id,
                'one': item.category_one,
                'three': item.category_three,
                'service': item.service,
                'department': item.department,
                'team': item.team,
                'budget': item.budget_assigned
            }
            res.json(new_candidate);
        });
    }
};

router.route('/explore/issues')
    .get(function(req, res) {
        var db = req.expl;
        db.collection('issues').find().toArray(function(err, items) {
            items.sort(function(a, b) {
                return b.related.length - a.related.length;
            });
            if (req.session.useremail) {
                console.log('explore', new Date(), req.session.useremail, "listed all issues");
            }
            res.json(items);
        });
    })
// Sum of ObjectId(issue_id).related
    .post(function(req, res) {
        var db = req.expl;
        var issue_id = req.toObjectID(req.body.issue);
        var budget_list = [];
        var sum = 0;

        db.collection('issues').findOne({_id: issue_id}, function(err, item) {
            res.json({'related_val': item.related_val});
        });
    });

router.route('/explore/pass')
    .get(function(req, res) {
        if (req.session.useremail) {
            console.log('explore', new Date(), req.session.useremail, "moved on to next service");
        }
        router.pass(req, res);
    })
    .post(function(req, res) {
        if (req.session.useremail) {
            console.log('explore', new Date(), req.session.useremail, "used a hint");
        }
        router.pass(req, res, req.body.hint);
    });


router.post('/explore/related', function(req, res) {
    var db = req.expl;
    var issue_id = req.body.issue;
    var budget_id = req.body.service;

    db.collection('issues').update({_id: req.toObjectID(issue_id)}, 
        {'$push': {related: req.toObjectID(budget_id)}}, function(err, result) {
        if (err) throw err;
        if (req.session.useremail) {
            console.log('explore', new Date(), req.session.useremail, "reported a related service", budget_id);
        }
    });
    db.collection('budgets').findOne({_id: req.toObjectID(budget_id)},
        function(err, item) {
            if (err) throw err;
            db.collection('issues').update({_id: req.toObjectID(issue_id)},
                {'$push': {related_val: item.budget_assigned}}, function(err, result) {
                    if(err) throw err;
            });
    });
    router.pass(req, res);
});


router.post('/explore/unrelated', function(req, res) {
    var db = req.expl;
    var issue_id = req.toObjectID(req.body.issue);
    var budget_id = req.toObjectID(req.body.service);

    db.collection('issues').update({_id: issue_id}, 
        {'$push': {unrelated: budget_id}}, function(err, result) {
        if (err) throw err;
        if (req.session.useremail) {
            console.log('explore', new Date(), req.session.useremail, "reported an unrelated service", budget_id);
        }
        router.pass(req, res);
    });
});
/*
 * End of explorer task functions.
 */

module.exports = router;
