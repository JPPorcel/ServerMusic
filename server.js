
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

var crypto = require("crypto");

function getHashKey()
{
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    return crypto.createHash('sha1').update(current_date + random).digest('hex');
}


app.use(bodyParser.urlencoded({ extended: true }));  
app.use(bodyParser.json());  
app.use(methodOverride());
app.enable('trust proxy')

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
	connection.query("select * from Marchas where titulo like '%" + req.params.filtro + "%'", function (err, marchas)
	{
		if(err)
			throw err;
        
        connection.query("select * from Autores where nombre like '%" + req.params.filtro + "%'", function (err, autores)
        {
            if(err)
                throw err;
            
            connection.query("select Listas.nombre as nombre, Listas.id as id, Listas.creador as idCreador, Usuarios.nombre as creador from Listas join Usuarios on Listas.creador=Usuarios.idFacebook where Listas.nombre like '%" + req.params.filtro + "%'", function (err, listas)
            {
                if(err)
                    throw err;
                
                connection.query("select Usuarios.idFacebook as idFacebook, Usuarios.nombre as nombre, Usuarios.apellidos as apellidos, Usuarios.localidad as idLocalidad, Usuarios.imagen as imagen, Localidad.nombre as localidad from Usuarios join Localidad on Usuarios.localidad=Localidad.id where Usuarios.nombre like '%" + req.params.filtro + "%'", function (err, usuarios)
                {
                    if(err)
                        throw err;
                    
                    result = '{"marchas":' + JSON.stringify(marchas) + ', "autores":' + JSON.stringify(autores) + ', "listas":' + JSON.stringify(listas) + ', "usuarios":' + JSON.stringify(usuarios) + '}'
                    
                    res.set({ 'content-type': 'application/json; charset=utf-8' });
                    res.send(String(result));
                });
            });
        });		
		//console.log(req.params.filtro);
	});
});

router.post('/users/logup', function(req, res)
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
				res.send("{'code': '20', 'message': 'ok'}");
			});
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'code': '41', 'message': 'user already registered'}");
		}
	});
});


router.post('/playlist/new_add', function(req, res)
{
    var id = getHashKey()
	var user = req.body.user;
	var nombre = req.body.nombre;
    var marcha = req.body.marcha
	
	connection.query("select * from Usuarios where idFacebook='" + user + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 1)
		{
			connection.query("insert into Listas(id, nombre, creador) values ('"+ id + "', '" + nombre + "', '" + user + "')", function (err, rows)
			{
				if(err)
					throw err;
				
				connection.query("insert into ListasMarchas values ('"+ id + "', '" + marcha + "')", function (err, rows)
                {
                    if(err)
                        throw err;
                    
                    res.set({ 'content-type': 'application/json; charset=utf-8' });
                    res.send("{'code': '20', 'message': 'ok'}");
                });
			});
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.send("{'code': '43', 'message': 'user does not exists'}");
		}
	});
});


router.post('/playlist/new', function(req, res)
{
    var id = getHashKey()
	var user = req.body.user;
	var nombre = req.body.nombre;
	
	connection.query("select * from Usuarios where idFacebook='" + user + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 1)
		{
			connection.query("insert into Listas(id, nombre, creador) values ('"+ id + "', '" + nombre + "', '" + user + "')", function (err, rows)
			{
				if(err)
					throw err;
				
				res.set({ 'content-type': 'application/json; charset=utf-8' });
				res.send("{'code': '20', 'message': 'ok'}");
			});
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.send("{'code': '43', 'message': 'user does not exists'}");
		}
	});
});

router.post('/playlist/add', function(req, res)
{
    var lista = req.body.lista
	var user = req.body.user
	var marcha = req.body.marcha
	
	connection.query("select * from Listas where id='" + lista + "' and creador='" + user + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 1)
		{
			connection.query("insert into ListasMarchas values ('"+ lista + "', '" + marcha + "')", function (err, rows)
			{
				if(err)
					throw err;
				
                connection.query("select * from ListasMarchas where lista='" + lista + "' and marcha='" + marcha + "'", function (err, rows)
                {
                    if(err)
                        throw err;
                    
                    if(rows.length == 0)
                    {
                        connection.query("insert into ListasMarchas values ('"+ lista + "', '" + marcha + "')", function (err, rows)
                        {
                            if(err)
                                throw err;
                            
                            res.set({ 'content-type': 'application/json; charset=utf-8' });
                            res.send("{'code': '20', 'message': 'ok'}");
                        });
                    }
                    else
                    {
                        res.set({ 'content-type': 'application/json; charset=utf-8' });
                        res.send("{'code': '47', 'message': 'la marcha ya esta en la lista'}");
                    }
                });
                
				res.set({ 'content-type': 'application/json; charset=utf-8' });
				res.send("{'code': '20', 'message': 'ok'}");
			});
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.send("{'code': '43', 'message': 'user does not exists'}");
		}
	});
});


