var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/budget-vis', function(req, res) {
  res.render('budget-vis', { title: 'Budget-Vis Test' });
});

router.get('/treemap', function(req, res) {
  res.render('treemap', { title: 'Budget-Vis Test' });
});

router.get('/issue/:id', function(req, res){
    var db = req.db;
    if (req.params.id === 'list') {
        db.collection("issue").find().toArray(function(err, items) {
            var result = [];
            for (var i in items) {
                var budget_ids = items[i]._budget_id || null;
                result.push({
                    _id: items[i]._id,
                    name: items[i].name,
                    _budget_ids: budget_ids
                });
            }
            res.json(result.sort());
        });
    } else {
        db.collection("issue").find({
            _budget_id: {$in: [req.toObjectID(req.params.id)]}
        }).toArray(function(err, items){
            var result = [];
            for (i in items) {
                var budget_ids = items[i]._budget_id || null;
                result.push({
                    _id: items[i]._id,
                    name: items[i].name,
                    _budget_ids: budget_ids
                });
            }
            res.json(result);
        });
    }
});

router.get('/budget/kvpairs', function(req, res) {
    var db = req.db;
    
    db.collection("seoul_budget").find().toArray(function(err, items) {
        var result = {};
        for (var i in items) {
            result[items[i]._id] = items[i].name;
        }
        console.log(result);
        res.json(result);
    });
});


router.get('/budget/data', function(req, res){
    var db = req.db;
    var date = new Date();
    var currYear = date.getFullYear();
    var prevYear = currYear-1;
    currYear = currYear.toString();
    prevYear = prevYear.toString();
    db.collection('budgetspider').find({ year: { $in: [ prevYear, currYear ] } }).toArray(function(err, items){
        console.log(items.length + ' budget records returned');
        
        var seoulBudget = {
            name: "seoul-budget-"+currYear,
            size: 0,
            children: []
        };
        //

        //aggregate by category_three 
        var cat3 = {};
        var svmap = {};
        for (var i in items){ 
            var budget = items[i];

            // category 3
            var node = cat3[budget.year + budget.category_three]
            if (node==null){
                node = cat3[budget.year + budget.category_three] = {
                    category1: budget.category_one,
                    category2: budget.category_two,
                    name: budget.category_three,
                    year: budget.year,
                    size: 0
                };
            }
            node.size += budget.budget_assigned;

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
                    children: []
                }
            }
            node.size += cat3node.size;
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
            seoulBudget.size += cat1node.size
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
            if (budget.year!=currYear) continue;
            var prevBudget = svmap[prevYear + budget.service];

            if (services[budget.category_three]==null){
                services[budget.category_three] = [];
            }
            budget.rate = (prevBudget==null || prevBudget.budget_assigned==0)? 0.0 : (budget.budget_assigned - prevBudget.budget_assigned)/prevBudget.budget_assigned;
            services[budget.category_three].push(budget);
        }
        //console.log(services)
        res.json({budget: seoulBudget, services: services});
        
    })

});

router.get('/budgetmap', function(req, res){
    res.render('index', {
        title: "budgetmap",
    });
});

/* GET home page. */
router.post('/issue/add', function(req, res){
    var db = req.db;
    var data = req.body;
    if (data.issue == null || data.issue == '') {
        console.log("ERROR /issue/add: no issue entered");
        res.json({success: 0, errcode: "No issue entered / How did you get here?"});
    } else {
        db.collection("issue").findOne({name: data.issue}, function(err, result) {
            if (err) {
                console.log("ERROR /issue/add: error querying issue from DB");
                res.json({success: 0, errcode: "Internal DB errorr"});
            } else if (!result) {
                var insert_query = {};
                if (data.budget_id == '') {
                    insert_query = {
                        name: data.issue
                    }
                } else {
                    insert_query = {
                        name: data.issue,
                        _budget_id: [req.toObjectID(data.budget_id)]
                    }
                }
                db.collection("issue").insert(insert_query, function(err, result) {
                    if (err) {
                        console.log("ERROR /issue/add: failed logging issue to DB: " + data.issue);
                        res.json({success: 0, errcode: "DB insert error"});
                    } else {
                        console.log("/issue/add: Logged new issue_names entry: " + result.name);
                        res.json({success: 1, errcode: "DB insert success"});
                    }
                });
            } else {
                if (data.budget_id == '' || result._budget_id.toString().indexOf(req.toObjectID(data.budget_id)) > -1) {
                    console.log("ERROR /issue/add: issue-budget relation already exists");
                    res.json({success: 0, errcode: "Budget-Issue relation already exists"});
                } else {
                    db.collection("issue").update({
                        name: data.issue,
                    }, {'$push': {
                        _budget_id: req.toObjectID(data.budget_id)
                    }}, function(err) {
                       if (err) {
                           console.log("ERROR /issue/add: failed updating budget_id to DB");
                           res.json({success: 0, errcode: "DB update error"});
                       } else {
                           console.log("/issue/add: Appended new budget_id: " + data.budget_id);
                           res.json({success: 1, errcode: "Db update success"});
                       }
                    });
                }
            } 
        });
    }
});

module.exports = router;
