/**
 * 奇门遁甲 — 旺衰与十二长生计算
 * 
 * 旺衰判断：基于当前月令（节气对应的地支）判断星/门的五行旺衰
 * 十二长生：基于天干在地支宫位的十二长生状态
 */

// 九星对应五行
export const XING_WUXING: Record<string, string> = {
  '天蓬': '水', '天芮': '土', '天冲': '木', '天辅': '木',
  '天禽': '土', '天心': '金', '天柱': '金', '天任': '土', '天英': '火'
}

// 八门对应五行
export const MEN_WUXING: Record<string, string> = {
  '休门': '水', '死门': '土', '伤门': '木', '杜门': '木',
  '景门': '火', '开门': '金', '惊门': '金', '生门': '土'
}

// 宫位对应五行
export const GONG_WUXING: Record<number, string> = {
  1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火'
}

// 宫位对应卦名
export const GONG_GUA: Record<number, string> = {
  1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离'
}

// 宫位对应地支
export const GONG_DIZHI: Record<number, string> = {
  1: '子', 2: '未', 3: '卯', 4: '辰', 5: '未', 6: '戌', 7: '酉', 8: '丑', 9: '午'
}

// 月令地支（根据节气判断当月地支）
export const JIEQI_MONTH_ZHI: Record<string, string> = {
  '立春': '寅', '雨水': '寅', '惊蛰': '卯', '春分': '卯',
  '清明': '辰', '谷雨': '辰', '立夏': '巳', '小满': '巳',
  '芒种': '午', '夏至': '午', '小暑': '未', '大暑': '未',
  '立秋': '申', '处暑': '申', '白露': '酉', '秋分': '酉',
  '寒露': '戌', '霜降': '戌', '立冬': '亥', '小雪': '亥',
  '大雪': '子', '冬至': '子', '小寒': '丑', '大寒': '丑'
}

// 地支对应五行
const ZHI_WX: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

// 天干对应五行
const GAN_WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

// 八门落宫旺衰表：同行=旺, 令(宫)生我(门)=相, 我(门)生令(宫)=休, 我克令=迫, 令克我=死
// key=宫位五行, value中key=门五行→状态
const WANGSHUAI_MEN: Record<string, Record<string, string>> = {
  '木': { '木': '旺', '火': '相', '水': '休', '土': '迫', '金': '死' },
  '火': { '火': '旺', '土': '相', '木': '休', '水': '迫', '金': '死' },
  '土': { '土': '旺', '金': '相', '火': '休', '木': '迫', '水': '死' },
  '金': { '金': '旺', '水': '相', '土': '休', '火': '迫', '木': '死' },
  '水': { '水': '旺', '木': '相', '金': '休', '土': '迫', '火': '死' },
}

// 九星旺衰表：我生令=旺, 同行=相, 我克令=休, 令克我=囚, 令生我=废
// key=令(宫/月)五行, value中key=九星五行→状态
const WANGSHUAI_XING: Record<string, Record<string, string>> = {
  '木': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '废' },
  '火': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '废' },
  '土': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '废' },
  '金': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '废' },
  '水': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '废' },
}

/**
 * 计算五行在当前月令下的旺衰（八门用）
 */
export function getWangShuai(wuxing: string, monthZhi: string): string {
  const monthWx = ZHI_WX[monthZhi] || '土'
  return WANGSHUAI_MEN[monthWx]?.[wuxing] || '休'
}

// 十二长生顺序
const TWELVE_STATES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

// 天干十二长生起始地支（阳干顺行，阴干逆行）
const TWELVE_START_ZHI: Record<string, string> = {
  '甲': '亥', '丙': '寅', '戊': '寅', '庚': '巳', '壬': '申', // 阳干
  '乙': '午', '丁': '酉', '己': '酉', '辛': '子', '癸': '卯'  // 阴干
}

const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const YANG_GAN = ['甲', '丙', '戊', '庚', '壬']

/**
 * 计算天干在某地支的十二长生状态
 * @param gan 天干
 * @param zhi 地支（宫位对应的地支）
 */
export function getTwelveState(gan: string, zhi: string): string {
  const startZhi = TWELVE_START_ZHI[gan]
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
 * 获取九星在宫位的旺衰 + 月令旺衰
 * 九星旺衰规则：与我同行=相，我生者=旺，生我者=休，克我者=囚，我克者=废
 */
export function getXingStatus(xingName: string, gongNum: number, monthZhi: string): { gongWs: string; monthWs: string } {
  const xingWx = XING_WUXING[xingName] || '土'
  const gongWx = GONG_WUXING[gongNum] || '土'
  const monthWx = ZHI_WX[monthZhi] || '土'
  
  // 九星落宫旺衰（九星专用表，以宫位五行为"令"）
  const gongWs = WANGSHUAI_XING[gongWx]?.[xingWx] || '休'
  // 九星月令旺衰（九星专用表，以月令五行为"令"）
  const monthWs = WANGSHUAI_XING[monthWx]?.[xingWx] || '休'
  
  return { gongWs, monthWs }
}

/**
 * 获取八门在宫位的旺衰 + 月令旺衰
 * 八门旺衰规则（标准）：当令者旺，我生者相，生我者休，克我者囚，我克者死
 */
export function getMenStatus(menName: string, gongNum: number, monthZhi: string): { gongWs: string; monthWs: string } {
  const menWx = MEN_WUXING[menName] || '土'
  const gongWx = GONG_WUXING[gongNum] || '土'
  const monthWx = ZHI_WX[monthZhi] || '土'
  
  // 八门落宫旺衰（标准表，以宫位五行为"令"）
  const gongWs = WANGSHUAI_MEN[gongWx]?.[menWx] || '休'
  // 八门月令旺衰（标准表，以月令五行为"令"）
  const monthWs = WANGSHUAI_MEN[monthWx]?.[menWx] || '休'
  
  return { gongWs, monthWs }
}

/**
 * 获取天干在宫位的十二长生
 */
export function getGanTwelveInGong(gan: string, gongNum: number): string {
  const gongZhi = GONG_DIZHI[gongNum]
  if (!gongZhi || !gan) return ''
  return getTwelveState(gan, gongZhi)
}

/**
 * 判断八门是否门迫（门克宫）
 */
export function isMenPo(menName: string, gongNum: number): boolean {
  const menWx = MEN_WUXING[menName] || '土'
  const gongWx = GONG_WUXING[gongNum] || '土'
  // 门克宫 = 门迫
  const KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
  return KE[menWx] === gongWx
}

export { GAN_WX, ZHI_WX }
