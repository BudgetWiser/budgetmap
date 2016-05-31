var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

// mongodb settings
var mongo = require('mongoskin');

// Private config
var config = require('./config');

//var db = mongo.db("mongodb://143.248.234.88:17027/budgetmap_proto", {native_parser: true});
//var db = mongo.db("mongodb://143.248.234.88:27017/budgetmap_live", {native_parser: true});
// Creates an instance 'db' of a connection to MongoDB

var url = "mongodb://" + config.mongo.username + ":" + config.mongo.password
			+ "@localhost:" + config.mongo.port + "/" + config.mongo.db_name;
var url_en = "mongodb://" + config.mongo.username + ":" + config.mongo.password
			+ "@localhost:" + config.mongo.port + "/" + config.mongo.db_name_en;

var db = mongo.db(url, {native_parser: true});
var db_en = mongo.db(url_en, {native_parser: true});

var session = require('express-session');
var app = express();

//socket.io

var server = require('http').Server(app);
var io = require('socket.io')(server);
require('./routes/socket')(io);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// hogan-express settings
app.enable('view cache');
app.engine('html', require('hogan-express'));

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({secret: 'budgetmap super secret', 
                 saveUninitialized: true,
                 resave: true}));
app.use(express.static(path.join(__dirname, 'public')));

// db settings
// adding the 'db' object defined above to every HTTP request(i.e. "req") the app makes
// Allows db accessible to router
app.use(function(req, res, next){
    req.db = db;
    req.db_en = db_en;
    req.toObjectID = mongo.helper.toObjectID;
    next();
});

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = server;
