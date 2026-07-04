/**
 * 奇门遁甲排盘核心算法（转盘 - 重写版）
 * 
 * 严格按照以下步骤：
 *   1. 定局（节气 + 三元 → 阳/阴遁几局）
 *   2. 排地盘干（戊从局数宫起，阳顺阴逆排三奇六仪）
 *   3. 排天盘干（时干旬首六仪在地盘的宫 → 天盘值符落宫 → 旋转）
 *   4. 排九星（地盘值符宫本位星 → 移到天盘值符宫 → 顺时针）
 *   5. 排八门（值使门从旬首宫起数到时干宫 → 顺时针排）
 *   6. 排八神（天盘值符宫起值符 → 顺时针排）
 */

import { Solar } from 'lunar-javascript'

// ============================================================================
// 基础常量
// ============================================================================
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 三奇六仪顺序（排地盘用）
const SAN_QI_LIU_YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']

// 九宫顺序（1-9，用于阳遁顺排）
const GONG_SHUN = [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 外八宫顺时针顺序（不含中5）
const OUTER_CW = [1, 8, 3, 4, 9, 2, 7, 6]

// 九星本位宫
const XING_NAMES = ['天蓬', '天任', '天冲', '天辅', '天英', '天芮', '天柱', '天心', '天禽']
const XING_NATIVE_GONG: Record<string, number> = {
  '天蓬': 1, '天任': 8, '天冲': 3, '天辅': 4,
  '天英': 9, '天芮': 2, '天柱': 7, '天心': 6, '天禽': 5
}

// 八门本位宫
const MEN_NAMES = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门']
const MEN_NATIVE_GONG: Record<string, number> = {
  '休门': 1, '生门': 8, '伤门': 3, '杜门': 4,
  '景门': 9, '死门': 2, '惊门': 7, '开门': 6
}

// 八神顺序
const BA_SHEN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天']

// 宫位对应卦名
const GONG_GUA: Record<number, string> = {
  1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离'
}

// 旬首 → 六仪
const XUN_SHOU_YI: Record<string, string> = {
  '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸'
}

// 节气局数表
const JU_TABLE: Record<string, { dun: 'yang' | 'yin'; ju: number[] }> = {
  '冬至': { dun: 'yang', ju: [1, 7, 4] }, '小寒': { dun: 'yang', ju: [2, 8, 5] },
  '大寒': { dun: 'yang', ju: [3, 9, 6] }, '立春': { dun: 'yang', ju: [8, 5, 2] },
  '雨水': { dun: 'yang', ju: [9, 6, 3] }, '惊蛰': { dun: 'yang', ju: [1, 7, 4] },
  '春分': { dun: 'yang', ju: [3, 9, 6] }, '清明': { dun: 'yang', ju: [4, 1, 7] },
  '谷雨': { dun: 'yang', ju: [5, 2, 8] }, '立夏': { dun: 'yang', ju: [4, 1, 7] },
  '小满': { dun: 'yang', ju: [5, 2, 8] }, '芒种': { dun: 'yang', ju: [6, 3, 9] },
  '夏至': { dun: 'yin', ju: [9, 3, 6] }, '小暑': { dun: 'yin', ju: [8, 2, 5] },
  '大暑': { dun: 'yin', ju: [7, 1, 4] }, '立秋': { dun: 'yin', ju: [2, 5, 8] },
  '处暑': { dun: 'yin', ju: [1, 4, 7] }, '白露': { dun: 'yin', ju: [9, 3, 6] },
  '秋分': { dun: 'yin', ju: [7, 1, 4] }, '寒露': { dun: 'yin', ju: [6, 9, 3] },
  '霜降': { dun: 'yin', ju: [5, 8, 2] }, '立冬': { dun: 'yin', ju: [6, 9, 3] },
  '小雪': { dun: 'yin', ju: [5, 8, 2] }, '大雪': { dun: 'yin', ju: [4, 7, 1] },
}

// 符头与三元判断
const FU_TOU_YUAN: Record<string, number> = {
  '甲子': 0, '己卯': 0, '甲午': 0, '己酉': 0, // 上元
  '甲寅': 1, '己巳': 1, '甲申': 1, '己亥': 1, // 中元
  '甲辰': 2, '己未': 2, '甲戌': 2, '己丑': 2, // 下元
}

// ============================================================================
// 数据结构
// ============================================================================
export interface QimenPalace {
  gongNumber: number
  gongName: string
  diPanGan: string    // 地盘干
  tianPanGan: string  // 天盘干
  jiuXing: string     // 九星
  baMen: string       // 八门
  baShen: string      // 八神
}

export interface QimenResult {
  isYangDun: boolean
  juNumber: number
  yuan: string
  jieQi: string
  yearGZ: string
  monthGZ: string
  dayGZ: string
  hourGZ: string
  zhiFu: string       // 值符星
  zhiShi: string      // 值使门
  palaces: QimenPalace[]
  xunShou: string
  datetime: string
}

// ============================================================================
// 辅助函数
// ============================================================================

/** 获取旬首 */
function getXunShou(gz: string): string {
  const ganIdx = TIAN_GAN.indexOf(gz[0])
  const zhiIdx = DI_ZHI.indexOf(gz[1])
  const xunZhiIdx = (zhiIdx - ganIdx + 12) % 12
  return '甲' + DI_ZHI[xunZhiIdx]
}

/** 获取符头（五天为一组的组首） */
function getFuTou(dayGZ: string): string {
  const ganIdx = TIAN_GAN.indexOf(dayGZ[0])
  const zhiIdx = DI_ZHI.indexOf(dayGZ[1])
  // 符头的天干序号 = 当前天干序号 - (当前天干序号 % 5) * 但要按5天一组
  // 实际：60甲子中每5个一组
  const sixtyIdx = (ganIdx * 12 + zhiIdx) // 不对，用标准方法
  // 标准方法：甲子=0, 乙丑=1, ... 通过 (ganIdx - zhiIdx + 60) % 60 不行
  // 正确：六十甲子序号 = (ganIdx * 6 + zhiIdx / 2) 也不对
  // 最简单：遍历查找
  const gan = dayGZ[0]
  const zhi = dayGZ[1]
  const gi = TIAN_GAN.indexOf(gan)
  const zi = DI_ZHI.indexOf(zhi)
  // 回退到组首（每5天一组）
  const offset = gi % 5
  const fuGanIdx = gi - offset
  const fuZhiIdx = (zi - offset + 12) % 12
  return TIAN_GAN[fuGanIdx] + DI_ZHI[fuZhiIdx]
}

/** 外八宫中获取某宫的顺时针下一宫 */
function nextGongCW(gong: number): number {
  const idx = OUTER_CW.indexOf(gong)
  if (idx < 0) return 2 // 中宫寄坤
  return OUTER_CW[(idx + 1) % 8]
}

/** 从某宫开始，按外八宫顺时针获取第 n 个宫 */
function getGongCW(startGong: number, steps: number): number {
  const idx = OUTER_CW.indexOf(startGong)
  if (idx < 0) return 2
  return OUTER_CW[(idx + steps) % 8]
}

/** 按九宫数字顺序（1→2→3→...→9）获取第 n 步 */
function getGongShun(startGong: number, steps: number): number {
  const idx = GONG_SHUN.indexOf(startGong)
  return GONG_SHUN[(idx + steps) % 9]
}

// ============================================================================
// 核心排盘
// ============================================================================
export function calculateQimen(date?: Date): QimenResult {
  const d = date || new Date()
  const solar = Solar.fromDate(d)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()
  
  const yearGZ = eightChar.getYear()
  const monthGZ = eightChar.getMonth()
  const dayGZ = eightChar.getDay()
  const hourGZ = eightChar.getTime()

  // === 第一步：定局 ===
  const jieQi = lunar.getPrevJieQi()?.getName() || '冬至'
  const juInfo = JU_TABLE[jieQi] || { dun: 'yang', ju: [1, 7, 4] }
  const isYangDun = juInfo.dun === 'yang'
  
  // 三元判断（通过符头）
  const fuTou = getFuTou(dayGZ)
  const yuanIdx = FU_TOU_YUAN[fuTou] ?? 0
  const yuan = ['上', '中', '下'][yuanIdx]
  const juNumber = juInfo.ju[yuanIdx]

  // === 第二步：排地盘干 ===
  const diPan: Record<number, string> = {}
  for (let i = 0; i < 9; i++) {
    let gong: number
    if (isYangDun) {
      // 阳遁顺排：从局数宫开始，按 1→2→3→4→5→6→7→8→9 顺序
      gong = getGongShun(juNumber, i)
    } else {
      // 阴遁逆排：从局数宫开始，按 9→8→7→6→5→4→3→2→1 逆序
      gong = getGongShun(juNumber, -i + 9 * 9) // 等价于往回走
      // 正确的阴遁：从局数宫开始，按 9,8,7,6,5,4,3,2,1 排
      const reverseOrder = [9, 8, 7, 6, 5, 4, 3, 2, 1]
      const startIdx = reverseOrder.indexOf(juNumber)
      gong = reverseOrder[(startIdx + i) % 9]
    }
    diPan[gong] = SAN_QI_LIU_YI[i]
  }
  // 阳遁修正（简化版重新实现）
  if (isYangDun) {
    // 戊从 juNumber 宫起，按 1→2→3→4→5→6→7→8→9 排
    for (let i = 0; i < 9; i++) {
      const gong = ((juNumber - 1 + i) % 9) + 1
      diPan[gong] = SAN_QI_LIU_YI[i]
    }
  } else {
    // 阴遁：戊从 juNumber 宫起，按 9→8→7→6→5→4→3→2→1 排
    for (let i = 0; i < 9; i++) {
      const gong = ((juNumber - 1 - i + 9) % 9) + 1
      diPan[gong] = SAN_QI_LIU_YI[i]
    }
  }

  // === 第三步：排天盘干 ===
  // 找时干旬首和对应六仪
  const xunShou = getXunShou(hourGZ)
  const xunYi = XUN_SHOU_YI[xunShou] || '戊'
  
  // 找旬首六仪在地盘的宫位 → 这是值符星的原始宫
  let zhiFuOrigGong = 1
  for (let g = 1; g <= 9; g++) {
    if (diPan[g] === xunYi) { zhiFuOrigGong = g; break }
  }
  
  // 找时干（或时干对应六仪）在地盘的宫位 → 天盘值符落宫
  const hourGan = hourGZ[0]
  // 时干如果是甲，用旬首六仪代替
  const hourGanInPan = hourGan === '甲' ? xunYi : hourGan
  // 找时干在地盘哪个宫
  let zhiFuDestGong = 1
  for (let g = 1; g <= 9; g++) {
    if (diPan[g] === hourGanInPan) { zhiFuDestGong = g; break }
  }
  
  // 天盘干：将地盘以值符原宫为起点的排列，旋转到值符目标宫
  const tianPan: Record<number, string> = {}
  // 计算旋转步数（在外八宫中）
  const origIdx = OUTER_CW.indexOf(zhiFuOrigGong)
  const destIdx = OUTER_CW.indexOf(zhiFuDestGong)
  
  if (origIdx >= 0 && destIdx >= 0) {
    const shift = (destIdx - origIdx + 8) % 8
    for (let i = 0; i < 8; i++) {
      const fromGong = OUTER_CW[i]
      const toGong = OUTER_CW[(i + shift) % 8]
      tianPan[toGong] = diPan[fromGong]
    }
  } else {
    // 如果值符在中宫（寄坤2），特殊处理
    for (let g = 1; g <= 9; g++) tianPan[g] = diPan[g]
  }
  // 中宫天盘 = 中宫地盘
  tianPan[5] = diPan[5]

  // === 第四步：排九星 ===
  // 值符星 = 值符原宫的本位星
  let zhiFuXing = ''
  for (const [xing, gong] of Object.entries(XING_NATIVE_GONG)) {
    if (gong === zhiFuOrigGong) { zhiFuXing = xing; break }
  }
  if (zhiFuOrigGong === 5) zhiFuXing = '天禽'
  
  // 值符星移到天盘值符目标宫，其余按外八宫顺时针排
  const xingInGong: Record<number, string> = {}
  const outerXing = XING_NAMES.filter(x => x !== '天禽' && x !== zhiFuXing)
  
  // 值符星原宫在外八宫的位置
  const zhiFuXingOrigIdx = OUTER_CW.indexOf(XING_NATIVE_GONG[zhiFuXing] || zhiFuOrigGong)
  // 其余星按本位宫顺时针排列
  const xingOrder: string[] = []
  for (let i = 1; i < 8; i++) {
    const nativeGong = OUTER_CW[(zhiFuXingOrigIdx + i) % 8]
    for (const [xing, gong] of Object.entries(XING_NATIVE_GONG)) {
      if (gong === nativeGong && xing !== '天禽') { xingOrder.push(xing); break }
    }
  }
  
  // 放置值符星
  xingInGong[zhiFuDestGong] = zhiFuXing
  // 其余星从值符目标宫顺时针放
  const destCWIdx = OUTER_CW.indexOf(zhiFuDestGong)
  for (let i = 0; i < xingOrder.length; i++) {
    const gong = OUTER_CW[(destCWIdx + i + 1) % 8]
    xingInGong[gong] = xingOrder[i]
  }
  // 中宫放天禽
  xingInGong[5] = '天禽'

  // === 第五步：排八门 ===
  // 值使门 = 值符原宫的本位门
  let zhiShiMen = ''
  for (const [men, gong] of Object.entries(MEN_NATIVE_GONG)) {
    if (gong === zhiFuOrigGong) { zhiShiMen = men; break }
  }
  if (zhiFuOrigGong === 5) zhiShiMen = '死门' // 中宫寄坤，本位死门
  
  // 值使门落宫：从值符原宫起甲子（旬首），按九宫顺序数到时干
  // 计算时干在旬中的序号（甲子=1, 乙丑=2, ... 庚午=7）
  const hourGanIdx = TIAN_GAN.indexOf(hourGZ[0])
  const xunGanIdx = TIAN_GAN.indexOf(xunShou[0]) // 甲=0
  let stepsToHour = (hourGanIdx - xunGanIdx + 10) % 10 // 从旬首到时干的步数
  
  // 从值符原宫起，按九宫顺序数 stepsToHour 步
  let zhiShiDestGong = zhiFuOrigGong
  for (let i = 0; i < stepsToHour; i++) {
    zhiShiDestGong = ((zhiShiDestGong) % 9) + 1 // 按 1→2→3→...→9→1 顺序
    // 跳过中宫5（中宫寄坤2）
    if (zhiShiDestGong === 5) zhiShiDestGong = ((zhiShiDestGong) % 9) + 1
  }
  
  // 八门排列：值使门放到目标宫，其余按外八宫顺时针排
  const menInGong: Record<number, string> = {}
  const otherMen = MEN_NAMES.filter(m => m !== zhiShiMen)
  
  // 值使门本位宫在外八宫中的索引
  const zhiShiNativeIdx = OUTER_CW.indexOf(MEN_NATIVE_GONG[zhiShiMen] || 1)
  const menOrder: string[] = []
  for (let i = 1; i < 8; i++) {
    const nativeGong = OUTER_CW[(zhiShiNativeIdx + i) % 8]
    for (const [men, gong] of Object.entries(MEN_NATIVE_GONG)) {
      if (gong === nativeGong) { menOrder.push(men); break }
    }
  }
  
  menInGong[zhiShiDestGong] = zhiShiMen
  const menDestCWIdx = OUTER_CW.indexOf(zhiShiDestGong)
  for (let i = 0; i < menOrder.length; i++) {
    const gong = OUTER_CW[(menDestCWIdx + i + 1) % 8]
    menInGong[gong] = menOrder[i]
  }
  menInGong[5] = '中' // 中宫无门

  // === 第六步：排八神 ===
  // 值符（八神）从天盘值符目标宫起，按外八宫顺时针排
  const shenInGong: Record<number, string> = {}
  const shenDestIdx = OUTER_CW.indexOf(zhiFuDestGong)
  for (let i = 0; i < 8; i++) {
    const gong = OUTER_CW[(shenDestIdx + i) % 8]
    shenInGong[gong] = BA_SHEN[i]
  }
  shenInGong[5] = shenInGong[2] || '白虎' // 中宫寄坤

  // === 构建结果 ===
  const palaces: QimenPalace[] = []
  for (let g = 1; g <= 9; g++) {
    palaces.push({
      gongNumber: g,
      gongName: GONG_GUA[g],
      diPanGan: diPan[g] || '',
      tianPanGan: tianPan[g] || diPan[g] || '',
      jiuXing: xingInGong[g] || '天禽',
      baMen: menInGong[g] || '中',
      baShen: shenInGong[g] || '值符',
    })
  }

  return {
    isYangDun,
    juNumber,
    yuan,
    jieQi,
    yearGZ, monthGZ, dayGZ, hourGZ,
    zhiFu: zhiFuXing,
    zhiShi: zhiShiMen,
    palaces,
    xunShou,
    datetime: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
}

export { GONG_GUA, XING_NAMES as JIU_XING, MEN_NAMES as BA_MEN, BA_SHEN }