router.post('/users/login', function(req, res)
{
	var id = req.body.idFacebook;
	
	connection.query("select * from Usuarios where idFacebook='" + id + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 0)
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'code': '42', 'message': 'unregistered user'}");
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'code': '20', 'message': 'ok'}");
		}
	});
});


router.post('/users/followers/new', function(req, res)
{
	var idUser1 = req.body.idUser1;
    var idUser2 = req.body.idUser2;
	
	connection.query("select * from Seguidores where idUsuario1='" + idUser1 + "' and idUsuario2='" + idUser2 + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 0)
		{
			connection.query("select * from Usuarios where idFacebook='" + idUser1 + "' or idFacebook='" + idUser2 + "'", function (err, rows)
            {
                if(err)
                    throw err;
                
                if(rows.length == 2)
                {
                    connection.query("insert into Seguidores values ('"+ idUser1 + "', '" + idUser2 + "')", function (err, rows)
                    {
                        if(err)
                            throw err;
                        
                        res.set({ 'content-type': 'application/json; charset=utf-8' });
                        res.send("{'code': '20', 'message': 'ok'}");
                    });
                }
                else
                {
                    res.set({ 'content-type': 'application/json; charset=utf-8' });
                    res.send("{'code': '43', 'message': 'user does not exists'}");
                }
            });
		}
		else
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'code': '44', 'message': 'users are already following'}");
		}
	});
});




router.post('/historial/nuevo', function(req, res)
{
    var user = req.body.user
    var marcha = req.body.marcha
    var claveEscucha = getHashKey()
        
    connection.query("select * from Usuarios where idFacebook='" + user + "'", function (err, rows)
	{
		if(err)
			throw err;
		
		if(rows.length == 0)
		{
			res.set({ 'content-type': 'application/json; charset=utf-8' });
			res.send("{'code': '43', 'message': 'user does not exists'}");
		}
		else
		{
			connection.query("insert into Escuchas values ('"+ claveEscucha + "', '" + user + "', '" + marcha + "', now())", function (err, rows)
            {
                if(err)
                    throw err;
                
                res.set({ 'content-type': 'application/json; charset=utf-8' });
                res.send("{'code': '20', 'message': 'ok'}");
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
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

router.get('/library/:user', function(req, res)
{
	connection.query("select Listas.id as id, Listas.nombre as nombre, Listas.creador as idCreador, Usuarios.nombre as creador  from Listas join Usuarios on Listas.creador=Usuarios.idFacebook where Listas.creador=" + req.params.user, function (err, listas)
	{
		if(err)
			throw err;
		
		connection.query("select Escuchas.idMarcha as id, Marchas.titulo as titulo, Marchas.autor as autor, Marchas.tipo as tipo, Marchas.duration as duration, Marchas.idAutor as idAutor, Marchas.imagen as imagen from Escuchas join Marchas on Escuchas.idMarcha=Marchas.id where idUsuario='"+ req.params.user +"' group by Escuchas.idMarcha order by count(Escuchas.idMarcha) desc limit 10;", function (err, marchas)
        {
            if(err)
                throw err;
            
            result = '{"marchas":' + JSON.stringify(marchas) + ', "listas":' + JSON.stringify(listas) + '}'
                    
            res.set({ 'content-type': 'application/json; charset=utf-8' });
            res.send(String(result));
        });
	});
});


router.get('/marchas/top', function(req, res)
{
	connection.query("select Escuchas.idMarcha as id, Marchas.titulo as titulo, Marchas.autor as autor, Marchas.tipo as tipo, Marchas.duration as duration, Marchas.idAutor as idAutor, Marchas.imagen as imagen from Escuchas join Marchas on Escuchas.idMarcha=Marchas.id group by Escuchas.idMarcha order by count(Escuchas.idMarcha) desc limit 20;", function (err, marchas)
    {
        if(err)
            throw err;
                
        res.set({ 'content-type': 'application/json; charset=utf-8' });
        res.send(marchas);
    });
});


router.get('/playlists/:user', function(req, res)
{
	connection.query("select Listas.id as id, Listas.nombre as nombre, Listas.creador as idCreador, Usuarios.nombre as creador  from Listas join Usuarios on Listas.creador=Usuarios.idFacebook where Listas.creador=" + req.params.user, function (err, rows)
	{
		if(err)
			throw err;
		
		res.set({ 'content-type': 'application/json; charset=utf-8' });
		res.send(rows);
	});
});

router.get('/playlist/:id', function(req, res)
{
	connection.query("select * from ListasMarchas join Marchas on ListasMarchas.marcha=Marchas.id where ListasMarchas.lista='" + req.params.id +"'", function (err, rows)
	{
		if(err)
			throw err;
		
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
