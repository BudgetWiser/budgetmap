var express = require('express');
var router = express.Router();

var pythonShell = require('python-shell');

router.get('/', function(req, res) {
    res.render('index', {
        layout: 'layout'
    });
});

router.get('/service', function(req, res){
    var issue = req.query.issue;

    var issueTrackerPy = new pythonShell('prototype.py');

    issueTrackerPy.send(issue);
    issueTrackerPy.on('message', function(obj){
        data = obj.split(" / ");
        output = [];
        for(var i = 0; i < data.length; i++){
            output.push({'service': data[i]});
        }
        res.render('service', {
            layout: 'layout',
            data: output
        });
    });
    issueTrackerPy.end(function(err){
        if(err) console.log(err);
        console.log('end');
    });
});

module.exports = router;
