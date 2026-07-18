/**
 * 八字干支关系判断
 * 天干：五合/相克；地支：六合/三合/三会/六冲/三刑/六害/相破/暗合
 * 支持原局内部关系 + 岁运与原局联动
 */

// ============================================================================
// 天干关系
// ============================================================================

/** 天干五合: 甲己合土 乙庚合金 丙辛合水 丁壬合木 戊癸合火 */
const GAN_HE: Record<string, [string, string]> = {
  '甲己': ['甲己', '土'], '己甲': ['甲己', '土'],
  '乙庚': ['乙庚', '金'], '庚乙': ['乙庚', '金'],
  '丙辛': ['丙辛', '水'], '辛丙': ['丙辛', '水'],
  '丁壬': ['丁壬', '木'], '壬丁': ['丁壬', '木'],
  '戊癸': ['戊癸', '火'], '癸戊': ['戊癸', '火'],
}

const GAN_WX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}
const KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }

export interface GanRelation {
  type: '合' | '克'
  label: string          // 如 "丙辛合化水" / "癸克丁"
  gans: [string, string] // 参与的两干
  positions: [number, number] // 柱索引（0年1月2日3时 4大运 5流年）
}

/** 计算一组天干间的关系（相邻优先，全对比较） */
export function getGanRelations(gans: string[]): GanRelation[] {
  const res: GanRelation[] = []
  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const a = gans[i], b = gans[j]
      if (!a || !b) continue
      const he = GAN_HE[a + b]
      if (he) {
        res.push({ type: '合', label: `${he[0][0]}${he[0][1]}合化${he[1]}`, gans: [a, b], positions: [i, j] })
      } else if (KE[GAN_WX[a]] === GAN_WX[b]) {
        res.push({ type: '克', label: `${a}克${b}`, gans: [a, b], positions: [i, j] })
      } else if (KE[GAN_WX[b]] === GAN_WX[a]) {
        res.push({ type: '克', label: `${b}克${a}`, gans: [b, a], positions: [j, i] })
      }
    }
  }
  return res
}

// ============================================================================
// 地支关系
// ============================================================================

const LIU_HE: Record<string, string> = {
  '子丑': '土', '寅亥': '木', '卯戌': '火', '辰酉': '金', '巳申': '水', '午未': '土',
}
const LIU_CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']
const LIU_HAI = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌']
const XIANG_PO = ['子酉', '午卯', '辰丑', '戌未', '寅亥', '巳申']
// 三刑
const SAN_XING_GROUPS = [
  ['寅', '巳', '申'], // 无恩之刑
  ['丑', '未', '戌'], // 持势之刑
]
const ZI_MAO_XING = ['子', '卯'] // 无礼之刑
const ZI_XING = ['辰', '午', '酉', '亥'] // 自刑
// 三合局
const SAN_HE: Array<[string[], string]> = [
  [['申', '子', '辰'], '水'], [['寅', '午', '戌'], '火'],
  [['巳', '酉', '丑'], '金'], [['亥', '卯', '未'], '木'],
]
// 三会方
const SAN_HUI: Array<[string[], string]> = [
  [['寅', '卯', '辰'], '木'], [['巳', '午', '未'], '火'],
  [['申', '酉', '戌'], '金'], [['亥', '子', '丑'], '水'],
]
// 暗合（藏干五合）
const AN_HE = ['亥午', '卯申', '寅丑', '子戌', '巳酉', '寅未']

export interface ZhiRelation {
  type: '六合' | '三合' | '半合' | '三会' | '冲' | '刑' | '自刑' | '害' | '破' | '暗合'
  label: string
  zhis: string[]
  positions: number[]
}

function pairKey(a: string, b: string): string { return a + b }
function inPairList(list: string[], a: string, b: string): boolean {
  return list.includes(a + b) || list.includes(b + a)
}

