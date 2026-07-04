/**
 * 四柱八字排盘页面
 */
import { useState, useEffect } from 'react'
import { calculateBazi, GAN_WUXING } from '../lib/bazi'
import type { BaziResult } from '../lib/bazi'

// 五行颜色映射
const WX_COLOR: Record<string, string> = {
  '木': 'text-green-400',
  '火': 'text-red-400',
  '土': 'text-yellow-400',
  '金': 'text-gray-300',
  '水': 'text-blue-400',
}

const WX_BG: Record<string, string> = {
  '木': 'bg-green-400',
  '火': 'bg-red-400',
  '土': 'bg-yellow-400',
  '金': 'bg-gray-300',
  '水': 'bg-blue-400',
}

const WX_BORDER: Record<string, string> = {
  '木': 'border-green-400/40',
  '火': 'border-red-400/40',
  '土': 'border-yellow-400/40',
  '金': 'border-gray-300/40',
  '水': 'border-blue-400/40',
}

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱']

export default function BaziPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [day, setDay] = useState(now.getDate())
  const [hour, setHour] = useState(now.getHours())
  const [gender, setGender] = useState<'男' | '女'>('男')
  const [result, setResult] = useState<BaziResult | null>(null)
  const [loading, setLoading] = useState(false)

  const doPaipan = () => {
    setLoading(true)
    try {
      const r = calculateBazi(year, month, day, hour, 0, gender)
      setResult(r)
    } catch (e) {
      console.error('排盘出错:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    doPaipan()
  }, [])

  const pillars = result
    ? [result.year, result.month, result.day, result.hour]
    : []

  const maxPower = result
    ? Math.max(...Object.values(result.wuXingPower), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="card">
        <h2 className="text-lg font-bold text-dark-100 mb-4">四柱八字排盘</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs text-dark-400 mb-1">年</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              min={1900}
              max={2100}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">月</label>
            <input
              type="number"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              min={1}
              max={12}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">日</label>
            <input
              type="number"
              value={day}
              onChange={e => setDay(Number(e.target.value))}
              min={1}
              max={31}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">时（0-23）</label>
            <input
              type="number"
              value={hour}
              onChange={e => setHour(Number(e.target.value))}
              min={0}
              max={23}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">性别</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value as '男' | '女')}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
        </div>
        <button
          onClick={doPaipan}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '排盘中…' : '排盘'}
        </button>
      </div>

      {result && (
        <>
          {/* 日主信息 */}
          <div className="card">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-dark-400 text-sm">日主</span>
                <span className={`text-2xl font-bold ${WX_COLOR[result.dayMaster.wuXing]}`}>
                  {result.dayMaster.gan}
                </span>
                <span className="text-xs text-dark-400">
                  {result.dayMaster.yinYang}{result.dayMaster.wuXing}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-dark-400 text-sm">性别</span>
                <span className="text-dark-100 text-sm">{result.gender}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-dark-400 text-sm">农历</span>
                <span className="text-dark-300 text-sm">{result.lunarDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-dark-400 text-sm">公历</span>
                <span className="text-dark-300 text-sm">{result.solarDate}</span>
              </div>
              {result.startDaYunAge > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-dark-400 text-sm">起运</span>
                  <span className="text-indigo-400 text-sm">{result.startDaYunAge}岁</span>
                </div>
              )}
            </div>
          </div>

          {/* 四柱展示 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className={`card border ${WX_BORDER[pillar.ganWuXing]} text-center`}
              >
                <div className="text-xs text-dark-500 mb-2">{PILLAR_LABELS[idx]}</div>

                {/* 天干 */}
                <div className={`text-3xl font-bold mb-1 ${WX_COLOR[pillar.ganWuXing]}`}>
                  {pillar.gan}
                </div>
                <div className="text-xs text-dark-400 mb-2">
                  {pillar.shiShen !== '日主' ? pillar.shiShen : '日主'}
                  <span className="ml-1 opacity-60">
                    {pillar.ganYinYang}{pillar.ganWuXing}
                  </span>
                </div>

                {/* 地支 */}
                <div className={`text-2xl font-semibold mb-1 ${WX_COLOR[pillar.zhiWuXing]}`}>
                  {pillar.zhi}
                </div>
                <div className="text-xs text-dark-500 mb-2">{pillar.zhiWuXing}</div>

                {/* 藏干 */}
                <div className="flex flex-wrap justify-center gap-1 mb-2">
                  {pillar.cangGan.map((cg, i) => (
                    <span
                      key={i}
                      className={`text-xs px-1 rounded ${WX_COLOR[cg.wuXing]}`}
                      title={cg.shiShen}
                    >
                      {cg.gan}
                      <span className="opacity-60 ml-0.5">{cg.shiShen}</span>
                    </span>
                  ))}
                </div>

                {/* 纳音 */}
                {pillar.naYin && (
                  <div className="text-xs text-dark-400 mb-1">纳音：{pillar.naYin}</div>
                )}

                {/* 十二长生 */}
                <div className="text-xs text-indigo-400">{pillar.twelveState}</div>

                {/* 干支合字 */}
                <div className="mt-2 pt-2 border-t border-dark-700/50 text-sm font-medium text-dark-300">
                  {pillar.ganZhi}
                </div>
              </div>
            ))}
          </div>

          {/* 五行力量 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-dark-200 mb-4">五行力量</h3>
            <div className="space-y-3">
              {['木', '火', '土', '金', '水'].map(wx => {
                const power = result.wuXingPower[wx] || 0
                const count = result.wuXingCount[wx] || 0
                const pct = Math.round((power / maxPower) * 100)
                return (
                  <div key={wx} className="flex items-center gap-3">
                    <span className={`w-4 text-sm font-bold ${WX_COLOR[wx]}`}>{wx}</span>
                    <div className="flex-1 bg-dark-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${WX_BG[wx]}`}
                        style={{ width: `${pct}%`, opacity: 0.85 }}
                      />
                    </div>
                    <span className="text-xs text-dark-400 w-16 text-right">
                      {power} <span className="opacity-50">({count}个)</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 大运 */}
          {result.daYun.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-dark-200 mb-4">大运</h3>
              <div className="flex overflow-x-auto gap-2 pb-2">
                {result.daYun.map((dy, idx) => {
                  const ganWx = GAN_WUXING[dy.ganZhi[0]] || '土'
                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 card border ${WX_BORDER[ganWx]} text-center min-w-[80px]`}
                    >
                      <div className={`text-lg font-bold ${WX_COLOR[ganWx]}`}>
                        {dy.ganZhi}
                      </div>
                      <div className="text-xs text-indigo-400 mt-1">{dy.shiShen}</div>
                      <div className="text-xs text-dark-500 mt-1">{dy.startAge}岁起</div>
                      <div className="text-xs text-dark-600">{dy.startYear}年</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
