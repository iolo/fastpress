# fastpress

fast and simple static site generator

## Getting Started

### Install

```console
$ npm i -D @iolo/fastpress
```

### Build

```console
$ npx fastpress build
```

* Watch Changes and Build(expremental)
 
```console
$ npx fastpress watch
```

### preview with local http server

```console
$ npx serve out/
```

see [serve](https://github.com/vercel/serve)

### publish to github pages

```console
$ npx gh-pages -d out/
```

see [gh-pages](https://github.com/tschaub/gh-pages)

### Configuration

```js
module.exports = {
  baseDir: '.', // absolute or relative to config file
  outDir: 'out', // absolute or relative to baseDir
  staticDir: 'static', // absolute or relative to baseDir
  contentDir: 'content', // absolute or relative to baseDir
  layoutDir: 'layout', // absolute or relative to baseDir
  site: {
    url: 'https://iolo.github.io',
    title: 'Iolo\'s Personal Homepage',
    description: 'Ho eyo he hum!',
    image: '/banner.png',
  },
}
```


### Directory Structure

```
+ content/
  - index.md
  + about/
    - index.md
  + posts/
    - index.md
    + slug
      - index.md
  + ...
+ static/
  - favicon.ico
  - style.css
  - script.js
  - logo.png
  - ... 
+ layout/
  - default.ejs
  - page.ejs
  - post.ejs
  - posts.ejs
  - ...
```

### Front Matter

- layout
- title
- date
- tags
- ...

## Custom Layout

...

see [ejs](https://ejs.co/)

---
May the **SOURCE** be with you...
