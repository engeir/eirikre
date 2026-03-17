---
title: "Arbeidsflyt for publisering av artikler"
description: "En hyllest til mise-en-place"
excerpt: "Automatisering av innsendings- og vurderingssyklusen frem mot publiseringer"
lead: "Automatisering av innsendings- og vurderingssyklusen frem mot publiseringer"
date: 2026-02-21T22:16:35+0100
lastmod: 2026-03-17T23:10:27+0100
draft: false
weight: 50
images: ["paper-publishing-workflow.png"]
toc: true
tags: [mise, latex, tinytex, paper]
contributors: ["Eirik Rolland Enger"]
pinned: false
homepage: false
---

> _En hyllest til mise-en-place_

{{<callout context="tip" title="TL;DR" icon="rocket">}}

Installer et nytt prosjekt fra
[paper-publish-process](https://github.com/engeir/paper-publishing-process) med

```bash {frame="none"}
curl -fsSL https://raw.githubusercontent.com/engeir/paper-publishing-process/main/INSTALL.sh | sh
```

- Automatisk kompilering av `main.pdf`, `review-<git-tag>.pdf` og `diff-<git-tag>.pdf`
- Git Tag-basert versjonering og generering av endringslogg
- CI/CD-pipeline med kompilering og nye releaser

{{< video src="compile-all.mp4" loop="true" autoplay="true" muted="true" >}}

{{</callout>}}

En frustrasjon fra da jeg først begynte å skrive artikler som skulle sendes inn til
tidsskrifter og gå gjennom en vurderingssyklus var å kunne holde styr på hvilken versjon
som ble sendt inn til hvilket tidspunkt. Hvilken versjon skal jeg svare på, hvilken
versjon skal den oppdaterte versjonen differensieres mot? Dette var en svært manuell
prosess hvor jobben med å holde styr på hva som skulle sendes inn i nyeste revisjon
tidvis føltes like stor som selve skrivingen.

Heldigvis finnes det løsninger.

## Oppsett av verktøy og repo

Alt skal kunne leve uavhengig av systemet man først utvikler på, så vi lager oss et
Git-repo som alle filene kan leve i. I denne guiden kommer vi til å benytte GitHub sin
workflow i utstrakt grad, så vi [oppretter repoet der](https://github.com/new/). Jeg
kalte min `paper-publishing-process`, så la oss klone det ned:

```bash
git clone git@github.com:engeir/paper-publishing-process.git
cd paper-publishing-process
```

Videre trenger vi å kunne installere alt av programvare, og til det bruker vi
[mise](https://mise.jdx.dev/). Først må vi installere [mise](https://mise.jdx.dev/);
besøk nettsiden, eller kjør følgende kommando:

```bash
curl https://mise.run | sh
```

Deretter oppretter vi fila `mise.toml` i prosjektet sin root:

```toml {title="mise.toml"}
[tools."github:rstudio/tinytex-releases"]
asset_pattern = "TinyTeX-1-*.tar.gz"
bin_path = ".TinyTeX/bin/x86_64-linux"
version = "latest"
[tools]
"github:WGUNDERWOOD/tex-fmt" = "latest"
"github:orhun/git-cliff" = "latest"
hk = "latest"
"pipx:bibfish" = "latest"
pkl = "latest"
```

Denne må vi gi tillatelse til [mise](https://mise.jdx.dev/) til å bruke, `mise trust`,
før vi installerer alt med `mise install`.

I den første commiten la jeg til en enkel lisensfil (MIT) og en `.gitignore` egnet for
TeX-utvikling.

_→ Se commit
[ce3150c](https://github.com/engeir/paper-publishing-process/commit/ce3150c6b25d2bbab7de1bdd98f2be6e64180dd4)._

La oss i samme slengen legge til noen filer som er behjelpelig med å holde repoet opp
til en god standard hva angår formatering:

- `tex-fmt.toml`: Formatering av `.tex` og `.bib`
- `.taplo.toml`: Formatering av `.toml`
- `.yamlfmt.yml`: Formatering av `.yml`
- `hk.pkl`: Formatering og linting

Denne endringen oppdaterer også `mise.toml` og lager fila `tex/main.tex`.

_→ Se commit
[b161e41](https://github.com/engeir/paper-publishing-process/commit/b161e41dc3fe4c10b6abb50f69a71f4d105c143e)._

Vi kan sjekke at alt så langt er som det skal:

```bash
$ git --no-pager reflog
b161e41 (HEAD -> main, origin/main, origin/HEAD) HEAD@{0}: commit: feat(format): first working tex file with formatting
ce3150c HEAD@{1}: commit: build(mise): install basic tools
4dd90d7 HEAD@{2}: clone: from github.com:engeir/paper-publishing-process.git
$ hk check
hk 1.38.0 by @jdx – check  [==========================================] 1/1
✔ files - Fetching modified files (0 files)
✔ bib-filepath

bib-filepath stderr:
[check-bib-filepath] $ #!/usr/bin/env bash
$ hk fix
hk 1.38.0 by @jdx – fix  [============================================] 1/1
✔ files - Fetching modified files (0 files)
✔ bib-filepath

bib-filepath stderr:
[fix-bib-filepath] $ #!/usr/bin/env bash
```

## Automatisk kompilering av TeX

### Lokal kompilering med mise

Vi er nå klare til å jobbe med TeX-filene! Vi ønsker å kunne skrive i `tex/main.tex`, og
hver gang vi lagrer så skal PDF-en oppdateres automatisk. Vi ser igjen til
[mise](https://mise.jdx.dev/) for å få denne funksjonaliteten.

_→ Se commit
[e7127b4](https://github.com/engeir/paper-publishing-process/commit/e7127b4)._

{{< details "Motivasjon for mise tasks" >}}

Vi legger i commiten over til en [mise](https://mise.jdx.dev/) task kalt
"localize-bib-paths". Motivasjonen bak det er at "compile" task (introdusert litt
senere) vil kjøre den slik at når man utvikler lokalt vil alle referanser komme fra den
globale hovedreferansen. Dette er nyttig i tilfeller hvor man ønsker å legge til en ny
referanse i TeX-dokumentet som allerede finnes i hovedreferansen. Om man bruker en
moderne editor vil den gi completion-forslag, noe som ikke vil være tilgjengelig i de
genererte referansefilene for _nye_ referanser.

{{< /details >}}

Vi kan nå kjøre

```bash
$ mise watch main:compile
[Running: /home/eirikre/.local/bin/mise run main:compile]
[main:update-refs] $ bibfish -c 'cite,citet,citep,citeA' -f main.tex .bib main.bib
Traceback (most recent call last):
  File "/home/eirikre/.local/share/mise/installs/pipx-bibfish/0.3.4/bin/bibfish", line 6, in <module>
    sys.exit(cli())
             ~~~^^
```

Den feiler! Dette er grunnet det først, litt spesielle valget vi gjør i denne
arbeidsflyten.

### Bibfish

For å kunne ha så minimale `.bib`-filer som mulig i repoet, blir alle generert fra en
lokal "hovedreferansefil". Denne fila er det `LOCAL_BIB_PATH` verdien som vi la til i
`mise.toml` peker på. Denne hovedreferansen er tiltenkt å være en fil som lever kun
lokalt, og ikke i Git-repoet, og skal kunne levere referanser ikke bare til dette
prosjektet, men til alle dine TeX-prosjekter! Bibfish vil da lese den og generere en
referansefil basert kun på de referansene som finnes i en gitt TeX-fil.

Bibfish støtter de fleste vanlige siteringsformat (for eksempel `\cite`, `\citet`,
osv.), men kan enkelt utvides med egne format. I `mise.toml` har vi lagt til `citeA`, og
spesifiserer også `cite`, `citet` og `citep`
(`bibfish -c 'cite,citet,citep,citeA' -f main.tex {{ env.LOCAL_BIB_PATH }}.bib main.bib`).

La oss fikse feilen fra i stad ved å

1. Legge `mise.local.toml` til i `.gitignore`
2. Spesifisere en lokal Bib-fil i `mise.local.toml`

{{<callout context="caution" title="Lokal bib-fil" icon="alert-triangle">}}

Merk at den lokale fila sin posisjon enten må være "absolutt" (`/home/user/the-file`),
eller "relativ" fra `tex`-mappen, samt at den spesifiseres uten `.bib`.

{{< /callout >}}

Jeg la også til den lokale hovedreferansen her for å illustrere med et minimalt
eksempel, men vanligvis ville jeg lagt den utenfor repoet. Legg også til

```toml {title="mise.local.toml"}
[env]
LOCAL_BIB_PATH = "../main-ref"
```

```bib {title="main-ref.bib"}
@article{enger2025:paper1,
  author = {Enger, Eirik Rolland and Graversen, Rune and Theodorsen, Audun},
  title = {{Saturation in Forcing Efficiency and Temperature Response of Large Volcanic Eruptions}},
  journal = {Journal of Geophysical Research: Atmospheres},
  volume = {130},
  number = {9},
  pages = {e2024JD041098},
  keywords = {super-eruption, AOD, ERF, temperature response},
  doi = {10.1029/2024JD041098},
  url = {https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/2024JD041098},
  eprint = {https://agupubs.onlinelibrary.wiley.com/doi/pdf/10.1029/2024JD041098},
  note = {e2024JD041098 2024JD041098},
  abstract = {Abstract Volcanic eruptions cause climate cooling due to the reflection of solar radiation by emitted and subsequently produced aerosols. The climate effect of an eruption may last for about a decade and is nonlinearly tied to the amount of injected SO2 \${\text{SO}}\_{2}\$ from the eruption. We investigate the climatic effects of volcanic eruptions, ranging from Mt. Pinatubo-sized events to supereruptions. The study is based on ensemble simulations in the Community Earth System Model Version 2 (CESM2) climate model applying the Whole Atmosphere Community Climate Model Version 6 (WACCM6) atmosphere model, using a coupled ocean and fixed sea surface temperature setting. Our analysis focuses on the impact of different levels of SO2 \${\text{SO}}\_{2}\$ injections on stratospheric aerosol optical depth (SAOD), effective radiative forcing (ERF), and global mean surface temperature (GMST) anomalies. We uncover a notable time-dependent decrease in aerosol forcing efficiency (ERF normalized by SAOD) for all eruption SO2 \${\text{SO}}\_{2}\$ levels during the first posteruption year. In addition, it is revealed that the largest eruptions investigated in this study, including several previous supereruption simulations, provide peak ERF anomalies bounded at −65Wm−2 \${-}65\,\mathrm{W}\,{\mathrm{m}}^{-2}\$. Further, a close linear relationship between peak GMST and ERF effectively bounds the GMST anomaly to, at most, approximately −10K \${-}10\,\mathrm{K}\$. This is consistent across several previous studies using different climate models.},
  year = {2025}
}

@article{enger2025:paper2,
  author = {Enger, Eirik Rolland and Graversen, Rune and Theodorsen, Audun},
  title = {{Nonparametric Estimation of Temperature Response to Volcanic Forcing}},
  journal = {Journal of Geophysical Research: Atmospheres},
  volume = {130},
  number = {10},
  pages = {e2024JD042519},
  keywords = {temperature response, super-eruption, radiative forcing, aerosol, AOD, ERF},
  doi = {10.1029/2024JD042519},
  url = {https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/2024JD042519},
  eprint = {https://agupubs.onlinelibrary.wiley.com/doi/pdf/10.1029/2024JD042519},
  note = {e2024JD042519 2024JD042519},
  abstract = {Abstract Large volcanic eruptions strongly influence the internal variability of the climate system. Reliable estimates of the volcanic eruption response as simulated by climate models are needed to reconstruct past climate variability. Yet, the ability of models to represent the response to both single-eruption events and a combination of eruptions remains uncertain. We use the Community Earth System Model version 2 along with the Whole Atmosphere Community Climate Model version 6, known as CESM2(WACCM6), to study the global-mean surface temperature (GMST) response to idealized single volcano eruptions at the equator, ranging in size from Mt. Pinatubo-type events to supereruptions. Additionally, we simulate the GMST response to double-eruption events with eruption separations of a few years. For large idealized eruptions, we demonstrate that double-eruption events separated by 4 years combine linearly in terms of GMST response. In addition, the temporal development is similar across all single volcanic eruptions injecting at least 400 Tg \$\left({\mathrm{S}\mathrm{O}}\_{2}\right)\$ into the atmosphere. Because only a few eruptions in the past millennium occurred within 4 years of a previous eruption, we assume that the historical record can be represented as a superposition of single-eruption events. Hence, we employ a deconvolution method to estimate a nonparametric historical GMST response pulse function for volcanic eruptions, based on climate simulation data from 850 to 1850 taken from a previous study. By applying the estimated GMST response pulse function, we can reconstruct most of the underlying historical GMST signal. Furthermore, the GMST response is significantly perturbed for at least 7 years following eruptions.},
  year = {2025}
}
```

_→ Se commit
[a149cdf](https://github.com/engeir/paper-publishing-process/commit/a149cdf)._

Når vi nå forsøker å kompilere, ingen error!

```bash
$ mise watch main:compile
[Running: /home/eirikre/.local/bin/mise run main:compile]
[main:update-refs] $ bibfish -c 'cite,citet,citep,citeA' -f main.tex ../main-ref.bib main.bib
[main:compile] $ latexmk -pdf -g -f -silent -recorder- main.tex
Rc files read:
  NONE
Latexmk: Run number 1 of rule 'pdflatex'
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
entering extended mode
Latexmk: Getting log file 'main.log'
Latexmk: Using bibtex to make bibliography file(s).

mise WARN  task main:compile did not generate expected output: main.bbl
Finished in 906.8ms
[Command was successful]
^C%
$ ls tex
main.aux  main.bib  main.fdb_latexmk  main.log  main.pdf  main.tex
```

### BBL-filer og referanser i Git

La oss legge til noen referanser.

```tex {title="tex/main.tex",linenos=true,hl_lines=["12-17"],linenostart=1}
\documentclass{article}

\author{Eirik Rolland Enger}
\title{A dead simple paper publishing workflow}

\begin{document}

\maketitle

Hello, World!

\section{Adding references}

See \cite{enger2025:paper1}.

\bibliographystyle{plain}
\bibliography{../main-ref}

\end{document}
```

Vi lager oss også en generell `compile`-task i [mise](https://mise.jdx.dev/):

```toml {title="mise.toml",linenos=true,hl_lines=["16-19"],linenostart=13}
[env]
LOCAL_BIB_PATH = "" # override in mise.local.toml with your personal global bib path

[tasks.compile]
description = "Compile all documents for local development."
dir = "{{ config_root }}/tex/"
run = [{ task = "localize-bib-paths" }, { task = "*:compile" }]

[tasks."main:compile"]
depends = ["main:*"]
```

Når vi nå kjører `mise watch compile` vil en ny fil bli generert: `tex/main.bbl`. Denne
er det vanlig å ignorere, men vi tenger denne i fremtiden, så vi fjerner den fra
`.gitignore`.

Den inneholder en ny `.bbl`-fil, og `.bib`-fila har blitt oppdatert med én (og bare én)
referanse, nemlig den vi la til i `tex/main.tex`!

_→ Se commit
[1a523ea](https://github.com/engeir/paper-publishing-process/commit/1a523ea)._

### Håndtering av TeX-pakker med tlmgr

Vi bruker [tinytex](https://yihui.org/tinytex/) som TeX-distribusjon i dette prosjektet.
Den er som navnet antyder mye mindre enn den vanligere TeX-live/TeX-live-full. Det betyr
også at vi litt oftere vil oppleve at pakker ikke er tilgjengelige, men det gir oss til
gjengjeld mer kontroll. La oss bruke et knippe pakker som ikke er å finne i TinyTeX.

_→ Se commit
[fe28c24](https://github.com/engeir/paper-publishing-process/commit/fe28c24) for
oppdatert `tex/main.tex` og `mise.toml`._

Om du først endrer `tex/main.tex` med innholdet i commiten over og har
`mise watch compile` kjørende burde den feile, og klage på at `underscore` ikke er
tilgjengelig. Legg så til `postinstall`-hook i `mise.toml`, og kjør `mise install`.

Dette vil sørge for at diverse pakker installeres via `tlmgr`. Fordelen med dette
oppsettet er at mange tidsskrifter er veldig kresne på hvilke pakker de aksepterer. Om
man da har skrevet et langt manuskript som benytter mange pakker og som kompilerer fint
lokalt fordi man har brukt TeX-live-full, kan det fort bli vanskelig å finne ut av hva
som må bort om kompilering på tidsskriftet sin server krasjer.

### Arbeidsflyt for lokal utvikling

Vi er nå i mål med arbeidsflyten for lokale TeX-filer! Kjør `mise watch compile`, skriv
ned alle dine gode ideer, og hver gang `tex/main.tex` lagres vil kompileringen kjøre.
Legg merke til hvordan `tex/main.bib` oppdateres i terminalvinduet øverst til høyre når
jeg legger til og fjerner referanser.

{{< video src="compile.mp4" loop="true" autoplay="true" muted="true" >}}

Neste steg: automatisk kompilering på GitHub, støtte for versjonering via Git og rutiner
for svar til tilbakemelding fra tidsskrifter.

## CI/CD-pipeline på GitHub

### Git commit hooks

Siden vi har verktøy for å formatere koden samt et fungerende [hk](https://hk.jdx.dev/)
oppsett, kan vi enkelt sette opp Git commit hooks:

```bash
hk install
```

{{<callout context="danger" title="Pre-commit vs. mise run compile" icon="alert-octagon">}}

Siden `mise run|watch compile` gjør alle `\bibliography{...}` om til å bruke den lokale
hovedreferansen, mens pre-commit hooken via `hk` gjør de om til å bruke de genererte
bib-filene vil det oppstå konflikt mellom de.

Hver gang man lager en commit er det derfor lurt å stoppe `mise watch compile`, slik at
den ikke skriver over før man er ferdig med commiten.

{{< /callout >}}

### Automatisk bygging og release

For å sette opp CI/CD lager vi fila `mise.ci.toml`, samt tre filer i `.github/workflows`
og `.mise/tasks`:

- `.github/workflows/build.yml`

  Kompilerer alle PDF-er for hver push til main-grenen på GitHub.

- `.github/workflows/fix-bib-filepath.yml`

  En ekstra sjekk som sørger for at rett bib-fil benyttes til å kompilere PDF-ene.

- `.mise/tasks/package`

  Legger alle filer som et tidsskrift ønsker i et arkiv, for enkel opplasting ved
  innsendelse.

_→ Se commit
[93c8487](https://github.com/engeir/paper-publishing-process/commit/93c8487) for
innholdet i filene._

Den commiten feilet faktisk i CI på GitHub. Her hadde jeg altså glemt at alle filer i
`.mise/tasks` må være kjørbare (executable bit), det vil si jeg måtte

```bash
chmod +x .mise/tasks/package
```

Jeg endret også på hvordan TinyTeX blir installert, og la til oppdatering av `tlmgr` i
postinstall hook.

_→ Se commit
[06262fd](https://github.com/engeir/paper-publishing-process/commit/06262fd)._

Under ser vi at CI/CD kjørte uten error og ga oss en `paper-assets` artefakt.

{{<figure src="first-ci.png" alt="Første CI/CD-kjøring" caption="Første CI/CD-kjøring" >}}

## Versjonering og svar til tidsskrift

Vi er nå nesten klare til å sende manuskriptet inn til et tidsskrift, men aller først
skal vi sette opp versjonering i Git som genererer nye utgivelser med endringslogg.
[Git-Cliff](https://git-cliff.org/) er et veldig fleksibelt og kraftfullt verktøy til
nettopp dette, og vi konfigurerer den med `cliff.toml`. Denne fila er helt generell, med
unntak av de siste to linjene, som vist under. De indikerer eier av repoet og navnet på
repoet.

```toml {title="cliff.toml",linenos=true,linenostart=107}
# limit_commits = 42

[remote.github]
owner = "engeir"
repo = "paper-publishing-process"
```

Vi kan nå sette en Git Tag på siste commit for å lage vår første versjon av
manuskriptet!

_→ Se commit
[bfe67c6](https://github.com/engeir/paper-publishing-process/commit/bfe67c6)._

```bash
$ git tag -a v1.0.0 -m "**Release v1.0.0**" -m 'First release!'
$ git push --tags
hk 1.38.0 by @jdx – pre-push – check  [=======================================================] 1/1
✔ files - Fetching files between refs/remotes/origin/main and HEAD (0 files)
✔ bib-filepath

bib-filepath stderr:
[check-bib-filepath] $ #!/usr/bin/env bash
Enumerating objects: 1, done.
Counting objects: 100% (1/1), done.
Writing objects: 100% (1/1), 189 bytes | 189.00 KiB/s, done.
Total 1 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
To github.com:engeir/paper-publishing-process.git
 * [new tag]         v1.0.0 -> v1.0.0
```

Og der har vi den, vår
[første release](https://github.com/engeir/paper-publishing-process/releases/tag/v1.0.0)!
Den fikk navn ut fra det vi tagget i Git Tag (`v1.0.0`), en tag som er helt vilkårlig,
men som i dette tilfellet følger SemVer-standarden. Vi kunne like gjerne benyttet CalVer
(f.eks. `vYYYY.MM.P`) `v2026.03.0`, eller noe helt egendefinert som `rel1`. Vi kan
tilogmed bytte standard; neste versjon kan helt fint følge CalVer selv om vi i første
release brukte SemVer. Så lenge du holder deg til en fast standard, bruk hva enn som
føles mest naturlig.

{{<figure src="first-release.png" alt="Første release" caption="Første release" >}}

Som et vedlegg (artefakt) til releasen har vi både `paper.zip` og `main.pdf`. Arkivet
`paper.zip` inneholder alle filer spesifisert i `.mise/tasks/package`, og mer spesifikt
i Bash-arrayet `files`. Her er det nyttig å legge til alle filer som trengs for å
_generere_ PDF-en, slik at, ved opplasting til tidsskriftet, kan man enkelt plukke ut
alle filene fra arkivet og laste opp, i stedet for å lete gjennom repoet etter alle
filer man trenger.

{{< details "Om Git Tag innhold" >}}

I `git tag`-kommandoen anga vi `-a` flagget (annotation), og to `-m` flagg. De står for
message, men blir ikke del i release teksten som vi ser i bildet over, siden det
genereres av Git-Cliff. Den vil dog være synlig i Git Tags, se
[Tags](https://github.com/engeir/paper-publishing-process/tags).

{{< /details >}}

## Review-syklus og revisjon

### Motta og sette opp revisjon

Selv om vi var aldri så fornøyd med manuskriptet får vi sannsynligvis tilbake en review
og forespørsel om å forbedre enkelte passasjer. Det er nå den gode jobben vi har lagt
ned i Git og versjonering virkelig kommer til syne.

Vi lager oss en siste [mise](https://mise.jdx.dev/) task: `.mise/tasks/setup-revision`.
_→ Se commit
[b490542](https://github.com/engeir/paper-publishing-process/commit/b490542) (legger
også til `diff*.tex`-filer i `.github/workflows/build.yml`)._

La oss teste den:

```bash
$ mise run setup-revision
[setup-revision] $ ~/projects/paper-publishing-process/.mise/tasks/setup-revision
Setting up revision against v1.0.0...
Working on  main.tex
Checking out old dir into: /tmp/01jqEMnfHT/latexdiff-vc-v1.0.0 (rev: v1.0.0)
Running: latexdiff  '--flatten' "/tmp/01jqEMnfHT/latexdiff-vc-v1.0.0/main.tex" "main.tex" > "main-diffv1.0.0.tex"
Generated difference file main-diffv1.0.0.tex

Created:
  tex/diff-v1.0.0.tex   (latexdiff vs v1.0.0)
  tex/review-v1.0.0.tex (review response skeleton using reviewresponse class)
  .mise/tasks/review-v1.0.0/update-refs
  .mise/tasks/review-v1.0.0/compile
  .mise/tasks/diff-v1.0.0/create
  .mise/tasks/diff-v1.0.0/compile

Next: edit review-v1.0.0.tex, then  mise run compile
```

Hele seks nye filer ble generert! Dette inkluderer to TeX-filer som skal fungere som
svar til reviewerne og differanse mellom forrige Git Tag og det nye manuskriptet, samt
fire Mise task-filer som skal kompilere de to TeX-filene. Disse avhenger av noe TeX-kode
som vi også legger til:

- `tex/reviewresponse.cls`: klassen som review-dokumentene bruker
- `tex/reviewresponse-extra.sty`: ekstra TeX-kode som setter opp formatering i
  review-dokumentene

{{<callout context="note" title="Feil Git Tag" icon="bulb">}}

Om du på et tidspunkt tenker at du er klar til å sende inn manuskriptet og lager en Git
Tag mot siste commit, men så senere innser at du trenger å gjøre ytterligere endringer
kan man enkelt flytte eller slette Git Tags. Hvis man ikke flytter en feilplassert Git
Tag vil ikke `setup-revision` tasken fungere som forventet, siden den da sammenligner
nåværende `main.tex` med en Git Tag som peker mot filer som aldri ble sendt inn til
tidsskriftet.

Git Tags kan slettes med `git tag --delete <git-tag>`, og festes på en spesifikk commit
med `git tag -a <git-tag> <commit-hash> -m "Message"`.

{{</callout>}}

La oss nå kjøre `mise watch compile`!

{{< video src="compile-all.mp4" loop="true" autoplay="true" muted="true" >}}

Ok, hva foregår egentlig i videoen? Videoen starter rett etter at jeg har kjørt
`mise run setup-revision` som genererer de seks filene for "diff" og "review". Først i
videoen kjøres så `mise watch compile`, som så går i bakgrunnen gjennom hele videoen.
Denne ene kommandoen kompilerer `main.pdf`, `review-v1.0.0.pdf` og `diff-v1.0.0.pdf`,
samt at den følger med på endringer. Deretter åpner vi `diff-v1.0.0.pdf` og
`review-v1.0.0.pdf`, før vi gjør en endring i `main.tex`. Endringen blir umiddelbart
synlig i `main.pdf` og `diff-v1.0.0.pdf`. Til slutt gjør vi en endring i
`review-v1.0.0.tex`, som like umiddelbart blir synlig i `review-v1.0.0.pdf`.

Differansen mellom den nye `main.tex`/`main.pdf` og den vi sendte inn i versjon `v1.0.0`
kan vi enkelt generere uten at filen eksisterer lokalt. Siden vi har en Git Tag
refererer vi bare til den, og sammenligner med fila på det tidspunktet i Git-historien.
Det er i dette steget vi er avhengige av `.bbl`-filene, som inneholder den kompilerte
(eksakte) bibliografien som ble brukt til å generere PDF-ene. Dette gjøres i de
genererte `create`-taskene med kommandoen

```bash
latexdiff-vc --force --git --flatten -r <git-tag> main.tex
```

_→ Se commit
[68d913f](https://github.com/engeir/paper-publishing-process/commit/68d913f) for de nye
filene._

### Sende inn revidert manuskript

La oss si at vi nå er fornøyd med våre siste endringer og er klare til å sende inn på
nytt til tidsskriftet. Da setter vi igjen en Git Tag på siste commit, dytter den opp og
venter på at siste versjon skal gjøres klar for oss i et pent format.

Siden jeg personlig liker CalVer i denne sammenhengen bytter jeg til det nå:

```bash
$ git tag -a v2026.3.0 -m "**Release v2026.03.0**" -m 'Answer.'
$ git push --tags
hk 1.38.0 by @jdx – pre-push – check  [=======================================================] 1/1
✔ files - Fetching files between refs/remotes/origin/main and HEAD (0 files)
✔ bib-filepath

bib-filepath stderr:
[check-bib-filepath] $ #!/usr/bin/env bash
Enumerating objects: 1, done.
Counting objects: 100% (1/1), done.
Writing objects: 100% (1/1), 189 bytes | 189.00 KiB/s, done.
Total 1 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
To github.com:engeir/paper-publishing-process.git
 * [new tag]         v2026.3.0 -> v2026.3.0
```

{{<figure src="second-release.png" alt="Andre release, med arkiv (paper.zip) og de tre PDF-ene" caption="Andre release, med arkiv (paper.zip) og de tre PDF-ene" >}}

Om vi nå får nye runder med endringer fra reviewerne, gjør vi bare det samme på nytt:

1. `mise run setup-revision`
2. `mise watch compile`: Gjør alle endringer på `main.tex` og `review-<git-tag>.tex` som
   vi mener er nødvendig
3. `git commit ...`
4. `git tag -a '...' -m '...'`
5. `git push --tags`

{{<details "En gang til">}}

Her er for eksempel output fra `mise run setup-revision` nå etter at jeg har laget
`v2026.03.0`:

```bash
$ mise run setup-revision
[setup-revision] $ ~/projects/paper-publishing-process/.mise/tasks/setup-revision
Setting up revision against v2026.3.0...
Working on  main.tex
Checking out old dir into: /tmp/UxG9Yg13w5/latexdiff-vc-v2026.3.0 (rev: v2026.3.0)
Running: latexdiff  '--flatten' "/tmp/UxG9Yg13w5/latexdiff-vc-v2026.3.0/main.tex" "main.tex" > "main-diffv2026.3.0.tex"
Generated difference file main-diffv2026.3.0.tex

Created:
  tex/diff-v2026.3.0.tex   (latexdiff vs v2026.3.0)
  tex/review-v2026.3.0.tex (review response skeleton using reviewresponse class)
  .mise/tasks/review-v2026.3.0/update-refs
  .mise/tasks/review-v2026.3.0/compile
  .mise/tasks/diff-v2026.3.0/create
  .mise/tasks/diff-v2026.3.0/compile

Next: edit review-v2026.3.0.tex, then  mise run compile
```

Og videre `mise run compile`. Legg merke til
`review-v1.0.0: skipping, newer revision exists`, og tilsvarende for "diff". Ingenting
kompileres om ikke det virkelig er nødvendig!

```bash
$ mise run compile
[localize-bib-paths] $ #!/usr/bin/env bash
[main:update-refs] $ bibfish -c 'cite,citet,citep,citeA' -f main.tex ../main-ref.bib main.bib
[review-v1.0.0:update-refs] $ ~/projects/paper-publishing-process/.mise/tasks/review-v1.0.0/update…
[review-v2026.3.0:update-refs] $ ~/projects/paper-publishing-process/.mise/tasks/review-v2026.3.0/…
[diff-v1.0.0:create] $ ~/projects/paper-publishing-process/.mise/tasks/diff-v1.0.0/create
review-v1.0.0: skipping, newer revision exists
[diff-v2026.3.0:create] $ ~/projects/paper-publishing-process/.mise/tasks/diff-v2026.3.0/create
diff-v1.0.0: skipping, newer revision exists
[review-v1.0.0:compile] $ ~/projects/paper-publishing-process/.mise/tasks/review-v1.0.0/compile
[diff-v1.0.0:compile] $ ~/projects/paper-publishing-process/.mise/tasks/diff-v1.0.0/compile
review-v1.0.0: skipping, newer revision exists
diff-v1.0.0: skipping, newer revision exists
Working on  main.tex
Checking out old dir into: /tmp/jXriCzZY0z/latexdiff-vc-v2026.3.0 (rev: v2026.3.0)
Running: latexdiff  '--flatten' "/tmp/jXriCzZY0z/latexdiff-vc-v2026.3.0/main.tex" "main.tex" > "main-diffv2026.3.0.tex"
Generated difference file main-diffv2026.3.0.tex
[main:compile] $ latexmk -pdf -g -f -silent -recorder- main.tex
[review-v2026.3.0:compile] $ ~/projects/paper-publishing-process/.mise/tasks/review-v2026.3.0/comp…
[diff-v2026.3.0:compile] $ ~/projects/paper-publishing-process/.mise/tasks/diff-v2026.3.0/compile
Rc files read:
  NONE
Latexmk: Run number 1 of rule 'bibtex main'
Rc files read:
  NONE
Latexmk: Run number 1 of rule 'pdflatex'
Rc files read:
  NONE
Latexmk: Run number 1 of rule 'pdflatex'
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
Latexmk: Run number 1 of rule 'pdflatex'
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
entering extended mode
entering extended mode
entering extended mode
Latexmk: Getting log file 'main.log'
Latexmk: Using bibtex to make bibliography file(s).
  ===Source file 'main.bbl' for 'pdflatex'
Latexmk: Getting log file 'diff-v2026.3.0.log'

Latexmk: Using bibtex to make bibliography file(s).
Latexmk: Run number 2 of rule 'pdflatex'
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
entering extended mode
Latexmk: Getting log file 'diff-v2026.3.0.log'
Latexmk: Using bibtex to make bibliography file(s).

Latexmk: Getting log file 'review-v2026.3.0.log'
Latexmk: Missing bbl file 'review-v2026.3.0.bbl' in following:
 No file review-v2026.3.0.bbl.
Latexmk: Using bibtex to make bibliography file(s).
  ===Source file 'review-v2026.3.0.bbl' for 'pdflatex'
Create bibtex review-v2026.3.0
Latexmk: Run number 1 of rule 'bibtex review-v2026.3.0'
Latexmk: Run number 2 of rule 'pdflatex'
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
entering extended mode
Latexmk: Getting log file 'review-v2026.3.0.log'
Latexmk: Using bibtex to make bibliography file(s).
  ===Source file 'review-v2026.3.0.bbl' for 'pdflatex'
Latexmk: Run number 2 of rule 'bibtex review-v2026.3.0'
Latexmk: Run number 3 of rule 'pdflatex'
This is pdfTeX, Version 3.141592653-2.6-1.40.29 (TeX Live 2026) (preloaded format=pdflatex)
 restricted \write18 enabled.
entering extended mode
Latexmk: Getting log file 'review-v2026.3.0.log'
Latexmk: Using bibtex to make bibliography file(s).
  ===Source file 'review-v2026.3.0.bbl' for 'pdflatex'
```

Og slik ser
[siste release](https://github.com/engeir/paper-publishing-process/releases/tag/v2026.3.1)
ut etter at de siste nødvendige endringene ble gjort, klar til å publiseres!

{{</details>}}

## Klargjøring og README

Repoet fungerer nå fullt og helt til å både enkelt klargjøre et manuskript for
innsendelse, og til å lage svar og differanse/endringsdokument på eventuelle reviewer.

Men for å gjøre selve repoet litt mer innbydende er det god praksis å også lage en
README-fil. Med alle releasene vi har laget og artefaktene til de er det enkelt å linke
til filer på ulike stadier av prosessen.

```markdown
# Paper publishing process

Please see the
[release page](https://github.com/engeir/paper-publishing-process/releases) for the
latest version of the manuscript and the generated PDF.

> [!TIP]
>
> Download the latest release of the manuscript
> [here](https://github.com/engeir/paper-publishing-process/releases/latest/download/main.pdf).
>
> If you want to see the manuscript at the latest commit, download the artefact of the
> last
> [workflow action](https://github.com/engeir/paper-publishing-process/actions/workflows/release.yml).

## More

### Review 1

> All relevant files used for the reply in review 1 can be found in the
> [artefacts of v2026.3.0](https://github.com/engeir/paper-publishing-process/releases/tag/v2026.3.0).

- The paper as it was sent in before review 1 is provided as
  [main.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v1.0.0/main.pdf)
  in v1.0.0, while the current manuscript is available as
  [main.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.0/main.pdf).
- The reply to review 1 is provided as
  [review-v1.0.0.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.0/review-v1.0.0.pdf),
  and as part of the
  [latest artefact](https://github.com/engeir/paper-publishing-process/actions/workflows/release.yml?query=branch%3Amain).
- The difference file for review 1 is provided as
  [diff-v1.0.0.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.0/diff-v1.0.0.pdf),
  and as part of the
  [latest artefact](https://github.com/engeir/paper-publishing-process/actions/workflows/release.yml?query=branch%3Amain).

### Review 2

> All relevant files used for the reply in review 1 can be found in the
> [artefacts of v2026.3.1](https://github.com/engeir/paper-publishing-process/releases/tag/v2026.3.1).

- The paper as it was sent in before review 2 is provided as
  [main.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.0/main.pdf)
  in v2026.3.0, while the current manuscript is available as
  [main.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.1/main.pdf).
- The reply to review 2 is provided as
  [review-v2026.3.0.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.1/review-v2026.3.0.pdf),
  and as part of the
  [latest artefact](https://github.com/engeir/paper-publishing-process/actions/workflows/release.yml?query=branch%3Amain).
- The difference file for review 2 is provided as
  [diff-v2026.3.0.pdf](https://github.com/engeir/paper-publishing-process/releases/download/v2026.3.1/diff-v2026.3.0.pdf),
  or as part of the
  [latest artefact](https://github.com/engeir/paper-publishing-process/actions/workflows/release.yml?query=branch%3Amain).
```

_→ Se commit
[b3cbc9d](https://github.com/engeir/paper-publishing-process/commit/b3cbc9d) for
endringene gjort i `README.md`._

## Videre utvidelser

### Endringslogg

Vi har allerede satt opp en hel del automasjon, men vi kan selvfølgelig fortsette enda
lenger. Git-Cliff kan settes opp til å skrive til en fil, typisk kalt `CHANGELOG.md`,
som i tillegg til at man har endringer mellom versjoner i hver release, så står hele
endringsloggen i den fila.

### PR-basert versjonering

Man kan også sette opp PR-basert (pull request) versjonering som benytter
[Conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) til å automatisk
generere nye forslag til releaser. Dette krever en litt større endring i konfigurasjonen
i GitHub CI/CD.

### Sikker versjonering av GitHub Actions

Som du kanskje har lagt merke til så er alle actions brukt i GitHub workflow spesifisert
med en lang hash, etterfulgt av en kommentar som beskriver hvilken versjon den peker på.
Dette er god praksis fordi, som så vidt nevnt tidligere, Git Tags er "mutable"; de kan
forandres og flyttes på. Dette gjør de til en potensiell angrepsflate, og det er derfor
tryggere å spesifisere commit hash, siden den er "immutable", uforanderlig.

For å enkelt holde seg oppdatert med de siste versjonene kan man bruke
[pinact-action](https://github.com/suzuki-shunsuke/pinact-action), men denne vil trenge
en TOKEN med rettigheter til å skrive til `.github/workflows`-filene.

### Enda mer mise-magi

Vi har allerede etablert at mise-en-place er en strålende programvare, og den kan gjøre
enda litt mer. Tre kommandoer som er nyttige for å ha et repo som både er lett å sette
opp, og har en veldokumentert flyt kan man kjøre

```bash
mise lock
mise generate bootstrap >MISE_BOOTSTRAP.sh
mise generate task-docs >TASKS.md
```

Den første kommandoen skriver en fil med låste versjoner som er tilpasset installasjon
til alle vanlige plattformer. Andre kommando genererer et shell-skript som installerer
samme versjon av mise-en-place som er i bruk, mens den siste kommandoen genererer
dokumentasjon for alle tasks som er definert med mise-en-place.

_→ Se commit
[9c1fb30](https://github.com/engeir/paper-publishing-process/commit/9c1fb30) for filer
som legger til funksjonalitet for
[versjonering av actions](#sikker-versjonering-av-github-actions) og
[mise bootstraping](#enda-mer-mise-magi)._

<!--
vi: spelllang=nb
-->
