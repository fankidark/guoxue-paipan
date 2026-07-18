/**
 * 八字分析层：旺衰 / 喜忌五档 / 格局 / 调候 / 十神组合 / 病位 / 天数地数 / 真太阳时
 */
import { getShiShen } from './bazi'

const GAN_WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}
const ZHI_WX: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}
const SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const SHENG_REV: Record<string, string> = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' }
const KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
const KE_REV: Record<string, string> = { '土': '木', '金': '火', '水': '土', '木': '金', '火': '水' }

// ============================================================================
// 旺衰判定（得令/得地/得势 加权评分）
// ============================================================================

export interface WangShuaiResult {
  level: '极弱' | '弱' | '中和' | '强' | '极强'
  score: number         // 0-100
  deLing: boolean       // 得令
  deDi: boolean         // 得地（有根）
  deShi: boolean        // 得势
  detail: string
}

/** 月令旺相休囚死：日主五行在月支的状态 */
function lingState(dayWx: string, monthZhi: string): string {
  const mWx = ZHI_WX[monthZhi]
  if (mWx === dayWx) return '旺'
  if (SHENG[mWx] === dayWx) return '相'
  if (SHENG[dayWx] === mWx) return '休'
  if (KE[dayWx] === mWx) return '囚'
  return '死'
}

const ZHI_CANG: Record<string, string[]> = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
  '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
  '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
}

export function getWangShuai(
  gans: [string, string, string, string],
  zhis: [string, string, string, string]
): WangShuaiResult {
  const dayGan = gans[2]
  const dayWx = GAN_WX[dayGan]
  let score = 0

  // 1. 得令（40分）
  const ls = lingState(dayWx, zhis[1])
  const lingScore: Record<string, number> = { '旺': 40, '相': 30, '休': 12, '囚': 6, '死': 0 }
  score += lingScore[ls]
  const deLing = ls === '旺' || ls === '相'

  // 2. 得地（30分）：四支藏干中同五行(比劫根)或生我(印根)
  let rootScore = 0
  zhis.forEach((z, i) => {
    const weight = i === 2 ? 1.5 : 1  // 日支加权
    const cang = ZHI_CANG[z] || []
    cang.forEach((cg, ci) => {
      const cgWx = GAN_WX[cg]
      const posWeight = ci === 0 ? 1 : ci === 1 ? 0.5 : 0.25 // 本气/中气/余气
      if (cgWx === dayWx) rootScore += 6 * weight * posWeight
      else if (SHENG[cgWx] === dayWx) rootScore += 3 * weight * posWeight
    })
  })
  score += Math.min(30, rootScore)
  const deDi = rootScore >= 6

  // 3. 得势（30分）：他干帮扶
  let shiScore = 0
  gans.forEach((g, i) => {
    if (i === 2) return
    const gWx = GAN_WX[g]
    const weight = i === 1 || i === 3 ? 1.5 : 1  // 月干时干贴身加权
    if (gWx === dayWx) shiScore += 8 * weight
    else if (SHENG[gWx] === dayWx) shiScore += 6 * weight
  })
  score += Math.min(30, shiScore)
  const deShi = shiScore >= 10

  score = Math.round(Math.min(100, score))
  let level: WangShuaiResult['level']
  if (score >= 75) level = '极强'
  else if (score >= 55) level = '强'
  else if (score >= 42) level = '中和'
  else if (score >= 18) level = '弱'
  else level = '极弱'

  return {
    level, score, deLing, deDi, deShi,
    detail: `月令${ls}(${deLing ? '得令' : '失令'})、${deDi ? '有根' : '无根'}、${deShi ? '得势' : '少助'}`
  }
}

// ============================================================================
// 喜忌五档
// ============================================================================

export interface XiJiResult {
  yong: string   // 用神五行（帮助最大）
  xi: string     // 喜神（次要帮助）
  xian: string   // 闲神
  chou: string   // 仇神（次要破坏）
  ji: string     // 忌神（破坏最大）
}

