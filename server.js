
// https://s3.eu-west-2.amazonaws.com/marchas-storage/_0mkd_x2YQY.mp3


var express = require("express"),  
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override"),
    mysql = require('mysql'),
	fs = require('fs'),
	mp3Duration = require('mp3-duration'),
	request = require('request');
	
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
		if(err) 
			throw err;
		
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.send(rows);
	});
});

// devuelve el archivo de audio de una marcha, si existe
router.get('/marcha/:id', function(req, res) 
{  	
	if (fs.existsSync("./marchas/" + req.params.id + ".mp3")) 
	{
		res.setHeader('content-type', 'audio/mpeg');
		//res.sendFile(__dirname + "/marchas/" + req.params.id + ".mp3");
		request('http://s3.eu-west-2.amazonaws.com/marchas-storage/'+ req.params.id + '.mp3').pipe(res); 
	}
	else
	{
		res.setHeader('content-type', 'text/plain');
		res.send("not exists");
	}
});

// devuelve la información de una marcha, si existe
router.get('/marcha/info/:id', function(req, res) 
{  
	connection.query("select * from Marchas where id='" + req.params.id + "'",function(err,rows)
	{
		if(err) throw err;
		
		if (fs.existsSync("./marchas/" + req.params.id + ".mp3")) 
		{
			mp3Duration(__dirname + "/marchas/" + req.params.id + ".mp3", function (err, duration) {
				if (err) return console.log(err.message);
				rows[0].duration = duration;
				res.setHeader('content-type', 'application/json; charset=utf-8');
				res.send(rows[0]);
			});
		}
		else
		{
			res.setHeader('content-type', 'application/json; charset=utf-8');
			res.send(rows[0]);
		}
	});
});


router.get('/filtro/:filtro', function(req, res)
{
	connection.query("select * from Marchas where titulo like '%" + req.params.filtro + "%' or autor like '%" + req.params.filtro + "%'", function (err, rows)
	{
		if(err)
			throw err;
		
		console.log(req.params.filtro);
		
		res.setHeader('content-type', 'application/json; charset=utf-8');
		res.send(rows);
	});
});

app.use(router);

app.listen(8080, function() {  
	console.log("Node server running on http://localhost:8080");
});
