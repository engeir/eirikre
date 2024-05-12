---
categories: ["Projects"]
contributors: ["Eirik Rolland Enger"]
date: 2022-07-16T22:28:55-06:00
description: "Forhåndsvisning av netCDF filer ved hjelp av Rich"
excerpt: "Forhåndsvisning av netCDF filer ved hjelp av Rich"
homepage: true
images: ['nnn-demo.png']
lastmod: 2024-05-12T11:51:31+0200
lead: "Forhåndsvisning av netCDF filer ved hjelp av Rich"
link: "https://ncdump-rich.readthedocs.io/"
pinned: true
tags: [python, CLI]
title: "Rich NcDump"
weight: 50
---

<!-- # Rich NcDump  -->

**Rich NcDump** er et lager laget for å raskt kunne forhåndsvise `netCDF` filer.
Spesielt nyttig når man kun ønsker informasjon om metadataen, og tilgjengelig via `pip`!

For å installere:

```bash
pip install ncdump-rich
```

eller enda bedre, installer via [`pipx`](https://github.com/pypa/pipx) som vil
installere programmet i et isolert miljø:

```bash
pipx install ncdump-rich
```

Hvis du, som meg, foretrekker å åpne filer fra terminalen, heller enn med Finder,
Nautilus og liknende, så vil denne forhåndsviseren passe perfekt inn i allerede
eksisterende filutforskere som for eksempel [nnn](https://github.com/jarun/nnn) og
[lf](https://github.com/gokcehan/lf).

````bash=10
nc) fifo_pager ncdump-rich -i "$1" ;;
``````

![ncdump-rich-example](https://raw.githubusercontent.com/engeir/ncdump-rich/main/demo/nnn-demo.png)
