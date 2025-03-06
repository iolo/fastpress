const fsp = require('fs/promises');
const path = require('path');
const ejs = require('ejs');
const { marked } = require('marked');
const sass = require('sass');
const frontMatter = require('front-matter');

const DEF_CONFIG_FILE = './config.js';
const DEF_CONFIG = {
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
};

function log(...args) {
  console.log(...args);
}

async function mkdirp(dir) {
  try {
    return await fsp.mkdir(dir, { recursive: true });
  } catch(e) {
    console.error(e);
  }
}

async function initContext(opts) {
  const configFile = path.resolve(process.cwd(), opts.configFile ?? DEF_CONFIG_FILE);
  const config = await loadConfig(configFile);
  console.log('------------');
  console.log(config);
  console.log('------------');

  const baseDir = path.resolve(path.dirname(configFile), config.baseDir);
  const outDir = path.resolve(baseDir, config.outDir);
  const staticDir = path.resolve(baseDir, config.staticDir);
  const contentDir = path.resolve(baseDir, config.contentDir);
  const layoutDir = path.resolve(baseDir, config.layoutDir);

  return { ...config, outDir, staticDir, contentDir, layoutDir };
}

async function loadConfig(configFile) {
  log(`loadConfig: ${configFile}`);
  try {
    return { ...DEF_CONFIG, ...require(configFile) };
  } catch(e) {
    return DEF_CONFIG;
  }
}

async function build(context) {
  const { baseDir, outDir, staticDir, contentDir } = context;

  log(`build: ${baseDir} -> ${outDir}`);

  await cleanOutput(outDir);
  await copyAssets(staticDir, outDir);
  await renderPages(contentDir, outDir, context);
}

async function watch(context) {
  const { contentDir } = context;

  log(`watch: ${contentDir}`);
  const watcher = await fsp.watch(contentDir, { recursive: true });
  for await (const event of watcher) {
    log('\twatch: ', event);
    // TODO: process the modified file only
    await build(context);
  }
}

async function cleanOutput(outDir) {
  log(`clean out: ${outDir}`);
  //await fsp.rm(outDir, { recursive: true });
  mkdirp(outDir);
}

async function copyAssets(staticDir, outDir) {
  log(`copy assets: ${staticDir} -> ${outDir}`);
  await fsp.cp(staticDir, outDir, { recursive: true });
}

async function renderPages(contentDir, outDir, context) {
  log(`renderPages: ${contentDir} -> ${outDir}`);
  const pageFiles = await collectFiles(contentDir);
  context.posts = [];
  context.pages = [];
  context.tags = {};
  for (const pageFile of pageFiles) {
    const page = await renderPage(pageFile);
    page.file = pageFile;
    const { dir, name, ext } = path.parse(pageFile);
    page.outDir = path.join(outDir, dir.substring(contentDir.length));
    page.outFile = path.format({
      dir: page.outDir,
      name,
      ext: page.ext || '.html',
    });
    if (!page.outFile.endsWith('.html')) {
      await mkdirp(page.outDir);
      console.log('non html file:', page.outFile);
      await fsp.writeFile(page.outFile, page.main, 'utf8');
      continue;
    }
    context.pages.push(page);
    if (!page.date) {
      const TIMESTAMP_REGEXP = /(\d{4})-(\d{2})-(\d{2})/;
      const m = TIMESTAMP_REGEXP.exec(name) || TIMESTAMP_REGEXP.exec(dir);
      if (m) {
        page.date = new Date(m[1], m[2], m[3]);
      } else {
        page.date = new Date((await fsp.stat(pageFile)).ctime);
      }
    }
    if (!page.layout) {
      if (/[\/\\]posts$/.test(dir) && name !== 'index') {
        page.layout = 'post';
      } else {
        page.layout = 'page';
      }
    }
    if (page.layout === 'post') {
      context.posts.push(page);
    }
    if (page.tags) {
      for (const tag of page.tags) {
        if (!context.tags[tag]) {
          context.tags[tag] = [];
        }
        context.tags[tag].push(page);
      }
    }
    if (!page.url) {
      const pageUrlPath = path.relative(outDir, (name === 'index') ? page.outDir : page.outFile);
      page.path = `/${pageUrlPath}`;
      page.url = `${context.site.url}/${pageUrlPath}`;
    }
  }
  for (const page of context.pages) {
    log(`${page.file} + ${page.layout} -> ${page.outFile}`);

    const html = await ejs.renderFile(path.join(context.layoutDir, 'default.ejs'), { ...context, page });

    await mkdirp(page.outDir);
    await fsp.writeFile(page.outFile, html, 'utf8');
  }
}

async function renderPage(pageFile) {
  const ext = path.extname(pageFile);
  log(`renderPage: ${pageFile}`);
  const content = await fsp.readFile(pageFile, 'utf8');
  switch (ext) {
    case '.ejs':
    case '.html':
    case '.htm':
      return renderEjsPage(content);
    case '.md':
    case '.markdown':
      return renderMarkdownPage(content);
    case '.sass':
    case '.scss':
      return renderSassPage(content);
  }
  return {};
}

async function renderEjsPage(content) {
  return { main: ejs.render(content) };
}

async function renderMarkdownPage(content) {
  const { body, attributes } = frontMatter(content);
  return { ...attributes, main: marked.parse(body) }
}

async function renderSassPage(content) {
  return { main: sass.compileString(content).css, ext: '.css' };
}

async function collectFiles(parent) {
  const result = [];
  const dir = await fsp.opendir(parent);
  for await (const dirent of dir) {
    const child = path.join(parent, dirent.name);
    if (dirent.isDirectory()) {
      result.push(...await collectFiles(child));
    } else {
      result.push(child);
    }
  }
  return result;
}

module.exports = { initContext, build, watch };
