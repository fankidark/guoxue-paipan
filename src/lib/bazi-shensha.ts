/**
 * 八字神煞计算
 * 覆盖小南斗App出现的常用神煞30+，按日干/年支/日支/柱组合四种基准
 */

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// ============================================================================
// 以日干查（值=该神煞落的地支列表）
// ============================================================================

/** 天乙贵人：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎 */
const TIANYI: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
}

/** 文昌贵人：甲巳乙午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见卯入云梯 */
const WENCHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '戊': '申', '丁': '酉', '己': '酉',
  '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
}

/** 禄神：甲禄在寅，乙禄在卯…… */
const LU: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午',
  '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
}

/** 羊刃（阳干禄前一位） */
const YANGREN: Record<string, string> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
}

/** 飞刃（羊刃对冲位） */
const FEIREN: Record<string, string> = {
  '甲': '酉', '丙': '子', '戊': '子', '庚': '卯', '壬': '午',
}

/** 血刃：甲午乙申丙戌丁丑戊辰己未庚戌辛酉壬子癸丑（流派多，取通行版） */
const XUEREN: Record<string, string> = {
  '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午',
  '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑',
}

/** 天厨贵人：甲丙丁食神禄地（甲巳丙巳丁午…通行表） */
const TIANCHU: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '巳', '丁': '午', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
}

/** 太极贵人：甲乙子午，丙丁卯酉，戊己辰戌丑未，庚辛寅亥，壬癸巳申 */
const TAIJI: Record<string, string[]> = {
  '甲': ['子', '午'], '乙': ['子', '午'],
  '丙': ['卯', '酉'], '丁': ['卯', '酉'],
  '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
  '庚': ['寅', '亥'], '辛': ['寅', '亥'],
  '壬': ['巳', '申'], '癸': ['巳', '申'],
}

// ============================================================================
// 以年支/日支查（三合局系）
// ============================================================================

/** 三合局组：申子辰/寅午戌/巳酉丑/亥卯未 */
function sanHeGroup(zhi: string): number {
  if (['申', '子', '辰'].includes(zhi)) return 0
  if (['寅', '午', '戌'].includes(zhi)) return 1
  if (['巳', '酉', '丑'].includes(zhi)) return 2
  return 3 // 亥卯未
}

/** 桃花（咸池）：申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子 */
const TAOHUA = ['酉', '卯', '午', '子']
/** 驿马：申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳 */
const YIMA = ['寅', '申', '亥', '巳']
/** 华盖：申子辰在辰，寅午戌在戌，巳酉丑在丑，亥卯未在未 */
const HUAGAI = ['辰', '戌', '丑', '未']
/** 将星：申子辰在子，寅午戌在午，巳酉丑在酉，亥卯未在卯 */
const JIANGXING = ['子', '午', '酉', '卯']
/** 劫煞：申子辰在巳，寅午戌在亥，巳酉丑在寅，亥卯未在申 */
const JIESHA = ['巳', '亥', '寅', '申']
/** 亡神：申子辰在亥，寅午戌在巳，巳酉丑在申，亥卯未在寅 */
const WANGSHEN = ['亥', '巳', '申', '寅']

/** 红鸾：子年卯…（年支起） */
const HONGLUAN: Record<string, string> = {
  '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌',
  '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰',
}
/** 天喜：红鸾对冲 */
const TIANXI: Record<string, string> = {
  '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰',
  '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌',
}

/** 孤辰寡宿：亥子丑人，孤寅寡戌…（按年支三会方） */
function guChenGuaSu(yearZhi: string): { guChen: string; guaSu: string } {
  if (['亥', '子', '丑'].includes(yearZhi)) return { guChen: '寅', guaSu: '戌' }
  if (['寅', '卯', '辰'].includes(yearZhi)) return { guChen: '巳', guaSu: '丑' }
  if (['巳', '午', '未'].includes(yearZhi)) return { guChen: '申', guaSu: '辰' }
  return { guChen: '亥', guaSu: '未' } // 申酉戌
}

// ============================================================================
// 柱组合类
// ============================================================================

/** 魁罡：庚辰庚戌壬辰戊戌（日柱） */
const KUIGANG = ['庚辰', '庚戌', '壬辰', '戊戌']
/** 十恶大败日 */
const SHIEDABAI = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥']
/** 阴阳差错日 */
const YINYANG_CHACUO = ['丙子', '丙午', '丁丑', '丁未', '戊寅', '戊申', '辛卯', '辛酉', '壬辰', '壬戌', '癸巳', '癸亥']

/** 天德贵人（按月支）：正丁二申宫，三壬四辛同，五亥六甲上，七癸八寅逢，九丙十居乙，子巳丑庚中 */
const TIANDE: Record<string, string> = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲',
  '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
}
/** 月德贵人（按月支三合局）：寅午戌月在丙，申子辰月在壬，亥卯未月在甲，巳酉丑月在庚 */
function yueDe(monthZhi: string): string {
  const g = sanHeGroup(monthZhi)
  return ['壬', '丙', '庚', '甲'][g]
}

