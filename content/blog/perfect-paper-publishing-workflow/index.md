---
title: "Perfect Paper Publishing Workflow"
description: "Get through reviews and publishing with minimal effort"
summary: ""
excerpt: ""
lead: ""
date: 2025-05-02T21:54:25+02:00
lastmod: 2025-05-03T09:28:26+0200
draft: false
weight: 50
images: []
toc: true
categories: []
tags: []
contributors: ["Eirik Rolland Enger"]
pinned: false
homepage: false
seo:
  title: "Perfect Paper Publishing Workflow" # custom title (optional)
  description: "Get through reviews and publishing with minimal effort" # custom description (recommended)
  canonical: "" # custom canonical URL (optional)
  noindex: false # false (default) or true
---

This post takes you through the life cycle of creating a paper manuscript, how two
review rounds, and then finally to finally publish the paper. The guide is
journal-agnostic and editor-agnostic, and should fit any ones need. However, this means
you will have to give up on the auto-compiling you are used to done by your editor, but
trust me this is way better. And besides, you can easily compile just like you are used
to if you really wish, but all that is for later.

## Tech stack

For this guide, we will use a few tools, our dependencies, which are really just one!

- curl
- [git]
- [GitHub]
- [mise]

  - [usage]
  - [tinytex](https://yihui.org/tinytex/)

[mise] is a brilliant piece of software, and is what allows us to really only have one
true dependency in practice; [git] is sort of given and [GitHub] is a website.

### TL;DR

In short, we will use [mise] to install everything, compile all documents, and run CI on
[GitHub]. The CI jobs will also compile everything, giving you the extra comfort of
knowing that it doesn't just _work on my computer_.

[mise]: https://mise.jdx.dev/
[git]: https://git-scm.com/
[github]: https://github.com/
[usage]: https://usage.jdx.dev/
