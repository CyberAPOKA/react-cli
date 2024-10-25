import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

/**
 * Carrega a hierarquia de palavras a partir do arquivo JSON localizado em 'dicts/hierarchy.json'.
 * @returns {Promise<any>} Uma promessa que resolve para a estrutura de dados da hierarquia.
 */
const loadHierarchy = async () => {
  const filePath = path.join(__dirname, 'dicts', 'hierarchy.json');
  return await fs.readJson(filePath);
};

const MAX_DEPTH = 4;

/**
 * Encontra as palavras na frase que estão presentes na hierarquia de palavras
 * na profundidade especificada.
 *
 * @param {string} phrase - A frase a ser analisada
 * @param {number} depth - A profundidade na hierarquia a ser analisada
 * @param {any} hierarchy - A hierarquia de palavras
 * @returns {string[]} Um array com as palavras encontradas na frase na profundidade especificada
 */
const findWordsAtDepth = (phrase: string, depth: number, hierarchy: any) => {

  if (depth > MAX_DEPTH) {
    return {};
  }

  /**
  * Converte todo o texto da frase para minusculas, afim de identificar palavras case-insensitive (tigres/Tigres/TIGRES/etc...).
  * Também remove todos os tipos de pontuações, afim de identificar palavras em momentos como "Eu amo tigres, cavalos e gorilas."
  */
  let wordCountsAndGroups: { [word: string]: { count: number, group: string } } = {};
  const sanitizedPhrase = phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  const words = sanitizedPhrase.split(' ');

  /**
   * Função recursiva que percorre a hierarquia de palavras e verifica se as palavras
   * da frase estão presentes na hierarquia na profundidade especificada.
   *
   * @param {any} node - O nó atual da hierarquia
   * @param {number} currentDepth - A profundidade atual na hierarquia
   * @returns {void}
   */
  const searchHierarchy = (node: any, currentDepth: number, group: string) => {
    if (currentDepth === depth) {
      if (Array.isArray(node)) {
        words.forEach(word => {
          if (node.map((w: string) => w.toLowerCase()).includes(word)) {
            if (!wordCountsAndGroups[word]) {
              wordCountsAndGroups[word] = { count: 0, group: group };
            }
            wordCountsAndGroups[word].count += 1;
          }
        });
      } else if (typeof node === 'object') {
        words.forEach(word => {
          if (Object.keys(node).map((key: string) => key.toLowerCase()).includes(word)) {
            if (!wordCountsAndGroups[word]) {
              wordCountsAndGroups[word] = { count: 0, group: group };
            }
            wordCountsAndGroups[word].count += 1;
          }
        });
        Object.entries(node).forEach(([key, childNode]) => {
          if (Array.isArray(childNode)) {
            words.forEach(word => {
              if (childNode.map((w: string) => w.toLowerCase()).includes(word)) {
                if (!wordCountsAndGroups[word]) {
                  wordCountsAndGroups[word] = { count: 0, group: key };
                }
                wordCountsAndGroups[word].count += 1;
              }
            });
          }
        });
      }
    } else {
      if (typeof node === 'object') {
        Object.entries(node).forEach(([key, childNode]) => {
          searchHierarchy(childNode, currentDepth + 1, key);
        });
      }
    }
  };

  searchHierarchy(hierarchy, 1, ''); // Começar a busca pela profundidade 1
  return wordCountsAndGroups; // Retorna o objeto com a contagem das palavras
};

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
      // Formata o resultado para exibir como "palavra = contagem"
      const resultString = Object.entries(foundWordsAndGroups)
        .map(([word, data]) => `${word} = ${data.count}`)
        .join('; ');
      console.log('Palavras encontradas:', resultString);

      // Exibe o grupo correspondente
      const groupString = Object.values(foundWordsAndGroups)
        .map(data => `${data.group} = ${data.count}`)
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
