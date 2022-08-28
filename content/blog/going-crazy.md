---
title: "Northern Lights Forecast"
date: 2022-07-16T22:28:16-06:00
featured_image: '/images/nlf-telegram-crop.png'
---

# [Northern Lights Forecast](https://github.com/engeir/northern-lights-forecast)

**nlf — Norther Lights Forecast** sends alerts
to the telegram bot `@NorthernLightsForecastBot` whenever
there are good chances of seeing northern lights near Tromsø. The
program itself can actually check the conditions in a number of places
(see the full list by running `nlf --locations`), but the
instance I have running on a raspberry pi that updates telegram is
looking only at Tromsø. Install and run your own version by cloning
and installing with `poetry`:

```bash
git clone https://github.com/engeir/northern-lights-forecast.git
poetry install
# Install tesseract and create a telegram bot, then run
nlf -l Tromsø
```

![nlf-telegram](/images/nlf-telegram-crop.png)
