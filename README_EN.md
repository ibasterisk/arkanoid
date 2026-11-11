# 🧱 iBasterisk RETRO ARKANOID

[🇸🇰 Slovenčina](README.md) | 🇬🇧 **English**

A retro arcade brick-breaker game built with HTML5 Canvas,
JavaScript and CSS.

🎮 **Play online:** https://arkanoid.ibasterisk.eu

## Features

- 8 challenging levels
- Score, lives and saved high score
- Power-ups: wide paddle, slow ball, extra life
- Slovak and English interface
- Retro sound effects and responsive design
- Keyboard, mouse and touch controls

## Installation

Requires Docker Engine and Docker Compose.

1. Clone: `git clone https://github.com/ibasterisk/arkanoid.git`
2. Enter directory: `cd arkanoid`
3. Create configuration: `cp .env.example .env`
4. Start: `docker compose up -d --build`
5. Open: http://localhost:3088

## Configuration

Set the port in `.env` using `ARKANOID_PORT=3088`.

After changing the configuration, run `docker compose up -d`.

## Controls

- Left / Right arrows: move paddle
- A / D: move paddle
- Mouse: control paddle
- Click inside game: activate mouse / launch ball
- Space: launch ball or pause
- Touch: mobile controls

Keyboard controls do not snap the paddle back
to the mouse cursor position.

## Customization

- `index.html`: page structure
- `static/css/style.css`: visual design
- `static/js/game.js`: game logic, levels and translations
- `static/img/favicon.svg`: game icon
- `nginx.conf`: web server configuration
- `docker-compose.yml`: Docker configuration

After editing, run `docker compose up -d --build`.
Refresh your browser using Ctrl + F5.

## Docker Commands

- Status: `docker compose ps`
- Logs: `docker compose logs --tail=50`
- Restart: `docker compose restart`
- Stop: `docker compose down`
- Rebuild: `docker compose up -d --build`

## HTTPS

For public deployment, use a reverse proxy
with a valid TLS certificate, such as Let's Encrypt.

## Technologies

HTML5 Canvas, JavaScript, CSS3, Docker, Nginx.

## Author

iBasterisk — https://ibasterisk.eu
