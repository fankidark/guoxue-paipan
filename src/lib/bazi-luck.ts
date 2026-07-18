/**
 * 大运/流年/流月/流日 四级时间轴 + 精确起运
 * 基于 lunar-javascript 的 Yun/DaYun/LiuNian API
 */
import { Solar } from 'lunar-javascript'
import { getShiShen } from './bazi'

export interface LuckStep {
  ganZhi: string
  gan: string
  zhi: string
  shiShen: string       // 天干十神（相对日主）
  startYear: number
  startAge: number
  endYear: number
  endAge: number
  isXiaoYun?: boolean   // 是否小运期（上运前）
}

export interface LiuNianItem {
  year: number
  age: number
  ganZhi: string
  shiShen: string
}

export interface LiuYueItem {
  monthLabel: string    // 节气名，如"立春"
  ganZhi: string
  shiShen: string
  dateLabel: string     // "2/4"
}

export interface LuckResult {
  startDesc: string     // "出生后8年4个月10天起运"
  startSolarDate: string
  jiaoYunDesc: string   // 交运描述
  siLing: string        // 人元司令（当日用事之干）
  daYun: LuckStep[]     // 含第0步小运期
  xiaoYun: LiuNianItem[] // 小运逐年
}

/** 计算完整大运信息 */
export function calculateLuck(
  year: number, month: number, day: number,
  hour: number, minute: number,
  gender: '男' | '女'
): LuckResult {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const dayGan = ec.getDay()[0]

  const yun = ec.getYun(gender === '男' ? 1 : 0)
  const startDesc = `出生后${yun.getStartYear()}年${yun.getStartMonth()}个月${yun.getStartDay()}天起运`
  const startSolarDate = yun.getStartSolar().toYmd()

  const daYunArr = yun.getDaYun()
  const daYun: LuckStep[] = daYunArr.slice(0, 10).map((d: any) => {
    const gz = d.getGanZhi() as string
    return {
      ganZhi: gz || '小运',
      gan: gz ? gz[0] : '',
      zhi: gz ? gz[1] : '',
      shiShen: gz ? getShiShen(dayGan, gz[0]) : '',
      startYear: d.getStartYear(),
      startAge: d.getStartAge(),
      endYear: d.getEndYear(),
      endAge: d.getEndAge(),
      isXiaoYun: !gz,
    }
  })

  // 小运（第0步内逐年）
  const xiaoYun: LiuNianItem[] = daYunArr[0].getXiaoYun().map((x: any) => ({
    year: x.getYear(),
    age: x.getYear() - year + 1,
    ganZhi: x.getGanZhi(),
    shiShen: getShiShen(dayGan, x.getGanZhi()[0]),
  }))

  // 人元司令（近似：按节气深度查分野表）
  const siLing = getSiLing(lunar)

  // 交运描述（起运节气）
  const jiaoYunDesc = `${startSolarDate.split('-')[0]}年${startSolarDate.split('-')[1]}月交运`

  return { startDesc, startSolarDate, jiaoYunDesc, siLing, daYun, xiaoYun }
}

/** 某步大运内的流年列表 */
export function getLiuNian(
  year: number, month: number, day: number,
  hour: number, minute: number,
  gender: '男' | '女', daYunIndex: number
): LiuNianItem[] {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
  const ec = solar.getLunar().getEightChar()
  const dayGan = ec.getDay()[0]
  const yun = ec.getYun(gender === '男' ? 1 : 0)
  const dy = yun.getDaYun()[daYunIndex]
  if (!dy) return []
  return dy.getLiuNian().map((l: any) => ({
    year: l.getYear(),
    age: l.getAge(),
    ganZhi: l.getGanZhi(),
    shiShen: getShiShen(dayGan, l.getGanZhi()[0]),
  }))
}

