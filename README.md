# EnhancedCTF-backend


To run locally on windows do this: 
```
DATABASE_URL=$(heroku config:get DATABASE_URL -a enhanced-ctf) node server.js
```
GitHub for the backend side of the Enhanced Capture the Flag Capstone project.




## Requests you can make to this API as a front-end user, and what requirements they will have.


Please Note: Most of the time if a request fails, it will return a 500 error, but sometimes it will return 40x, or 30x errors depending on the request that failed. Please go to the heroku app and view the logs to see exactly why your request failed, as it will log it every time.

Feel free to scroll, or click to jump to the desired function.

[GET createGame](#GET-createGame)

[GET getGameStarted](#GET-getGameStarted)

[GET getEndGameInfo](#GET-getEndGameInfo)

[GET getPlayersInGame](#GET-getPlayersInGame)

[GET getTeamsInfo](#GET-getTeamsInfo)

[GET getTeammatesLocations](#GET-getTeammatesLocations)

[GET getClockInfo](#GET-getClockInfo)

[GET getMyTeamsFlags](#GET-getMyTeamsFlags)

[GET getEnemiesInViewRadius](#GET-getEnemiesInViewRadius)

[GET getGameRegions](#GET-getGameRegions)

[GET getMapScreenInfo](#GET-getMapScreenInfo)

[GET getMyInfo](#GET-getMyInfo)

[GET attemptStealFlag](#GET-attemptStealFlag)

[GET attemptTagPlayer](#GET-attemptTagPlayer)

[GET attemptCookieGet](#GET-attemptCookieGet)

[GET attemptCookieGet](#GET-attemptBackInHomeBase)

[POST setGameInfo](#POST-setGameInfo)

[POST joinGame](#POST-joinGame)

[POST startGame](#POST-startGame)

[POST deleteGame](#POST-deleteGame)

[POST updatePlayerLocation](#POST-updatePlayerLocation)

[DELETE deleteMyGames](#DELETE-deleteMyGames)



# GET createGame
### Info
This should be the **first** request ever submitted to the server by a user attempting to create a game.
### Required Parameters 
deviceId - String
### Example URL
http://enhanced-ctf.herokuapp.com/createGame?deviceId=ADSDFASDF-FSDSADSF-FDSASDF
### Return Body
```JSON
  {"gameId":"RWDTGR"}
```
### Return Info
This returns a unique 6 capital character gameID for your game. You will need to store this and use it to set the game info (view the next query).

### Common Errors
A user (i.e. a deviceID) can only create one game at a time. If a user tries to call createGame twice in a row without deleting the first game, they will get an Internal Server Error (error code 500), and the backend will log 
```
Error in query, createGameQuery: error: duplicate key value violates unique cons
traint "games_user_number_key"
```
# POST setGameInfo
### Info
This should be the **second** request ever submitted to the server by a user attempting to create a game. It can be resubmitted again later to update the game info, i.e. changing the region, changing team colors, etc.
### Required Parameters 
gameId - String

deviceId - String

defaultTagRadius - Int

defaultViewRadius - Int -> how far they can see other enemy players

maxPlayers - int

numRounds - int

currentRound - int (should be 0)... might change this later.

gameLength - int - game length in minutes

region - region object... see below.

gameType - type of game. 0 for default, 1 for chess.

divideByLatitude - bool, whether you want the rectangle split in half via latitude or longitude.

amountOfFlags - int - amount of flags

coookieAmounts - list of ints - amount for each type of cooke (index 0 = increase view, 1 = increase tag, 2 = invisible)

### Example Post Body
```JSON
{
    "gameId": "IAUPSE",
    "deviceId":"123",
    "defaultTagRadius":10,
    "defaultViewRadius":30,
    "maxPlayers":520,
    "numRounds":3,
    "gameLength":120,
    "currentRound":0,
    "gameType":0,
    "amountOfFlags":3,
    "region":[
        {
            "latitude":0, 
            "longitude":0
        },{
            "latitude":0,
            "longitude":2
        },{
            "latitude":2, 
            "longitude":2
        },{
            "latitude":2,
            "longitude": 0
        }
    ],
    "divideByLatitude":false,
    "cookieAmounts":[1,1,1]
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/setGameInfo
#### Return Info
200 if successful, error code if unsuccessful. As typical, if you want to know what went wrong, look at the backend logs.

### Common Errors
None yet.

# POST joinGame
### Info
This should be the **third** request ever submitted to the server by a user attempting to create a game. It should also be submitted by any new users attempting to join a game.
### Required Parameters 
gameId - String

deviceId - String

username - String

team - Int (1 or 2)

### Example Post Body
```JSON
{
    "deviceId":"joinUser",
    "gameId": "AMKJVA",
    "username":"jnUserUserName",
    "team":1
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/joinGame
#### Return Info
200 if successful, error code if unsuccessful. Reasons for unsuccessful can be that the game does not exist. As typical, if you want to know what went wrong, look at the backend logs.

### Common Errors
None yet.



# POST deleteGame
### Info
This will delete the game and all users associated with it. This command can ONLY be issued by the user who initially created the game with the /createGame request
### Required Parameters 
gameId - String

deviceId - String


### Example Post Body
```JSON
{
    "gameId":"NDUUHQ",
    "deviceId":"123"
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/deleteGame
### Return Info
200 if successful, error code if unsuccessful. Reasons for unsuccessful can be that the game does not exist, the user is not the creator of the game, etc. As typical, if you want to know what went wrong, look at the backend logs.

### Common Errors
None yet.



### Common Errors
None yet.

# POST updatePlayerLocation
### Info
This updates the player location of a user (if that user is in a game)
### Required Parameters 
deviceId - String

latitude - Float

longitude - Float


### Example Post Body
```JSON
{
    "deviceId":"123",
    "latitude":2,
    "longitude":2
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/updatePlayerLocation
### Return Info
200 if successful, error code if unsuccessful. Reasons for unsuccessful can be that the game does not exist, the user is not in the game, etc. As typical, if you want to know what went wrong, look at the backend logs.

### Common Errors
None yet.

# GET getPlayersInGame
### Info
Returns a list of all the players in a game (if you are in that game). Only usernames and what team they're on.
### Required Parameters 
deviceId - String

gameId - string

### Example URL
http://enhanced-ctf.herokuapp.com/getPlayersInGame?gameId=ZQQKHS&deviceId=testUser

### Return Body
```JSON{
    "players":[{"username":"jacob","team_number":1},
            {"username":"notJacob1","team_number":2},
            {"username":"notJacob2","team_number":2},
            {"username":"notJacob3","team_number":2},
            {"username":"notJacob4","team_number":2}]
    "maxPlayers":123
}

```
### Return Info
Returns a list of names if successful. Reasons for being unsuccessful, can include the game not existing, the user requesting it not being in the game, etc. As always, check the backend logs for the exact error. Typically returns 40x error if there was an accessing violation, although it can return 500 errors.

### Common Errors
None yet.

# GET getTeamsInfo
### Info
Returns a list of the 2 teams in a game, with their team color, and player count.
### Required Parameters 
deviceId - String

gameId - string

### Example URL
http://enhanced-ctf.herokuapp.com/getTeamsInfo?gameId=ZQQKHS&deviceId=testUser

### Return Body
```JSON
{"1":{"team_color":"FF0000FF","player_count":"1"},
"2":{"team_color":"0000FFFF","player_count":"4"}}
```

note: no I don't know why these are strings and not numbers, just convert them to an integer.

### Return Info
Returns a list of teams with their team color in RGBA hex, and the player count. Can fail if the user requesting is not in the game.

### Common Errors
None Yet.

# GET getTeammatesLocations
### Info
Returns a list of all your teammates usernames and locations, as well as whether they have a flag or not, and if they are eliminated.
### Required Parameters 
deviceId - String

gameId - string

### Example URL
http://enhanced-ctf.herokuapp.com/getTeammatesLocations?gameId=ZQQKHS&deviceId=testUser

### Return Body
```JSON
[
    {
    
        "latitude": 44.56238712731649,
        "longitude": -123.28321710180174,
        "username": "jnUserUserNassssme",
        "hasFlag": true,
        "flagNumber": 2,
        "eliminated": false,
        "class":1,
        "invisible":true
    }
]
```
### Return Info
Returns a list of all your teammates, where they are, and whether they have an enemy flag, and if they are eliminated.
Returns error codes if you request for a game you're not in, the game doesn't exist, etc. Note that in example return there is only one teammate. flagNumber is ALWAYS the flag number for the opposite team. You cannot hold your own flag.

### Common Errors
None Yet.

# GET getClockInfo
### Info
Returns the start date, start time, timezone, and game length **in minutes** of the current game. Also returns a boolean gameStarted that is false if the game has not started yet, i.e. the start_time == null.
### Required Parameters 
deviceId - String

gameId - string

### Example URL
http://enhanced-ctf.herokuapp.com/getClockInfo?gameId=ZQQKHS&deviceId=testUser

### Return Body
```JSON
{"timezone":"UTC",
"gameStarted":true,
"startTimeStamp":"2021-11-30T20:57:48.433Z",
"gameLength":120}
```
### Return Info
Note that if gameStarted = false like it does in the example, none of the info will have been entered. 
### Common Errors
None Yet.





# POST startGame
### Info
This starts the game and sets the game start time and date to the current UTC time/date. Only the creator of the game may issue this request.
### Required Parameters 
deviceId - String

gameId - String


### Example Post Body
```JSON
{
    "deviceId":"123",
    "gameId":"ZQQKHS"
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/startGame
### Return Info
400 if user is attempting to start a game, and they have not created any.
404 if user is attempting to start a game that they did not create.
200 - success! Game has started, you can swap to the game screen now. hip hip hooray.
### Common Errors
None yet.

# GET getMyTeamsFlags
### Info
This returns the locations of all of your team flags, along with whether they are currently stolen, i.e.
still in your territory, but an enemy player is running with it. This feature might need to be removed later,
but it's in for right now.
### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
[
    {
        "stolen": false,
        "latitude": 44.56262526674929,
        "longitude": -123.28198598740566,
        "flagNumber": 1
    },
    {
        "stolen": false,
        "latitude": 44.5631381526055,
        "longitude": -123.27989126810203,
        "flagNumber": 2
    },
    {
        "stolen": false,
        "latitude": 44.56257468314724,
        "longitude": -123.28035962081427,
        "flagNumber": 3
    }
]
```

### Example URL
http://enhanced-ctf.herokuapp.com/getMyTeamFlags?gameId=ZVGDWN&deviceId=123
### Return Info
200 and above body for each flag that exists on YOUR team. Doesn't return anything about enemy team flags.
Can return errors if there is a mistake in your request, or user requesting for a game they're not in.
### Common Errors
None yet.


# GET getEnemiesInViewRadius
### Info
This returns a list of all enemies. If they are in your view radius, seen = true, and they have a location. It also says whether
that enemy has a flag or not. If they DO have a flag, then it will send their location, and mark them as seen. Note that they may not be within your view radius.
### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
[
    {
        "seen": true,
        "latitude": 44.56238712731649,
        "longitude": -123.28321710180174,
        "eliminated": false,
        "hasFlag": true,
        "flagNumber": 3,
        "username": "jnUserUserName"
    },
    {
        "seen": false,
        "eliminated": false,
        "hasFlag": false,
        "username": "itsa me"
    }
]
```

### Example URL
http://enhanced-ctf.herokuapp.com/getEnemiesInViewRadius?gameId=ZVGDWN&deviceId=123
### Return Info
200 and above body for each each enemy player that exists. Note that if enemy player has not set their location yet,
it will not return a location for them (even if they are standing right next to you). Some error codes such as 400 if the user 
has not set their own location yet, and the usual ones for when someone tries to do something to a game they're not in.
### Common Errors
None yet.

# GET getGameRegions
### Info
This returns an object of all the game regions in the game,
the game region, team one's region, and tem two's region.
### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
{"gameRegion":[{"latitude":44.5634722648764,"longitude":-123.28442299460671},
    {"latitude":44.56350033490656,"longitude":-123.27972149942421},
    {"latitude":44.561984533897835,"longitude":-123.27962957074746},
    {"latitude":44.562115530605794,"longitude":-123.28444925994292}],
"teamOneRegion":[{"latitude":44.56350033490656,"longitude":-123.28444925994292},
    {"latitude":44.561984533897835,"longitude":-123.28444925994292},
    {"latitude":44.56350033490656,"longitude":-123.2820394153452},
    {"latitude":44.561984533897835,"longitude":-123.2820394153452}],
"teamTwoRegion":[{"latitude":44.56350033490656,
    "longitude":-123.27962957074746},
    {"latitude":44.561984533897835,"longitude":-123.27962957074746},
    {"latitude":44.56350033490656,"longitude":-123.2820394153452},
    {"latitude":44.561984533897835,"longitude":-123.2820394153452}]
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/getGameRegions?gameId=ZVGDWN&deviceId=123
### Return Info
200 and above body for all the team regions. Assumes the team regions exist, otherwise will probably result in a 500 error.
### Common Errors
None yet.

# GET getMapScreenInfo
### Info
This returns an object of all the info needed to render the map screen, i.e.
Your teammates locations
Your enemy locations (that you can see)
Your flag locations
Your enemy's flag locations(that you can see)

### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
{
    "teamFlags": [
        {
            "stolen": false,
            "invisible": false,
            "latitude": 44.56217698119289,
            "longitude": -123.28364246965373,
            "flagNumber": 0
        },
        {
            "stolen": false,
            "invisible": false,
            "latitude": 44.56305237404315,
            "longitude": -123.2836323715751,
            "flagNumber": 1
        },
        {
            "stolen": false,
            "invisible": false,
            "latitude": 44.56320042776445,
            "longitude": -123.28430453508018,
            "flagNumber": 2
        }
    ],
    "teammates": [
        {
            "latitude": 44.56539363682165,
            "longitude": -123.27855838007444,
            "username": "user2Team1",
            "hasFlag": true,
            "flagNumber": 1,
            "eliminated": false,
            "class":1,
            "invisible":false
        },
        {
            "latitude": 44.56814291568858,
            "longitude": -123.27686533817312,
            "username": "stu",
            "hasFlag": false,
            "eliminated": false,
            "class":1
        },
        {
            "latitude": 44.565590342265665,
            "longitude": -123.27978548067951,
            "username": "user3Team1",
            "hasFlag": false,
            "eliminated": false,
            "class":1,
            "invisible":false
        },
        {
            "latitude": null,
            "longitude": null,
            "username": "jnUserUserNamadsafsda",
            "hasFlag": false,
            "eliminated": false,
            "class":1,
            "invisible":false
        },
        {
            "latitude": null,
            "longitude": null,
            "username": "aaa",
            "hasFlag": false,
            "eliminated": false,
            "class":1,
            "invisible":false
        },
        {
            "latitude": null,
            "longitude": null,
            "username": "aaa",
            "hasFlag": false,
            "eliminated": false,
            "class":1,
            "invisible":false
        },
        {
            "latitude": 44.56595565061133,
            "longitude": -123.27948308803039,
            "username": "user1Team1",
            "hasFlag": false,
            "eliminated": false,
            "class":1,
            "invisible":false
        }
    ],
    "enemys": [
        {
            "seen": true,
            "latitude": 44.563245416809224,
            "longitude": -123.27267073030954,
            "eliminated": false,
            "hasFlag": true,
            "flagNumber": 1,
            "username": "kevinPhone",
            "class":1
        },
        {
            "seen": false,
            "eliminated": false,
            "hasFlag": false,
            "username": "user1Team2",
            "class":1
        },
        {
            "seen": false,
            "eliminated": true,
            "hasFlag": false,
            "username": "user2Team2",
            "class":1
        },
        {
            "seen": true,
            "latitude": 44.565840125997916,
            "longitude": -123.27978548067951,
            "eliminated": false,
            "hasFlag": false,
            "username": "user3Team2",
            "class":1
        }
    ],
    "enemyFlags": [
        {
            "stolen": true,
            "latitude": 44.56539363682165,
            "longitude": -123.27855838007444,
            "flagNumber": 1
        }
    ],
    "cookies": [
        {
            "type": 1,
            "cookieNumber": 1,
            "longitude": 44.56222471995084,
            "latitude": -123.28372732338315,
            "secondOfCookie": 30
        },
        {
            "type": 2,
            "cookieNumber": 2,
            "longitude": 44.5619934722942,
            "latitude": -123.28414177926986,
            "secondOfCookie": 30
        },
        {
            "type": 2,
            "cookieNumber": 3,
            "longitude": 44.56349922324252,
            "latitude": -123.28444821659383,
            "secondOfCookie": 30
        },
        {
            "type": 2,
            "cookieNumber": 4,
            "longitude": 44.563340532326606,
            "latitude": -123.28085970876674,
            "secondOfCookie": 30
        },
        {
            "type": 2,
            "cookieNumber": 5,
            "longitude": 44.56333759899845,
            "latitude": -123.2833225666634,
            "secondOfCookie": 30
        }
    ]
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/getMapScreenInfo?gameId=AAAAAA&deviceId=sadfsdfsdafsdafsda
### Return Info
200 and above body for the game you're in. Errors if you are not in the game. Check the backend. Note that if you cannot see enemy flags
THEY ARE NOT RENDERED. Only gives enemyFlags locations that you can see.

NOTE That if one of your flags is invisible, it's latitude and longitude are null. This means an enemy that is invisible is holding your flag. Additionally, your players can be marked as invisilbe as well. Obviously, if your enemies are invisible, you cannot see them so they are not sent in this request.
### Common Errors
None yet.

# GET getGameStarted
### Info
Returns whether the game has started or not.

### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
{"gameStarted":true}
```

### Example URL
http://enhanced-ctf.herokuapp.com/getGameStarted?gameId=AAAAAA&deviceId=sadfsdfsdafsdafsda
### Return Info
200 and above body for your game. False if the creator has not started the game yet, true if they have.
### Common Errors
None yet.


# DELETE deleteMyGames
### Info
Deletes all games that belong to deviceID.

### Required Parameters
deviceId - String

### Example URL
http://enhanced-ctf.herokuapp.com/deleteMyGames?deviceId=123332222
### Return Info
200 and the amount of games deleted if successful. error codes if unsuccessful.
### Common Errors
None yet.

# GET getMyInfo
### Info
Gets all the info for a player. This will likely change as there's more info addded per players

### Required Parameters 
deviceId - String

gameId - String


### Return Body
```JSON
{
    "hasFlag": false,
    "gameOver": true,
    "username": "jnUserUserNamadsafsda",
    "location": {
        "latitude": 44.5629177257359,
        "longitude": -123.28205904338554
    },
    "activeCookies": [
        {
            "secondsLeft": 7,
            "type": 2
        },
        {
            "secondsLeft": 9,
            "type": 2
        },
        {
            "secondsLeft": 11,
            "type": 1
        },
        {
            "secondsLeft": 11,
            "type": 2
        }
    ],
    "tagRadius": 13,
    "viewRadius": 30,
    "invisible": true,
    "eliminated": false,
    "classString": "Pawn",
    "classId": 1,
    "queenFlagNumber": -1,
    "gameId": "UZJWNH"
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/getMyInfo?gameId=AAAAAA&deviceId=sadfffffffsdssasdsadfsadfsdafsdafffdsafdsasafdsafsqwerweqasdfsadfqda
### Return Info
200 and above body for info. Note that location can be NULL if it is not set yet for the player.
ALso if hasFlag is false, flag number does not exist.
invisible true if activated for someone reason, could be from cookie.
tag radius and view radius are already updated
### Common Errors
None yet.


# GET attemptStealFlag
### Info

Attempts to steal a flag. Doesn't work if you're eliminated, or already holding a flag, or too far away from the flag. 
### Required Parameters 
deviceId - String

gameId - String

flagNumber - Int

### Return Body
```JSON
{"flagStolen":true}
```

### Example URL
http://enhanced-ctf.herokuapp.com/attemptStealFlag?gameId=KYZEEY&deviceId=joinUser2&flagNumber=2
### Return Info
200 and above body for info. If the player is out of bounds, is eliminated, or is already hodling a flag, returns 405 errors. Can return regular server errors as well. MAKE SURE TO HANDLE THESE.
### Common Errors
None yet.


# GET attemptTagPlayer
### Info
Attempts to tag an enemy player. Doesn't work if you are too far away, if you're in the enemy zone, if they're in their own zone, or a variety of other reasons
### Required Parameters 
deviceId - String

gameId - String

enemyUsername - String
### Return Body
```JSON
{"playerTagged":true}
```

### Example URL
http://enhanced-ctf.herokuapp.com/attemptTagPlayer?deviceId=0&gameId=KYZEEY&enemyUsername=itsa%20me
### Return Info
200 and above body for info. If player is too far away, but all other checks are met, returns playerTagged:false. If something is wrong, like the player is already tagged, or you're in the wrong regions, returns 400, with error code as body. Make sure to handle.
### Common Errors
If you attempt to tag a player that's invisible, it won't work. This means that if a player is visible, you load the display, then they turn invisible, then you tag them it won't work.

# GET getEndGameInfo
### Info
Get's the info for a game to be displayed on the end game page. If the game is not ended, returns an error.
### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
{
    "startTimeStamp": "2021-11-30T21:01:15.762Z",
    "gameDayLength": 0,
    "gameHourLength": 0,
    "gameMinuteLength": 2,
    "gameSecondLength": 49,
    "winner": 0,
    "teamOneFlagsLeft": "3",
    "teamTwoFlagsLeft": "3"
}
```

### Example URL
https://enhanced-ctf.herokuapp.com/getEndGameInfo?gameId=VGXXBX&deviceId=321
### Return Info
200 and above body for info. Can return server errors or 403 for forbidden if the game isn't over.
### Common Errors
None yet.



# GET attemptCookieGet
### Info
Attempts to get a cookie in the game. Does not work if someone else has the cookie, does not work if you are to far away.
### Required Parameters 
deviceId - String

gameId - String

cookieNumber - int
### Return Body
```JSON
{
    "gotCookie": true,
    "reasonFailed": "Did not fail",
    "secondsOfCookie": 30,
    "cookieType": 0
}
```

### Example URL
http://enhanced-ctf.herokuapp.com/attemptCookieGet?gameId=UZJWNH&deviceId=1&cookieNumber=0
### Return Info
200 and above body for info. If cookie is too far away or out of game, gotCookie is false, and reasonFailed is updated accordingly. secondsOfCookie is 
how long the cookie lasts for.
### Common Errors
None yet.


# GET attemptBackInHomeBase
### Info
Attempts to set yourself back inside your team zone, claiming all flags and reviving yourse.
### Required Parameters 
deviceId - String

gameId - String

### Return Body
```JSON
{"backInHome":true}
```

### Example URL
http://enhanced-ctf.herokuapp.com/attemptBackInHomeBase?deviceId=0&gameId=KYZEEY
### Return Info
200 and above body for info. Can return errors if things are wrong. backInHome is false if you aren't back in the home base according to the game.
### Common Errors
None so far.