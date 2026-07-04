/**
 * 八字排盘核心算法
 * 基于 lunar-javascript 库，扩展十神、大运、五行旺衰计算
 */
import { Solar, Lunar } from 'lunar-javascript'

// ============================================================================
// 基础常量
// ============================================================================
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const WU_XING = ['木', '火', '土', '金', '水']
const SHI_CHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 天干对应五行
const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

// 天干阴阳
const GAN_YINYANG: Record<string, string> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
}

// 地支对应五行
const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

// 地支藏干
const ZHI_CANG_GAN: Record<string, string[]> = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
  '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
  '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
}

// 十神对照（以日主为基准）
// 生我为印，我生为食伤，克我为官杀，我克为财，同我为比劫
const SHISHEN_MAP: Record<string, string> = {
  '同阳': '比肩', '同阴': '劫财',
  '生阳': '偏印', '生阴': '正印',
  '泄阳': '食神', '泄阴': '伤官',
  '克阳': '偏官', '克阴': '正官',
  '财阳': '偏财', '财阴': '正财'
}

// 五行相生相克
const SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }

// 十二长生
const TWELVE_STATES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']
const TWELVE_START: Record<string, number> = {
  '甲': 0, '丙': 2, '戊': 2, '庚': 7, '壬': 9, // 阳干
  '乙': 7, '丁': 9, '己': 9, '辛': 0, '癸': 2  // 阴干（逆行）
}

// ============================================================================
// 核心计算函数
// ============================================================================

/** 计算十神 */
export function getShiShen(dayGan: string, targetGan: string): string {
  const dayWx = GAN_WUXING[dayGan]
  const targetWx = GAN_WUXING[targetGan]
  const dayYy = GAN_YINYANG[dayGan]
  const targetYy = GAN_YINYANG[targetGan]
  const sameYy = dayYy === targetYy

  if (dayWx === targetWx) return sameYy ? '比肩' : '劫财'
  if (SHENG[targetWx] === dayWx) return sameYy ? '偏印' : '正印' // 生我
  if (SHENG[dayWx] === targetWx) return sameYy ? '食神' : '伤官' // 我生
  if (KE[targetWx] === dayWx) return sameYy ? '偏官' : '正官' // 克我（七杀/正官）
  if (KE[dayWx] === targetWx) return sameYy ? '偏财' : '正财' // 我克
  return ''
}

/** 计算十二长生状态 */
export function getTwelveState(dayGan: string, zhi: string): string {
  const zhiIdx = DI_ZHI.indexOf(zhi)
  const startIdx = TWELVE_START[dayGan]
  if (startIdx === undefined) return ''
  
  const isYang = GAN_YINYANG[dayGan] === '阳'
  let stateIdx: number
  if (isYang) {
    stateIdx = (zhiIdx - startIdx + 12) % 12
  } else {
    stateIdx = (startIdx - zhiIdx + 12) % 12
  }
  return TWELVE_STATES[stateIdx]
}

/** 纳音五行 */
const NAYIN_TABLE: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水', '甲午': '沙中金', '乙未': '沙中金',
  '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
}

// ============================================================================
// 柱位数据结构
// ============================================================================
export interface Pillar {
  ganZhi: string
  gan: string
  zhi: string
  ganWuXing: string
  zhiWuXing: string
  ganYinYang: string
  naYin: string
  shiShen: string         // 天干十神（相对日主）
  cangGan: Array<{
    gan: string
    wuXing: string
    shiShen: string
  }>
  twelveState: string     // 十二长生
}

export interface DaYun {
  ganZhi: string
  startAge: number
  startYear: number
  endAge: number
  shiShen: string
}

export interface BaziResult {
  // 四柱
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
  
  // 日主信息
  dayMaster: { gan: string; wuXing: string; yinYang: string }
  
  // 大运
  daYun: DaYun[]
  
  // 五行统计
  wuXingCount: Record<string, number>
  wuXingPower: Record<string, number>
  
  // 元数据
  startDaYunAge: number
  gender: '男' | '女'
  lunarDate: string
  solarDate: string
}

