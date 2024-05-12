---
categories: [Projects]
contributors: ["Eirik Rolland Enger"]
date: 2022-07-16T22:28:16-06:00
description: "Kommandolinjeprogram som varsler om pågående nordly-hendelser, med støtte for telegram-bot"
excerpt: "CLI tool to be notified about northern light events, with support for a telegram bot"
images: ["northern-lights.JPG"]
lastmod: 2024-05-12T12:00:05+0200
lead: "Kommandolinjeprogram som varsler om pågående nordly-hendelser, med støtte for telegram-bot"
tags: [CLI, python, raspberry-pi]
title: "Northern Lights Forecast"
weight: 50
---

<!-- # [Northern Lights Forecast](https://github.com/engeir/northern-lights-forecast) -->

**nlf — Norther Lights Forecast**
[:link:](https://github.com/engeir/northern-lights-forecast) sender varsler til telegram
boten `@NorthernLightsForecastBot` når det oppstår gode muligheter for å se nordlys nært
Tromsø. Selve programmet kan faktisk også sjekke forholdene på en rekke lokasjoner (se
den fullstendige listen ved å kjøre kommandoen `nlf --locations`), men innstansen jeg
kjører på min raspberry pi som oppdaterer telegram boten lytter kun til Tromsø sitt
magnetogram. Installer og kjør din egen versjon av programmet ved å laste ned via `pip`:

```bash
pip install nlf
```

Eller du kan klone git lageret og installere med `poetry`:

```bash
git clone https://github.com/engeir/northern-lights-forecast.git
poetry install
# Install tesseract and create a telegram bot, then run
nlf -l Tromsø
```

<!-- ![nlf bot](https://github.com/engeir/northern-lights-forecast/raw/main/assets/telegram_screendump.gif) -->

<!-- ![nlf qr](nlf-bot.jpg) -->

{{< callout context="note" title="Note" icon="qrcode" >}} Skann QR koden for å gå
direkte til telegramboten! {{< /callout >}}

{{< img src="nlf-bot.jpg" fillImage="778x660 jpg" >}}
