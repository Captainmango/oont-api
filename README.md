# OoNt API

Backend interview task submission. The project was built with `Bun` but will work with NodeJS. The Node version used is 22.17.1. The Bun version used is 1.3.9.

### Usage

* Set up a `.env` file. The minimum needed is in the `.env.example` file.
> App port can be set by adding `PORT` envvar. By default the app uses `3000`.
* Use `docker compose up -d` To build and start the application. By default the application is available at `http://localhost:3000`. OpenAPI docs are available at `http://localhost:3000/api/v1/docs`.
* Run the migrations with `bun run db:dev:migrate`
* Run the seeder with `bun run db:dev:seed`

### Tests

1. Run `bun install` or `npm install`
2. Start the testing Docker compose set up (just Postgres) `docker compose -f docker-compose.dev.yml up -d`
4. Run the migrations against the test set up `bun run db:dev:migrate`
3. Run tests `bun run test`

## Design

The application follows a layered architecture, with an explicit service layer and abstracted data layer. Neverthrow is used to manage error handling in a clean way as well as structuring the project for fast and safe development. The approach of creating a set of steps that transform some data is called [Railway Oriented Programming](https://www.youtube.com/watch?v=fYo3LN9Vf_M) and is a great way to structure error paths alongside happy paths. It also leads to explicit error handling, helping with debugging and reasoning about a system.


## Concurrency Strategy

The concurrency concerns on product stock quantity are handled in two ways:

1. A soft check is performed when attempting to add an item to the cart. This is so that we don't try and checkout with a quantity we know won't work.
2. A hard check when making the stock changes on the product rows. This is so that if any stock quantity fails the check, we roll everything back.

The soft check happens with an `ACCESS SHARE` table lock. This does not prevent concurrent reads from anyone else adding products to their carts. We do not want to decrement the stock count before the user attempts to checkout as we cannot guarantee that the product would actually be purchased. We also do not want to manage stock counts for customers simply shopping.

The hard check happens with a `ROW SHARE` lock. SELECT ... FOR UPDATE places this lock on the rows returned by the query, preventing anyone else from reading them. This is wrapped within a transaction meaning the lock is held until it commits or rollsback. The hard check is carried out in the case the stock changed before the user checked out their cart. If we don't do this, it is possible to oversell.

It's reasonable to question why we would even do the soft check in the first place. The reason for this is pretty simple. Stock changes are dynamic and happen all the time. We want to manage customer expectations. If there are 5 items left and they want 3 of them, someone _could_ purchase 4 in the time they attempt to add them to the cart and checkout. In this case, we would allow them to add the quantity to the cart, only to fail to checkout as the quantity is no longer there. This double locking approach is more performance heavy, but means customers will have better experiences when proceeding through their journey so is a worth while trade off.

The Isolation Level is kept at Read Commited (Postgres' default). Serializable would be too disruptive and Repeatable Read would allow phantom reads. The soft check suffers from a TOCTOU (Time Of Check Time Of Use) race condition, but the hard check handles this gracefully and performantly. Locks are only held for as long as they are needed.
