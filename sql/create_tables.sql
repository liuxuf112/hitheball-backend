DROP TABLE IF EXISTS cookie_amounts;
DROP TABLE IF EXISTS coins;
DROP TABLE IF EXISTS cookies;
DROP TABLE IF EXISTS queens;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS flags;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS game_infos;
DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS queries;

/*Creating users table*/
CREATE TABLE users(
    device_id VARCHAR(255) NOT NULL UNIQUE,
    create_date DATE NOT NULL,
    user_number INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);


/*Creating games table*/

CREATE TABLE games(
    game_id VARCHAR(6) NOT NULL PRIMARY KEY,
    user_number INT NOT NULL UNIQUE,        /* A user should only be able to create one game at a time */
    FOREIGN KEY (user_number) REFERENCES users(user_number) ON DELETE CASCADE
);


CREATE TABLE regions(
    region_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    corner1 point NOT NULL,
    corner2 point NOT NULL,
    corner3 point NOT NULL,
    corner4 point NOT NULL
);


CREATE TABLE game_infos(
    default_tag_radius INT,
    default_view_radius INT,
    max_players INT,
    create_time_stamp TIMESTAMPTZ NOT NULL,
    start_time_stamp TIMESTAMPTZ,
    end_time_stamp TIMESTAMPTZ,
    game_length INT, /* In minutes */
    num_rounds INT,
    current_round INT,
    region_id INT,
    game_type INT,
    flag_amount INT,
    game_id VARCHAR(6) NOT NULL UNIQUE, /*Only one game_info per game_id*/
    FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE, /*If the region is deleted, the game can't exist, cascade*/
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE   /* When the game is deleted, delete corresponding game id*/
);


CREATE TABLE teams(
    team_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enemy_team_id INT,
    team_color VARCHAR(8), /*8 digit hex code RGBA*/
    game_id VARCHAR(6) NOT NULL,
    region_id INT,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE,
    FOREIGN KEY (enemy_team_id) REFERENCES teams(team_id)
);

CREATE TABLE flags(
    flag_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    flag_location POINT,
    grab_radius INT,
    flag_number INT,
    out_of_game BOOLEAN,
    team_id INT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE players(
    player_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_location POINT,
    tag_radius INT,
    view_radius INT,
    username VARCHAR(255),  /*Maybe change this to limit*/
    team_id INT,
    flag_id INT,
    is_eliminated BOOLEAN,
    coin_amount INT,
    user_number INT NOT NULL UNIQUE,    /*Only one player for user suckas*/
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (flag_id) REFERENCES flags(flag_id),
    FOREIGN KEY (user_number) REFERENCES users(user_number) ON DELETE CASCADE
);


CREATE TABLE queens(
    queen_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    flag_id INT,
    player_id INT NOT NULL UNIQUE,
    FOREIGN KEY (flag_id) REFERENCES flags(flag_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

CREATE TABLE coins(
    coin_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id VARCHAR(6) NOT NULL,
    coin_location POINT NOT NULL,
    player_id INT,
    create_date DATE NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

CREATE TABLE cookies(
    cookie_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cookie_type INT NOT NULL,
    game_id VARCHAR(6) NOT NULL,
    cookie_location POINT NOT NULL,
    cookie_number INT NOT NULL,
    player_id INT,
    activation_time_stamp TIMESTAMPTZ,
    activation_length INT,
    
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id)

);

CREATE TABLE cookie_amounts(
    cookie_amounts_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cookie_type INT NOT NULL,
    cookie_amount INT NOT NULL,
    game_id VARCHAR(6) NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
    
);

CREATE TABLE queries(
    query_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    query_path VARCHAR(255),
    total_queries INT,
    last_called_at_timestamp TIMESTAMPTZ,
    unique_name VARCHAR(265) UNIQUE NOT NULL,
    request_method VARCHAR(10)
);