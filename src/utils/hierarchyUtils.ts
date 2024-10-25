import fs from 'fs-extra';
import path from 'path';

const MAX_DEPTH = 4;

/**
 * Carrega a hierarquia de palavras a partir do arquivo JSON localizado em 'dicts/hierarchy.json'.
 * @returns {Promise<any>} Uma promessa que resolve para a estrutura de dados da hierarquia.
 */
export const loadHierarchy = async () => {
  const filePath = path.join(__dirname, '..', 'dicts', 'hierarchy.json');
  return await fs.readJson(filePath);
};

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
export const findWordsAtDepth = (phrase: string, depth: number, hierarchy: any) => {
  // Se a profundidade informada for maior que o nível máximo já retorna um objeto vazio
  if (depth > MAX_DEPTH) {
    return {};
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