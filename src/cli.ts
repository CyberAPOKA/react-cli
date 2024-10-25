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
   * Também remove todos os tipos de pontuações, afim de identificar palavras em momentos como "Eu amo tigres, cavalos e gorilas."
   */
  const sanitizedPhrase = phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  const words = sanitizedPhrase.split(' ');
  
  // Objeto para armazenar a contagem de ocorrências de cada palavra
  let wordCounts: { [key: string]: number } = {};

  /**
   * Função recursiva que percorre a hierarquia de palavras e verifica se as palavras
   * da frase estão presentes na hierarquia na profundidade especificada.
   *
   * @param {any} node - O nó atual da hierarquia
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
            wordCounts[word] = (wordCounts[word] || 0) + 1; // Incrementa o contador
          }
        });
      } else if (typeof node === 'object') {
        // Se o nó é um objeto, verifica as chaves e valores
        words.forEach(word => {
          if (Object.keys(node).map((key: string) => key.toLowerCase()).includes(word)) {
            wordCounts[word] = (wordCounts[word] || 0) + 1; // Incrementa o contador
          }
        });
        Object.values(node).forEach(childNode => {
          if (Array.isArray(childNode)) {
            // Se encontrar um array, verifica as palavras no array
            words.forEach(word => {
              if (childNode.map((w: string) => w.toLowerCase()).includes(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1; // Incrementa o contador
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
  return wordCounts; // Retorna o objeto com a contagem das palavras
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
    const foundWords = findWordsAtDepth(phrase, depth, hierarchy);
    const endTimeVerification = Date.now(); // Finaliza o cronômetro para o tempo de verificação da frase

    if (Object.keys(foundWords).length > 0) {
      // Formatar o resultado para exibir como "palavra = contagem"
      const resultString = Object.entries(foundWords)
        .map(([word, count]) => `${word} = ${count}`)
        .join('; ');
      console.log('Palavras encontradas:', resultString);
    } else {
      console.log('Nenhuma palavra encontrada nesse nível de profundidade.');
    }

    if (options.verbose) {
      console.log('Modo verbose ativado');
      console.log(`Tempo de carregamento dos parâmetros: ${endTimeLoad - startTimeLoad}ms`);
      console.log(`Tempo de verificação da frase: ${endTimeVerification - startTimeVerification}ms`);
    }
  });

program.parse(process.argv);
