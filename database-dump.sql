PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO users VALUES('cmf3dg2b4000wdqxu9w9ccp81','Dad','dad','test@example.com',NULL,NULL,'$2b$12$pDTzx6mmuHIde1PQpqW52utne/r7uVdZDpj5UeR7qjo9cAVG/seiS',1756867328176,1756868313050,0);
CREATE TABLE IF NOT EXISTS "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "pools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "inviteCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "pool_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    CONSTRAINT "pool_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pool_members_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "pool_weeks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "pool_weeks_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "logo" TEXT,
    "color" TEXT
);
INSERT INTO teams VALUES('cmf3dg23w0000dqxuraqk16ls','Arizona Cardinals','Arizona Cardinals','ARI','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ari.png','#a40227');
INSERT INTO teams VALUES('cmf3dg2410001dqxuczf2fxeq','Atlanta Falcons','Atlanta Falcons','ATL','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/atl.png','#a71930');
INSERT INTO teams VALUES('cmf3dg2430002dqxuel6x4vre','Baltimore Ravens','Baltimore Ravens','BAL','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/bal.png','#29126f');
INSERT INTO teams VALUES('cmf3dg2450003dqxuaz50wbdy','Buffalo Bills','Buffalo Bills','BUF','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/buf.png','#00338d');
INSERT INTO teams VALUES('cmf3dg2460004dqxu9p71zz8l','Carolina Panthers','Carolina Panthers','CAR','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/car.png','#0085ca');
INSERT INTO teams VALUES('cmf3dg2470005dqxuco4uawfp','Chicago Bears','Chicago Bears','CHI','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/chi.png','#0b1c3a');
INSERT INTO teams VALUES('cmf3dg2480006dqxuuwdcvknp','Cincinnati Bengals','Cincinnati Bengals','CIN','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/cin.png','#fb4f14');
INSERT INTO teams VALUES('cmf3dg24a0007dqxuo6ptclfx','Cleveland Browns','Cleveland Browns','CLE','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/cle.png','#472a08');
INSERT INTO teams VALUES('cmf3dg24b0008dqxua74y8xne','Dallas Cowboys','Dallas Cowboys','DAL','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/dal.png','#002a5c');
INSERT INTO teams VALUES('cmf3dg24c0009dqxucrdjasz6','Denver Broncos','Denver Broncos','DEN','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/den.png','#0a2343');
INSERT INTO teams VALUES('cmf3dg24e000adqxu8vcfyq77','Detroit Lions','Detroit Lions','DET','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/det.png','#0076b6');
INSERT INTO teams VALUES('cmf3dg24f000bdqxukbtg9o7a','Green Bay Packers','Green Bay Packers','GB','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/gb.png','#204e32');
INSERT INTO teams VALUES('cmf3dg24g000cdqxuosslh2xl','Houston Texans','Houston Texans','HOU','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/hou.png','#00143f');
INSERT INTO teams VALUES('cmf3dg24h000ddqxufb6c6okn','Indianapolis Colts','Indianapolis Colts','IND','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ind.png','#003b75');
INSERT INTO teams VALUES('cmf3dg24i000edqxuingps7oi','Jacksonville Jaguars','Jacksonville Jaguars','JAX','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/jax.png','#007487');
INSERT INTO teams VALUES('cmf3dg24j000fdqxurb8dbij6','Kansas City Chiefs','Kansas City Chiefs','KC','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/kc.png','#e31837');
INSERT INTO teams VALUES('cmf3dg24k000gdqxulmzl3nux','Las Vegas Raiders','Las Vegas Raiders','LV','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lv.png','#000000');
INSERT INTO teams VALUES('cmf3dg24l000hdqxu3wry4r6x','Los Angeles Chargers','Los Angeles Chargers','LAC','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lac.png','#0080c6');
INSERT INTO teams VALUES('cmf3dg24m000idqxukfiomgjh','Los Angeles Rams','Los Angeles Rams','LAR','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/lar.png','#003594');
INSERT INTO teams VALUES('cmf3dg24n000jdqxup3q6szg5','Miami Dolphins','Miami Dolphins','MIA','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/mia.png','#008e97');
INSERT INTO teams VALUES('cmf3dg24o000kdqxu8vx7ls30','Minnesota Vikings','Minnesota Vikings','MIN','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/min.png','#4f2683');
INSERT INTO teams VALUES('cmf3dg24q000ldqxu2hguvean','New England Patriots','New England Patriots','NE','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ne.png','#002a5c');
INSERT INTO teams VALUES('cmf3dg24r000mdqxu5jcc707a','New Orleans Saints','New Orleans Saints','NO','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/no.png','#d3bc8d');
INSERT INTO teams VALUES('cmf3dg24s000ndqxucuk2sc50','New York Giants','New York Giants','NYG','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyg.png','#003c7f');
INSERT INTO teams VALUES('cmf3dg24t000odqxu3wu6k9oj','New York Jets','New York Jets','NYJ','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nyj.png','#115740');
INSERT INTO teams VALUES('cmf3dg24t000pdqxuk4d8kw10','Philadelphia Eagles','Philadelphia Eagles','PHI','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/phi.png','#06424d');
INSERT INTO teams VALUES('cmf3dg24u000qdqxunln4qmo8','Pittsburgh Steelers','Pittsburgh Steelers','PIT','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/pit.png','#000000');
INSERT INTO teams VALUES('cmf3dg24v000rdqxuu4xlb6b5','San Francisco 49ers','San Francisco 49ers','SF','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/sf.png','#aa0000');
INSERT INTO teams VALUES('cmf3dg24w000sdqxup5oujzag','Seattle Seahawks','Seattle Seahawks','SEA','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/sea.png','#002a5c');
INSERT INTO teams VALUES('cmf3dg24x000tdqxu6djimiim','Tampa Bay Buccaneers','Tampa Bay Buccaneers','TB','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/tb.png','#bd1c36');
INSERT INTO teams VALUES('cmf3dg24y000udqxu2bsmgowp','Tennessee Titans','Tennessee Titans','TEN','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/ten.png','#4b92db');
INSERT INTO teams VALUES('cmf3dg250000vdqxuggddkutg','Washington Commanders','Commanders','WAS',NULL,NULL);
INSERT INTO teams VALUES('cmf3dkvz5000gdqj0lwyhnj6h','Washington Commanders','Washington Commanders','WSH','https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/wsh.png','#5a1414');
CREATE TABLE IF NOT EXISTS "games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "espnId" TEXT,
    "week" INTEGER NOT NULL,
    "season" INTEGER NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "gameDate" DATETIME NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "winnerTeamId" TEXT, "awayMoneyline" INTEGER, "awaySpread" REAL, "homeMoneyline" INTEGER, "homeSpread" REAL, "oddsProvider" TEXT, "oddsUpdatedAt" DATETIME, "overUnder" REAL,
    CONSTRAINT "games_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "games_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO games VALUES('cmf3dkw0b000xdqj0gi4qy2d8','401772510',1,2025,'cmf3dg24t000pdqxuk4d8kw10','cmf3dg24b0008dqxua74y8xne',1757031600000,0,NULL,NULL,NULL,130,3.5,-150,-3.5,'Sample Data','2025-09-03 23:37:21',47.5);