/** 计算一组地支间的关系 */
export function getZhiRelations(zhis: string[]): ZhiRelation[] {
  const res: ZhiRelation[] = []
  const n = zhis.length

  // 三会/三合（三支全齐才记，扫描全组合）
  const idxOf = (z: string, used: number[]) => zhis.findIndex((x, i) => x === z && !used.includes(i))
  for (const [group, wx] of SAN_HUI) {
    const pos: number[] = []
    for (const z of group) {
      const i = idxOf(z, pos)
      if (i >= 0) pos.push(i)
    }
    if (pos.length === 3) res.push({ type: '三会', label: `${group.join('')}三会${wx}方`, zhis: group, positions: pos })
  }
  for (const [group, wx] of SAN_HE) {
    const pos: number[] = []
    for (const z of group) {
      const i = idxOf(z, pos)
      if (i >= 0) pos.push(i)
    }
    if (pos.length === 3) {
      res.push({ type: '三合', label: `${group.join('')}三合${wx}局`, zhis: group, positions: pos })
    } else if (pos.length === 2) {
      // 半合：必须含旺支（中间那个）
      const wang = group[1]
      const present = pos.map(i => zhis[i])
      if (present.includes(wang)) {
        res.push({ type: '半合', label: `${present.join('')}半合${wx}局`, zhis: present, positions: pos })
      }
    }
  }

  // 两两关系
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = zhis[i], b = zhis[j]
      if (!a || !b) continue
      if (LIU_HE[pairKey(a, b)] !== undefined || LIU_HE[pairKey(b, a)] !== undefined) {
        const wx = LIU_HE[pairKey(a, b)] ?? LIU_HE[pairKey(b, a)]
        res.push({ type: '六合', label: `${a}${b}相合(${wx})`, zhis: [a, b], positions: [i, j] })
      }
      const canon = (list: string[]): string => list.includes(a + b) ? a + b : b + a
      if (inPairList(LIU_CHONG, a, b)) { const k = canon(LIU_CHONG); res.push({ type: '冲', label: `${k[0]}${k[1]}相冲`, zhis: [a, b], positions: [i, j] }) }
      if (inPairList(LIU_HAI, a, b)) { const k = canon(LIU_HAI); res.push({ type: '害', label: `${k[0]}${k[1]}相害`, zhis: [a, b], positions: [i, j] }) }
      if (inPairList(XIANG_PO, a, b)) { const k = canon(XIANG_PO); res.push({ type: '破', label: `${k[0]}${k[1]}相破`, zhis: [a, b], positions: [i, j] }) }
      if (inPairList(AN_HE, a, b)) { const k = canon(AN_HE); res.push({ type: '暗合', label: `${k[0]}${k[1]}暗合`, zhis: [a, b], positions: [i, j] }) }
      // 子卯刑
      if ((a === '子' && b === '卯') || (a === '卯' && b === '子')) {
        res.push({ type: '刑', label: `${a}刑${b}`, zhis: [a, b], positions: [i, j] })
      }
      // 三刑组内两两（寅巳申/丑未戌）
      for (const g of SAN_XING_GROUPS) {
        if (g.includes(a) && g.includes(b) && a !== b) {
          res.push({ type: '刑', label: `${a}刑${b}`, zhis: [a, b], positions: [i, j] })
          break
        }
      }
      // 自刑（同支）
      if (a === b && ZI_XING.includes(a)) {
        res.push({ type: '自刑', label: `${a}刑${a}`, zhis: [a, b], positions: [i, j] })
      }
    }
  }
  return res
}

/** 岁运与原局联动：返回 仅涉及岁运位置(索引>=baseCount) 的关系 */
export function getYunRelations(
  baseGans: string[], baseZhis: string[],
  extraGans: string[], extraZhis: string[]
): { ganRelations: GanRelation[]; zhiRelations: ZhiRelation[] } {
  const gans = [...baseGans, ...extraGans]
  const zhis = [...baseZhis, ...extraZhis]
  const gr = getGanRelations(gans).filter(r => r.positions.some(p => p >= baseGans.length))
  const zr = getZhiRelations(zhis).filter(r => r.positions.some(p => p >= baseZhis.length))
  return { ganRelations: gr, zhiRelations: zr }
}
