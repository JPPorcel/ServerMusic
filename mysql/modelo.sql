-- base de datos --

create database Music CHARACTER SET utf8 COLLATE utf8_general_ci;

use Music;



create table if not exists Marchas 
(
	id varchar(50) not null,
    titulo varchar(200) not null,
    autor varchar(200) not null,
    tipo varchar(10) not null,
    primary key (id)
);

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
	email varchar(200) not null,
	nombre varchar(200) not null,
	apellidos varchar(200),
	localidad int not null references Localidad(id),
	primary key (email)
);

create table if not exists Escuchas 
(
	claveEscucha varchar(50) not null,
    emailUsuario varchar(200) not null references Usuarios(email),
    idMarcha varchar(50) not null references Marchas (id),
    ip varchar(50),
    fecha datetime,
    primary key (claveEscucha)
);


-- --------------------------------------------------------


create user 'music'@'localhost' identified by 'music';

grant all on Music.* to music@localhost;