/** 某年的流月（12节气月） */
export function getLiuYue(dayGan: string, targetYear: number): LiuYueItem[] {
  // 流月干支 = 该年各节气月干支。用当年立春后任一天推月柱起点：五虎遁
  const JIE_LABELS = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒']
  const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const DI_ZHI_M = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  // 年干（立春分界）
  const solar = Solar.fromYmdHms(targetYear, 6, 1, 12, 0, 0) // 年中取年干支稳妥
  const yearGan = solar.getLunar().getEightChar().getYear()[0]
  // 五虎遁：甲己丙作首 乙庚戊 丙辛庚 丁壬壬 戊癸甲
  const WUHU: Record<string, number> = { '甲': 2, '己': 2, '乙': 4, '庚': 4, '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0 }
  const firstGanIdx = WUHU[yearGan]

  // 各节气日期
  const items: LiuYueItem[] = []
  for (let i = 0; i < 12; i++) {
    const ganIdx = (firstGanIdx + i) % 10
    const gz = TIAN_GAN[ganIdx] + DI_ZHI_M[i]
    items.push({
      monthLabel: JIE_LABELS[i],
      ganZhi: gz,
      shiShen: getShiShen(dayGan, gz[0]),
      dateLabel: '',
    })
  }
  return items
}

/** 某月的流日（前后30天） */
export interface LiuRiItem { dateLabel: string; ganZhi: string; shiShen: string }
export function getLiuRi(dayGan: string, y: number, m: number, d: number, count = 15): LiuRiItem[] {
  const items: LiuRiItem[] = []
  const solar = Solar.fromYmd(y, m, d)
  let cur = solar
  for (let i = 0; i < count; i++) {
    const gz = cur.getLunar().getDayInGanZhi()
    items.push({
      dateLabel: `${cur.getMonth()}/${cur.getDay()}`,
      ganZhi: gz,
      shiShen: getShiShen(dayGan, gz[0]),
    })
    cur = cur.next(1)
  }
  return items
}

// ============================================================================
// 人元司令分野（月支藏干轮值：三命通会口径）
// ============================================================================

/** 每月分野表：[干, 天数][]，按节气后天数轮值 */
const SI_LING_TABLE: Record<string, Array<[string, number]>> = {
  '寅': [['戊', 5], ['丙', 5], ['甲', 20]],
  '卯': [['甲', 7], ['乙', 23]],
  '辰': [['乙', 7], ['壬', 5], ['戊', 18]],
  '巳': [['戊', 7], ['庚', 5], ['丙', 18]],
  '午': [['丙', 7], ['丁', 23]],
  '未': [['丁', 7], ['甲', 5], ['己', 18]],
  '申': [['戊', 5], ['壬', 5], ['庚', 20]],
  '酉': [['庚', 7], ['辛', 23]],
  '戌': [['辛', 7], ['丙', 5], ['戊', 18]],
  '亥': [['戊', 5], ['甲', 5], ['壬', 20]],
  '子': [['壬', 7], ['癸', 23]],
  '丑': [['癸', 7], ['庚', 5], ['己', 18]],
}

function getSiLing(lunar: any): string {
  const monthZhi = lunar.getEightChar().getMonth()[1]
  const table = SI_LING_TABLE[monthZhi]
  if (!table) return ''
  // 节气后天数
  const prevJie = lunar.getPrevJie()
  const jieSolar = prevJie.getSolar()
  const solar = lunar.getSolar()
  const days = Math.floor(
    (Date.UTC(solar.getYear(), solar.getMonth() - 1, solar.getDay()) -
      Date.UTC(jieSolar.getYear(), jieSolar.getMonth() - 1, jieSolar.getDay())) / 86400000
  )
  let acc = 0
  for (const [gan, n] of table) {
    acc += n
    if (days < acc) return gan
  }
  return table[table.length - 1][0]
}

/** 获取司令干的完整描述（如"癸水用事"） */
export function getSiLingDesc(gan: string): string {
  const WX: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' }
  return gan ? `${gan}${WX[gan]}用事` : ''
}
