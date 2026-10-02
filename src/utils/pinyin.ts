/**
 * Resolves the initial letter for a name (A-Z, or # for symbols/others).
 * Supports English and Chinese characters using standard locale comparison.
 */
export function getInitialLetter(name: string): string {
  if (!name || !name.trim()) return '#';
  const char = name.trim()[0];

  // English letters
  if (/^[a-zA-Z]$/.test(char)) {
    return char.toUpperCase();
  }

  // Chinese characters pinyin boundary matching with localeCompare
  const pinyinBoundaries: Array<[string, string]> = [
    ['A', '阿'], ['B', '八'], ['C', '嚓'], ['D', '嗒'], ['E', '妸'],
    ['F', '发'], ['G', '噶'], ['H', '哈'], ['J', '讥'], ['K', '咔'],
    ['L', '垃'], ['M', '妈'], ['N', '拿'], ['O', '哦'], ['P', '妑'],
    ['Q', '七'], ['R', '呥'], ['S', '仨'], ['T', '他'], ['W', '哇'],
    ['X', '夕'], ['Y', '丫'], ['Z', '帀']
  ];

  for (let i = pinyinBoundaries.length - 1; i >= 0; i--) {
    const [letter, boundaryChar] = pinyinBoundaries[i];
    if (char.localeCompare(boundaryChar, 'zh-Hans-CN') >= 0) {
      return letter;
    }
  }

  return '#';
}
