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
 * Coleta todos os nomes dos grupos na hierarquia para serem excluídos da análise.
 * 
 * @param {any} node - O nó atual da hierarquia
 * @returns {Set<string>} Um conjunto contendo todos os nomes dos grupos
 */
const collectGroupNames = (node: any): Set<string> => {
  let groupNames = new Set<string>();

  const traverse = (currentNode: any) => {
    if (typeof currentNode === 'object' && !Array.isArray(currentNode)) {
      Object.keys(currentNode).forEach(key => {
        groupNames.add(key.toLowerCase()); // Adiciona o nome do grupo em minúsculas
        traverse(currentNode[key]); // Continua percorrendo a hierarquia
      });
    }
  };

  traverse(node);
  return groupNames;
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
  // Se a profundidade solicitada for maior que o nível máximo, retorne um objeto vazio
  if (depth > MAX_DEPTH) {
    return {}; // Retorna um objeto vazio, indicando que não há palavras encontradas
  }

  // Coletar automaticamente os nomes dos grupos a serem excluídos
  const groupNames = collectGroupNames(hierarchy);

  let wordCountsAndGroups: { [word: string]: { count: number, group: string } } = {};
  const sanitizedPhrase = phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  const words = sanitizedPhrase.split(' ');

  const searchHierarchy = (node: any, currentDepth: number, group: string) => {
    if (currentDepth === depth) {
      if (Array.isArray(node)) {
        words.forEach(word => {
          // Ignora palavras que estão na lista de nomes de grupos
          if (!groupNames.has(word) && node.map((w: string) => w.toLowerCase()).includes(word)) {
            if (!wordCountsAndGroups[word]) {
              wordCountsAndGroups[word] = { count: 0, group: group };
            }
            wordCountsAndGroups[word].count += 1;
          }
        });
      } else if (typeof node === 'object') {
        words.forEach(word => {
          if (!groupNames.has(word) && Object.keys(node).map((key: string) => key.toLowerCase()).includes(word)) {
            if (!wordCountsAndGroups[word]) {
              wordCountsAndGroups[word] = { count: 0, group: group };
            }
            wordCountsAndGroups[word].count += 1;
          }
        });
        Object.entries(node).forEach(([key, childNode]) => {
          if (Array.isArray(childNode)) {
            words.forEach(word => {
              if (!groupNames.has(word) && childNode.map((w: string) => w.toLowerCase()).includes(word)) {
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

  searchHierarchy(hierarchy, 1, ''); // Começa a busca pela profundidade 1
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