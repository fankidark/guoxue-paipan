/**
 * 四柱八字排盘页面 — 三Tab布局（基本信息/原命局/细盘），对齐小南斗App功能
 */
import { useState, useEffect, type ReactNode } from 'react'
import { calculateBazi, GAN_WUXING, ZHI_WUXING } from '../lib/bazi'
import type { BaziResult, Pillar } from '../lib/bazi'
import { getGanRelations, getZhiRelations, getYunRelations } from '../lib/bazi-relations'
import { getAllShenSha, getShenShaForZhi } from '../lib/bazi-shensha'
import type { ShenShaInput } from '../lib/bazi-shensha'
import {
  getWangShuai, getXiJi, getGeJu, getTiaoHou, getShiShenCombo,
  getWeakOrgans, getTianDiShu, trueSolarOffsetMinutes,
  getMingGongApp, getShenGongApp
} from '../lib/bazi-analysis'
import { calculateLuck, getLiuNian, getSiLingDesc } from '../lib/bazi-luck'
import type { LuckResult, LiuNianItem } from '../lib/bazi-luck'
import { DetailProvider, useDetail } from '../components/qimen/DetailContext'
import { lookupBaziDetail } from '../lib/bazi-details'

// 五行颜色映射
const WX_COLOR: Record<string, string> = {
  '木': 'text-green-400', '火': 'text-red-400', '土': 'text-amber-600',
  '金': 'text-yellow-400', '水': 'text-blue-400',
}
const WX_BG: Record<string, string> = {
  '木': 'bg-green-400', '火': 'bg-red-400', '土': 'bg-amber-600',
  '金': 'bg-yellow-400', '水': 'bg-blue-400',
}

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱']

function ganColor(gan: string): string { return WX_COLOR[GAN_WUXING[gan]] || 'text-dark-200' }
function zhiColor(zhi: string): string { return WX_COLOR[ZHI_WUXING[zhi]] || 'text-dark-200' }

