/**
 * 奇门遁甲排盘页面 — 九星/八门/八神使用五行颜色
 */
import { useState, useEffect } from 'react'
import { calculateQimen } from '../lib/qimen'
import type { QimenResult } from '../lib/qimen'
import {
  GONG_GUA, JIEQI_MONTH_ZHI, XING_WUXING, MEN_WUXING,
  getXingStatus, getMenStatus, getGanTwelveInGong
} from '../lib/qimen-status'

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

// 天干五行颜色
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
  '值符': '土', '腾蛇': '火', '太阴': '金', '六合': '木',
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

// 宫位五行颜色
const GONG_WUXING: Record<number, string> = {
  1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火'
}
function gongColor(gong: number): string {
  return WX_TEXT_COLOR[GONG_WUXING[gong] || '土'] || 'text-dark-100'
}

export default function QimenPage() {
  const [datetime, setDatetime] = useState(formatDateTime(new Date()))
  const [result, setResult] = useState<QimenResult | null>(null)

  const doPaipan = (dt?: Date) => {
    const d = dt || new Date(datetime)
    setResult(calculateQimen(d))
  }

  useEffect(() => { doPaipan(new Date()) }, [])

  const setNow = () => {
    const now = new Date()
    setDatetime(formatDateTime(now))
    doPaipan(now)
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
              <div className="flex gap-3 text-[11px]">
                <span className="text-dark-400">八神</span>
                <span className="text-dark-400">九星</span>
                <span className="text-dark-400">天盘干</span>
                <span className="text-dark-400">八门</span>
                <span className="text-dark-400">地盘干</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              {LUOSHU_ORDER.map((gongNum) => {
                const palace = result.palaces.find(p => p.gongNumber === gongNum)
                if (!palace) return <div key={gongNum} />
                return <PalaceCell key={gongNum} palace={palace} monthZhi={monthZhi} />
              })}
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

// === 九宫格 Cell（五行颜色版）===
interface PalaceData {
  gongNumber: number
  gongName: string
  diPanGan: string
  tianPanGan: string
  jiuXing: string
  baMen: string
  baShen: string
}

function PalaceCell({ palace, monthZhi }: { palace: PalaceData; monthZhi: string }) {
  const gongNum = palace.gongNumber
  const guaName = GONG_GUA[gongNum] || ''
  const gColor = gongColor(gongNum)
  
  const xingStatus = getXingStatus(palace.jiuXing, gongNum, monthZhi)
  const menStatus = getMenStatus(palace.baMen, gongNum, monthZhi)
  const tianGanTwelve = getGanTwelveInGong(palace.tianPanGan, gongNum)
  const diGanTwelve = getGanTwelveInGong(palace.diPanGan, gongNum)

  return (
    <div className="bg-dark-800/40 border border-dark-700/30 rounded-lg p-2.5 min-h-[160px] relative flex flex-col justify-between">
      {/* 左上角：卦名（宫位五行色） */}
      <span className={`absolute top-1.5 left-2 text-[11px] font-bold ${gColor}`}>{guaName}</span>
      
      {/* 左下角：宫位数字（宫位五行色） */}
      <span className={`absolute bottom-1.5 left-2 text-sm font-bold ${gColor}`}>{gongNum}</span>

      {/* 主内容区 */}
      <div className="flex flex-col items-center gap-[3px] pt-4 pb-3">
        {/* 八神（八神五行色） */}
        <span className={`text-xs font-medium ${shenColor(palace.baShen)}`}>{palace.baShen}</span>
        
        {/* 九星（九星五行色）+ 天盘干（天干五行色） */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs ${xingColor(palace.jiuXing)}`}>{palace.jiuXing}</span>
          <span className={`text-sm font-bold ${ganColor(palace.tianPanGan)}`}>{palace.tianPanGan}</span>
        </div>
        
        {/* 九星旺衰 + 十二长生 */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-dark-500">{xingStatus.gongWs}月{xingStatus.monthWs}</span>
          {tianGanTwelve && <span className="text-dark-400">{tianGanTwelve}</span>}
        </div>

        {/* 八门（八门五行色）+ 地盘干（天干五行色） */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs font-medium ${menColor(palace.baMen)}`}>{palace.baMen}</span>
          <span className={`text-xs ${ganColor(palace.diPanGan)}`}>{palace.diPanGan}</span>
        </div>
        
        {/* 八门旺衰 + 十二长生 */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-dark-500">{menStatus.gongWs}月{menStatus.monthWs}</span>
          {diGanTwelve && <span className="text-dark-400">{diGanTwelve}</span>}
        </div>
      </div>
    </div>
  )
}
