// 对照 Obsidian 例子讲解文档中的三例最终盘面
import { calculateQimen } from '../src/lib/qimen'

const cases = [
  {
    name: '例一 2024-01-15 10:00 阳遁五局',
    date: new Date(2024, 0, 15, 10, 0),
    exp: {
      dun: '阳', ju: 5, zhiFu: '天蓬', zhiShi: '休门', xunShou: '甲寅',
      // 宫: [地盘, 天盘, 九星, 八门, 八神]
      pan: {
        4: ['乙','庚','天柱','休门','九地'], 9: ['壬','己','天心','生门','九天'], 2: ['丁','癸','天蓬','伤门','值符'],
        3: ['丙','丁','天芮','开门','玄武'], 7: ['庚','辛','天任','杜门','螣蛇'],
        8: ['辛','壬','天英','惊门','白虎'], 1: ['癸','乙','天辅','死门','六合'], 6: ['己','丙','天冲','景门','太阴'],
      },
      kong: [1,8], ma: 6,
    }
  },
  {
    name: '例二 2025-08-20 14:00 阴遁八局',
    date: new Date(2025, 7, 20, 14, 0),
    exp: {
      dun: '阴', ju: 8, zhiFu: '天芮', zhiShi: '死门', xunShou: '甲午',
      pan: {
        4: ['壬','乙','天英','休门','螣蛇'], 9: ['乙','丁','天芮','生门','值符'], 2: ['丁','己','天柱','伤门','九天'],
        3: ['癸','壬','天辅','开门','太阴'], 7: ['己','庚','天心','杜门','九地'],
        8: ['戊','癸','天冲','惊门','六合'], 1: ['丙','戊','天任','死门','白虎'], 6: ['庚','丙','天蓬','景门','玄武'],
      },
      kong: [4], ma: 4, jixing: [2],
    }
  },
  {
    name: '例三 2026-03-08 06:00 阳遁一局',
    date: new Date(2026, 2, 8, 6, 0),
    exp: {
      dun: '阳', ju: 1, zhiFu: '天冲', zhiShi: '伤门', xunShou: '甲申',
      pan: {
        4: ['辛','庚','天冲','休门','值符'], 9: ['乙','辛','天辅','生门','螣蛇'], 2: ['己','乙','天英','伤门','太阴'],
        3: ['庚','丙','天任','开门','九天'], 7: ['丁','己','天芮','杜门','六合'],
        8: ['丙','戊','天蓬','惊门','九地'], 1: ['戊','癸','天心','死门','玄武'], 6: ['癸','丁','天柱','景门','白虎'],
      },
      kong: [9,2], ma: 4, jixing: [9],
    }
  },
]

for (const c of cases) {
  const r = calculateQimen(c.date)
  console.log('\n===', c.name, '===')
  console.log('实际: 遁=' + (r.isYangDun?'阳':'阴'), '局=' + r.juNumber, '值符=' + r.zhiFu, '值使=' + r.zhiShi, '旬首=' + r.xunShou, '时柱=' + r.hourGZ)
  let fail = 0
  if ((r.isYangDun?'阳':'阴') !== c.exp.dun) { fail++; console.log('✗ 遁: 期望', c.exp.dun) }
  if (r.juNumber !== c.exp.ju) { fail++; console.log('✗ 局: 期望', c.exp.ju) }
  if (r.zhiFu !== c.exp.zhiFu) { fail++; console.log('✗ 值符: 期望', c.exp.zhiFu) }
  if (r.zhiShi !== c.exp.zhiShi) { fail++; console.log('✗ 值使: 期望', c.exp.zhiShi) }
  if (r.xunShou !== c.exp.xunShou) { fail++; console.log('✗ 旬首: 期望', c.exp.xunShou) }
  for (const [g, [di, tian, xing, men, shen]] of Object.entries(c.exp.pan)) {
    const p = r.palaces.find(p => p.gongNumber === Number(g))
    if (p.diPanGan !== di) { fail++; console.log(`✗ 宫${g} 地盘: 期望${di} 实际${p.diPanGan}`) }
    if (p.tianPanGan !== tian) { fail++; console.log(`✗ 宫${g} 天盘: 期望${tian} 实际${p.tianPanGan}`) }
    if (p.jiuXing !== xing) { fail++; console.log(`✗ 宫${g} 九星: 期望${xing} 实际${p.jiuXing}`) }
    if (p.baMen !== men) { fail++; console.log(`✗ 宫${g} 八门: 期望${men} 实际${p.baMen}`) }
    if (p.baShen !== shen) { fail++; console.log(`✗ 宫${g} 八神: 期望${shen} 实际${p.baShen}`) }
  }
  // 空亡/驿马
  const kongActual = r.palaces.filter(p=>p.kongWang).map(p=>p.gongNumber).sort()
  const kongExp = [...c.exp.kong].sort()
  if (JSON.stringify(kongActual) !== JSON.stringify(kongExp)) { fail++; console.log('✗ 空亡: 期望', kongExp, '实际', kongActual) }
  const maActual = r.palaces.filter(p=>p.yiMa).map(p=>p.gongNumber)
  if (!maActual.includes(c.exp.ma)) { fail++; console.log('✗ 驿马: 期望宫', c.exp.ma, '实际', maActual) }
  if (c.exp.jixing) {
    const jxActual = r.palaces.filter(p=>p.jiXing).map(p=>p.gongNumber).sort()
    if (JSON.stringify(jxActual) !== JSON.stringify([...c.exp.jixing].sort())) { fail++; console.log('✗ 击刑: 期望', c.exp.jixing, '实际', jxActual) }
  }
  console.log(fail === 0 ? '✅ 全部通过' : `❌ ${fail} 处不符`)
}
