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
  /**
   * Converte todo o texto da frase para minusculas, afim de identificar palavras case-insensitive (tigres/Tigres/TIGRES/etc...).
   */
  const words = phrase.toLowerCase().split(' ');
  let results: string[] = [];

  /**
   * Fun o recursiva que percorre a hierarquia de palavras e verifica se as palavras
   * da frase est o presentes na hierarquia na profundidade especificada.
   *
   * @param {any} node - O nº atual da hierarquia
   * @param {number} currentDepth - A profundidade atual na hierarquia
   * @returns {void}
   */
  const searchHierarchy = (node: any, currentDepth: number) => {
    if (currentDepth === depth) {
      // Verifica se esta na profundidade correta
      if (Array.isArray(node)) {
        // Se o nó atual é um array, verifica se contém alguma das palavras
        words.forEach(word => {
          if (node.map((w: string) => w.toLowerCase()).includes(word)) {
            results.push(word);
          }
        });
      } else if (typeof node === 'object') {
        // Se o nó é um objeto, verifica as chaves e valores
        words.forEach(word => {
          if (Object.keys(node).map((key: string) => key.toLowerCase()).includes(word)) {
            results.push(word);  // Se a palavra é uma chave, adiciona ao resultado
          }
        });
        Object.values(node).forEach(childNode => {
          if (Array.isArray(childNode)) {
            // Se encontrar um array, verifica as palavras no array
            words.forEach(word => {
              if (childNode.map((w: string) => w.toLowerCase()).includes(word)) {
                results.push(word);
              }
            });
          }
        });
      }
    } else {
      // Se ainda não chegou ao nível correto, continuar descendo a hierarquia
      if (typeof node === 'object') {
        Object.values(node).forEach(childNode => {
          searchHierarchy(childNode, currentDepth + 1);
        });
      }
    }
  };

  searchHierarchy(hierarchy, 1); // Começar a busca pela profundidade 1
  return results;
};


program
  .option('--depth <number>', 'Profundidade da hierarquia')
  .option('--verbose', 'Exibe métricas detalhadas')
  .argument('<phrase>', 'Frase a ser analisada')
  .action(async (phrase, options) => {
    const depth = parseInt(options.depth);
    const hierarchy = await loadHierarchy();
    
    console.log('Frase:', phrase);
    console.log('Profundidade:', depth);
    
    const foundWords = findWordsAtDepth(phrase, depth, hierarchy);

    if (foundWords.length > 0) {
      console.log('Palavras encontradas:', foundWords.join(', '));
    } else {
      console.log('Nenhuma palavra encontrada nesse nível de profundidade.');
    }

    if (options.verbose) {
      console.log('Modo verbose ativado');
      console.log(`Tempo de carregamento dos parâmetros: (${new Date().getTime()}ms)`);
    }
  });

program.parse(process.argv);