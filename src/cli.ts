import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

program
  .option('--depth <number>', 'Profundidade da hierarquia')
  .option('--verbose', 'Exibe métricas detalhadas')
  .argument('<phrase>', 'Frase a ser analisada')
  .action((phrase, options) => {
    console.log('Frase:', phrase);
    console.log('Profundidade:', options.depth);
    if (options.verbose) {
      console.log('Modo verbose ativado');
    }
  });

program.parse(process.argv);