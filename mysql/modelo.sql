-- base de datos --

SET NAMES 'utf8' COLLATE 'utf8_general_ci';

create database Music CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

use Music;

create table if not exists Provincia 
(
    id int not null auto_increment,
    nombre varchar(255) collate latin1_spanish_ci NOT NULL,
    primary key (id)
);

create table if not exists Localidad 
(
    id int not null auto_increment,
    provincia int not null references Provincia(id),
    nombre varchar(255) collate latin1_spanish_ci not null,
    mostrar varchar(10),
    coordenadas varchar(100),
    primary key (id)
);

create table if not exists Usuarios
(
	idFacebook varchar(100) not null,
	email varchar(200) not null,
	nombre varchar(200) not null,
	apellidos varchar(200),
	localidad int not null references Localidad(id),
	primary key (idFacebook)
);

create table if not exists Seguidores
(
    idUsuario1 varchar(100) references Usuarios(idFacebook),
    idUsuario2 varchar(100) references Usuarios(idFacebook),
    primary key (idUsuario1, idUsuario2)
);

create table if not exists Autores
(
	id varchar(50) not null,
	nombre varchar(200) not null,
	primary key (id)
);

create table if not exists Marchas 
(
	id varchar(50) not null,
    titulo varchar(200) not null,
    autor varchar(200) not null, 
    tipo varchar(10) not null,
    duration double,
    idAutor varchar(50) not null references Autores(id),
    primary key (id)
);

create table if not exists Listas
(
	id varchar(50) not null,
	titulo varchar(200) not null,
	marcha varchar(50) not null references Marchas(id),
	primary key (id, marcha)
);

create table if not exists Escuchas 
(
	claveEscucha varchar(50) not null,
    idUsuario varchar(100) not null references Usuarios(idFacebook),
    idMarcha varchar(50) not null references Marchas(id),
    ip varchar(50),
    fecha datetime,
    primary key (claveEscucha)
);

create table if not exists Busquedas 
(
	claveBusqueda varchar(50) not null,
    idUsuario varchar(100) not null references Usuarios(idFacebook),
    busqueda varchar(200) not null,
    ip varchar(50),
    fecha datetime,
    primary key (claveBusqueda)
);

-- --------------------------------------------------------

create user if not exists 'music'@'localhost' identified by 'music';

grant all on Music.* to music@localhost;
