
var express = require("express"),  
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override");
    mysql = require('mysql');
	
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'music',
  password : 'music',
  database : 'Music'
});

connection.connect(function(err){
	if(!err) {
		console.log("Database is connected ... " + err);    
	} else {
		console.log("Error connecting database ... " + err);    
	}
});

app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());  
app.use(methodOverride());

var router = express.Router();

router.get('/', function(req, res) 
{  
	res.send("raiz");
});

router.get('/marchas', function(req, res) 
{  
	connection.query("SELECT * FROM Marchas limit 10",function(err,rows){
		if(err) throw err;
		connection.end();

		res.send(rows);
	});
});

router.get('/marcha/:id', function(req, res) 
{  
	connection.query("SELECT * FROM Marchas where id='" + req.params.id + "'",function(err,rows){
		if(err) throw err;
		connection.end();

		res.send(rows);
	});
});

app.use(router);

app.listen(8080, function() {  
	console.log("Node server running on http://localhost:8080");
});
