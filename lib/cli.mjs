#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { initContext, build, watch, createPost } from './index.mjs';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv).then(console.info).catch(console.error);
}

async function main(args) {
  const program = new Command();

  program
    .option('-c, --config-file <string>', 'path to config file');

  program
    .command('build')
    .action(async (opts) => build(await initContext(opts)));

  program
    .command('watch')
    .action(async (opts) => watch(await initContext(opts)));

  program
    .command('createPost')
    .option('-t, --title <string>', 'title of the post')
    .action(async (opts) => createPost(await initContext(opts)));

  await program.parseAsync(args);

  return 'done.';
}
