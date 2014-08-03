var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/budget-vis', function(req, res) {
  res.render('budget-vis', { title: 'Budget-Vis Test' });
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

    db.collection("seoul_budget").find().toArray(function(err, items){
        //console.log(items.length);
        
        var result = {
            name: "seoul-budget",
            children: []
        };
        // preprocessing
        var id_map = {};
        var yr_code_map = {};
        var date = new Date();
        var curYear = date.getFullYear();

        for (var i in items){
            var budget = items[i];
            id_map[budget._id] = items[i];
            yr_code_map[budget.year.toString() + budget.code.toString()] = items[i];
        }
        //construct nodes
        var node_map = {};
        var rel_map = {};
        for (var id in id_map){
            if (id_map[id].year!=curYear) continue;

            var budget = id_map[id];
            var lastYrBudget = yr_code_map[(curYear-1).toString()+budget.code.toString()].budget;
            var node = {
                _id  : budget._id,
                name : budget.name,
                size : budget.budget,
                rate : lastYrBudget==0? 0.0 : (budget.budget - lastYrBudget)/lastYrBudget,
                children: []
            };
            node_map[budget._id] = node;
            if (budget._parent_id !=null){
                if (rel_map[budget._parent_id] == null){
                    rel_map[budget._parent_id] = [];
                }
                rel_map[budget._parent_id].push(node);
            }else{
                result.children.push(node);
            }
        }
        
        // construct parent-child relationships
        for (var id in node_map){
            var node = node_map[id];
            node.children = rel_map[id]
        }
        
        //console.log(result);
        res.json(result);
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
