/**
 * 奇门遁甲排盘页面 — 完整版（五行颜色 + 十二长生备注）
 */
import { useState, useEffect } from 'react'
import { calculateQimen } from '../lib/qimen'
import type { QimenResult } from '../lib/qimen'
import {
  GONG_GUA, JIEQI_MONTH_ZHI, XING_WUXING, MEN_WUXING,
  getXingStatus, getMenStatus, getGanTwelveInGong
} from '../lib/qimen-status'
import { getGanTwelveInGongDouble, hasXingInGong } from '../lib/qimen-twelve'

// 洛书九宫排列：巽4|离9|坤2 / 震3|中5|兑7 / 艮8|坎1|乾6
const LUOSHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6]

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 五行颜色（金黄/木绿/水蓝/火红/土棕）
const WX_TEXT_COLOR: Record<string, string> = {
  '金': 'text-yellow-400',
  '木': 'text-green-400',
  '水': 'text-blue-400',
  '火': 'text-red-400',
  '土': 'text-amber-600',
}

// 天干五行
const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}
function ganColor(gan: string): string {
  return WX_TEXT_COLOR[GAN_WUXING[gan] || '土'] || 'text-dark-100'
}

// 地支五行
const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
}
function zhiColor(zhi: string): string {
  return WX_TEXT_COLOR[ZHI_WUXING[zhi] || '土'] || 'text-dark-100'
}

// 八神五行
const SHEN_WUXING: Record<string, string> = {
  '值符': '土', '螣蛇': '火', '太阴': '金', '六合': '木',
  '白虎': '金', '玄武': '水', '九地': '土', '九天': '火',
}
function shenColor(shen: string): string {
  return WX_TEXT_COLOR[SHEN_WUXING[shen] || '土'] || 'text-dark-100'
}

// 九星五行颜色
function xingColor(xing: string): string {
  return WX_TEXT_COLOR[XING_WUXING[xing] || '土'] || 'text-dark-100'
}

// 八门五行颜色
function menColor(men: string): string {
  return WX_TEXT_COLOR[MEN_WUXING[men] || '土'] || 'text-dark-100'
}

// 宫位五行
const GONG_WX: Record<number, string> = {
  1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火'
}
function gongColor(gong: number): string {
  return WX_TEXT_COLOR[GONG_WX[gong] || '土'] || 'text-dark-100'
}

// 十二长生说明
const TWELVE_STATE_DESC: Record<string, string> = {
  '长生': '初生，生机旺盛',
  '沐浴': '洗礼期，不稳定',
  '冠带': '成长成熟，渐强',
  '临官': '当权得势，大强',
  '帝旺': '最旺盛，鼎盛期',
  '衰': '开始衰退',
  '病': '力量病弱',
  '死': '无力，衰竭',
  '墓': '入库收藏，极弱',
  '绝': '消亡断绝',
  '胎': '孕育中，将生',
  '养': '养育期，蓄力',
}