// ============================================================================
// 可点击术语（弹窗详解）
// ============================================================================
function Term({ name, display, className }: { name: string; display?: string; className?: string }) {
  const { showDetail } = useDetail()
  const detail = lookupBaziDetail(name)
  if (!detail) return <span className={className}>{display ?? name}</span>
  return (
    <span
      className={`cursor-pointer hover:underline ${className || ''}`}
      onClick={() => showDetail(detail.title, (
        <div className="space-y-2">
          <div className="text-xs text-dark-400">{detail.category}</div>
          {detail.lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      ))}
    >{display ?? name}</span>
  )
}

// ============================================================================
// 主页面
// ============================================================================
export default function BaziPage() {
  return (
    <DetailProvider>
      <BaziPageInner />
    </DetailProvider>
  )
}

function BaziPageInner() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [day, setDay] = useState(now.getDate())
  const [hour, setHour] = useState(now.getHours())
  const [minute, setMinute] = useState(0)
  const [gender, setGender] = useState<'男' | '女'>('男')
  const [result, setResult] = useState<BaziResult | null>(null)
  const [luck, setLuck] = useState<LuckResult | null>(null)
  const [tab, setTab] = useState<'info' | 'chart' | 'detail'>('chart')
  const [loading, setLoading] = useState(false)
  // 细盘：选中的大运/流年
  const [selDaYun, setSelDaYun] = useState(0)
  const [liuNian, setLiuNian] = useState<LiuNianItem[]>([])
  const [selLiuNian, setSelLiuNian] = useState<LiuNianItem | null>(null)

  const doPaipan = () => {
    setLoading(true)
    try {
      const r = calculateBazi(year, month, day, hour, minute, gender)
      setResult(r)
      const lk = calculateLuck(year, month, day, hour, minute, gender)
      setLuck(lk)
      // 默认选中当前所处大运
      const nowYear = new Date().getFullYear()
      const idx = lk.daYun.findIndex(d => nowYear >= d.startYear && nowYear <= d.endYear)
      const di = Math.max(0, idx)
      setSelDaYun(di)
      const lns = getLiuNian(year, month, day, hour, minute, gender, di)
      setLiuNian(lns)
      setSelLiuNian(lns.find(l => l.year === nowYear) || lns[0] || null)
    } catch (e) {
      console.error('排盘出错:', e)
    } finally {
      setLoading(false)
    }
  }

  const pickDaYun = (i: number) => {
    setSelDaYun(i)
    const lns = getLiuNian(year, month, day, hour, minute, gender, i)
    setLiuNian(lns)
    setSelLiuNian(lns[0] || null)
  }

  useEffect(() => { doPaipan() }, [])

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="card">
        <h2 className="text-lg font-bold text-dark-100 mb-4">八字排盘</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm text-dark-300">年<input type="number" value={year} onChange={e => setYear(+e.target.value)} className="input-field w-20 ml-1" /></label>
          <label className="text-sm text-dark-300">月<input type="number" min={1} max={12} value={month} onChange={e => setMonth(+e.target.value)} className="input-field w-14 ml-1" /></label>
          <label className="text-sm text-dark-300">日<input type="number" min={1} max={31} value={day} onChange={e => setDay(+e.target.value)} className="input-field w-14 ml-1" /></label>
          <label className="text-sm text-dark-300">时<input type="number" min={0} max={23} value={hour} onChange={e => setHour(+e.target.value)} className="input-field w-14 ml-1" /></label>
          <label className="text-sm text-dark-300">分<input type="number" min={0} max={59} value={minute} onChange={e => setMinute(+e.target.value)} className="input-field w-14 ml-1" /></label>
          <div className="flex gap-1">
            {(['男', '女'] as const).map(g => (
              <button key={g} onClick={() => setGender(g)}
                className={`px-3 py-1.5 rounded-lg text-sm ${gender === g ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300'}`}>{g}</button>
            ))}
          </div>
          <button onClick={doPaipan} disabled={loading} className="btn-primary">{loading ? '排盘中…' : '排盘'}</button>
        </div>
      </div>

      {result && luck && (
        <>
          {/* 子Tab */}
          <div className="flex gap-2">
            {([['info', '基本信息'], ['chart', '原命局'], ['detail', '细盘']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === k ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'info' && <InfoTab result={result} luck={luck} birth={{ year, month, day, hour, minute }} />}
          {tab === 'chart' && <ChartTab result={result} />}
          {tab === 'detail' && (
            <DetailTab result={result} luck={luck} selDaYun={selDaYun} pickDaYun={pickDaYun}
              liuNian={liuNian} selLiuNian={selLiuNian} setSelLiuNian={setSelLiuNian} />
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// Tab1 基本信息
// ============================================================================
function InfoTab({ result: r, luck, birth }: {
  result: BaziResult; luck: LuckResult
  birth: { year: number; month: number; day: number; hour: number; minute: number }
}) {
  // 真太阳时
  const dayOfYear = Math.floor((Date.UTC(birth.year, birth.month - 1, birth.day) - Date.UTC(birth.year, 0, 1)) / 86400000) + 1
  const offset = trueSolarOffsetMinutes(dayOfYear, 120)
  const totalMin = birth.hour * 60 + birth.minute + offset
  const tstH = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60)
  const tstM = Math.round(((totalMin % 60) + 60) % 60)

  const mingGong = getMingGongApp(r.year.gan, r.month.zhi, r.hour.zhi)
  const shenGong = getShenGongApp(r.year.gan, r.month.zhi, r.hour.zhi)
  const tds = getTianDiShu([r.year.gan, r.month.gan, r.day.gan, r.hour.gan], [r.year.zhi, r.month.zhi, r.day.zhi, r.hour.zhi])
  const totalPower = Object.values(r.wuXingPower).reduce((a, b) => a + b, 0) || 1

  const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex justify-between py-1.5 border-b border-dark-800 text-sm">
      <span className="text-dark-400">{label}</span>
      <span className="text-dark-200 text-right">{children}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-3">命主档案</h3>
        <InfoRow label="阳历">{r.solarDate} {String(birth.hour).padStart(2, '0')}:{String(birth.minute).padStart(2, '0')}（{r.gender}）</InfoRow>
        <InfoRow label="农历">{r.lunarDate}</InfoRow>
        <InfoRow label="真太阳时">{String(tstH).padStart(2, '0')}:{String(tstM).padStart(2, '0')}（修正{offset.toFixed(0)}分钟，按东经120°）</InfoRow>
        <InfoRow label="人元司令分野"><Term name="人元司令" display={getSiLingDesc(luck.siLing)} className="text-primary-400" /></InfoRow>
        <InfoRow label="出生节气">{r.prevJie.name}（{r.prevJie.date.slice(0, 16)}）后 · {r.nextJie.name}（{r.nextJie.date.slice(0, 16)}）前</InfoRow>
        <InfoRow label="命主五行"><span className={ganColor(r.dayMaster.gan)}>{r.dayMaster.gan}{r.dayMaster.wuXing}</span></InfoRow>
        <InfoRow label="天运五行">{r.year.naYin}</InfoRow>
        <InfoRow label="胎元"><Term name="胎元" display={`${r.taiYuan}（${r.taiYuanNaYin}）`} className="text-primary-400" /></InfoRow>
        <InfoRow label="命宫"><Term name="命宫" display={mingGong} className="text-primary-400" /></InfoRow>
        <InfoRow label="身宫"><Term name="身宫" display={shenGong} className="text-primary-400" /></InfoRow>
        <InfoRow label="胎息">{r.taiXi}（{r.taiXiNaYin}）</InfoRow>
        <InfoRow label="空亡"><Term name="空亡" display={`${r.yearXunKong}（年） ${r.dayXunKong}（日）`} className="text-primary-400" /></InfoRow>
      </div>

      {/* 天数地数 */}
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-3"><Term name="天数地数" display="天数 / 地数" className="text-dark-100" /></h3>
        <ShuBar label="天数" value={tds.tianShu} low={24} high={36} />
        <ShuBar label="地数" value={tds.diShu} low={24} high={36} />
        <p className="text-xs text-dark-500 mt-2">河洛理数干支配数。得中为佳，过与不及皆偏。</p>
      </div>

      {/* 五行力量 */}
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-3">五行力量</h3>
        {(['木', '火', '土', '金', '水'] as const).map(wx => {
          const pct = r.wuXingPower[wx] / totalPower * 100
          return (
            <div key={wx} className="flex items-center gap-3 mb-2">
              <span className={`w-4 text-sm font-bold ${WX_COLOR[wx]}`}>{wx}</span>
              <div className="flex-1 bg-dark-800 rounded-full h-3 overflow-hidden">
                <div className={`h-full rounded-full ${WX_BG[wx]}`} style={{ width: `${pct}%`, opacity: 0.85 }} />
              </div>
              <span className="text-xs text-dark-400 w-24 text-right">{pct.toFixed(1)}%（{r.wuXingCount[wx]}个）</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShuBar({ label, value, low, high }: { label: string; value: number; low: number; high: number }) {
  const level = value < low - 8 ? '至弱' : value < low ? '不足' : value <= high ? '得中' : value <= high + 8 ? '有余' : '太过'
  const color = level === '得中' ? 'text-green-400' : level === '不足' || level === '至弱' ? 'text-blue-400' : 'text-orange-400'
  const pct = Math.min(100, value / 60 * 100)
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="w-10 text-sm text-dark-300">{label}</span>
      <div className="flex-1 bg-dark-800 rounded-full h-3 overflow-hidden">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%`, opacity: 0.8 }} />
      </div>
      <span className="text-sm text-dark-200 w-8 text-right">{value}</span>
      <span className={`text-xs w-10 ${color}`}>{level}</span>
    </div>
  )
}

// ============================================================================
// Tab2 原命局
// ============================================================================
function ChartTab({ result: r }: { result: BaziResult }) {
  const pillars = [r.year, r.month, r.day, r.hour]
  const gans = pillars.map(p => p.gan)
  const zhis = pillars.map(p => p.zhi)
  const ganRel = getGanRelations(gans)
  const zhiRel = getZhiRelations(zhis)
  const ssInput: ShenShaInput = {
    gans: gans as ShenShaInput['gans'], zhis: zhis as ShenShaInput['zhis'],
    dayGZ: r.day.ganZhi, yearXunKong: r.yearXunKong, dayXunKong: r.dayXunKong,
  }
  const shenSha = getAllShenSha(ssInput)

  return (
    <div className="space-y-6">
      {/* 四柱大盘 */}
      <div className="card overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="text-dark-500 text-xs">
              <th className="py-1 w-14"></th>
              {PILLAR_LABELS.map(l => <th key={l} className="py-1">{l}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-dark-500 text-xs">主星</td>
              {pillars.map((p, i) => (
                <td key={i} className="py-1">
                  {p.shiShen === '日主' ? <span className="text-dark-400">{r.gender === '男' ? '元男' : '元女'}</span>
                    : <Term name={p.shiShen} className="text-primary-400" />}
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs">天干</td>
              {pillars.map((p, i) => <td key={i} className={`text-3xl font-bold py-1 ${ganColor(p.gan)}`}>{p.gan}</td>)}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs">地支</td>
              {pillars.map((p, i) => <td key={i} className={`text-3xl font-bold py-1 ${zhiColor(p.zhi)}`}>{p.zhi}</td>)}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs align-top pt-2">藏干</td>
              {pillars.map((p, i) => (
                <td key={i} className="pt-2 align-top">
                  {p.cangGan.map(c => (
                    <div key={c.gan} className="text-xs">
                      <span className={ganColor(c.gan)}>{c.gan}</span>
                      <Term name={c.shiShen} className="text-dark-400 ml-0.5" />
                    </div>
                  ))}
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs">星运</td>
              {pillars.map((p, i) => <td key={i} className="text-xs py-1"><Term name="星运" display={p.twelveState} className="text-amber-500/80" /></td>)}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs">自坐</td>
              {pillars.map((p, i) => <td key={i} className="text-xs py-1"><Term name="自坐" display={p.ziZuo} className="text-dark-400" /></td>)}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs">空亡</td>
              {pillars.map((p, i) => {
                const kong = (i === 0 ? r.yearXunKong : i === 2 ? r.dayXunKong : '')
                const isKong = r.yearXunKong.includes(p.zhi) || r.dayXunKong.includes(p.zhi)
                return <td key={i} className="text-xs py-1 text-dark-500">{kong || (isKong ? '○落空' : '—')}</td>
              })}
            </tr>
            <tr>
              <td className="text-dark-500 text-xs">纳音</td>
              {pillars.map((p, i) => <td key={i} className="text-xs py-1"><Term name="纳音" display={p.naYin} className="text-dark-400" /></td>)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 干支关系 */}
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-2">干支关系</h3>
        <div className="text-sm space-y-1">
          <div><span className="text-dark-500 text-xs mr-2">天干</span>
            {ganRel.length ? ganRel.map((g, i) => <span key={i} className="text-orange-400 mr-3">{g.label}</span>) : <span className="text-dark-500">无明显关系</span>}
          </div>
          <div><span className="text-dark-500 text-xs mr-2">地支</span>
            {zhiRel.length ? zhiRel.map((z, i) => <span key={i} className="text-orange-400 mr-3">{z.label}</span>) : <span className="text-dark-500">无明显关系</span>}
          </div>
        </div>
      </div>

      {/* 神煞表 */}
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-2">神煞</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {shenSha.map((list, i) => (
            <div key={i}>
              <div className="text-xs text-dark-500 mb-1">{PILLAR_LABELS[i]}</div>
              {list.length ? list.map(s => (
                <div key={s.name} className="text-xs py-0.5">
                  <Term name={s.name}
                    className={s.type === '吉' ? 'text-green-400/90' : s.type === '凶' ? 'text-red-400/80' : 'text-dark-300'} />
                </div>
              )) : <div className="text-xs text-dark-600">—</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Tab3 细盘（大运流年 + 分析）
// ============================================================================
function DetailTab({ result: r, luck, selDaYun, pickDaYun, liuNian, selLiuNian, setSelLiuNian }: {
  result: BaziResult; luck: LuckResult
  selDaYun: number; pickDaYun: (i: number) => void
  liuNian: LiuNianItem[]; selLiuNian: LiuNianItem | null
  setSelLiuNian: (l: LiuNianItem) => void
}) {
  const pillars = [r.year, r.month, r.day, r.hour]
  const gans = pillars.map(p => p.gan)
  const zhis = pillars.map(p => p.zhi)

  const ws = getWangShuai(gans as [string, string, string, string], zhis as [string, string, string, string])
  const xj = getXiJi(r.dayMaster.gan, ws.level, r.wuXingPower)
  const gj = getGeJu(gans as [string, string, string, string], zhis as [string, string, string, string])
  const tiaoHou = getTiaoHou(r.dayMaster.gan, r.month.zhi)
  const organs = getWeakOrgans(r.wuXingPower)

  // 十神组合
  const counts: Record<string, number> = {}
  pillars.forEach(p => {
    if (p.shiShen && p.shiShen !== '日主') counts[p.shiShen] = (counts[p.shiShen] || 0) + 1
    p.cangGan.forEach(c => { counts[c.shiShen] = (counts[c.shiShen] || 0) + 1 })
  })
  const combo = getShiShenCombo(counts)

  // 岁运关系
  const curDaYun = luck.daYun[selDaYun]
  const extraGans: string[] = []
  const extraZhis: string[] = []
  if (curDaYun && !curDaYun.isXiaoYun) { extraGans.push(curDaYun.gan); extraZhis.push(curDaYun.zhi) }
  if (selLiuNian) { extraGans.push(selLiuNian.ganZhi[0]); extraZhis.push(selLiuNian.ganZhi[1]) }
  const yunRel = getYunRelations(gans, zhis, extraGans, extraZhis)

  // 岁运神煞
  const ssInput: ShenShaInput = {
    gans: gans as ShenShaInput['gans'], zhis: zhis as ShenShaInput['zhis'],
    dayGZ: r.day.ganZhi, yearXunKong: r.yearXunKong, dayXunKong: r.dayXunKong,
  }
  const daYunSS = curDaYun && !curDaYun.isXiaoYun ? getShenShaForZhi(ssInput, curDaYun.zhi, -1) : []
  const liuNianSS = selLiuNian ? getShenShaForZhi(ssInput, selLiuNian.ganZhi[1], -1) : []

  // 岁运并临检测
  const suiYunBingLin = luck.daYun.flatMap(d =>
    d.isXiaoYun ? [] : Array.from({ length: 10 }, (_, k) => d.startYear + k)
      .filter(y => {
        // 流年干支 == 大运干支
        const yGZ = getLiuNianGZ(y)
        return yGZ === d.ganZhi
      }))

  return (
    <div className="space-y-6">
      {/* 起运信息 */}
      <div className="card text-sm text-dark-300 space-y-1">
        <div><span className="text-dark-500">起运：</span>{luck.startDesc}（{luck.startSolarDate} 上运）</div>
        {suiYunBingLin.length > 0 && (
          <div><span className="text-dark-500">岁运并临：</span>
            <Term name="岁运并临" display={suiYunBingLin.join('年、') + '年'} className="text-orange-400" /></div>
        )}
      </div>

      {/* 大运轴 */}
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-2">大运</h3>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {luck.daYun.map((d, i) => (
            <button key={i} onClick={() => !d.isXiaoYun && pickDaYun(i)}
              className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-center ${i === selDaYun ? 'bg-primary-600/30 ring-1 ring-primary-500' : 'bg-dark-800 hover:bg-dark-700'}`}>
              <div className="text-[10px] text-dark-500">{d.startYear}</div>
              {d.isXiaoYun ? <div className="text-sm text-dark-400">小运</div> : (
                <div className="text-sm">
                  <span className="text-[10px] text-dark-400 mr-0.5">{shortShiShen(d.shiShen)}</span>
                  <span className={ganColor(d.gan)}>{d.gan}</span>
                  <span className={zhiColor(d.zhi)}>{d.zhi}</span>
                </div>
              )}
              <div className="text-[10px] text-dark-500">{d.startAge}岁</div>
            </button>
          ))}
        </div>
      </div>

      {/* 流年轴 */}
      {liuNian.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-dark-100 mb-2">流年</h3>
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {liuNian.map(l => (
              <button key={l.year} onClick={() => setSelLiuNian(l)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-center ${selLiuNian?.year === l.year ? 'bg-primary-600/30 ring-1 ring-primary-500' : 'bg-dark-800 hover:bg-dark-700'}`}>
                <div className="text-[10px] text-dark-500">{l.year}</div>
                <div className="text-sm">
                  <span className="text-[10px] text-dark-400 mr-0.5">{shortShiShen(l.shiShen)}</span>
                  <span className={ganColor(l.ganZhi[0])}>{l.ganZhi[0]}</span>
                  <span className={zhiColor(l.ganZhi[1])}>{l.ganZhi[1]}</span>
                </div>
                <div className="text-[10px] text-dark-500">{l.age}岁</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 岁运关系 */}
      <div className="card">
        <h3 className="font-bold text-dark-100 mb-2">岁运关系</h3>
        <div className="text-sm space-y-1">
          <div><span className="text-dark-500 text-xs mr-2">天干</span>
            {yunRel.ganRelations.length ? yunRel.ganRelations.map((g, i) => <span key={i} className="text-orange-400 mr-3">{g.label}</span>) : <span className="text-dark-500">无</span>}
          </div>
          <div><span className="text-dark-500 text-xs mr-2">地支</span>
            {yunRel.zhiRelations.length ? yunRel.zhiRelations.map((z, i) => <span key={i} className="text-orange-400 mr-3">{z.label}</span>) : <span className="text-dark-500">无</span>}
          </div>
          {(daYunSS.length > 0 || liuNianSS.length > 0) && (
            <div className="pt-1 border-t border-dark-800 mt-2">
              {daYunSS.length > 0 && <div><span className="text-dark-500 text-xs mr-2">大运神煞</span>{daYunSS.map(s => <Term key={s.name} name={s.name} className="text-dark-300 mr-2 text-xs" />)}</div>}
              {liuNianSS.length > 0 && <div><span className="text-dark-500 text-xs mr-2">流年神煞</span>{liuNianSS.map(s => <Term key={s.name} name={s.name} className="text-dark-300 mr-2 text-xs" />)}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 分析区 */}
      <div className="card space-y-3 text-sm">
        <h3 className="font-bold text-dark-100">命局分析</h3>
        <AnalysisRow label="旺衰">
          <Term name="旺衰" display={ws.level} className="text-red-400 font-bold" />
          <span className="text-dark-500 text-xs ml-2">{ws.detail}</span>
        </AnalysisRow>
        <AnalysisRow label="喜忌">
          <span className="mr-3">喜 <span className={`font-bold ${WX_COLOR[xj.yong]}`}>{xj.yong}</span></span>
          <span className="mr-3">相 <span className={`font-bold ${WX_COLOR[xj.xi]}`}>{xj.xi}</span></span>
          <span className="mr-3">闲 <span className={`font-bold ${WX_COLOR[xj.xian]}`}>{xj.xian}</span></span>
          <span className="mr-3">仇 <span className={`font-bold ${WX_COLOR[xj.chou]}`}>{xj.chou}</span></span>
          <span>忌 <span className={`font-bold ${WX_COLOR[xj.ji]}`}>{xj.ji}</span></span>
          <Term name="喜忌" display="ⓘ" className="text-dark-500 ml-2" />
        </AnalysisRow>
        <AnalysisRow label="格局">
          <Term name={gj.name} className="text-primary-400 font-bold" />
          <span className="text-dark-500 text-xs ml-2">{gj.base}</span>
        </AnalysisRow>
        <AnalysisRow label="十神组合">
          <span className="text-primary-400">{combo.name}</span>
          <div className="text-dark-400 text-xs mt-1">{combo.desc}</div>
        </AnalysisRow>
        <AnalysisRow label="调候">
          <Term name="调候" display={tiaoHou.split('').join(' ')} className="text-amber-500" />
        </AnalysisRow>
        <AnalysisRow label="易患部位">
          <span className="text-dark-300">{organs}</span>
          <span className="text-dark-600 text-xs ml-2">（五行失衡提示，仅供参考）</span>
        </AnalysisRow>
      </div>
    </div>
  )
}

function AnalysisRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-dark-800/60 pb-2">
      <span className="text-dark-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function shortShiShen(ss: string): string {
  const map: Record<string, string> = {
    '比肩': '比', '劫财': '劫', '食神': '食', '伤官': '伤', '正财': '财',
    '偏财': '才', '正官': '官', '偏官': '杀', '正印': '印', '偏印': '枭',
  }
  return map[ss] || ss
}

/** 流年干支（立春分界近似：以年份定甲子序） */
function getLiuNianGZ(y: number): string {
  const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  return TIAN_GAN[(y - 4) % 10] + DI_ZHI[(y - 4) % 12]
}
