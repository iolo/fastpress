#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { initContext, build, watch } from './index.mjs';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv).then(console.info).catch(console.error);
}

async function main(args) {
  const program = new Command();

  program
    .option('-c, --config-file <string>', 'path to config file');

  program
    .command('build')
    .action(async () => build(await initContext(program.opts())));

  program
    .command('watch')
    .action(async () => watch(await initContext(program.opts())));

  await program.parseAsync(args);

  return 'done.';
}
