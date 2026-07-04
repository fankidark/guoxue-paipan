/**
 * 底部参考速查区组件
 * 包含：十二长生/旺衰/五行/时辰/年命/天干地支/九宫本位/吉凶速查 全部内容。
 * 从原 QimenPage.tsx 拆分出来，保持所有内容不变。
 */
import { useState } from 'react'

// ============================================================================
// 五行颜色常量（独立维护，不依赖外部）
// ============================================================================

const WX_TEXT_COLOR: Record<string, string> = {
  '金': 'text-yellow-400',
  '木': 'text-green-400',
  '水': 'text-blue-400',
  '火': 'text-red-400',
  '土': 'text-amber-600',
}

// ============================================================================
// 天干 / 地支颜色
// ============================================================================

const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}
const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
}
function ganColor(gan: string) { return WX_TEXT_COLOR[GAN_WUXING[gan] || '土'] || 'text-dark-100' }
function zhiColor(zhi: string) { return WX_TEXT_COLOR[ZHI_WUXING[zhi] || '土'] || 'text-dark-100' }

/** 九星五行颜色 */
const XING_WUXING_LOCAL: Record<string, string> = {
  '天蓬': '水', '天芮': '土', '天冲': '木', '天辅': '木',
  '天禽': '土', '天心': '金', '天柱': '金', '天任': '土', '天英': '火',
}
function xingColor(xing: string) { return WX_TEXT_COLOR[XING_WUXING_LOCAL[xing] || '土'] || 'text-dark-100' }

/** 八门五行颜色 */
const MEN_WUXING_LOCAL: Record<string, string> = {
  '休门': '水', '死门': '土', '伤门': '木', '杜门': '木',
  '景门': '火', '开门': '金', '惊门': '金', '生门': '土',
}
function menColor(men: string) { return WX_TEXT_COLOR[MEN_WUXING_LOCAL[men] || '土'] || 'text-dark-100' }

// ============================================================================
// 十二长生说明
// ============================================================================

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

// ============================================================================
// 纳音表（年命速查用）
// ============================================================================

const NAYIN_TABLE: Record<string, [string, string]> = {
  '甲子': ['海中金', '金'], '乙丑': ['海中金', '金'], '丙寅': ['炉中火', '火'], '丁卯': ['炉中火', '火'],
  '戊辰': ['大林木', '木'], '己巳': ['大林木', '木'], '庚午': ['路旁土', '土'], '辛未': ['路旁土', '土'],
  '壬申': ['剑锋金', '金'], '癸酉': ['剑锋金', '金'], '甲戌': ['山头火', '火'], '乙亥': ['山头火', '火'],
  '丙子': ['涧下水', '水'], '丁丑': ['涧下水', '水'], '戊寅': ['城头土', '土'], '己卯': ['城头土', '土'],
  '庚辰': ['白蜡金', '金'], '辛巳': ['白蜡金', '金'], '壬午': ['杨柳木', '木'], '癸未': ['杨柳木', '木'],
  '甲申': ['泉中水', '水'], '乙酉': ['泉中水', '水'], '丙戌': ['屋上土', '土'], '丁亥': ['屋上土', '土'],
  '戊子': ['霹雳火', '火'], '己丑': ['霹雳火', '火'], '庚寅': ['松柏木', '木'], '辛卯': ['松柏木', '木'],
  '壬辰': ['长流水', '水'], '癸巳': ['长流水', '水'], '甲午': ['沙中金', '金'], '乙未': ['沙中金', '金'],
  '丙申': ['山下火', '火'], '丁酉': ['山下火', '火'], '戊戌': ['平地木', '木'], '己亥': ['平地木', '木'],
  '庚子': ['壁上土', '土'], '辛丑': ['壁上土', '土'], '壬寅': ['金箔金', '金'], '癸卯': ['金箔金', '金'],
  '甲辰': ['覆灯火', '火'], '乙巳': ['覆灯火', '火'], '丙午': ['天河水', '水'], '丁未': ['天河水', '水'],
  '戊申': ['大驿土', '土'], '己酉': ['大驿土', '土'], '庚戌': ['钗钏金', '金'], '辛亥': ['钗钏金', '金'],
  '壬子': ['桑柘木', '木'], '癸丑': ['桑柘木', '木'], '甲寅': ['大溪水', '水'], '乙卯': ['大溪水', '水'],
  '丙辰': ['沙中土', '土'], '丁巳': ['沙中土', '土'], '戊午': ['天上火', '火'], '己未': ['天上火', '火'],
  '庚申': ['石榴木', '木'], '辛酉': ['石榴木', '木'], '壬戌': ['大海水', '水'], '癸亥': ['大海水', '水'],
}

