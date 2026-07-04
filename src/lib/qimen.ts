/**
 * 奇门遁甲排盘核心算法（转盘 - 拆补法）
 * 
 * 九宫布局（洛书）：
 *   4(巽) | 9(离) | 2(坤)
 *   3(震) | 5(中) | 7(兑)
 *   8(艮) | 1(坎) | 6(乾)
 *
 * 排盘步骤：
 *   1. 定阴阳遁（冬至→夏至为阳遁，夏至→冬至为阴遁）
 *   2. 定三元局数（上中下元 × 阳/阴 = 1-9局）
 *   3. 布地盘（三奇六仪按局数排入九宫）
 *   4. 定值符值使（时干所在宫位）
 *   5. 布天盘九星（值符星随时干转动）
 *   6. 布八门（值使门随时支转动）
 *   7. 布八神
 */

import { Solar } from 'lunar-javascript'

// ============================================================================
// 基础常量
// ============================================================================

// 三奇六仪（按顺序：戊己庚辛壬癸丁丙乙）
const SAN_QI_LIU_YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']

// 九星
const JIU_XING = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英']

// 八门
const BA_MEN = ['休门', '死门', '伤门', '杜门', '中门', '开门', '惊门', '生门', '景门']
// 实际八门排列（不含中）
const BA_MEN_ORDER = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门']

// 八神（阳遁）
const BA_SHEN_YANG = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']
// 八神（阴遁）
const BA_SHEN_YIN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']

// 洛书轨迹（阳遁顺飞）
const LUOSHU_YANG = [1, 8, 3, 4, 9, 2, 7, 6] // 不含5（中宫寄坤或寄坤艮）
// 九宫编号对应方位
const GONG_NAME = ['', '坎一宫', '坤二宫', '震三宫', '巽四宫', '中五宫', '乾六宫', '兑七宫', '艮八宫', '离九宫']

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
// 地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 旬首对应六仪
const XUN_SHOU: Record<string, string> = {
  '甲子': '戊', '甲戌': '己', '甲申': '庚',
  '甲午': '辛', '甲辰': '壬', '甲寅': '癸'
}

// 24节气与局数的对应关系（阳遁）
const YANG_DUN_JU: Record<string, number[]> = {
  '冬至': [1, 7, 4], '小寒': [2, 8, 5], '大寒': [3, 9, 6],
  '立春': [8, 5, 2], '雨水': [9, 6, 3], '惊蛰': [1, 7, 4],
  '春分': [3, 9, 6], '清明': [4, 1, 7], '谷雨': [5, 2, 8],
  '立夏': [4, 1, 7], '小满': [5, 2, 8], '芒种': [6, 3, 9],
}
// 阴遁
const YIN_DUN_JU: Record<string, number[]> = {
  '夏至': [9, 3, 6], '小暑': [8, 2, 5], '大暑': [7, 1, 4],
  '立秋': [2, 5, 8], '处暑': [1, 4, 7], '白露': [9, 3, 6],
  '秋分': [7, 1, 4], '寒露': [6, 9, 3], '霜降': [5, 8, 2],
  '立冬': [6, 9, 3], '小雪': [5, 8, 2], '大雪': [4, 7, 1],
}

// ============================================================================
// 数据结构
// ============================================================================
export interface QimenPalace {
  gongNumber: number     // 宫位编号 1-9
  gongName: string       // 宫位名
  diPanGan: string       // 地盘干
  tianPanGan: string     // 天盘干
  jiuXing: string        // 九星
  baMen: string          // 八门
  baShen: string         // 八神
  anGan?: string         // 暗干
  kongWang?: boolean     // 是否空亡
}

export interface QimenResult {
  // 基础信息
  isYangDun: boolean     // 是否阳遁
  juNumber: number       // 局数 (1-9)
  yuan: string           // 上/中/下元
  jieQi: string          // 当前节气
  
  // 四柱
  yearGZ: string
  monthGZ: string
  dayGZ: string
  hourGZ: string
  
  // 值符值使
  zhiFu: string          // 值符（星名）
  zhiShi: string         // 值使（门名）
  
  // 九宫数据
  palaces: QimenPalace[]
  
  // 旬首
  xunShou: string
  
  // 时间
  datetime: string
}

// ============================================================================
// 排盘核心逻辑
// ============================================================================

/** 获取旬首 */
function getXunShou(ganZhi: string): string {
  const ganIdx = TIAN_GAN.indexOf(ganZhi[0])
  const zhiIdx = DI_ZHI.indexOf(ganZhi[1])
  // 旬首的天干一定是甲，地支 = 当前地支 - 天干序号
  const xunZhiIdx = (zhiIdx - ganIdx + 12) % 12
  return '甲' + DI_ZHI[xunZhiIdx]
}

