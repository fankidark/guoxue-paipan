/**
 * 八字算法回归测试 — 命例：1994-01-01 12:00 男（对齐小南斗App截图）
 * 运行: npx tsx tests/verify-bazi.mts
 */
import { calculateBazi } from '../src/lib/bazi'
import { getGanRelations, getZhiRelations } from '../src/lib/bazi-relations'
import { getAllShenSha } from '../src/lib/bazi-shensha'
import {
  getWangShuai, getXiJi, getGeJu, getTiaoHou,
  getShiShenCombo, getWeakOrgans, getTianDiShu, trueSolarOffsetMinutes,
  getMingGongApp, getShenGongApp
} from '../src/lib/bazi-analysis'
import { calculateLuck, getSiLingDesc } from '../src/lib/bazi-luck'

let pass = 0, fail = 0
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected)
  if (a === e) { pass++; console.log(`✓ ${name}: ${a}`) }
  else { fail++; console.log(`✗ ${name}: got ${a}, want ${e}`) }
}
function checkContains(name: string, actual: string[], expected: string[]) {
  const missing = expected.filter(x => !actual.includes(x))
  if (!missing.length) { pass++; console.log(`✓ ${name}: 含 ${expected.join(',')}`) }
  else { fail++; console.log(`✗ ${name}: 缺 ${missing.join(',')} (实际: ${actual.join(',')})`) }
}

const r = calculateBazi(1994, 1, 1, 12, 0, '男')

// 四柱
check('年柱', r.year.ganZhi, '癸酉')
check('月柱', r.month.ganZhi, '甲子')
check('日柱', r.day.ganZhi, '丁亥')
check('时柱', r.hour.ganZhi, '丙午')

// 主星
check('年干十神', r.year.shiShen, '偏官')  // 七杀=偏官
check('月干十神', r.month.shiShen, '正印')
check('时干十神', r.hour.shiShen, '劫财')

// 藏干十神
check('酉藏干', r.year.cangGan.map(c => c.gan + c.shiShen), ['辛偏财'])
check('子藏干', r.month.cangGan.map(c => c.gan + c.shiShen), ['癸偏官'])
check('亥藏干', r.day.cangGan.map(c => c.gan + c.shiShen), ['壬正官', '甲正印'])
check('午藏干', r.hour.cangGan.map(c => c.gan + c.shiShen), ['丁比肩', '己食神'])

// 星运（日主丁对各支）
check('星运', [r.year.twelveState, r.month.twelveState, r.day.twelveState, r.hour.twelveState],
  ['长生', '绝', '胎', '临官'])

// 自坐
check('自坐', [r.year.ziZuo, r.month.ziZuo, r.day.ziZuo, r.hour.ziZuo],
  ['病', '沐浴', '胎', '帝旺'])

// 空亡
check('年旬空', r.yearXunKong, '戌亥')
check('日旬空', r.dayXunKong, '午未')

// 纳音
check('纳音', [r.year.naYin, r.month.naYin, r.day.naYin, r.hour.naYin],
  ['剑锋金', '海中金', '屋上土', '天河水'])

// 附加盘
check('胎元', r.taiYuan, '乙卯')
check('胎元纳音', r.taiYuanNaYin, '大溪水')
check('胎息', r.taiXi, '壬寅')
// 命宫身宫（App口径自实现）
check('命宫(App口径)', getMingGongApp(r.year.gan, r.month.zhi, r.hour.zhi), '壬戌')
check('身宫(App口径)', getShenGongApp(r.year.gan, r.month.zhi, r.hour.zhi), '庚申')

// 大运（精确起运）
check('大运第1步', r.daYun[0]?.ganZhi, '癸亥')
check('大运第1步起年', r.daYun[0]?.startYear, 2002)
check('大运列表', r.daYun.slice(0, 9).map(d => d.ganZhi),
  ['癸亥', '壬戌', '辛酉', '庚申', '己未', '戊午', '丁巳', '丙辰', '乙卯'])