const TIAN_GAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI_LIST = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

function getYearInfo(year: number) {
  const ganIdx = ((year - 4) % 10 + 10) % 10
  const zhiIdx = ((year - 4) % 12 + 12) % 12
  const gan = TIAN_GAN_LIST[ganIdx]
  const zhi = DI_ZHI_LIST[zhiIdx]
  const shengXiao = SHENG_XIAO[zhiIdx]
  const gz = gan + zhi
  const nayin = NAYIN_TABLE[gz]
  return { gan, zhi, gz, shengXiao, nayinName: nayin?.[0] || '', nayinWx: nayin?.[1] || '' }
}

// ============================================================================
// 年份速查子组件
// ============================================================================

function YearLookup() {
  const [year, setYear] = useState(new Date().getFullYear())
  const info = getYearInfo(year)

  return (
    <div>
      <div className="text-xs text-dark-300 font-medium mb-1.5">年份查询</div>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
          className="input-field w-24 text-sm"
          min={1900}
          max={2100}
        />
        <span className="text-xs text-dark-400">年</span>
      </div>

      <div className="bg-dark-800/40 border border-dark-700/30 rounded-lg p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="text-center">
            <div className="text-dark-500 mb-1">干支</div>
            <div className="text-lg font-bold">
              <span className={ganColor(info.gan)}>{info.gan}</span>
              <span className={zhiColor(info.zhi)}>{info.zhi}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-dark-500 mb-1">生肖</div>
            <div className="text-lg font-bold text-dark-100">{info.shengXiao}</div>
          </div>
          <div className="text-center">
            <div className="text-dark-500 mb-1">纳音</div>
            <div className={`text-sm font-bold ${WX_TEXT_COLOR[info.nayinWx]}`}>{info.nayinName}</div>
          </div>
          <div className="text-center">
            <div className="text-dark-500 mb-1">年命五行</div>
            <div className={`text-lg font-bold ${WX_TEXT_COLOR[info.nayinWx]}`}>{info.nayinWx}</div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-dark-600 space-y-0.5">
        <div>• 年命=纳音五行，用于判断求测人与盘中元素的生克关系</div>
        <div>• 年命被克：不利，受压制。年命得生：有助力。年命克宫：耗费精力</div>
        <div>• 天干由年份尾数决定，地支按12年一轮循环（子丑寅卯...）</div>
      </div>
    </div>
  )
}

// ============================================================================
// 主组件：底部参考速查区
// ============================================================================

/** WsItem 小标签 */
function WsItem({ label, desc, color = 'text-amber-400' }: { label: string; desc: string; color?: string }) {
  return (
    <div className="flex items-start gap-1.5 text-xs">
      <span className={`font-medium whitespace-nowrap ${color}`}>{label}</span>
      <span className="text-dark-500">{desc}</span>
    </div>
  )
}

