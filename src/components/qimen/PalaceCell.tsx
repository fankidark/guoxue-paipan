/**
 * 九宫格单元格组件
 * 负责展示单个宫位的所有信息：八神、九星、八门、天地盘干、旺衰、十二长生等。
 * 所有点击弹窗通过 DetailContext 的 useDetail() 钩子实现。
 */
import type { QimenPalace } from '../../lib/qimen'
import { useDetail } from './DetailContext'
import {
  GONG_GUA, XING_WUXING, MEN_WUXING,
  getXingStatus, getMenStatus, isMenPo,
} from '../../lib/qimen-status'
import { getGanTwelveInGongDouble, hasXingInGong } from '../../lib/qimen-twelve'
import {
  XING_DETAIL, MEN_DETAIL, SHEN_DETAIL,
  SPECIAL_DETAIL, WANGSHUAI_DETAIL, TWELVE_DETAIL, GEJU_DETAIL,
} from '../../lib/qimen-details'

// ============================================================================
// 五行颜色工具
// ============================================================================

/** 五行 → Tailwind 文字颜色 */
const WX_TEXT_COLOR: Record<string, string> = {
  '金': 'text-yellow-400',
  '木': 'text-green-400',
  '水': 'text-blue-400',
  '火': 'text-red-400',
  '土': 'text-amber-600',
}

/** 天干五行 */
const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

/** 宫位五行 */
const GONG_WX: Record<number, string> = {
  1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火',
}

/** 八神五行 */
const SHEN_WUXING: Record<string, string> = {
  '值符': '土', '螣蛇': '火', '太阴': '金', '六合': '木',
  '白虎': '金', '玄武': '水', '九地': '土', '九天': '火',
}

function ganColor(gan: string) { return WX_TEXT_COLOR[GAN_WUXING[gan] || '土'] || 'text-dark-100' }
function shenColor(shen: string) { return WX_TEXT_COLOR[SHEN_WUXING[shen] || '土'] || 'text-dark-100' }
function xingColor(xing: string) { return WX_TEXT_COLOR[XING_WUXING[xing] || '土'] || 'text-dark-100' }
function menColor(men: string) { return WX_TEXT_COLOR[MEN_WUXING[men] || '土'] || 'text-dark-100' }
function gongColor(gong: number) { return WX_TEXT_COLOR[GONG_WX[gong] || '土'] || 'text-dark-100' }

// ============================================================================
// 组件 Props
// ============================================================================

interface PalaceCellProps {
  palace: QimenPalace
  monthZhi: string
  zhongGongGan?: string     // 中宫地盘干（寄坤标记用）
  isZhiFuOrig?: boolean     // 是否值符原宫
  isZhiFuDest?: boolean     // 是否值符目标宫
}

// ============================================================================
// 主组件
// ============================================================================

/**
 * 九宫格单元格
 * - 响应式：大屏 min-h-[160px]，小屏 min-h-[120px]，字体也相应紧凑
 */
