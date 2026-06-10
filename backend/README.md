# Zilobook Golang Backend Architecture

## Overview
This backend powers the dynamic scaling architecture for independent professionals and strict physical location profiles. It relies on standard **Gin** and **PostgreSQL** mapping.

## Dependencies Setup
To configure this backend natively on your local machine:

1. Open your terminal to `e:\projects\gymapp\backend`.
2. Initialize and download strictly required modules:
   ```bash
   go mod init zilobook
   go get github.com/gin-gonic/gin
   go get github.com/gin-contrib/cors
   go get github.com/lib/pq
   ```

## Spinning The Database
We are utilizing standard PostgreSQL Up/Down flat file Migrations.
1. Deploy your local Postgres database container (port 5432) or open pgAdmin.
2. Assuming `golang-migrate` is installed globally onto your system, run:
   ```bash
   migrate -path ./migrations -database "postgres://postgres:postgres@localhost:5432/zilobook?sslmode=disable" up
   ```
   *Note: Modify the connection string credentials based on your own actual PostgreSQL local host bindings.*

## Booting Server
Run the standard go execution line to mount the REST endpoints up to port `:8080`:
```bash
go run main.go
```