export default function QimenPage() {
  const [datetime, setDatetime] = useState(formatDateTime(new Date()))
  const [result, setResult] = useState<QimenResult | null>(null)
  const [history, setHistory] = useState<{ dt: string; label: string }[]>([])

  // 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qimen_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  // 保存历史记录
  const saveToHistory = (dt: string, res: QimenResult) => {
    const label = `${res.datetime} ${res.isYangDun ? '阳' : '阴'}遁${res.juNumber}局 ${res.fuYin ? '伏吟' : res.fanYin ? '反吟' : ''}`
    const newItem = { dt, label: label.trim() }
    const updated = [newItem, ...history.filter(h => h.dt !== dt)].slice(0, 20) // 最多保留20条
    setHistory(updated)
    try { localStorage.setItem('qimen_history', JSON.stringify(updated)) } catch {}
  }

  const doPaipan = (dt?: Date) => {
    const d = dt || new Date(datetime)
    const r = calculateQimen(d)
    setResult(r)
    saveToHistory(formatDateTime(d), r)
  }

  useEffect(() => { doPaipan(new Date()) }, [])

  const setNow = () => {
    const now = new Date()
    setDatetime(formatDateTime(now))
    doPaipan(now)
  }

  const loadHistory = (dt: string) => {
    setDatetime(dt)
    doPaipan(new Date(dt))
  }

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem('qimen_history') } catch {}
  }

  const monthZhi = result ? (JIEQI_MONTH_ZHI[result.jieQi] || '午') : '午'

  return (
    <div className="space-y-5">
      {/* 输入区 */}
      <div className="card">
        <h2 className="text-lg font-bold text-dark-100 mb-4">奇门遁甲排盘</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label block mb-1">日期时间</label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="input-field w-52" />
          </div>
          <button onClick={setNow} className="btn-secondary text-sm">当前时间</button>
          <button onClick={() => doPaipan()} className="btn-primary text-sm">排盘</button>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dark-700/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-500">历史记录</span>
              <button onClick={clearHistory} className="text-[10px] text-dark-600 hover:text-red-400">清除</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => loadHistory(h.dt)}
                  className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                    h.dt === datetime
                      ? 'border-purple-500/60 bg-purple-500/10 text-purple-300'
                      : 'border-dark-700/40 bg-dark-800/40 text-dark-400 hover:text-dark-200 hover:border-dark-500'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {result && (
        <>
          {/* 信息栏 */}
          <div className="card">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <InfoItem label="遁局" value={result.isYangDun ? '阳遁' : '阴遁'} />
              <InfoItem label="局数" value={`${result.juNumber}局`} color="text-amber-400" />
              <InfoItem label="三元" value={`${result.yuan}元`} />
              <InfoItem label="节气" value={result.jieQi} />
              <InfoItem label="值符" value={result.zhiFu} color={xingColor(result.zhiFu)} />
              <InfoItem label="值使" value={result.zhiShi} color={menColor(result.zhiShi)} />
              <InfoItem label="旬首" value={result.xunShou} color="text-amber-500" />
              <InfoItem label="局式" value="拆补法-转盘奇门" />
              {result.fuYin && <span className="text-xs text-pink-400 font-medium">伏吟</span>}
              {result.fanYin && <span className="text-xs text-pink-400 font-medium">反吟</span>}
            </div>
          </div>

          {/* 四柱 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">四柱</h3>
            <div className="grid grid-cols-4 gap-3">
              <PillarCard label="年柱" value={result.yearGZ} />
              <PillarCard label="月柱" value={result.monthGZ} />
              <PillarCard label="日柱" value={result.dayGZ} />
              <PillarCard label="时柱" value={result.hourGZ} />
            </div>
          </div>

          {/* 九宫盘局 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-dark-400 font-medium">九宫盘局</h3>
            </div>
            
            {/* 方位标记 + 九宫格 */}
            <div className="relative">
              {/* 上方位：南 */}
              <div className="text-center text-[10px] text-dark-500 mb-1">南</div>
              <div className="flex items-center gap-1">
                {/* 左方位：东 */}
                <div className="text-[10px] text-dark-500 w-4 text-center shrink-0">东</div>
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  {LUOSHU_ORDER.map((gongNum) => {
                    const palace = result.palaces.find(p => p.gongNumber === gongNum)
                    if (!palace) return <div key={gongNum} />
                    return <PalaceCell key={gongNum} palace={palace} monthZhi={monthZhi} />
                  })}
                </div>
                {/* 右方位：西 */}
                <div className="text-[10px] text-dark-500 w-4 text-center shrink-0">西</div>
              </div>
              {/* 下方位：北 */}
              <div className="text-center text-[10px] text-dark-500 mt-1">北</div>
            </div>
          </div>

          {/* 十二长生备注 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">十二长生参考</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(TWELVE_STATE_DESC).map(([state, desc]) => (
                <div key={state} className="flex items-start gap-1.5 text-xs">
                  <span className="text-amber-400 font-medium whitespace-nowrap">{state}</span>
                  <span className="text-dark-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 旺衰参考 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">旺衰参考</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">九星旺衰（以落宫/月令五行为令）</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <WsItem label="旺" desc="我生令（泄气为旺）" />
                  <WsItem label="相" desc="与令同行" />
                  <WsItem label="休" desc="我克令（耗力）" />
                  <WsItem label="囚" desc="令克我（受制）" />
                  <WsItem label="废" desc="令生我（被养无力）" />
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">八门旺衰（以落宫/月令五行为令）</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <WsItem label="旺" desc="与令同行（当令）" />
                  <WsItem label="相" desc="我生令" />
                  <WsItem label="休" desc="令生我（受生休息）" />
                  <WsItem label="囚" desc="我克令（克令受囚）" />
                  <WsItem label="死" desc="令克我（被克无力）" />
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">特殊标记</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <WsItem label="迫" desc="门克宫（门迫，能量耗损）" color="text-pink-400" />
                  <WsItem label="刑" desc="地支三刑（六仪击刑）" color="text-pink-400" />
                  <WsItem label="○" desc="空亡（旬中缺失地支）" />
                  <WsItem label="🐎" desc="驿马（主动、变动）" />
                </div>
              </div>
            </div>
          </div>

          {/* 五行速查 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">五行相生相克速查</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">五行相生（生我者为母，我生者为子）</div>
                <div className="text-xs text-dark-400 leading-relaxed">
                  <span className="text-green-400">木</span> → <span className="text-red-400">火</span> → <span className="text-amber-600">土</span> → <span className="text-yellow-400">金</span> → <span className="text-blue-400">水</span> → <span className="text-green-400">木</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">五行相克（克我者为官，我克者为财）</div>
                <div className="text-xs text-dark-400 leading-relaxed">
                  <span className="text-green-400">木</span> → <span className="text-amber-600">土</span> → <span className="text-blue-400">水</span> → <span className="text-red-400">火</span> → <span className="text-yellow-400">金</span> → <span className="text-green-400">木</span>
                </div>
              </div>
            </div>
          </div>

          {/* 时辰五行速查 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">时辰五行速查</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 text-xs">
              {[
                ['子时','23:00-01:00','深夜/凌晨','水'],['丑时','01:00-03:00','凌晨','土'],['寅时','03:00-05:00','黎明前','木'],
                ['卯时','05:00-07:00','日出/早晨','木'],['辰时','07:00-09:00','早餐后','土'],['巳时','09:00-11:00','上午','火'],
                ['午时','11:00-13:00','中午','火'],['未时','13:00-15:00','下午','土'],['申时','15:00-17:00','傍晚前','金'],
                ['酉时','17:00-19:00','傍晚/下班','金'],['戌时','19:00-21:00','晚上','土'],['亥时','21:00-23:00','深夜前','水'],
              ].map(([name, time, modern, wx]) => (
                <div key={name} className="bg-dark-800/40 rounded px-2 py-1.5 text-center">
                  <div className={`font-medium ${WX_TEXT_COLOR[wx]}`}>{name}</div>
                  <div className="text-dark-400 text-[10px]">{time}</div>
                  <div className="text-dark-600 text-[9px]">{modern}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 年命纳音速查 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">年命纳音速查（近年）</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-xs">
              {[
                ['2020庚子','壁上土'],['2021辛丑','壁上土'],
                ['2022壬寅','金箔金'],['2023癸卯','金箔金'],
                ['2024甲辰','覆灯火'],['2025乙巳','覆灯火'],
                ['2026丙午','天河水'],['2027丁未','天河水'],
                ['2028戊申','大驿土'],['2029己酉','大驿土'],
                ['2030庚戌','钗钏金'],['2031辛亥','钗钏金'],
              ].map(([year, nayin]) => (
                <div key={year} className="bg-dark-800/40 rounded px-2 py-1.5 flex justify-between items-center">
                  <span className="text-dark-300">{year}</span>
                  <span className="text-amber-400">{nayin}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 天干地支五行速查 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">天干地支五行速查</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">十天干</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[['甲','木','阳'],['乙','木','阴'],['丙','火','阳'],['丁','火','阴'],['戊','土','阳'],
                    ['己','土','阴'],['庚','金','阳'],['辛','金','阴'],['壬','水','阳'],['癸','水','阴']
                  ].map(([gan, wx, yy]) => (
                    <span key={gan} className={`${WX_TEXT_COLOR[wx]} bg-dark-800/40 rounded px-1.5 py-0.5`}>
                      {gan}{wx}{yy}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-dark-300 font-medium mb-1.5">十二地支</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[['子','水','鼠'],['丑','土','牛'],['寅','木','虎'],['卯','木','兔'],
                    ['辰','土','龙'],['巳','火','蛇'],['午','火','马'],['未','土','羊'],
                    ['申','金','猴'],['酉','金','鸡'],['戌','土','狗'],['亥','水','猪']
                  ].map(([zhi, wx, sx]) => (
                    <span key={zhi} className={`${WX_TEXT_COLOR[wx]} bg-dark-800/40 rounded px-1.5 py-0.5`}>
                      {zhi}{wx}{sx}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 九宫原始宫位参考 */}
          <div className="card">
            <h3 className="text-sm text-dark-400 font-medium mb-3">九宫原始宫位（本位）</h3>
            <div className="grid grid-cols-3 gap-1 text-xs">
              {[
                { gong: 4, gua: '巽', dir: '东南', wx: '木', xing: '天辅', men: '杜门', shen: '—' },
                { gong: 9, gua: '离', dir: '南', wx: '火', xing: '天英', men: '景门', shen: '—' },
                { gong: 2, gua: '坤', dir: '西南', wx: '土', xing: '天芮', men: '死门', shen: '—' },
                { gong: 3, gua: '震', dir: '东', wx: '木', xing: '天冲', men: '伤门', shen: '—' },
                { gong: 5, gua: '中', dir: '中', wx: '土', xing: '天禽', men: '—', shen: '—' },
                { gong: 7, gua: '兑', dir: '西', wx: '金', xing: '天柱', men: '惊门', shen: '—' },
                { gong: 8, gua: '艮', dir: '东北', wx: '土', xing: '天任', men: '生门', shen: '—' },
                { gong: 1, gua: '坎', dir: '北', wx: '水', xing: '天蓬', men: '休门', shen: '—' },
                { gong: 6, gua: '乾', dir: '西北', wx: '金', xing: '天心', men: '开门', shen: '—' },
              ].map((p) => (
                <div key={p.gong} className="bg-dark-800/40 border border-dark-700/30 rounded p-2 text-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${WX_TEXT_COLOR[p.wx]}`}>{p.gua}{p.gong}</span>
                    <span className="text-dark-500 text-[10px]">{p.dir}·{p.wx}</span>
                  </div>
                  <div className={`${xingColor(p.xing)}`}>{p.xing}</div>
                  <div className={`${menColor(p.men)}`}>{p.men}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-dark-500">
              <div className="font-medium text-dark-400 mb-1">八神排列顺序</div>
              <div>值符 → 螣蛇 → 太阴 → 六合 → 白虎 → 玄武 → 九地 → 九天</div>
              <div className="mt-1 text-dark-600">（八神无固定本位宫，从值符目标宫起按阳遁顺时针/阴遁逆时针排列）</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// === 子组件 ===

function InfoItem({ label, value, color = 'text-dark-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-dark-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}

function WsItem({ label, desc, color = 'text-amber-400' }: { label: string; desc: string; color?: string }) {
  return (
    <div className="flex items-start gap-1.5 text-xs">
      <span className={`font-medium whitespace-nowrap ${color}`}>{label}</span>
      <span className="text-dark-500">{desc}</span>
    </div>
  )
}

function PillarCard({ label, value }: { label: string; value: string }) {
  const gan = value[0] || ''
  const zhi = value[1] || ''
  return (
    <div className="bg-dark-800/60 border border-dark-700/40 rounded-lg py-4 px-3 text-center">
      <div className="text-xs text-dark-500 mb-2">{label}</div>
      <div className="flex flex-col items-center gap-1">
        <span className={`text-xl font-bold ${ganColor(gan)}`}>{gan}</span>
        <span className={`text-xl font-bold ${zhiColor(zhi)}`}>{zhi}</span>
      </div>
    </div>
  )
}

// === 九宫格 Cell ===
interface PalaceData {
  gongNumber: number
  gongName: string
  diPanGan: string
  tianPanGan: string
  jiuXing: string
  baMen: string
  baShen: string
  kongWang: boolean
  yiMa: boolean
  jiXing: boolean
}

function PalaceCell({ palace, monthZhi }: { palace: PalaceData; monthZhi: string }) {
  const gongNum = palace.gongNumber
  const guaName = GONG_GUA[gongNum] || ''
  const gColor = gongColor(gongNum)
  
  const xingStatus = getXingStatus(palace.jiuXing, gongNum, monthZhi)
  const menStatus = getMenStatus(palace.baMen, gongNum, monthZhi)
  
  // 双地支十二长生
  const tianTwelve = getGanTwelveInGongDouble(palace.tianPanGan, gongNum)
  const diTwelve = getGanTwelveInGongDouble(palace.diPanGan, gongNum)
  
  // 地支三刑
  const tianXing = hasXingInGong(palace.tianPanGan, gongNum)
  const diXing = hasXingInGong(palace.diPanGan, gongNum)

  return (
    <div className="bg-dark-800/40 border border-dark-700/30 rounded-lg p-2.5 min-h-[160px] relative flex flex-col justify-between">
      {/* 左上角：卦名 */}
      <span className={`absolute top-1.5 left-2 text-[11px] font-bold ${gColor}`}>{guaName}</span>
      
      {/* 右上角：驿马🐎 空亡○ */}
      <div className="absolute top-1.5 right-2 flex items-center gap-0.5">
        {palace.yiMa && <span className="text-[11px]">🐎</span>}
        {palace.kongWang && <span className="text-[11px] text-dark-400">○</span>}
      </div>
      
      {/* 左下角：宫位数字 */}
      <span className={`absolute bottom-1.5 left-2 text-sm font-bold ${gColor}`}>{gongNum}</span>

      {/* 主内容区 */}
      <div className="flex flex-col items-center gap-[3px] pt-4 pb-3">
        {/* 八神 */}
        <span className={`text-xs font-medium ${shenColor(palace.baShen)}`}>{palace.baShen}</span>
        
        {/* 九星 + 天盘干 */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs ${xingColor(palace.jiuXing)}`}>{palace.jiuXing}</span>
          <span className={`text-sm font-bold ${ganColor(palace.tianPanGan)}`}>{palace.tianPanGan}</span>
        </div>
        
        {/* 九星旺衰 + 十二长生(含刑) */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-dark-500">{xingStatus.gongWs}月{xingStatus.monthWs}</span>
          {(tianXing || tianTwelve) && (
            <span className="text-amber-500/70">{tianXing ? <span className="text-pink-400">刑</span> : ''}{tianTwelve}</span>
          )}
        </div>

        {/* 八门 + 地盘干 */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs font-medium ${menColor(palace.baMen)}`}>{palace.baMen}</span>
          <span className={`text-xs ${ganColor(palace.diPanGan)}`}>{palace.diPanGan}</span>
        </div>
        
        {/* 八门旺衰 + 门迫 + 十二长生(含刑) */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-dark-500">
            {menStatus.gongWs === '迫' ? <span className="text-pink-400">迫</span> : menStatus.gongWs}月{menStatus.monthWs}
          </span>
          {(diXing || diTwelve) && (
            <span className="text-amber-500/70">{diXing ? <span className="text-pink-400">刑</span> : ''}{diTwelve}</span>
          )}
        </div>
      </div>
    </div>
  )
}
