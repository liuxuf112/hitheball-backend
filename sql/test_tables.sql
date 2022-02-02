/*Testing inserting into users table*/
INSERT INTO users(device_id,create_date) VALUES ('device1ID',now()),('device2ID',now()),('device3ID',now());


INSERT INTO users(device_id,create_date) VALUES ('device1ID',now());    /* This line should fail, no matching device IDs, one userID per deviceID */


/*Next 2 lines should succeed*/
INSERT INTO games(game_id,user_number) VALUES ('AXKHGE',1);
INSERT INTO games(game_id,user_number) VALUES ('ZZZZZZ',2);

/*Next 2 lines should fail
INSERT INTO games(game_id,user_number) VALUES ('ASFGHS',1); 
INSERT INTO games(game_id,user_number) VALUES ('AXKHGE',1); 
*/

/*Testing regions*/
INSERT INTO regions(corner1,corner2,corner3,corner4) VALUES (point(0,0),point(0,1),point(1,1),point(1,0));
INSERT INTO regions(corner1,corner2,corner3,corner4) VALUES (point(3,4),point(0.1,0.2),point(0.000002,0.00003),point(0.00000000321,89.212345));


/* Testing game_infos */

INSERT INTO game_infos(default_tag_radius,max_players,create_date,create_time,num_rounds,region_id,game_id)
VALUES (10,20,NOW(),NOW(),4,1,'AXKHGE');

/*Testing teams*/

INSERT INTO TEAMS(team_color,game_id,region_id)
VALUES ('AAAAAAAA','AXKHGE',2);


/*Testing flags*/
INSERT INTO flags(flag_location,grab_radius,team_id)
VALUES (point(1,1),10,1);

/*Testing players*/

INSERT INTO players(player_location,username,user_number)
VALUES(point(0,1),'MyNameIsJacob',1);