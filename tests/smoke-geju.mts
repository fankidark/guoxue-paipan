// smoke test: 直接调用 src/lib/qimen.ts 验证新格局判定逻辑
import { calculateQimen } from './src/lib/qimen'

const PAIR_TO_GEJU: Record<string, string> = {
  '乙乙': '日奇伏吟', '乙庚': '日奇被刑', '庚乙': '太白逢星',
  '丙庚': '荧入太白', '庚丙': '太白入荧', '丁庚': '星奇受阻',
  '庚戊': '天乙伏宫', '庚己': '刑格', '庚庚': '战格', '庚壬': '小格', '庚癸': '大格',
}

let fails = 0
for (const dt of [
  new Date(2024, 0, 15, 10), new Date(2025, 7, 20, 14), new Date(2026, 2, 8, 6),
  new Date(2026, 6, 5, 19), new Date(2026, 6, 11, 12), new Date(2023, 4, 1, 8),
]) {
  const r = calculateQimen(dt)
  const dayGan = r.dayGZ[0], yearGan = r.yearGZ[0], monthGan = r.monthGZ[0], hourGan = r.hourGZ[0]
  console.log(`\n== ${r.datetime} ${r.isYangDun ? '阳' : '阴'}遁${r.juNumber}局 日干${dayGan} ==`)
  for (const p of r.palaces) {
    if (p.gongNumber === 5) continue
    const key = p.tianPanGan + p.diPanGan
    const expected: string[] = []
    if (PAIR_TO_GEJU[key]) expected.push(PAIR_TO_GEJU[key])
    if (p.tianPanGan === '庚') {
      if (p.diPanGan === yearGan) expected.push('岁格')
      if (p.diPanGan === monthGan) expected.push('月格')
      if (p.diPanGan === dayGan) expected.push('伏干格')
      if (p.diPanGan === hourGan) expected.push('时格')
    }
    if (p.diPanGan === '庚' && p.tianPanGan === dayGan && dayGan !== '庚') expected.push('飞干格')
    const actual = p.geJu || []
    for (const e of expected) {
      if (!actual.includes(e)) { fails++; console.log(`✗ 宫${p.gongNumber} ${key} 缺 ${e}, 实际[${actual}]`) }
    }
    if (actual.length) console.log(`  宫${p.gongNumber} ${p.tianPanGan}+${p.diPanGan}: ${actual.join(',')}`)
  }
  if (r.geJu.length) console.log(`  全局: ${r.geJu.join(',')}`)
}
console.log(fails === 0 ? '\n✅ 格局smoke全部通过' : `\n❌ ${fails}处不符`)
