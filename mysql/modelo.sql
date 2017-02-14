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



-- --------------------------------------------------------


create user 'music'@'localhost' identified by 'music';

grant all on Music.* to music@localhost;
