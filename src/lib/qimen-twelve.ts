/**
 * 奇门遁甲 — 十二长生（双地支版）+ 地支三刑
 * 
 * 每宫对应两个地支:
 *   1坎=子, 2坤=未申, 3震=卯, 4巽=辰巳, 6乾=戌亥, 7兑=酉, 8艮=丑寅, 9离=午
 *   (5中宫无地支)
 * 
 * 十二长生: 天干在宫位的两个地支分别计算，然后缩写合并
 * 三刑: 天盘干所遁甲的地支与宫位地支构成三刑时标"刑"
 */

// 宫位对应的双地支
export const GONG_DOUBLE_ZHI: Record<number, string[]> = {
  1: ['子'],
  2: ['未', '申'],
  3: ['卯'],
  4: ['辰', '巳'],
  5: [],
  6: ['戌', '亥'],
  7: ['酉'],
  8: ['丑', '寅'],
  9: ['午'],
}

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 十二长生
const TWELVE_STATES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

// 十二长生缩写
const TWELVE_SHORT: Record<string, string> = {
  '长生': '生', '沐浴': '沐', '冠带': '冠', '临官': '临',
  '帝旺': '旺', '衰': '衰', '病': '病', '死': '死',
  '墓': '墓', '绝': '绝', '胎': '胎', '养': '养',
}

// 天干十二长生起始地支
const TWELVE_START: Record<string, string> = {
  '甲': '亥', '丙': '寅', '戊': '寅', '庚': '巳', '壬': '申',
  '乙': '午', '丁': '酉', '己': '酉', '辛': '子', '癸': '卯',
}
const YANG_GAN = ['甲', '丙', '戊', '庚', '壬']

/**
 * 计算天干在某地支的十二长生
 */
function getTwelveAtZhi(gan: string, zhi: string): string {
  const startZhi = TWELVE_START[gan]
  if (!startZhi) return ''
  const startIdx = DI_ZHI.indexOf(startZhi)
  const zhiIdx = DI_ZHI.indexOf(zhi)
  if (startIdx < 0 || zhiIdx < 0) return ''
  
  const isYang = YANG_GAN.includes(gan)
  let stateIdx: number
  if (isYang) {
    stateIdx = (zhiIdx - startIdx + 12) % 12
  } else {
    stateIdx = (startIdx - zhiIdx + 12) % 12
  }
  return TWELVE_STATES[stateIdx]
}

/**
 * 获取天干在宫位的十二长生合并显示（双地支版）
 * 如：丙在坤2(未申) → 衰+病 → "衰病"
 */
export function getGanTwelveInGongDouble(gan: string, gongNum: number): string {
  const zhis = GONG_DOUBLE_ZHI[gongNum]
  if (!zhis || zhis.length === 0 || !gan) return ''
  
  if (zhis.length === 1) {
    const state = getTwelveAtZhi(gan, zhis[0])
    return TWELVE_SHORT[state] || state
  }
  
  // 双地支：分别计算再合并
  const state1 = getTwelveAtZhi(gan, zhis[0])
  const state2 = getTwelveAtZhi(gan, zhis[1])
  const short1 = TWELVE_SHORT[state1] || state1
  const short2 = TWELVE_SHORT[state2] || state2
  
  if (short1 === short2) return short1
  return short1 + short2
}

/**
 * 判断天盘干是否在该宫构成地支三刑
 * 
 * 三刑规则：
 *   寅巳申 — 无恩之刑（互刑）
 *   丑未戌 — 持势之刑（互刑）
 *   子卯 — 无礼之刑（互刑）
 *   辰午酉亥 — 自刑
 * 
 * 判断方法：天盘干所遁的甲的地支，与宫位地支是否构成三刑
 */
export function hasXingInGong(tianGan: string, gongNum: number): boolean {
  // 天干对应的六甲地支
  const GAN_TO_JIA_ZHI: Record<string, string> = {
    '戊': '子', '己': '戌', '庚': '申', '辛': '午', '壬': '辰', '癸': '寅',
    '乙': '卯', '丙': '午', '丁': '巳',  // 三奇用自身对应
  }
  
  const ganZhi = GAN_TO_JIA_ZHI[tianGan]
  if (!ganZhi) return false
  
  const gongZhis = GONG_DOUBLE_ZHI[gongNum]
  if (!gongZhis || gongZhis.length === 0) return false
  
  // 三刑关系表
  const XING_PAIRS: Record<string, string[]> = {
    '寅': ['巳'], '巳': ['申', '寅'], '申': ['寅'],
    '丑': ['未', '戌'], '未': ['丑', '戌'], '戌': ['丑', '未'],
    '子': ['卯'], '卯': ['子'],
    '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'], // 自刑
  }
  
  const xingTargets = XING_PAIRS[ganZhi] || []
  
  for (const gz of gongZhis) {
    if (xingTargets.includes(gz)) return true
    // 自刑：干的地支 = 宫位地支
    if (ganZhi === gz && ['辰', '午', '酉', '亥'].includes(ganZhi)) return true
  }
  
  return false
}
