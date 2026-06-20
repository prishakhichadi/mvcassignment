## How to install and run

1. Copy this repo to your machine
   ```
   git clone https://github.com/prishakhichadi/mvcassignment
   ```

2. Navigate to the project folder
   ```
   cd mvcassignment
   ```

3. Start the database
   ```
   docker compose up -d
   ```
   This brings up Postgres only (container `mvcassignment_db`), exposed on `localhost:5432` with database `mvcassignment`, user `postgres`, password `password`.

4. Run the database migrations
   ```
   migrate -path ./db/migrations -database "postgres://postgres:password@localhost:5432/mvcassignment?sslmode=disable" up
   ```
   (Adjust the migrations path above if it differs from `./db/migrations` in your repo.)

5. Seed the troop/building catalog (one-time)
   ```
   go run seeder.go
   ```

6. Start the backend API
   ```
   go run main.go
   ```
   You should see `vanguard API processing traffic on port:8080`.

7. Start the frontend, in a separate terminal
   ```
   cd frontend
   npm install
   npm run dev
   ```

Now open a browser to `http://localhost:5173` and you should see the login page. The API runs on `http://localhost:8080`.

In case you get an error about ports not being available, make sure `localhost:5432`, `:8080`, and `:5173` are free on your machine before starting.


Only the database is containerized right now — the backend and frontend run directly on your machine.

## Stopping

```
docker compose down
```

To wipe the database and start fresh:

```
docker compose down -v
```