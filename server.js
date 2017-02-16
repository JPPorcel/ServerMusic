
var express = require("express"),  
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override"),
    mysql = require('mysql'),
	fs = require('fs');
	
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'music',
  password : 'music',
  database : 'Music'
});



app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());  
app.use(methodOverride());

var router = express.Router();

// raíz del servidor - devolverá html
router.get('/', function(req, res) 
{  
	res.send("Server Music");
});

// devolverá lista de marchas
router.get('/marchas', function(req, res) 
{  
	connection.query("select * from Marchas",function(err,rows){
		if(err) throw err;

		res.send(rows);
	});
});

// devuelve el archivo de audio de una marcha, si existe
router.get('/marcha/:id', function(req, res) 
{  	
	if (fs.existsSync("./marchas/" + req.params.id + ".mp3")) 
	{
		res.sendFile(__dirname + "/marchas/" + req.params.id + ".mp3");
	}
	else
	{
		res.send("not exists");
	}
});

// devuelve la información de una marcha, si existe
router.get('/marcha/info/:id', function(req, res) 
{  
	connection.query("select * from Marchas where id='" + req.params.id + "'",function(err,rows){
		if(err) throw err;

		res.send(rows);
	});
});

app.use(router);

app.listen(8080, function() {  
	console.log("Node server running on http://localhost:8080");
});
