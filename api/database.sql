# put database startup scripts in here in lieu of any fancy migrations

DROP TABLE "world_state";
DROP TABLE "stops";
DROP TABLE "users";
DROP TABLE "monsters";
CREATE TABLE "world_state"
(
	time TIMESTAMP,
	seed VARCHAR(100)
);
CREATE TABLE "stops"
(
  coordinates POINT,
  seed VARCHAR(100),
  state VARCHAR(100)
);
CREATE TABLE "users"
(
  id UUID PRIMARY KEY ,
  name VARCHAR(30)
);
CREATE TABLE "monsters"
(
  name VARCHAR(30),
  encstats VARCHAR(100),
  created TIMESTAMP,
  caughtby UUID UNIQUE references users(id)
);