export function getXiJi(dayGan: string, wangShuai: WangShuaiResult['level'], wuXingPower: Record<string, number>): XiJiResult {
  const dayWx = GAN_WX[dayGan]
  const isWeak = wangShuai === '弱' || wangShuai === '极弱'

  if (isWeak) {
    // 身弱：用比劫（自身五行），喜印（生我）
    const yong = dayWx
    const xi = SHENG_REV[dayWx]
    // 忌神：克我(官杀)与泄耗中力量最大者——常规取官杀
    const guanSha = KE_REV[dayWx]
    const cai = KE[dayWx]        // 我克=财
    const shiShang = SHENG[dayWx] // 我生=食伤
    // 忌取力量最大的克泄耗
    const candidates: Array<[string, number]> = [
      [guanSha, wuXingPower[guanSha] ?? 0],
      [cai, wuXingPower[cai] ?? 0],
      [shiShang, wuXingPower[shiShang] ?? 0],
    ]
    candidates.sort((a, b) => b[1] - a[1])
    const ji = candidates[0][0]
    const chou = SHENG_REV[ji]   // 生忌神者为仇
    const all = ['木', '火', '土', '金', '水']
    const xian = all.find(w => ![yong, xi, ji, chou].includes(w)) || ''
    return { yong, xi, xian, chou, ji }
  } else {
    // 身强：用克泄耗中最需要者——默认取官杀为用、财为喜
    const guanSha = KE_REV[dayWx]
    const cai = KE[dayWx]
    const shiShang = SHENG[dayWx]
    const yong = guanSha
    const xi = cai
    const ji = dayWx              // 忌比劫再帮
    const chou = SHENG_REV[dayWx] // 仇印
    const all = ['木', '火', '土', '金', '水']
    const xian = all.find(w => ![yong, xi, ji, chou].includes(w)) || shiShang
    return { yong, xi, xian, chou, ji }
  }
}

// ============================================================================
// 格局判定（子平真诠八格+禄刃）
// ============================================================================

export interface GeJuResult {
  name: string          // 如 "七杀格"
  base: string          // 取格依据说明
}

export function getGeJu(
  gans: [string, string, string, string],
  zhis: [string, string, string, string]
): GeJuResult {
  const dayGan = gans[2]
  const monthZhi = zhis[1]
  const cang = ZHI_CANG[monthZhi] || []
  const benQi = cang[0]

  // 月令本气是日主比劫 → 建禄/月劫/阳刃
  const benQiShiShen = getShiShen(dayGan, benQi)
  if (benQiShiShen === '比肩') {
    // 禄=临官 刃=帝旺（阳干）
    const LU: Record<string, string> = { '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' }
    if (LU[dayGan] === monthZhi) return { name: '建禄格', base: `月令${monthZhi}为日主禄地` }
    return { name: '月劫格', base: `月令${monthZhi}本气为比肩` }
  }
  if (benQiShiShen === '劫财') {
    const REN: Record<string, string> = { '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子' }
    if (REN[dayGan] === monthZhi) return { name: '阳刃格', base: `月令${monthZhi}为阳刃` }
    return { name: '月劫格', base: `月令${monthZhi}本气为劫财` }
  }

  // 藏干透出者优先取格（本气>中气>余气）
  const otherGans = [gans[0], gans[1], gans[3]]
  for (const cg of cang) {
    if (otherGans.includes(cg)) {
      const ss = getShiShen(dayGan, cg)
      return { name: shiShenToGe(ss), base: `月令${monthZhi}藏${cg}透出天干` }
    }
  }
  // 全不透，用本气
  return { name: shiShenToGe(benQiShiShen), base: `月令${monthZhi}本气${benQi}(不透)` }
}

function shiShenToGe(ss: string): string {
  const map: Record<string, string> = {
    '正官': '正官格', '偏官': '七杀格', '正财': '正财格', '偏财': '偏财格',
    '正印': '正印格', '偏印': '偏印格', '食神': '食神格', '伤官': '伤官格',
  }
  return map[ss] || `${ss}格`
}

// ============================================================================
// 调候用神（穷通宝鉴通行表：十干×十二月支）
// ============================================================================

