var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});
router.get('/budget-vis', function(req, res) {
  res.render('budget-vis', { title: 'Budget-Vis Test' });
});
router.get('/issues/:id', function(req, res){
    var db = req.db;
    console.log(req.toObjectID(req.params.id));
    db.collection("issues").find({_budget_id:req.toObjectID(req.params.id)}).toArray(function(err, items){
        var result = [];
        //console.log(items);
        res.json(items);
    });
});
router.get('/issue-categories', function(req, res){
    var db = req.db;
    db.collection("issue_categories").find().toArray(function(err, items){
        var result = [];
        for (var i in items){
            var issue = items[i];
            result.push({
                id: issue._id,
                name: issue.name,
                desc: issue.desc
            });
        }
        res.json(result);
    });
});
router.get('/budget-data', function(req, res){
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
        console.log(yr_code_map)
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
router.get('/data', function(req, res) {
    var db = req.db;

    var result = {
        "name": "budgetdata",
        "children": [] 
    };
    db.collection('seoul_functional').find().toArray(function(err, items) {
        for (var i in items) {
            var doc = items[i];

            var exist = false;
            var child = null;
            for (var j in result.children){
                var item = result.children[j];

                if (item.name == doc.level1){
                    exist = true;
                    child = item;
                    break;
                }
            }
            if (exist == false){
                child = {};
                child.name = doc.level1;
                child.children = [];
                result.children.push(child);
            }
            
            var new_obj = {};
            new_obj.name = doc.level2;
            new_obj.size = doc.yr_2014;

            var yr_2014 = parseInt(doc.yr_2014);
            var yr_2013 = parseInt(doc.yr_2013);


            if (yr_2013 == 0) {
                new_obj.rate = 0;
            }
            else {
                new_obj.rate = (yr_2014 - yr_2013) / yr_2013;
            }
            
            child.children.push(new_obj);
        }
        res.json(result);
    });
});

router.get('/budgetmap', function(req, res){
    res.render('index', {
        title: "budgetmap",
    });
});

/* GET home page. */
router.post('/add-issue', function(req, res){
    var db = req.db;
    var data = req.body;
    db.collection("issues").insert({
        _budget_id      : req.toObjectID(data.issue_budget_id),
        _issue_category_id  : req.toObjectID(data.issue_category_id),
        type: 0, //0: article, 1: ??? 
        link: data.issue_link,
        title: data.issue_title,
        desc: data.issue_desc,
        reason: data.issue_reason
    }, function(err, result){
        if (err){
            res.json({ ret_code: 1, msg: 'Issue Insertion Failed!', data: result});
        }else{
            res.json({ ret_code: 0, msg: 'Issue Insertion Success!', data: result});
        }

    });
});
module.exports = router;