export default function ReferenceSection() {
  return (
    <>
      {/* 十二长生参考 */}
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
            ['子时', '23:00-01:00', '深夜/凌晨', '水'], ['丑时', '01:00-03:00', '凌晨', '土'],
            ['寅时', '03:00-05:00', '黎明前', '木'], ['卯时', '05:00-07:00', '日出/早晨', '木'],
            ['辰时', '07:00-09:00', '早餐后', '土'], ['巳时', '09:00-11:00', '上午', '火'],
            ['午时', '11:00-13:00', '中午', '火'], ['未时', '13:00-15:00', '下午', '土'],
            ['申时', '15:00-17:00', '傍晚前', '金'], ['酉时', '17:00-19:00', '傍晚/下班', '金'],
            ['戌时', '19:00-21:00', '晚上', '土'], ['亥时', '21:00-23:00', '深夜前', '水'],
          ].map(([name, time, modern, wx]) => (
            <div key={name} className="bg-dark-800/40 rounded px-2 py-1.5 text-center">
              <div className={`font-medium ${WX_TEXT_COLOR[wx]}`}>{name}</div>
              <div className="text-dark-400 text-[10px]">{time}</div>
              <div className="text-dark-600 text-[9px]">{modern}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 年命速查 */}
      <div className="card">
        <h3 className="text-sm text-dark-400 font-medium mb-3">年命速查</h3>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-dark-300 font-medium mb-1.5">年份尾数对应天干</div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-xs">
              {[
                ['4', '甲', '木'], ['5', '乙', '木'], ['6', '丙', '火'], ['7', '丁', '火'],
                ['8', '戊', '土'], ['9', '己', '土'], ['0', '庚', '金'], ['1', '辛', '金'],
                ['2', '壬', '水'], ['3', '癸', '水'],
              ].map(([num, gan, wx]) => (
                <div key={num} className="bg-dark-800/40 rounded px-1.5 py-1.5 text-center">
                  <div className="text-dark-300 font-bold">{num}</div>
                  <div className={`font-medium ${WX_TEXT_COLOR[wx]}`}>{gan}{wx}</div>
                </div>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-dark-600">记忆口诀：4甲5乙6丙7丁8戊9己0庚1辛2壬3癸</div>
          </div>
          <YearLookup />
        </div>
      </div>

      {/* 天干地支五行速查 */}
      <div className="card">
        <h3 className="text-sm text-dark-400 font-medium mb-3">天干地支五行速查</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-dark-300 font-medium mb-1.5">十天干</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                ['甲', '木', '阳'], ['乙', '木', '阴'], ['丙', '火', '阳'], ['丁', '火', '阴'],
                ['戊', '土', '阳'], ['己', '土', '阴'], ['庚', '金', '阳'], ['辛', '金', '阴'],
                ['壬', '水', '阳'], ['癸', '水', '阴'],
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
              {[
                ['子', '水', '鼠'], ['丑', '土', '牛'], ['寅', '木', '虎'], ['卯', '木', '兔'],
                ['辰', '土', '龙'], ['巳', '火', '蛇'], ['午', '火', '马'], ['未', '土', '羊'],
                ['申', '金', '猴'], ['酉', '金', '鸡'], ['戌', '土', '狗'], ['亥', '水', '猪'],
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
            { gong: 4, gua: '巽', dir: '东南', wx: '木', xing: '天辅', men: '杜门' },
            { gong: 9, gua: '离', dir: '南', wx: '火', xing: '天英', men: '景门' },
            { gong: 2, gua: '坤', dir: '西南', wx: '土', xing: '天芮', men: '死门' },
            { gong: 3, gua: '震', dir: '东', wx: '木', xing: '天冲', men: '伤门' },
            { gong: 5, gua: '中', dir: '中', wx: '土', xing: '天禽', men: '—' },
            { gong: 7, gua: '兑', dir: '西', wx: '金', xing: '天柱', men: '惊门' },
            { gong: 8, gua: '艮', dir: '东北', wx: '土', xing: '天任', men: '生门' },
            { gong: 1, gua: '坎', dir: '北', wx: '水', xing: '天蓬', men: '休门' },
            { gong: 6, gua: '乾', dir: '西北', wx: '金', xing: '天心', men: '开门' },
          ].map((p) => (
            <div key={p.gong} className="bg-dark-800/40 border border-dark-700/30 rounded p-2 text-center">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold ${WX_TEXT_COLOR[p.wx]}`}>{p.gua}{p.gong}</span>
                <span className="text-dark-500 text-[10px]">{p.dir}·{p.wx}</span>
              </div>
              <div className={xingColor(p.xing)}>{p.xing}</div>
              <div className={menColor(p.men)}>{p.men}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-dark-500">
          <div className="font-medium text-dark-400 mb-1">八神排列顺序</div>
          <div>值符 → 螣蛇 → 太阴 → 六合 → 白虎 → 玄武 → 九地 → 九天</div>
          <div className="mt-1 text-dark-600">（八神无固定本位宫，从值符目标宫起按阳遁顺时针/阴遁逆时针排列）</div>
        </div>
      </div>

      {/* 九星八门八神吉凶速查 */}
      <div className="card">
        <h3 className="text-sm text-dark-400 font-medium mb-3">九星·八门·八神吉凶速查</h3>
        <div className="space-y-4">
          {/* 九星吉凶 */}
          <div>
            <div className="text-xs text-dark-300 font-medium mb-1.5">九星吉凶</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {[
                ['天心', '金', '大吉', '主贵人、医药、技术、策划，利求谋'],
                ['天任', '土', '吉', '主忠厚、稳重、土地、农业，利守成'],
                ['天辅', '木', '吉', '主文昌、学业、仁慈、教育，利文事'],
                ['天冲', '木', '小吉', '主果敢、冲动、武勇，利出行征战'],
                ['天禽', '土', '中平', '主中正、沉稳，随天芮同宫判断'],
                ['天英', '火', '小凶', '主血光、文书、是非口舌，宜南方事'],
                ['天芮', '土', '大凶', '主疾病、小人、阴私暗害，百事不利'],
                ['天柱', '金', '凶', '主毁折、口舌、惊恐，不利谋事'],
                ['天蓬', '水', '大凶', '主盗贼、暗昧、奸淫，百事皆凶'],
              ].map(([name, wx, ji, desc]) => (
                <div key={name} className="bg-dark-800/40 rounded px-2 py-1.5 flex items-start gap-2">
                  <span className={`font-medium whitespace-nowrap ${WX_TEXT_COLOR[wx]}`}>{name}</span>
                  <span className={`whitespace-nowrap ${ji.includes('凶') ? 'text-red-400' : ji === '中平' ? 'text-dark-400' : 'text-green-400'}`}>{ji}</span>
                  <span className="text-dark-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 八门吉凶 */}
          <div>
            <div className="text-xs text-dark-300 font-medium mb-1.5">八门吉凶</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {[
                ['开门', '金', '大吉', '主开创、官贵、升迁，万事可为'],
                ['休门', '水', '吉', '主休养、贵人相助，利求财见贵'],
                ['生门', '土', '大吉', '主生机、财利、营造，利求财开业'],
                ['伤门', '木', '凶', '主伤灾、口角、竞争，利追讨索债'],
                ['杜门', '木', '中平', '主阻塞、隐匿、闭藏，利防守躲避'],
                ['景门', '火', '中平', '主文书、光明、消息，利文事考试'],
                ['死门', '土', '大凶', '主死丧、凶险、绝境，百事不利'],
                ['惊门', '金', '凶', '主惊恐、官非、口舌，宜坐镇安抚'],
              ].map(([name, wx, ji, desc]) => (
                <div key={name} className="bg-dark-800/40 rounded px-2 py-1.5 flex items-start gap-2">
                  <span className={`font-medium whitespace-nowrap ${WX_TEXT_COLOR[wx]}`}>{name}</span>
                  <span className={`whitespace-nowrap ${ji.includes('凶') ? 'text-red-400' : ji === '中平' ? 'text-dark-400' : 'text-green-400'}`}>{ji}</span>
                  <span className="text-dark-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 八神吉凶 */}
          <div>
            <div className="text-xs text-dark-300 font-medium mb-1.5">八神吉凶</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {[
                ['值符', '土', '大吉', '主尊贵、领导、上级庇护，诸事皆吉'],
                ['螣蛇', '火', '凶', '主虚惊、怪异、缠绕、梦寐不安'],
                ['太阴', '金', '吉', '主阴谋、暗助、贵人暗中相帮'],
                ['六合', '木', '吉', '主和合、婚姻、交易、中间人'],
                ['白虎', '金', '凶', '主凶煞、伤病、丧事、刑罚血光'],
                ['玄武', '水', '凶', '主盗贼、欺诈、暗昧、失物走失'],
                ['九地', '土', '吉', '主柔顺、包容、藏匿、守旧安稳'],
                ['九天', '火', '吉', '主刚健、远大、向上、宜远行高举'],
              ].map(([name, wx, ji, desc]) => (
                <div key={name} className="bg-dark-800/40 rounded px-2 py-1.5 flex items-start gap-2">
                  <span className={`font-medium whitespace-nowrap ${WX_TEXT_COLOR[wx]}`}>{name}</span>
                  <span className={`whitespace-nowrap ${ji.includes('凶') ? 'text-red-400' : 'text-green-400'}`}>{ji}</span>
                  <span className="text-dark-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