// 干支关系
const gr = getGanRelations([r.year.gan, r.month.gan, r.day.gan, r.hour.gan])
checkContains('天干关系', gr.map(x => x.label), ['癸克丁'])
const zr = getZhiRelations([r.year.zhi, r.month.zhi, r.day.zhi, r.hour.zhi])
checkContains('地支关系', zr.map(x => x.label), ['子午相冲', '子酉相破', '亥午暗合'])

// 神煞
const ss = getAllShenSha({
  gans: [r.year.gan, r.month.gan, r.day.gan, r.hour.gan],
  zhis: [r.year.zhi, r.month.zhi, r.day.zhi, r.hour.zhi],
  dayGZ: r.day.ganZhi, yearXunKong: r.yearXunKong, dayXunKong: r.dayXunKong,
})
checkContains('年柱神煞', ss[0].map(x => x.name), ['天乙贵人', '文昌贵人'])
checkContains('日柱神煞', ss[2].map(x => x.name), ['天乙贵人', '驿马', '孤辰', '十恶大败'])
checkContains('时柱神煞', ss[3].map(x => x.name), ['禄神', '桃花', '空亡(日)'])

// 旺衰
const ws = getWangShuai(
  [r.year.gan, r.month.gan, r.day.gan, r.hour.gan],
  [r.year.zhi, r.month.zhi, r.day.zhi, r.hour.zhi])
check('旺衰', ws.level, '弱')
console.log(`ℹ 旺衰评分: ${ws.score} (${ws.detail})`)

// 喜忌五档
const xj = getXiJi('丁', ws.level, r.wuXingPower)
check('喜忌', [xj.yong, xj.xi, xj.xian, xj.chou, xj.ji], ['火', '木', '土', '金', '水'])

// 格局
const gj = getGeJu(
  [r.year.gan, r.month.gan, r.day.gan, r.hour.gan],
  [r.year.zhi, r.month.zhi, r.day.zhi, r.hour.zhi])
check('格局', gj.name, '七杀格')

// 调候
check('调候', getTiaoHou('丁', '子'), '甲庚')

// 十神组合
const counts: Record<string, number> = {}
;[r.year, r.month, r.day, r.hour].forEach(p => {
  if (p.shiShen && p.shiShen !== '日主') counts[p.shiShen] = (counts[p.shiShen] || 0) + 1
  p.cangGan.forEach(c => { counts[c.shiShen] = (counts[c.shiShen] || 0) + 1 })
})
const combo = getShiShenCombo(counts)
check('十神组合', combo.name, '官杀配比劫')

// 病位
const organs = getWeakOrgans(r.wuXingPower)
check('病位', organs, '心、肾')

// 天数地数
const tds = getTianDiShu(
  [r.year.gan, r.month.gan, r.day.gan, r.hour.gan],
  [r.year.zhi, r.month.zhi, r.day.zhi, r.hour.zhi])
check('天数(App口径)', tds.tianShu, 34)
check('地数(App口径)', tds.diShu, 25)

// 真太阳时（1月1日≈第1天）
const offset = trueSolarOffsetMinutes(1, 120)
console.log(`ℹ 真太阳时修正: ${offset.toFixed(1)}分钟（期望≈-3，12:00→11:57）`)
if (offset > -5 && offset < -1) { pass++; console.log('✓ 真太阳时在预期区间') } else { fail++; console.log('✗ 真太阳时偏差过大') }

// 大运luck模块
const luck = calculateLuck(1994, 1, 1, 12, 0, '男')
check('起运描述', luck.startDesc, '出生后8年4个月10天起运')
check('人元司令', getSiLingDesc(luck.siLing), '癸水用事')
check('小运首年', luck.xiaoYun[0]?.ganZhi, '乙巳')

console.log(`\n===== ${pass} passed, ${fail} failed =====`)
process.exit(fail ? 1 : 0)
