# --- Build stage ---
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /bin/zilobook-api .

# --- Runtime stage ---
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H app
WORKDIR /app
COPY --from=build /bin/zilobook-api ./zilobook-api
# main.go runs migrations from ./migrations on startup
COPY migrations ./migrations
USER app
EXPOSE 8080
CMD ["./zilobook-api"]
