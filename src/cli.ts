import { Command } from 'commander';
import { loadHierarchy, findWordsAtDepth } from './utils/hierarchyUtils';

const program = new Command();

program
  .option('--depth <number>', 'Profundidade da hierarquia')
  .option('--verbose', 'Exibe métricas detalhadas')
  .argument('<phrase>', 'Frase a ser analisada')
  .action(async (phrase, options) => {
    const startTimeLoad = Date.now(); // Inicia o cronômetro para o tempo de carregamento dos parâmetros
    const depth = parseInt(options.depth);
    const hierarchy = await loadHierarchy();
    const endTimeLoad = Date.now(); // Finaliza o cronômetro para o tempo de carregamento dos parâmetros

    console.log('Frase:', phrase);
    console.log('Profundidade:', depth);
    
    const startTimeVerification = Date.now(); // Inicia o cronômetro para o tempo de verificação da frase
    const foundWordsAndGroups = findWordsAtDepth(phrase, depth, hierarchy);
    const endTimeVerification = Date.now(); // Finaliza o cronômetro para o tempo de verificação da frase

    if (Object.keys(foundWordsAndGroups).length > 0) {
      const resultString = Object.entries(foundWordsAndGroups)
        .map(([word, data]) => `${word} = ${data.count}`)
        .join('; ');
      console.log('Palavras encontradas:', resultString);

      // Agrupa as contagens por grupo
      const groupCounts: { [group: string]: number } = {};
      Object.values(foundWordsAndGroups).forEach(data => {
        groupCounts[data.group] = (groupCounts[data.group] || 0) + data.count;
      });

      // Formata a saída do grupo
      const groupString = Object.entries(groupCounts)
        .map(([group, count]) => `${group} = ${count}`)
        .join('; ');
      console.log('Output:', groupString);
    } else {
      console.log('Output: 0');
    }

    if (options.verbose) {
      console.log('Modo verbose ativado');
      console.log(`Tempo de carregamento dos parâmetros: ${endTimeLoad - startTimeLoad}ms`);
      console.log(`Tempo de verificação da frase: ${endTimeVerification - startTimeVerification}ms`);
    }
  });

program.parse(process.argv);