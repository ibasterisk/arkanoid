# 🧱 iBasterisk RETRO ARKANOID

🇸🇰 **Slovenčina** | [🇬🇧 English](README_EN.md)

Retro arkádová hra v HTML5 Canvas, JavaScripte a CSS.

🎮 **Hraj online:** https://arkanoid.ibasterisk.eu

## Funkcie
- 8 herných úrovní
- Skóre, životy a uložený rekord
- Bonusy: širšia plošinka, pomalá loptička, extra život
- Slovenčina a angličtina
- Retro zvuky a responzívny dizajn
- Ovládanie myšou, klávesnicou a dotykom

## Inštalácia

Vyžaduje Docker Engine a Docker Compose.

1. Naklonuj repozitár: `git clone https://github.com/ibasterisk/arkanoid.git`
2. Prejdi do adresára: `cd arkanoid`
3. Vytvor konfiguráciu: `cp .env.example .env`
4. Spusti hru: `docker compose up -d --build`
5. Otvor: http://localhost:3088

## Konfigurácia

Port nastavíš v súbore `.env` pomocou `ARKANOID_PORT=3088`.

Po zmene konfigurácie spusti `docker compose up -d`.

## Ovládanie

- Šípky alebo A/D: pohyb plošinky
- Myš: ovládanie plošinky
- Kliknutie do hry: aktivácia myši a vypustenie loptičky
- Medzerník: vypustenie loptičky alebo pauza
- Dotyk: ovládanie na mobile

Pri použití klávesnice sa plošinka nevracia pod kurzor.

## Úpravy hry

- `index.html`: štruktúra stránky
- `static/css/style.css`: dizajn a responzivita
- `static/js/game.js`: herná logika, levely a preklady
- `static/img/favicon.svg`: ikona
- `nginx.conf`: konfigurácia webservera
- `docker-compose.yml`: Docker konfigurácia

Po úprave spusti `docker compose up -d --build`.
V prehliadači obnov stránku pomocou Ctrl + F5.

## Docker príkazy

- Stav: `docker compose ps`
- Logy: `docker compose logs --tail=50`
- Reštart: `docker compose restart`
- Zastavenie: `docker compose down`
- Aktualizácia: `docker compose up -d --build`

## HTTPS

Pre verejné nasadenie použi reverzný proxy server
s platným TLS certifikátom, napríklad Let's Encrypt.

## Technológie

HTML5 Canvas, JavaScript, CSS3, Docker, Nginx.

## Autor

iBasterisk — https://ibasterisk.eu