const TIAOHOU: Record<string, Record<string, string>> = {
  '甲': { '寅': '丙癸', '卯': '庚戊己', '辰': '庚壬', '巳': '癸庚丁', '午': '癸庚丁', '未': '癸庚丁', '申': '庚丁壬', '酉': '庚丙丁', '戌': '庚甲壬癸', '亥': '庚丁戊', '子': '丁庚丙', '丑': '丁庚丙' },
  '乙': { '寅': '丙癸', '卯': '丙癸', '辰': '癸丙戊', '巳': '癸', '午': '癸丙', '未': '癸丙', '申': '丙癸己', '酉': '癸丙丁', '戌': '癸辛', '亥': '丙戊', '子': '丙', '丑': '丙' },
  '丙': { '寅': '壬庚', '卯': '壬己', '辰': '壬甲', '巳': '壬庚癸', '午': '壬庚', '未': '壬庚', '申': '壬戊', '酉': '壬癸', '戌': '甲壬', '亥': '甲戊庚壬', '子': '壬戊己', '丑': '壬甲' },
  '丁': { '寅': '甲庚', '卯': '庚甲', '辰': '甲庚', '巳': '甲庚', '午': '壬庚癸', '未': '甲壬庚', '申': '甲庚丙戊', '酉': '甲庚丙戊', '戌': '甲庚戊', '亥': '甲庚', '子': '甲庚', '丑': '甲庚' },
  '戊': { '寅': '丙甲癸', '卯': '丙甲癸', '辰': '甲丙癸', '巳': '甲丙癸', '午': '壬甲丙', '未': '癸丙甲', '申': '丙癸甲', '酉': '丙癸', '戌': '甲丙癸', '亥': '甲丙', '子': '丙甲', '丑': '丙甲' },
  '己': { '寅': '丙庚甲', '卯': '甲癸丙', '辰': '丙癸甲', '巳': '癸丙', '午': '癸丙', '未': '癸丙', '申': '丙癸', '酉': '丙癸', '戌': '甲丙癸', '亥': '丙甲戊', '子': '丙甲戊', '丑': '丙甲戊' },
  '庚': { '寅': '戊甲壬丙丁', '卯': '丁甲庚丙', '辰': '甲丁壬癸', '巳': '壬戊丙丁', '午': '壬癸', '未': '丁甲', '申': '丁甲', '酉': '丁甲丙', '戌': '甲壬', '亥': '丁丙', '子': '丁甲丙', '丑': '丙丁甲' },
  '辛': { '寅': '己壬庚', '卯': '壬甲', '辰': '壬甲', '巳': '壬甲癸', '午': '壬己癸', '未': '壬庚甲', '申': '壬甲戊', '酉': '壬甲', '戌': '壬甲', '亥': '壬丙', '子': '丙戊壬甲', '丑': '丙壬戊己' },
  '壬': { '寅': '庚丙戊', '卯': '戊辛庚', '辰': '甲庚', '巳': '壬辛庚癸', '午': '癸庚辛', '未': '辛甲', '申': '戊丁', '酉': '甲庚', '戌': '甲丙', '亥': '戊丙庚', '子': '戊丙', '丑': '丙丁甲' },
  '癸': { '寅': '辛丙', '卯': '庚辛', '辰': '丙辛甲', '巳': '辛', '午': '庚辛壬癸', '未': '庚辛壬癸', '申': '丁', '酉': '辛丙', '戌': '辛甲壬癸', '亥': '庚辛戊丁', '子': '丙辛甲', '丑': '丙丁' },
}

export function getTiaoHou(dayGan: string, monthZhi: string): string {
  return TIAOHOU[dayGan]?.[monthZhi] || ''
}

// ============================================================================
// 十神组合识别（主要组合）
// ============================================================================

export function getShiShenCombo(shiShenCounts: Record<string, number>): { name: string; desc: string } {
  const cnt = (names: string[]) => names.reduce((s, n) => s + (shiShenCounts[n] || 0), 0)
  const guanSha = cnt(['正官', '偏官'])
  const yin = cnt(['正印', '偏印'])
  const biJie = cnt(['比肩', '劫财'])
  const shiShang = cnt(['食神', '伤官'])
  const cai = cnt(['正财', '偏财'])

  if (guanSha >= 2 && biJie >= 2) return { name: '官杀配比劫', desc: '官杀给目标压力、比劫给行动马力：确定目标后非常坚定，干劲十足，不畏挫折。' }
  if (guanSha >= 2 && yin >= 1) return { name: '杀印相生', desc: '官杀生印、印生日主，化压力为成长动力，主贵气，抗压强，适合专业+管理复合路线。' }
  if (shiShang >= 2 && cai >= 1) return { name: '食伤生财', desc: '才华变现通道通畅，适合创意、技术、内容变现方向。' }
  if (shiShang >= 1 && guanSha >= 1 && shiShang + guanSha >= 3) return { name: '食神制杀', desc: '以才制敌，技术专家掌权之象。' }
  if (yin >= 2 && guanSha >= 1) return { name: '官印相生', desc: '学而优则仕，名声与学识互相成就。' }
  if (cai >= 2 && guanSha >= 1) return { name: '财官双美', desc: '财生官旺，职场发展有资源加持。' }
  if (biJie >= 2 && cai >= 1) return { name: '比劫夺财', desc: '同辈竞争影响财务，合伙需谨慎，宜官杀制劫或食伤通关。' }
  if (yin >= 3) return { name: '印重身埋', desc: '生扶太过，依赖心重，宜财星损印、食伤泄秀。' }
  return { name: '常规配置', desc: '十神分布相对均衡，以格局与喜忌综合判断。' }
}

// ============================================================================
// 容易患病部位（五行失衡）
// ============================================================================

const WX_ORGAN: Record<string, string> = { '木': '肝', '火': '心', '土': '脾', '金': '肺', '水': '肾' }

