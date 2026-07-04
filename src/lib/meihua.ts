/**
 * 梅花易数核心算法
 * 支持：时间起卦、数字起卦
 * 输出：主卦、互卦、变卦、体用分析
 */

// ============================================================================
// 八卦基础数据
// ============================================================================
const BAGUA = [
  { name: '乾', symbol: '☰', lines: [1, 1, 1], wuXing: '金', nature: '天', number: 1 },
  { name: '兑', symbol: '☱', lines: [1, 1, 0], wuXing: '金', nature: '泽', number: 2 },
  { name: '离', symbol: '☲', lines: [1, 0, 1], wuXing: '火', nature: '火', number: 3 },
  { name: '震', symbol: '☳', lines: [0, 0, 1], wuXing: '木', nature: '雷', number: 4 },
  { name: '巽', symbol: '☴', lines: [1, 1, 0], wuXing: '木', nature: '风', number: 5 },
  { name: '坎', symbol: '☵', lines: [0, 1, 0], wuXing: '水', nature: '水', number: 6 },
  { name: '艮', symbol: '☶', lines: [1, 0, 0], wuXing: '土', nature: '山', number: 7 },
  { name: '坤', symbol: '☷', lines: [0, 0, 0], wuXing: '土', nature: '地', number: 8 },
]

// 先天八卦数对应：1乾2兑3离4震5巽6坎7艮8坤
function getGuaByNumber(num: number) {
  const idx = ((num - 1) % 8 + 8) % 8
  return BAGUA[idx]
}

// 64卦名表（上卦×8 + 下卦）
const HEXAGRAM_NAMES: Record<string, string> = {
  '乾乾': '乾为天', '乾兑': '天泽履', '乾离': '天火同人', '乾震': '天雷无妄',
  '乾巽': '天风姤', '乾坎': '天水讼', '乾艮': '天山遁', '乾坤': '天地否',
  '兑乾': '泽天夬', '兑兑': '兑为泽', '兑离': '泽火革', '兑震': '泽雷随',
  '兑巽': '泽风大过', '兑坎': '泽水困', '兑艮': '泽山咸', '兑坤': '泽地萃',
  '离乾': '火天大有', '离兑': '火泽睽', '离离': '离为火', '离震': '火雷噬嗑',
  '离巽': '火风鼎', '离坎': '火水未济', '离艮': '火山旅', '离坤': '火地晋',
  '震乾': '雷天大壮', '震兑': '雷泽归妹', '震离': '雷火丰', '震震': '震为雷',
  '震巽': '雷风恒', '震坎': '雷水解', '震艮': '雷山小过', '震坤': '雷地豫',
  '巽乾': '风天小畜', '巽兑': '风泽中孚', '巽离': '风火家人', '巽震': '风雷益',
  '巽巽': '巽为风', '巽坎': '风水涣', '巽艮': '风山渐', '巽坤': '风地观',
  '坎乾': '水天需', '坎兑': '水泽节', '坎离': '水火既济', '坎震': '水雷屯',
  '坎巽': '水风井', '坎坎': '坎为水', '坎艮': '水山蹇', '坎坤': '水地比',
  '艮乾': '山天大畜', '艮兑': '山泽损', '艮离': '山火贲', '艮震': '山雷颐',
  '艮巽': '山风蛊', '艮坎': '山水蒙', '艮艮': '艮为山', '艮坤': '山地剥',
  '坤乾': '地天泰', '坤兑': '地泽临', '坤离': '地火明夷', '坤震': '地雷复',
  '坤巽': '地风升', '坤坎': '地水师', '坤艮': '地山谦', '坤坤': '坤为地',
}

// ============================================================================
// 数据结构
// ============================================================================
export interface Gua {
  name: string
  symbol: string
  lines: number[]  // [下爻, 中爻, 上爻] 1=阳 0=阴
  wuXing: string
  nature: string
  number: number
}

export interface Hexagram {
  upper: Gua       // 上卦（外卦）
  lower: Gua       // 下卦（内卦）
  name: string     // 卦名
  lines: number[]  // 六爻 [1爻, 2爻, 3爻, 4爻, 5爻, 6爻] 从下到上
}

export interface MeihuaResult {
  // 起卦信息
  method: '时间起卦' | '数字起卦'
  input: string
  
  // 卦象
  mainHex: Hexagram      // 主卦（本卦）
  mutualHex: Hexagram    // 互卦
  changedHex: Hexagram   // 变卦
  
  // 动爻
  movingLine: number     // 动爻位置 (1-6)
  
  // 体用
  tiGua: Gua             // 体卦
  yongGua: Gua           // 用卦
  tiYongRelation: string // 体用关系
  fortune: string        // 吉凶判断
  
  // 五行分析
  tiWuXing: string
  yongWuXing: string
}

// ============================================================================
// 核心计算
// ============================================================================

/** 构建六十四卦 */
function buildHexagram(upper: Gua, lower: Gua): Hexagram {
  const lines = [...lower.lines, ...upper.lines]
  const name = HEXAGRAM_NAMES[upper.name + lower.name] || `${upper.name}${lower.name}`
  return { upper, lower, name, lines }
}

/** 计算互卦：取2-4爻为下卦，3-5爻为上卦 */
function getMutualHexagram(hex: Hexagram): Hexagram {
  const lines = hex.lines
  const lowerLines = [lines[1], lines[2], lines[3]]
  const upperLines = [lines[2], lines[3], lines[4]]
  
  const lower = findGuaByLines(lowerLines)
  const upper = findGuaByLines(upperLines)
  return buildHexagram(upper, lower)
}