INSERT INTO games VALUES('cmf3dkw0d000zdqj04g2e3ebm','401772714',1,2025,'cmf3dg24l000hdqxu3wry4r6x','cmf3dg24j000fdqxurb8dbij6',1757116800000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0e0011dqj07zh270hg','401772830',1,2025,'cmf3dg2410001dqxuczf2fxeq','cmf3dg24x000tdqxu6djimiim',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0f0013dqj0kbe96527','401772829',1,2025,'cmf3dg24a0007dqxuo6ptclfx','cmf3dg2480006dqxuuwdcvknp',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0h0015dqj0ft1vthq7','401772719',1,2025,'cmf3dg24h000ddqxufb6c6okn','cmf3dg24n000jdqxup3q6szg5',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0i0017dqj02xjba0ox','401772720',1,2025,'cmf3dg24q000ldqxu2hguvean','cmf3dg24k000gdqxulmzl3nux',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0j0019dqj0eebohkd2','401772718',1,2025,'cmf3dg24r000mdqxu5jcc707a','cmf3dg23w0000dqxuraqk16ls',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0k001bdqj02jc95exl','401772721',1,2025,'cmf3dg24t000odqxu3wu6k9oj','cmf3dg24u000qdqxunln4qmo8',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0l001ddqj0fn5ikryz','401772827',1,2025,'cmf3dkvz5000gdqj0lwyhnj6h','cmf3dg24s000ndqxucuk2sc50',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0n001fdqj0casoep7w','401772828',1,2025,'cmf3dg24i000edqxuingps7oi','cmf3dg2460004dqxu9p71zz8l',1757264400000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0o001hdqj02jnspt9g','401772832',1,2025,'cmf3dg24c0009dqxucrdjasz6','cmf3dg24y000udqxu2bsmgowp',1757275500000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0p001jdqj07exrn2x9','401772831',1,2025,'cmf3dg24w000sdqxup5oujzag','cmf3dg24v000rdqxuu4xlb6b5',1757275500000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0q001ldqj0xxgo7j6z','401772722',1,2025,'cmf3dg24f000bdqxukbtg9o7a','cmf3dg24e000adqxu8vcfyq77',1757276700000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0r001ndqj07k5tayp2','401772723',1,2025,'cmf3dg24m000idqxukfiomgjh','cmf3dg24g000cdqxuosslh2xl',1757276700000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0s001pdqj0ohd9q132','401772918',1,2025,'cmf3dg2450003dqxuaz50wbdy','cmf3dg2430002dqxuel6x4vre',1757290800000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO games VALUES('cmf3dkw0u001rdqj0zvbyd2xp','401772810',1,2025,'cmf3dg2470005dqxuco4uawfp','cmf3dg24o000kdqxu8vx7ls30',1757376900000,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "picks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "points" INTEGER,
    "isCorrect" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "picks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "picks_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "picks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO picks VALUES('cmf3dll19001vdqj0sk6jwd77','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0d000zdqj04g2e3ebm','cmf3dg24j000fdqxurb8dbij6',NULL,NULL,1756867585725,1756867585725);
INSERT INTO picks VALUES('cmf3dln4e001xdqj0ej4iawc1','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0e0011dqj07zh270hg','cmf3dg2410001dqxuczf2fxeq',NULL,NULL,1756867588430,1756867588430);
INSERT INTO picks VALUES('cmf3dlnx0001zdqj0plnfwu1z','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0f0013dqj0kbe96527','cmf3dg24a0007dqxuo6ptclfx',NULL,NULL,1756867589460,1756867589460);
INSERT INTO picks VALUES('cmf3dlop60021dqj0i2gvz4el','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0n001fdqj0casoep7w','cmf3dg2460004dqxu9p71zz8l',NULL,NULL,1756867590475,1756867590475);
INSERT INTO picks VALUES('cmf3dlpd90023dqj0mq2b5b0l','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0h0015dqj0ft1vthq7','cmf3dg24h000ddqxufb6c6okn',NULL,NULL,1756867591342,1756867591342);
INSERT INTO picks VALUES('cmf3dlqpa0025dqj0ye7t0bgq','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0k001bdqj02jc95exl','cmf3dg24u000qdqxunln4qmo8',NULL,NULL,1756867593071,1756867593071);
INSERT INTO picks VALUES('cmf3dlrgc0027dqj0l1og0kki','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0l001ddqj0fn5ikryz','cmf3dkvz5000gdqj0lwyhnj6h',NULL,NULL,1756867594045,1756867594045);
INSERT INTO picks VALUES('cmf3dlspr0029dqj06i8pug15','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0s001pdqj0ohd9q132','cmf3dg2430002dqxuel6x4vre',NULL,NULL,1756867595679,1756867595679);
INSERT INTO picks VALUES('cmf3dlttz002bdqj04owlaayi','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0u001rdqj0zvbyd2xp','cmf3dg24o000kdqxu8vx7ls30',NULL,NULL,1756867597127,1756867597127);
INSERT INTO picks VALUES('cmf3dlzgi002ddqj0ofxpu4l5','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0i0017dqj02xjba0ox','cmf3dg24k000gdqxulmzl3nux',NULL,NULL,1756867604418,1756867604418);
INSERT INTO picks VALUES('cmf3dm07g002fdqj0ceyuxvgl','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0j0019dqj0eebohkd2','cmf3dg24r000mdqxu5jcc707a',NULL,NULL,1756867605389,1756867605389);
INSERT INTO picks VALUES('cmf3dm1c2002hdqj07wq4olwl','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0o001hdqj02jnspt9g','cmf3dg24y000udqxu2bsmgowp',NULL,NULL,1756867606850,1756867606850);
INSERT INTO picks VALUES('cmf3dm2eh002jdqj09vwyeqzk','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0p001jdqj07exrn2x9','cmf3dg24w000sdqxup5oujzag',NULL,NULL,1756867608233,1756867608233);
INSERT INTO picks VALUES('cmf3dm3vi002ldqj016iipsun','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0q001ldqj0xxgo7j6z','cmf3dg24f000bdqxukbtg9o7a',NULL,NULL,1756867610143,1756867610143);
INSERT INTO picks VALUES('cmf3dm4q7002ndqj0r4ipm1jc','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0r001ndqj07k5tayp2','cmf3dg24m000idqxukfiomgjh',NULL,NULL,1756867611247,1756867611247);
INSERT INTO picks VALUES('cmf3e9v43002pdqj069c2e2kz','cmf3dg2b4000wdqxu9w9ccp81','cmf3dkw0b000xdqj0gi4qy2d8','cmf3dg24t000pdqxuk4d8kw10',NULL,NULL,1756868718531,1756868718531);
CREATE TABLE IF NOT EXISTS "odds_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "homeSpread" REAL,
    "awaySpread" REAL,
    "homeMoneyline" INTEGER,
    "awayMoneyline" INTEGER,
    "overUnder" REAL,
    "provider" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "odds_history_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");
CREATE UNIQUE INDEX "pools_inviteCode_key" ON "pools"("inviteCode");
CREATE UNIQUE INDEX "pool_members_userId_poolId_key" ON "pool_members"("userId", "poolId");
CREATE UNIQUE INDEX "pool_weeks_poolId_week_season_key" ON "pool_weeks"("poolId", "week", "season");
CREATE UNIQUE INDEX "teams_abbreviation_key" ON "teams"("abbreviation");
CREATE UNIQUE INDEX "games_espnId_key" ON "games"("espnId");
CREATE UNIQUE INDEX "games_week_season_homeTeamId_awayTeamId_key" ON "games"("week", "season", "homeTeamId", "awayTeamId");
CREATE UNIQUE INDEX "picks_userId_gameId_key" ON "picks"("userId", "gameId");
CREATE INDEX "odds_history_gameId_timestamp_idx" ON "odds_history"("gameId", "timestamp");
COMMIT;