// ============================================================================
// 主函数
// ============================================================================

export interface ShenShaHit {
  name: string
  level: 1 | 2 | 3        // 重要度：1=一级必看 2=常用 3=了解
  type: '吉' | '凶' | '中'
}

export interface ShenShaInput {
  gans: [string, string, string, string]  // 年月日时天干
  zhis: [string, string, string, string]  // 年月日时地支
  dayGZ: string                            // 日柱干支
  yearXunKong: string                      // 年旬空（两字，如"戌亥"）
  dayXunKong: string                       // 日旬空
}

/** 计算某个地支（或某柱）命中的所有神煞。pillarIdx: 0年1月2日3时；zhi 可传大运/流年支 */
export function getShenShaForZhi(input: ShenShaInput, zhi: string, pillarIdx: number): ShenShaHit[] {
  const { gans, zhis, dayGZ, yearXunKong, dayXunKong } = input
  const dayGan = gans[2]
  const yearZhi = zhis[0]
  const dayZhi = zhis[2]
  const monthZhi = zhis[1]
  const hits: ShenShaHit[] = []

  // 日干系
  if (TIANYI[dayGan]?.includes(zhi)) hits.push({ name: '天乙贵人', level: 1, type: '吉' })
  if (WENCHANG[dayGan] === zhi) hits.push({ name: '文昌贵人', level: 2, type: '吉' })
  if (LU[dayGan] === zhi) hits.push({ name: '禄神', level: 1, type: '吉' })
  if (YANGREN[dayGan] === zhi) hits.push({ name: '羊刃', level: 1, type: '凶' })
  if (FEIREN[dayGan] === zhi) hits.push({ name: '飞刃', level: 3, type: '凶' })
  if (XUEREN[dayGan] === zhi) hits.push({ name: '血刃', level: 3, type: '凶' })
  if (TIANCHU[dayGan] === zhi) hits.push({ name: '天厨贵人', level: 3, type: '吉' })
  if (TAIJI[dayGan]?.includes(zhi)) hits.push({ name: '太极贵人', level: 3, type: '吉' })

  // 年支系（桃花驿马等：年支为主，日支为辅——App口径年支查）
  const gY = sanHeGroup(yearZhi)
  const gD = sanHeGroup(dayZhi)
  if (TAOHUA[gY] === zhi || TAOHUA[gD] === zhi) hits.push({ name: '桃花', level: 1, type: '中' })
  if (YIMA[gY] === zhi || YIMA[gD] === zhi) hits.push({ name: '驿马', level: 1, type: '中' })
  if (HUAGAI[gY] === zhi || HUAGAI[gD] === zhi) hits.push({ name: '华盖', level: 2, type: '中' })
  if (JIANGXING[gY] === zhi || JIANGXING[gD] === zhi) hits.push({ name: '将星', level: 2, type: '吉' })
  if (JIESHA[gY] === zhi) hits.push({ name: '劫煞', level: 2, type: '凶' })
  if (WANGSHEN[gY] === zhi) hits.push({ name: '亡神', level: 2, type: '凶' })
  if (HONGLUAN[yearZhi] === zhi) hits.push({ name: '红鸾', level: 2, type: '吉' })
  if (TIANXI[yearZhi] === zhi) hits.push({ name: '天喜', level: 2, type: '吉' })
  const { guChen, guaSu } = guChenGuaSu(yearZhi)
  if (guChen === zhi) hits.push({ name: '孤辰', level: 2, type: '凶' })
  if (guaSu === zhi) hits.push({ name: '寡宿', level: 2, type: '凶' })

  // 空亡（年日两查）
  if (yearXunKong.includes(zhi)) hits.push({ name: '空亡(年)', level: 1, type: '凶' })
  if (dayXunKong.includes(zhi)) hits.push({ name: '空亡(日)', level: 1, type: '凶' })

  // 月支系天月德（天干类神煞，落在天干上——挂到对应柱显示）
  if (pillarIdx >= 0 && pillarIdx <= 3) {
    const gan = gans[pillarIdx]
    if (TIANDE[monthZhi] === gan) hits.push({ name: '天德贵人', level: 2, type: '吉' })
    if (yueDe(monthZhi) === gan) hits.push({ name: '月德贵人', level: 2, type: '吉' })
  }

  // 日柱组合类（只挂日柱）
  if (pillarIdx === 2) {
    if (KUIGANG.includes(dayGZ)) hits.push({ name: '魁罡', level: 2, type: '中' })
    if (SHIEDABAI.includes(dayGZ)) hits.push({ name: '十恶大败', level: 3, type: '凶' })
    if (YINYANG_CHACUO.includes(dayGZ)) hits.push({ name: '阴阳差错', level: 3, type: '凶' })
  }

  return hits
}

/** 四柱全部神煞（返回按柱分组） */
export function getAllShenSha(input: ShenShaInput): ShenShaHit[][] {
  return input.zhis.map((zhi, i) => getShenShaForZhi(input, zhi, i))
}

export { DI_ZHI as SHENSHA_DI_ZHI }
