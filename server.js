
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

function getHashKey()
{
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    return crypto.createHash('sha1').update(current_date + random).digest('hex');
}


app.use(bodyParser.urlencoded({ extended: true }));  
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
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

// devuelve el archivo de audio de una marcha, si existe
router.get('/marcha/:id', function(req, res) 
{  	
	res.setHeader('content-type', 'audio/mpeg');
	//res.sendFile(__dirname + "/marchas/" + req.params.id + ".mp3");
	request('http://s3.eu-west-2.amazonaws.com/marchas-storage/'+ req.params.id + '.mp3').pipe(res);
});

// devuelve la información de una marcha, si existe
router.get('/marcha/info/:id', function(req, res) 
{  
	connection.query("select * from Marchas where id='" + req.params.id + "'",function(err,rows)
	{
		if(err) 
			throw err;
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows[0]);
	});
});

router.get('/filtro/:filtro', function(req, res)
{
	connection.query("select * from Marchas where titulo like '%" + req.params.filtro + "%' or autor like '%" + req.params.filtro + "%'", function (err, rows)
	{
		if(err)
			throw err;
		
		console.log(req.params.filtro);
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

router.post('/users/register', function(req, res)
{
	var id = req.body.idFacebook;
	var nombre = req.body.nombre;
	var apellidos = req.body.apellidos;
	var localidad = req.body.localidad;
	var imagen = req.body.imagen;
	
	connection.query("select * from Usuarios where idFacebook='" + id + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 0)
		{
			connection.query("insert into Usuarios values ('"+ id + "', '" + nombre + "', '" + apellidos + "', " + localidad + ", '" + imagen + "')", function (err, rows)
			{
				if(err)
					throw err;
				
				res.set({ 'content-type': 'application/json; charset=utf-8' });
				res.send("{'message': 'ok'}");
			});
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'message': 'user already registered'}");
		}
	});
});


router.post('/historial/nuevo', function(req, res)
{
    var user = req.body.user
    var marcha = req.body.marcha
    var claveEscucha = getHashKey()
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    var date;
    date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' + 
        ('00' + date.getUTCHours()).slice(-2) + ':' + 
        ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
        ('00' + date.getUTCSeconds()).slice(-2);
        
    connection.query("select * from Usuarios where idFacebook='" + id + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 0)
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'message': 'user does not exists'}");
		}
		else
		{
			connection.query("insert into Escuchas values ('"+ claveEscucha + "', '" + user + "', '" + marcha + "', " + ip + ", '" + date + "')", function (err, rows)
            {
                if(err)
                    throw err;
                
                res.set({ 'content-type': 'application/json; charset=utf-8' });
                res.send("{'message': 'ok'}");
            });
		}
	});
});


router.get('/historial/:user', function(req, res)
{
	connection.query("select * from Escuchas where idFacebook=" + req.params.user + " order by fecha desc", function (err, rows)
	{
		if(err)
			throw err;
		
		console.log(req.params.filtro);
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

router.get('/historial/:user/:n', function(req, res)
{
	connection.query("select * from Escuchas where idFacebook=" + req.params.user + " order by fecha desc limit "+req.params.n, function (err, rows)
	{
		if(err)
			throw err;
		
		console.log(req.params.filtro);
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

router.get('/localidades', function(req, res)
{
	connection.query("select * from Localidad",function(err,rows){
		if(err) 
			throw err;
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

app.use(router);

app.listen(8080, function() {  
	console.log("Node server running on http://localhost:8080");
});