/** 计算变卦：动爻变（阳变阴，阴变阳） */
function getChangedHexagram(hex: Hexagram, movingLine: number): Hexagram {
  const newLines = [...hex.lines]
  newLines[movingLine - 1] = newLines[movingLine - 1] === 1 ? 0 : 1
  
  const lowerLines = [newLines[0], newLines[1], newLines[2]]
  const upperLines = [newLines[3], newLines[4], newLines[5]]
  
  const lower = findGuaByLines(lowerLines)
  const upper = findGuaByLines(upperLines)
  return buildHexagram(upper, lower)
}

/** 通过爻线查找八卦 */
function findGuaByLines(lines: number[]): Gua {
  // 八卦爻象对应
  const key = lines.join('')
  // unused legacy map removed
  // 正确的八卦爻象（从下到上）
  const correctMap: Record<string, number> = {
    '111': 0, // 乾 ☰
    '011': 1, // 兑 ☱（下阴上二阳→从下到上：0,1,1→实际写法110的逆序）
    '101': 2, // 离 ☲
    '100': 3, // 震 ☳（最下阳→从下到上：1,0,0）
    '110': 4, // 巽 ☴（最下阴→从下到上：0,1,1→修正）
    '010': 5, // 坎 ☵
    '001': 6, // 艮 ☶（最上阳→从下到上：0,0,1）
    '000': 7, // 坤 ☷
  }
  const idx = correctMap[key]
  return idx !== undefined ? BAGUA[idx] : BAGUA[7]
}

/** 五行生克关系 */
function getWuXingRelation(ti: string, yong: string): { relation: string; fortune: string } {
  if (ti === yong) return { relation: '比和', fortune: '中平' }
  
  const shengMap: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const keMap: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
  
  if (shengMap[yong] === ti) return { relation: '用生体', fortune: '大吉' }
  if (shengMap[ti] === yong) return { relation: '体生用', fortune: '小凶（泄气）' }
  if (keMap[ti] === yong) return { relation: '体克用', fortune: '中吉' }
  if (keMap[yong] === ti) return { relation: '用克体', fortune: '大凶' }
  
  return { relation: '未知', fortune: '待定' }
}

// ============================================================================
// 起卦方法
// ============================================================================

/** 时间起卦（梅花易数标准方法） */
export function qiGuaByTime(date?: Date): MeihuaResult {
  const d = date || new Date()
  
  // 农历年月日时（简化：用公历数值，严格版应转农历）
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()
  
  // 时辰数 (子1丑2寅3...亥12)
  const shiChenNum = Math.floor((hour + 1) / 2) % 12 + 1
  
  // 上卦 = (年+月+日) mod 8
  const upperNum = (year + month + day) % 8 || 8
  // 下卦 = (年+月+日+时) mod 8
  const lowerNum = (year + month + day + shiChenNum) % 8 || 8
  // 动爻 = (年+月+日+时) mod 6
  const movingLine = (year + month + day + shiChenNum) % 6 || 6

  const upper = getGuaByNumber(upperNum)
  const lower = getGuaByNumber(lowerNum)
  const mainHex = buildHexagram(upper, lower)
  const mutualHex = getMutualHexagram(mainHex)
  const changedHex = getChangedHexagram(mainHex, movingLine)

  // 体用判断：动爻在下卦(1-3)→下卦为用，上卦为体；动爻在上卦(4-6)→上卦为用，下卦为体
  const tiGua = movingLine <= 3 ? upper : lower
  const yongGua = movingLine <= 3 ? lower : upper
  
  const { relation, fortune } = getWuXingRelation(tiGua.wuXing, yongGua.wuXing)

  return {
    method: '时间起卦',
    input: `${year}年${month}月${day}日 ${hour}时`,
    mainHex, mutualHex, changedHex,
    movingLine,
    tiGua, yongGua,
    tiYongRelation: relation,
    fortune,
    tiWuXing: tiGua.wuXing,
    yongWuXing: yongGua.wuXing,
  }
}

/** 数字起卦 */
export function qiGuaByNumber(num1: number, num2: number): MeihuaResult {
  const upperNum = num1 % 8 || 8
  const lowerNum = num2 % 8 || 8
  const movingLine = (num1 + num2) % 6 || 6

  const upper = getGuaByNumber(upperNum)
  const lower = getGuaByNumber(lowerNum)
  const mainHex = buildHexagram(upper, lower)
  const mutualHex = getMutualHexagram(mainHex)
  const changedHex = getChangedHexagram(mainHex, movingLine)

  const tiGua = movingLine <= 3 ? upper : lower
  const yongGua = movingLine <= 3 ? lower : upper
  
  const { relation, fortune } = getWuXingRelation(tiGua.wuXing, yongGua.wuXing)

  return {
    method: '数字起卦',
    input: `${num1}, ${num2}`,
    mainHex, mutualHex, changedHex,
    movingLine,
    tiGua, yongGua,
    tiYongRelation: relation,
    fortune,
    tiWuXing: tiGua.wuXing,
    yongWuXing: yongGua.wuXing,
  }
}

export { BAGUA, HEXAGRAM_NAMES, getGuaByNumber }
