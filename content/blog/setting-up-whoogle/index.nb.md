---
title: "Selvbetjen Whoogle via docker"
description: "Sett opp din egen Whoogle søkemotor på en Nginx server"
excerpt: "Sett opp din egen Whoogle søkemotor på en Nginx server"
lead: "Sett opp din egen Whoogle søkemotor på en Nginx server"
date: 2023-08-19T22:35:06+02:00
lastmod: 2025-10-05T17:22:51+0200
draft: false
weight: 50
images: ["whoogle.png"]
toc: true
tags: [docker, self-host, nginx, whoogle]
contributors: ["Eirik Rolland Enger"]
pinned: false
homepage: false
---

I en periode har jeg betjent min egen nettside og noen subdomener på en server jeg leier
via [Vultr](https://www.vultr.com/), men alt har ligget direkte i mapper på serveren.
Det har bare vært ferdige nettsider som ligger der, tilgjengelige via domenet jeg eier.

Men det er slutt på det nå, for jeg kjører nå min egen versjon av søkemotoren
[Whoogle](https://github.com/benbusby/whoogle-search) på serveren via docker, som jeg
kan nå fra hvor som helst via subdomenet [whoogle.eirik.re](https://whoogle.eirik.re).

## Whoogle

Whoogle er et fint åpen kildekode-prosjekt som er "en selvbetjent, reklamefri,
personvernrespekterende meta-søkemotor". Den kan installeres på flere måter: fra
kildekode, via [PyPI](https://pypi.org) eller via docker, for å nevne noen.

Å kjøre den på datamaskinene mine via docker og få tilgang til den på
[`http://localhost:5000`](http://localhost:5000) har vært min foretrukne løsning lenge,
men da blir telefonen min stående på sidelinjen. Dette er derfor et forsøk på å få et
komplett oppsett for alle enhetene mine samtidig.

### Dockerize env

Før vi setter opp docker-imaget, la oss først finne ut hvordan vi enkelt kan konfigurere
dette via miljøvariabler.
[Whoogle støtter mange av dem](https://github.com/benbusby/whoogle-search#environment-variables),
så det er greit å vite hvordan man håndterer det med en gang.

Ett problem er når man setter fargetemaet, som strekker seg over flere linjer, siden
[docker ikke kan sende linjeskift fra variabler i `--env-file` filer](https://github.com/moby/moby/issues/12997).
Vi løser dette med et praktisk lite skript kalt
[dockerize-env](https://gist.github.com/hudon/149466af21dfc52fdc70). Det er beskrevet
hvordan man bruker det i skriptet, men kort sagt, du definerer alle variabler i `.env`:

```env {title=".env"}
WHOOGLE_CONFIG_LANGUAGE=lang_no
WHOOGLE_CONFIG_COUNTRY=NO
WHOOGLE_CONFIG_BLOCK="w3schools.com,w3schools.blog,w3schools.in,w3schools.io,w3schools.me"
WHOOGLE_CONFIG_DARK=1
WHOOGLE_CONFIG_GET_ONLY=1
```

Deretter kjører du

```bash {title="Lager variabler for en dummy container kalt 'my_container'"}
dockerize-env .env
source .env.exported && docker run --env-file .env.vars <my_container>
```

### Docker

Så hva er containeren vi kjører? Imaget heter `benbusby/whoogle-search`, så vi laster
det først ned med

```bash {title="Last ned docker-imaget"}
docker pull benbusby/whoogle-search
```

før vi fikser miljøvariablene våre og starter containeren:

```bash {title="Lag variabler og kjør whoogle-containeren"}
dockerize-env .env
source .env.exported && docker run --publish 5000:5000 --detach --env-file .env.vars --name whoogle-search benbusby/whoogle-search:latest
```

På dette tidspunktet skal whoogle være tilgjengelig på
[`http://localhost:5000`](http://localhost:5000)!

## Selvbetjening

Den vanskelige delen for meg var å forstå hvordan jeg skulle ta dette til serveren min
hvor jeg kjører [Nginx](https://nginx.org/en/) som en reverse proxy-server med https ved
hjelp av [certbot](https://certbot.eff.org/), når jeg ikke bare peker til lokale filer,
men kjører programvare i en container. Plutselig må du håndtere IP-adressen til
containeren og forskjellige porter som imaget forventer.

### Nginx og oppsett av en nettside

Jeg startet først med nettsiden min ved å følge guiden på
[landchad.net](https://landchad.net), som er grunnen til at jeg bruker Vultr og Nginx
(og [Epik](https://www.epik.com/)) i utgangspunktet. Dette betyr også at den statiske
siden min på [eirik.re](https://eirik.re) er konfigurert via en fil i
`/etc/nginx/sites-available/` som

```nginx {title="/etc/nginx/sites-available/eirikre"}
server {
        listen 80 ;
        listen [::]:80 ;
        server_name eirik.re ;
        root /var/www/eirikre ;
        index index.html index.htm index.nginx-debian.html ;
        location / {
                try_files $uri $uri/ =404 ;
        }
}
```

Så, hva må vi justere i dette for å ha en ny fil for whoogle-subdomenet vårt?

### Sette det hele sammen

Fra domeneregistratorens perspektiv trengte jeg ikke å gjøre noe. Ved å følge
[landchad.net](https://landchad.net)-guiden vil vi omdirigere alle subdomener til nginx,
og hvis de ikke er konfigurert, vises standardfeilmeldingen:

{{< figure caption="Side som vises når man besøker whoogle.eirik.re før oppdatering av nginx-innstillingene" src="welcome-to-nginx.jpg" >}}

> Du kan se et levende eksempel ved å besøke et subdomene som ikke er konfigurert ennå,
> for eksempel [no-subdomain-here.eirik.re](http://no-subdomain-here.eirik.re).

Derfor, etter å ha kjørt kommandoene fra før, men denne gangen på serveren min

```bash
dockerize-env .env
source .env.exported && docker run --publish 5000:5000 --detach --env-file .env.vars --name whoogle-search benbusby/whoogle-search:latest
```

sjekket jeg hvilken IP-adresse docker-containeren brukte:

```console
$ ip a
...
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:55:9c:07:3c brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:55ff:fe9c:73c/64 scope link
       valid_lft forever preferred_lft forever
...
```

Kommandoen `ip a` gir mye output, men du kan finne docker oppført der, og etter `inet`
på den andre linjen i docker-blokken, finner vi IP-adressen som `172.17.0.1`! Fra
Whoogle README får vi faktisk en
[Nginx konfigurasjonsfil](https://github.com/benbusby/whoogle-search#nginx) som
"virker", men å ha den faktiske IP-adressen var avgjørende for å få `certbot` til å
akseptere den. Så vi gjør en liten endring på konfigurasjonsfilen, slik at den nå ser
slik ut

```nginx {title="/etc/nginx/sites-available/whoogle"}
server {
  server_name whoogle.eirik.re;
  access_log /dev/null;
  error_log /dev/null;

  location / {
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header Host $host;
      proxy_set_header X-NginX-Proxy true;
      # proxy_pass http://localhost:5000;
      proxy_pass http://172.17.0.1:5000;
  }
}
```

Den viktige endringen her er at i stedet for å bruke `localhost`, bruker vi IP-en til
docker-containeren vår. (Jeg prøvde også å bruke begge `proxy_pass`-variablene, men det
fungerer ikke. Du kan bare ha én `proxy_pass`-variabel.) Vi lagrer deretter dette til
`/etc/nginx/sites-available/whoogle` og symlinker det til `sites-enabled` med

```bash {title="Lenk siden til aktiverte sider"}
ln -s /etc/nginx/sites-available/whoogle /etc/nginx/sites-enabled/
```

La oss nå starte Nginx på nytt slik at den er klar over den nye siden vår

```bash {title="Last inn nginx på nytt"}
systemctl reload nginx
```

og deretter kjøre `certbot` for å få sertifikatene våre og få siden til å bruke https

```bash {title="Lag sertifikater for whoogle.eirik.re"}
certbot --nginx
```

La oss nå beundre den store suksessen!

{{< figure caption="Whoogle på desktop!" src="whoogle-desktop.jpg" alt="Whoogle på desktop!" >}}

{{< figure caption="Whoogle på mobil!" src="whoogle-mobile.jpg" alt="Whoogle på mobil!" >}}

## Ressurser

For å få alt til å fungere, var noen guider spesielt nyttige, utover det jeg har lenket
til gjennom innlegget så langt. Denne guiden om
[nginx reverse proxy](https://www.techaddressed.com/tutorials/basic-nginx-reverse-proxy/)
er super nyttig for å forstå hva som skal være i Nginx-konfigurasjonsfilen, og deretter
har samme nettsted en guide om hvordan man
[setter opp whoogle search med docker](https://www.techaddressed.com/tutorials/setup-whoogle-search-docker/).
Likevel, det mest nyttige for meg var kanskje å se
[denne fyren gjøre akkurat dette](https://www.youtube.com/watch?v=aq3mZrDbbYQ), men ved
å bruke GUI-er i stedet for kommandolinjen.