/** 获取时干对应的六仪 */
function getYiForHour(hourGZ: string): string {
  const xunShou = getXunShou(hourGZ)
  return XUN_SHOU[xunShou] || '戊'
}

/** 布地盘 */
function layoutDiPan(juNumber: number, isYangDun: boolean): string[] {
  // 地盘：从局数对应的宫位开始，按洛书轨迹排布三奇六仪
  // 九宫（排除中5）按洛书顺序：1,8,3,4,9,2,7,6（阳遁顺排）
  const order = isYangDun 
    ? [1, 8, 3, 4, 9, 2, 7, 6]  // 坎→艮→震→巽→离→坤→兑→乾
    : [1, 6, 7, 2, 9, 4, 3, 8]  // 坎→乾→兑→坤→离→巽→震→艮（逆）
  
  const diPan = new Array(10).fill('')  // index 1-9
  
  // 找到局数对应宫位的起始位置
  const startIdx = order.indexOf(juNumber)
  
  for (let i = 0; i < 9; i++) {
    if (i < 8) {
      const gongNum = order[(startIdx + i) % 8]
      diPan[gongNum] = SAN_QI_LIU_YI[i]
    }
  }
  // 中宫（5）寄坤二宫
  diPan[5] = diPan[2]
  
  return diPan
}

/** 主排盘函数 */
export function calculateQimen(date?: Date): QimenResult {
  const d = date || new Date()
  const solar = Solar.fromDate(d)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()
  
  const yearGZ = eightChar.getYear()
  const monthGZ = eightChar.getMonth()
  const dayGZ = eightChar.getDay()
  const hourGZ = eightChar.getTime()
  
  // 获取节气
  const jieQi = lunar.getPrevJieQi()?.getName() || '冬至'
  
  // 判断阴阳遁
  const yangJieQi = Object.keys(YANG_DUN_JU)
  const isYangDun = yangJieQi.includes(jieQi)
  
  // 确定局数（简化：用上元）
  const juTable = isYangDun ? YANG_DUN_JU : YIN_DUN_JU
  const juNumbers = juTable[jieQi] || [1, 7, 4]
  
  // 三元判断（简化：根据日干支序号 mod 3）
  const dayGanIdx = TIAN_GAN.indexOf(dayGZ[0])
  const yuanIdx = dayGanIdx % 3  // 0=上元, 1=中元, 2=下元
  const yuan = ['上', '中', '下'][yuanIdx]
  const juNumber = juNumbers[yuanIdx]
  
  // 布地盘
  const diPan = layoutDiPan(juNumber, isYangDun)
  
  // 获取时干六仪
  const hourYi = getYiForHour(hourGZ)
  
  // 找到时干六仪在地盘中的宫位
  let hourYiGong = 1
  for (let i = 1; i <= 9; i++) {
    if (diPan[i] === hourYi) {
      hourYiGong = i
      break
    }
  }
  
  // 值符（时干落宫对应的九星）
  const zhiFuIdx = hourYiGong - 1
  const zhiFu = JIU_XING[zhiFuIdx] || '天蓬'
  
  // 值使（时干落宫对应的八门）
  const zhiShi = BA_MEN[zhiFuIdx] || '休门'
  
  // 天盘布局（值符星随时干转入时干落宫）
  // 简化：天盘干 = 地盘干旋转后的结果
  const tianPan = new Array(10).fill('')
  const shift = hourYiGong - 1
  const order = [1, 8, 3, 4, 9, 2, 7, 6]
  for (let i = 0; i < 8; i++) {
    const fromGong = order[i]
    const toGong = order[(i + shift) % 8]
    tianPan[toGong] = diPan[fromGong]
  }
  tianPan[5] = tianPan[2] // 中宫寄坤
  
  // 构建九宫数据
  const palaces: QimenPalace[] = []
  for (let g = 1; g <= 9; g++) {
    palaces.push({
      gongNumber: g,
      gongName: GONG_NAME[g],
      diPanGan: diPan[g] || '',
      tianPanGan: tianPan[g] || diPan[g] || '',
      jiuXing: JIU_XING[(g - 1) % 9],
      baMen: g === 5 ? '中' : BA_MEN_ORDER[(g - 1) % 8],
      baShen: BA_SHEN_YANG[(g - 1) % 8],
    })
  }
  
  return {
    isYangDun,
    juNumber,
    yuan,
    jieQi,
    yearGZ, monthGZ, dayGZ, hourGZ,
    zhiFu,
    zhiShi,
    palaces,
    xunShou: getXunShou(hourGZ),
    datetime: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
}

export { JIU_XING, BA_MEN, BA_MEN_ORDER, BA_SHEN_YANG, GONG_NAME }
