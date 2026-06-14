composefile=docker-compose.yml
serverpath=cmd/server/main.go
seederpath=cmd/seeder/seeder.go

.PHONY: up down restart seed run logs status clean


all: run


up:
	docker compose -f $(composefile) up -d

down:
	docker compose -f $(composefile) down

restart: down up

logs:
	docker compose -f $(composefile) logs -f

status:
	docker compose -f $(composefile) ps

seed:
	go run $(seederpath)

run:
	go run $(serverpath)

test:
	go test ./...

clean:
	go clean
	rm -rf bin/