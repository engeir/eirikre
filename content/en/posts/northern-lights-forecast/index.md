---
categories: [Projects]
contributors: ["Eirik Rolland Enger"]
date: 2022-07-16T22:28:16-06:00
description: "Introducing Doks, a Hugo theme helping you build modern documentation websites that are secure, fast, and SEO-ready by default."
excerpt: "CLI tool that notifies about northern light events, with support for a telegram bot"
images: ["northern-lights.JPG"]
lastmod: 2020-11-04T09:19:42+01:00
lead: "Introducing Doks, a Hyas theme build by the creator of Hyas. Doks helps you build modern documentation websites that are secure, fast, and SEO-ready by default."
tags: [CLI, python, raspberry-pi]
title: "Northern Lights Forecast"
weight: 50
---

<!-- # [Northern Lights Forecast](https://github.com/engeir/northern-lights-forecast) -->

**nlf — Norther Lights Forecast**
[:link:](https://github.com/engeir/northern-lights-forecast) sends alerts to the
telegram bot `@NorthernLightsForecastBot` whenever there are good chances of seeing
northern lights near Tromsø. The program itself can actually check the conditions in a
number of places (see the full list by running `nlf --locations`), but the instance I
have running on a raspberry pi that updates telegram is looking only at Tromsø. Install
and run your own version by cloning and installing with `poetry`:

```bash
git clone https://github.com/engeir/northern-lights-forecast.git
poetry install
# Install tesseract and create a telegram bot, then run
nlf -l Tromsø
```

![nlf bot](https://github.com/engeir/northern-lights-forecast/raw/main/assets/telegram_screendump.gif)

<!-- ![nlf qr](nlf-bot.jpg) -->

{{< alert icon="📷" context="info" text="Scan the QR code to get directly to the telegram bot!" />}}

{{<img-simple src="nlf-bot.jpg" class="border-0 rounded-circle" >}}