export function getWeakOrgans(wuXingPower: Record<string, number>): string {
  const total = Object.values(wuXingPower).reduce((a, b) => a + b, 0) || 1
  const pct: Record<string, number> = {}
  Object.keys(wuXingPower).forEach(k => { pct[k] = wuXingPower[k] / total * 100 })

  const organs: string[] = []
  // 被克太过：克我者>40% 且我<25%（如水56.9%克火17.4% → 心）
  Object.entries(pct).forEach(([wx, p]) => {
    const keMe = KE_REV[wx]
    if (pct[keMe] > 40 && p < 25) organs.push(WX_ORGAN[wx])
  })
  // 过旺：>45% 的五行主对应脏腑负担（如水56.9% → 肾）
  Object.entries(pct).forEach(([wx, p]) => {
    if (p > 45 && !organs.includes(WX_ORGAN[wx])) organs.push(WX_ORGAN[wx])
  })
  return organs.length ? organs.join('、') : '五行较均衡'
}

// ============================================================================
// 天数地数（河洛理数）
// ============================================================================

const HELUO_GAN: Record<string, number> = {
  '甲': 6, '乙': 2, '丙': 8, '丁': 7, '戊': 1, '己': 9, '庚': 3, '辛': 4, '壬': 6, '癸': 2
}
const HELUO_ZHI: Record<string, [number, number]> = {
  '子': [1, 6], '丑': [5, 10], '寅': [3, 8], '卯': [3, 8], '辰': [5, 10], '巳': [2, 7],
  '午': [2, 7], '未': [5, 10], '申': [4, 9], '酉': [4, 9], '戌': [5, 10], '亥': [1, 6],
}

/** 返回 {tianShu, diShu}——App口径：偶数和标"天数"、奇数和标"地数" */
export function getTianDiShu(gans: string[], zhis: string[]): { tianShu: number; diShu: number } {
  const nums: number[] = []
  gans.forEach(g => nums.push(HELUO_GAN[g]))
  zhis.forEach(z => { const [a, b] = HELUO_ZHI[z]; nums.push(a, b) })
  const odd = nums.filter(n => n % 2 === 1).reduce((a, b) => a + b, 0)
  const even = nums.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0)
  return { tianShu: even, diShu: odd }  // App口径
}

// ============================================================================
// 真太阳时（均时差近似公式）
// ============================================================================

/** 均时差（分钟），dayOfYear 1-366。近似公式误差<0.5分钟 */
export function equationOfTime(dayOfYear: number): number {
  const b = 2 * Math.PI * (dayOfYear - 81) / 364
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)
}

/** 真太阳时修正总分钟数：经度差 + 均时差。longitude 缺省120（北京时间基准） */
export function trueSolarOffsetMinutes(dayOfYear: number, longitude = 120): number {
  return (longitude - 120) * 4 + equationOfTime(dayOfYear)
}

// ============================================================================
// 命宫（App口径：n=月序(寅1)+时序(子0)，n<14取14-n，否则26-n，从寅起数；干用五虎遁）
// ============================================================================

const MING_DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const MING_TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/** 命宫（月支+时支+年干），返回干支。与部分排盘软件（如小南斗）口径一致 */
export function getMingGongApp(yearGan: string, monthZhi: string, hourZhi: string): string {
  // 月序：寅=1 卯=2 … 丑=12
  const monthOrder = ((MING_DI_ZHI.indexOf(monthZhi) - 2 + 12) % 12) + 1
  // 时序：子=0 丑=1 … 亥=11
  const hourOrder = MING_DI_ZHI.indexOf(hourZhi)
  const n = monthOrder + hourOrder
  const k = n < 14 ? 14 - n : 26 - n   // 从寅=1数k位
  const zhiIdx = (2 + k - 1) % 12       // 寅索引2
  const zhi = MING_DI_ZHI[zhiIdx]
  // 五虎遁定干
  const WUHU: Record<string, number> = { '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8 }
  // 甲己年丙作首：寅月天干=丙(索引2)。表存"寅月干索引-2"便于计算
  const firstGanIdx = (WUHU[yearGan] + 2) % 10
  // 从寅数到命宫支的月位差
  const ganIdx = (firstGanIdx + ((zhiIdx - 2 + 12) % 12)) % 10
  return MING_TIAN_GAN[ganIdx] + zhi
}

/** 身宫（App口径）：支=(月支idx+时支idx+2)%12，干按五虎遁从寅顺推。命例癸年子月午时→庚申已验证 */
export function getShenGongApp(yearGan: string, monthZhi: string, hourZhi: string): string {
  const zhiIdx = (MING_DI_ZHI.indexOf(monthZhi) + MING_DI_ZHI.indexOf(hourZhi) + 2) % 12
  const zhi = MING_DI_ZHI[zhiIdx]
  const WUHU: Record<string, number> = { '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8 }
  const firstGanIdx = (WUHU[yearGan] + 2) % 10
  const ganIdx = (firstGanIdx + ((zhiIdx - 2 + 12) % 12)) % 10
  return MING_TIAN_GAN[ganIdx] + zhi
}