// ============================================================================
// 主排盘函数
// ============================================================================
export function calculateBazi(
  year: number, month: number, day: number,
  hour: number, minute: number,
  gender: '男' | '女'
): BaziResult {
  // 使用 lunar-javascript 获取基础八字
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  const yearGZ = eightChar.getYear()
  const monthGZ = eightChar.getMonth()
  const dayGZ = eightChar.getDay()
  const hourGZ = eightChar.getTime()

  const dayGan = dayGZ[0]

  // 构建四柱
  const buildPillar = (gz: string): Pillar => {
    const gan = gz[0]
    const zhi = gz[1]
    const cangGanList = ZHI_CANG_GAN[zhi] || []
    return {
      ganZhi: gz,
      gan, zhi,
      ganWuXing: GAN_WUXING[gan],
      zhiWuXing: ZHI_WUXING[zhi],
      ganYinYang: GAN_YINYANG[gan],
      naYin: NAYIN_TABLE[gz] || '',
      shiShen: gan === dayGan ? '日主' : getShiShen(dayGan, gan),
      cangGan: cangGanList.map(g => ({
        gan: g,
        wuXing: GAN_WUXING[g],
        shiShen: getShiShen(dayGan, g)
      })),
      twelveState: getTwelveState(dayGan, zhi)
    }
  }

  const yearPillar = buildPillar(yearGZ)
  const monthPillar = buildPillar(monthGZ)
  const dayPillar = buildPillar(dayGZ)
  const hourPillar = buildPillar(hourGZ)

  // 五行统计
  const wuXingCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  const allGans = [yearGZ[0], monthGZ[0], dayGZ[0], hourGZ[0]]
  const allZhis = [yearGZ[1], monthGZ[1], dayGZ[1], hourGZ[1]]
  
  allGans.forEach(g => { wuXingCount[GAN_WUXING[g]]++ })
  allZhis.forEach(z => { wuXingCount[ZHI_WUXING[z]]++ })

  // 五行力量（含藏干权重）
  const wuXingPower: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  allGans.forEach(g => { wuXingPower[GAN_WUXING[g]] += 10 })
  allZhis.forEach(z => {
    const cg = ZHI_CANG_GAN[z] || []
    const weights = cg.length === 1 ? [10] : cg.length === 2 ? [7, 3] : [6, 3, 1]
    cg.forEach((g, i) => { wuXingPower[GAN_WUXING[g]] += weights[i] })
  })

  // 大运计算
  const daYun = calculateDaYun(eightChar, gender, year)

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster: {
      gan: dayGan,
      wuXing: GAN_WUXING[dayGan],
      yinYang: GAN_YINYANG[dayGan]
    },
    daYun,
    wuXingCount,
    wuXingPower,
    startDaYunAge: daYun.length > 0 ? daYun[0].startAge : 0,
    gender,
    lunarDate: lunar.toString(),
    solarDate: solar.toYmd()
  }
}

/** 大运计算 */
function calculateDaYun(eightChar: any, gender: '男' | '女', birthYear: number): DaYun[] {
  const dayGan = eightChar.getDay()[0]
  const yearGan = eightChar.getYear()[0]
  const isYangYear = GAN_YINYANG[yearGan] === '阳'
  
  // 男命阳年顺行，阴年逆行；女命反之
  const isForward = (gender === '男') === isYangYear

  // 月柱干支索引
  const monthGZ = eightChar.getMonth()
  const monthGanIdx = TIAN_GAN.indexOf(monthGZ[0])
  const monthZhiIdx = DI_ZHI.indexOf(monthGZ[1])

  // 起运年龄（简化：按3天=1年的近似计算，实际应精确到节气）
  // 这里用 lunar-javascript 的大运方法获取
  const startAge = 1 // 默认1岁起运，后续精确化

  const result: DaYun[] = []
  for (let i = 0; i < 10; i++) {
    const step = isForward ? i + 1 : -(i + 1)
    const ganIdx = ((monthGanIdx + step) % 10 + 10) % 10
    const zhiIdx = ((monthZhiIdx + step) % 12 + 12) % 12
    const gz = TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx]
    
    result.push({
      ganZhi: gz,
      startAge: startAge + i * 10,
      startYear: birthYear + startAge + i * 10,
      endAge: startAge + (i + 1) * 10 - 1,
      shiShen: getShiShen(dayGan, TIAN_GAN[ganIdx])
    })
  }

  return result
}

// ============================================================================
// 导出工具函数
// ============================================================================
export { TIAN_GAN, DI_ZHI, WU_XING, GAN_WUXING, GAN_YINYANG, ZHI_WUXING, ZHI_CANG_GAN }