export default function PalaceCell({ palace, monthZhi, zhongGongGan, isZhiFuOrig, isZhiFuDest }: PalaceCellProps) {
  const { showDetail } = useDetail()

  const gongNum = palace.gongNumber
  const guaName = GONG_GUA[gongNum] || ''
  const gColor = gongColor(gongNum)

  const xingStatus = getXingStatus(palace.jiuXing, gongNum, monthZhi)
  const menStatus = getMenStatus(palace.baMen, gongNum, monthZhi)
  const menPo = isMenPo(palace.baMen, gongNum)

  // 双地支十二长生
  const tianTwelve = getGanTwelveInGongDouble(palace.tianPanGan, gongNum)
  const diTwelve = getGanTwelveInGongDouble(palace.diPanGan, gongNum)

  // 地支三刑
  const tianXing = hasXingInGong(palace.tianPanGan, gongNum)
  const diXing = hasXingInGong(palace.diPanGan, gongNum)

  // ── 弹窗辅助函数 ──

  function showXingDetail(name: string) {
    const d = XING_DETAIL[name]
    if (!d) return
    showDetail(`${name}（${d.wx}·${d.ji}）`, (
      <div className="space-y-2">
        <p>{d.desc}</p>
        <div><span className="text-dark-400 font-medium">象意：</span>{d.象意}</div>
        <div><span className="text-dark-400 font-medium">主事：</span>{d.主事}</div>
      </div>
    ))
  }

  function showMenDetail(name: string) {
    const d = MEN_DETAIL[name]
    if (!d) return
    showDetail(`${name}（${d.wx}·${d.ji}）`, (
      <div className="space-y-2">
        <p>{d.desc}</p>
        <div><span className="text-dark-400 font-medium">象意：</span>{d.象意}</div>
        <div><span className="text-dark-400 font-medium">主事：</span>{d.主事}</div>
      </div>
    ))
  }

  function showShenDetail(name: string) {
    const d = SHEN_DETAIL[name]
    if (!d) return
    showDetail(`${name}（${d.wx}·${d.ji}）`, (
      <div className="space-y-2">
        <p>{d.desc}</p>
        <div><span className="text-dark-400 font-medium">象意：</span>{d.象意}</div>
        <div><span className="text-dark-400 font-medium">主事：</span>{d.主事}</div>
      </div>
    ))
  }

  function showSpecialDetail(key: string) {
    const d = SPECIAL_DETAIL[key]
    if (!d) return
    showDetail(d.title, (
      <div className="space-y-2">
        <p>{d.desc}</p>
        <div><span className="text-dark-400 font-medium">影响：</span>{d.影响}</div>
        <div><span className="text-dark-400 font-medium">化解：</span>{d.化解}</div>
      </div>
    ))
  }

  function showWsDetail(ws: string) {
    const d = WANGSHUAI_DETAIL[ws]
    if (!d) return
    showDetail(`旺衰·${d.title}`, (
      <div className="space-y-2">
        {d.desc.split('\n').map((line, i) => <p key={i}>{line}</p>)}
      </div>
    ))
  }

  function showTwelveDetail(state: string) {
    // 从缩写还原全称
    const SHORT_TO_FULL: Record<string, string> = {
      '生': '长生', '沐': '沐浴', '冠': '冠带', '临': '临官', '旺': '帝旺',
      '衰': '衰', '病': '病', '死': '死', '墓': '墓', '绝': '绝', '胎': '胎', '养': '养',
    }
    const full = SHORT_TO_FULL[state] || state
    const d = TWELVE_DETAIL[full]
    if (!d) return
    showDetail(`十二长生·${d.title}`, (
      <div className="space-y-2">
        <p>{d.desc}</p>
        <div><span className="text-dark-400 font-medium">力量：</span>{d.力量}</div>
      </div>
    ))
  }

  // ── 格局标记（来自 palace.geJu） ──
  const geJu = palace.geJu ?? []

  return (
    /* 响应式：小屏 min-h-[120px]，大屏 min-h-[160px]；字体在小屏更紧凑 */
    <div className={`bg-dark-800/40 border border-dark-700/30 rounded-lg p-1.5 sm:p-2.5 min-h-[120px] sm:min-h-[160px] relative flex flex-col justify-between`}>
      {/* 左上角：卦名 */}
      <span className={`absolute top-1 sm:top-1.5 left-1.5 sm:left-2 text-[10px] sm:text-[11px] font-bold ${gColor}`}>
        {guaName}
      </span>

      {/* 右上角：驿马🐎 空亡○（可点击） */}
      <div className="absolute top-1 sm:top-1.5 right-1.5 sm:right-2 flex items-center gap-0.5">
        {palace.yiMa && (
          <span
            className="text-[10px] sm:text-[11px] cursor-pointer"
            onClick={() => showSpecialDetail('马')}
          >🐎</span>
        )}
        {palace.kongWang && (
          <span
            className="text-[10px] sm:text-[11px] text-dark-400 cursor-pointer hover:text-dark-200"
            onClick={() => showSpecialDetail('空')}
          >○</span>
        )}
      </div>

      {/* 左下角：宫位数字 + 中宫壬寄坤(仅2宫) */}
      <span className={`absolute bottom-1 sm:bottom-1.5 left-1.5 sm:left-2 text-xs sm:text-sm font-bold ${gColor}`}>
        {gongNum}
        {zhongGongGan && gongNum === 2 && (
          <span className={`ml-0.5 text-[9px] sm:text-[10px] font-normal ${ganColor(zhongGongGan)}`}>{zhongGongGan}</span>
        )}
      </span>

      {/* 主内容区 — 固定列宽精确对齐 */}
      <div className="flex flex-col items-center pt-3.5 sm:pt-4 pb-2.5 sm:pb-3 w-full px-0.5">
        {/* 八神（居中独占一行） */}
        <span
          className={`text-[10px] sm:text-xs font-medium cursor-pointer hover:underline mb-[2px] ${shenColor(palace.baShen)}`}
          onClick={() => showShenDetail(palace.baShen)}
        >{palace.baShen}</span>

        {/* 统一grid容器：所有行共享列宽 */}
        <div className="grid grid-cols-[16px_1fr_1fr] sm:grid-cols-[20px_1fr_1fr] w-full gap-y-0 items-center">
          {/* ─── 九星行 ─── */}
          <span className="text-right pr-0.5">
            {zhongGongGan && isZhiFuOrig && (
              <span className={`text-[10px] sm:text-xs font-bold ${ganColor(zhongGongGan)}`}>{zhongGongGan}</span>
            )}
          </span>
          <span
            className={`text-[10px] sm:text-xs cursor-pointer hover:underline text-center ${xingColor(palace.jiuXing)}`}
            onClick={() => showXingDetail(palace.jiuXing)}
          >{palace.jiuXing}</span>
          <span className={`text-xs sm:text-sm font-bold text-center ${ganColor(palace.tianPanGan)}`}>
            {palace.tianPanGan}
            {palace.anGan && <span className="text-[8px] sm:text-[9px] text-dark-500 font-normal">({palace.anGan})</span>}
          </span>

          {/* ─── 九星旺衰行 ─── */}
          <span className="text-right pr-0.5 text-[9px] sm:text-[10px] text-amber-500/70">
            {zhongGongGan && isZhiFuOrig && (
              <>
                {getGanTwelveInGongDouble(zhongGongGan, gongNum).split('').map((ch: string, i: number) => (
                  <span key={i} className="cursor-pointer hover:underline" onClick={() => showTwelveDetail(ch)}>{ch}</span>
                ))}
              </>
            )}
          </span>
          <span className="text-center text-[9px] sm:text-[10px] text-dark-500">
            <span className="cursor-pointer hover:text-dark-300" onClick={() => showWsDetail(xingStatus.gongWs)}>{xingStatus.gongWs}</span>
            <span className="cursor-pointer hover:text-dark-300" onClick={() => showWsDetail(xingStatus.monthWs)}>月{xingStatus.monthWs}</span>
          </span>
          <span className="text-center text-[9px] sm:text-[10px] text-amber-500/70">
            {tianXing ? (
              <span className="text-pink-400 cursor-pointer hover:underline" onClick={() => showSpecialDetail('刑')}>刑</span>
            ) : ''}
            {tianTwelve.split('').map((ch, i) => (
              <span key={i} className="cursor-pointer hover:underline" onClick={() => showTwelveDetail(ch)}>{ch}</span>
            ))}
          </span>

          {/* ─── 八门行（上方加间距） ─── */}
          <span className="col-span-3 h-1 sm:h-1.5" />
          <span />
          <span
            className={`text-[10px] sm:text-xs font-medium cursor-pointer hover:underline text-center ${menColor(palace.baMen)}`}
            onClick={() => showMenDetail(palace.baMen)}
          >{palace.baMen}</span>
          <span className={`text-[10px] sm:text-xs text-center ${ganColor(palace.diPanGan)}`}>
            {palace.diPanGan}
          </span>

          {/* ─── 八门旺衰行 ─── */}
          <span />
          <span className="text-center text-[9px] sm:text-[10px] text-dark-500">
            {menPo
              ? <span className="text-pink-400 cursor-pointer hover:underline" onClick={() => showSpecialDetail('迫')}>迫</span>
              : <span className="cursor-pointer hover:text-dark-300" onClick={() => showWsDetail(menStatus.gongWs)}>{menStatus.gongWs}</span>
            }
            <span className="cursor-pointer hover:text-dark-300" onClick={() => showWsDetail(menStatus.monthWs)}>月{menStatus.monthWs}</span>
          </span>
          <span className="text-center text-[9px] sm:text-[10px] text-amber-500/70">
            {diXing ? (<span className="text-pink-400 cursor-pointer hover:underline" onClick={() => showSpecialDetail('刑')}>刑</span>) : ''}
            {diTwelve.split('').map((ch: string, i: number) => (
              <span key={i} className="cursor-pointer hover:underline" onClick={() => showTwelveDetail(ch)}>{ch}</span>
            ))}
          </span>
        </div>

        {/* 格局标记（可点击查看详解） */}
        {geJu.length > 0 && (
          <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
            {geJu.map((g: string, i: number) => (
              <span
                key={i}
                className={`text-[9px] sm:text-[10px] text-purple-400 bg-purple-900/30 rounded px-0.5 ${GEJU_DETAIL[g] ? 'cursor-pointer hover:bg-purple-900/60' : ''}`}
                onClick={() => {
                  const d = GEJU_DETAIL[g]
                  if (d) {
                    showDetail(d.title, (
                      <div className="space-y-2">
                        <p>{d.desc}</p>
                        <div><span className="text-dark-400 font-medium">吉凶：</span>{d.吉凶}</div>
                      </div>
                    ))
                  }
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
