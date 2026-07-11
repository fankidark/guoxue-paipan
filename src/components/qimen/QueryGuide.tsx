/**
 * 查什么 — 问事用神速查面板
 * 选择要测的事 → 弹窗显示用神表+判断要点
 * 专业名词（星/门/神/概念）可点击弹出详解，栈式弹窗支持返回继续查看
 */
import { useDetail } from './DetailContext'
import { XING_DETAIL, MEN_DETAIL, SHEN_DETAIL, SPECIAL_DETAIL, WANGSHUAI_DETAIL } from '../../lib/qimen-details'

// ============================================================================
// 术语弹窗内容构建
// ============================================================================

const CONCEPT_DETAIL: Record<string, { desc: string; extra?: string }> = {
  '日干': { desc: '四柱中日柱的天干，奇门中代表求测人自己。看日干落宫的旺衰、组合，判断求测人的状态与处境。', extra: '天盘日干代表现在/将来，地盘日干代表过去。' },
  '时干': { desc: '四柱中时柱的天干，代表所测的事情本身（事体）。也代表对方、目的地、失物等（视问事而定）。', extra: '日干为人，时干为事——两宫的生克关系是断成败的核心。' },
  '年命': { desc: '求测人出生年的天干（年命干）。测终身命运、重大事项时以年命为主线，与日干互参。', extra: '' },
  '用神': { desc: '断局时的"主角"——问什么事，就在盘上找代表这件事的符号。问事不同用神不同：测财看生门戊，测婚男看乙女看庚。', extra: '断局流程：定用神→找落宫→看旺衰→看组合→下结论。' },
  '乙奇': { desc: '三奇之一，日奇/天德。代表妻子、女人、医生、医药、艺术。测婚姻中为女方/妻子的代表符号。', extra: '乙的实现方式是"弯曲实现"——绕个弯才成。' },
  '丙奇': { desc: '三奇之一，月奇/天威。代表权威、乱子、男性第三者。测婚外情中为男方第三者符号。', extra: '丙的实现方式是"出乱子实现"——折腾一场才成。' },
  '丁奇': { desc: '三奇之一，星奇/玉女。代表文书、证件、合同、信息、女性第三者。测考试文书最重要的符号。', extra: '丁的希望最好——三奇中实现最顺。' },
  '戊': { desc: '六仪之一，甲子旬首。奇门中戊=钱财、资本、资金，测财运第一用神。', extra: '天盘戊+地盘生门同宫为经典财局。' },
  '庚': { desc: '六仪之一，甲申旬首。奇门中庚=阻隔、丈夫、仇人、道路。测婚姻中为男方/丈夫符号；测事为阻碍。', extra: '六庚诸格（岁格/月格/伏干格/时格）皆凶，详见凶格。' },
  '六合': { desc: '八神之一，属木主吉。代表合作、中介、婚姻、和谐。测婚姻的核心用神——六合旺相有力婚事可成。', extra: '⚠️ 六合逢空亡=合作婚姻的否决票。' },
  '空亡': SPECIAL_DETAIL['空'] ? { desc: SPECIAL_DETAIL['空'].desc + '\n' + SPECIAL_DETAIL['空'].影响, extra: SPECIAL_DETAIL['空'].化解 } : { desc: '', extra: '' },
  '驿马': SPECIAL_DETAIL['马'] ? { desc: SPECIAL_DETAIL['马'].desc + '\n' + SPECIAL_DETAIL['马'].影响, extra: SPECIAL_DETAIL['马'].化解 } : { desc: '', extra: '' },
  '击刑': SPECIAL_DETAIL['刑'] ? { desc: SPECIAL_DETAIL['刑'].desc + '\n' + SPECIAL_DETAIL['刑'].影响, extra: SPECIAL_DETAIL['刑'].化解 } : { desc: '', extra: '' },
  '门迫': SPECIAL_DETAIL['迫'] ? { desc: SPECIAL_DETAIL['迫'].desc + '\n' + SPECIAL_DETAIL['迫'].影响, extra: SPECIAL_DETAIL['迫'].化解 } : { desc: '', extra: '' },
  '旺衰': { desc: '符号的"电量"。以月令或落宫为参照：旺相=有力，休囚死废=无力。吉符号旺则吉上加吉，凶符号旺则凶性发威。', extra: '九星与八门用的旺衰表不同：九星"我生令为旺"（反直觉），八门用标准表。' },
  '应期': { desc: '事情何时应验。常用取法：用神落宫地支对应时间；逢合以冲为应期；逢冲以合为应期；逢空以出空/填实为应期。', extra: '旺相事快，休囚事慢——远慢断年月，近快断日时。' },
}

/** 名词分类查找详解内容 */
function lookupTerm(term: string): { title: string; body: { label: string; text: string }[] } | null {
  if (XING_DETAIL[term]) {
    const d = XING_DETAIL[term]
    return { title: `${term}（${d.wx} · ${d.ji}）`, body: [
      { label: '简介', text: d.desc }, { label: '象意', text: d.象意 }, { label: '主事', text: d.主事 },
    ]}
  }
  if (MEN_DETAIL[term]) {
    const d = MEN_DETAIL[term]
    return { title: `${term}（${d.wx} · ${d.ji}）`, body: [
      { label: '简介', text: d.desc }, { label: '象意', text: d.象意 }, { label: '主事', text: d.主事 },
    ]}
  }
  if (SHEN_DETAIL[term]) {
    const d = SHEN_DETAIL[term]
    return { title: `${term}（${d.wx} · ${d.ji}）`, body: [
      { label: '简介', text: d.desc }, { label: '象意', text: d.象意 }, { label: '主事', text: d.主事 },
    ]}
  }
  if (WANGSHUAI_DETAIL[term]) {
    const d = WANGSHUAI_DETAIL[term]
    return { title: d.title, body: [{ label: '含义', text: d.desc }] }
  }
  if (CONCEPT_DETAIL[term]) {
    const d = CONCEPT_DETAIL[term]
    const body = [{ label: '含义', text: d.desc }]
    if (d.extra) body.push({ label: '要点', text: d.extra })
    return { title: term, body }
  }
  return null
}

/** 可点击术语（有详解则紫色可点，无则普通文字） */
export function Term({ name, display }: { name: string; display?: string }) {
  const { showDetail } = useDetail()
  const found = lookupTerm(name)
  if (!found) return <span>{display || name}</span>
  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        showDetail(found.title, <TermBody body={found.body} />)
      }}
      className="text-purple-400 cursor-pointer hover:underline decoration-purple-500/50"
    >
      {display || name}
    </span>
  )
}

function TermBody({ body }: { body: { label: string; text: string }[] }) {
  return (
    <div className="space-y-2">
      {body.map((b, i) => (
        <div key={i}>
          <div className="text-[10px] text-dark-500 mb-0.5">{b.label}</div>
          <div className="text-xs text-dark-300 leading-relaxed whitespace-pre-wrap">{b.text}</div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// 问事数据（用神来自教材，术语名与详解字典对齐）
// ============================================================================

interface QueryItem {
  icon: string
  title: string
  yongshen: { symbol: string; role: string }[]
  points: string[]          // 判断要点（含术语名会自动变成可点击）
  caution?: string
}

const QUERY_ITEMS: QueryItem[] = [
  {
    icon: '💼', title: '工作事业',
    yongshen: [
      { symbol: '开门', role: '工作岗位/单位' },
      { symbol: '值符', role: '领导/上级' },
      { symbol: '日干', role: '求测人自己' },
    ],
    points: [
      '开门旺相且生日干宫 → 工作顺利/能找到',
      '日干生开门 → 自己主动求职；开门克日干 → 工作压力大',
      '值符生日干 → 领导赏识；测升职重点看值符与日干关系',
      '开门逢空亡 → 岗位悬空、事难落实',
    ],
    caution: '跳槽看新旧两宫比较：现单位宫衰、新方向宫旺则宜动。',
  },
  {
    icon: '💰', title: '生意财运',
    yongshen: [
      { symbol: '生门', role: '财门/生意' },
      { symbol: '戊', role: '资本/钱财' },
      { symbol: '日干', role: '求测人' },
    ],
    points: [
      '生门+戊同宫旺相 → 财气旺',
      '生门生日干宫 → 财来找我；日干克生门 → 求财辛苦',
      '生门旺衰定财之大小，逢空亡则财落空',
      '合作看六合，投资防门迫击刑',
    ],
    caution: '讨债看伤门；生门临驿马主流动财/外地财。',
  },
  {
    icon: '💕', title: '恋爱婚姻',
    yongshen: [
      { symbol: '乙奇', role: '女方/妻子' },
      { symbol: '庚', role: '男方/丈夫' },
      { symbol: '六合', role: '婚姻/媒介' },
    ],
    points: [
      '乙庚两宫相生比和 → 感情和顺；相克相冲 → 矛盾大',
      '六合旺相 → 婚事有望；六合逢空亡 → 难成',
      '丙奇为男第三者、丁奇为女第三者——旺而贴近用神则有外情之忧',
      '乙庚相合（同宫）为夫妻和合之象',
    ],
    caution: '男测婚以乙为妻，女测婚以庚为夫，勿搞反。',
  },
  {
    icon: '🏥', title: '疾病健康',
    yongshen: [
      { symbol: '天芮', role: '疾病/病星' },
      { symbol: '天心', role: '医生/医药' },
      { symbol: '日干', role: '病人' },
    ],
    points: [
      '天芮旺 → 病重病顽；天芮衰 → 病轻易愈',
      '天心旺且克天芮 → 医药有效能治',
      '日干（病人）克天芮 → 人能扛病；天芮克日干 → 病欺人，凶',
      '病位看天芮落宫对应的八卦人体部位',
    ],
    caution: '求医方向：往克制天芮之宫的方位寻医。',
  },
  {
    icon: '📝', title: '考试求学',
    yongshen: [
      { symbol: '天辅', role: '学业/考试院' },
      { symbol: '景门', role: '试卷/成绩' },
      { symbol: '丁奇', role: '文章/录取文书' },
    ],
    points: [
      '天辅旺相 → 学业有成之象',
      '景门、丁奇生日干宫 → 成绩理想',
      '值符为主考官/录取方，生日干则有利',
      '文书丁奇逢空亡 → 录取通知有变数',
    ],
  },
  {
    icon: '✈️', title: '出行出国',
    yongshen: [
      { symbol: '驿马', role: '动象/行程' },
      { symbol: '开门', role: '成行/目的地' },
      { symbol: '日干', role: '出行人' },
    ],
    points: [
      '驿马临吉门吉星 → 出行顺利',
      '日干宫旺相无凶格 → 人在旅途平安',
      '驿马逢空亡 → 想走走不成、行程生变',
      '白虎主道路凶险，临用神宜谨慎',
    ],
  },
  {
    icon: '🔍', title: '失物寻人',
    yongshen: [
      { symbol: '时干', role: '失物' },
      { symbol: '六合', role: '走失之人' },
      { symbol: '玄武', role: '盗贼' },
    ],
    points: [
      '时干落宫定失物方位（按九宫方位找）',
      '玄武旺 → 被人偷走；玄武衰或不临用神 → 自己遗失',
      '用神旺相不空 → 可找回；逢空亡 → 难寻',
      '寻人看六合/年命落宫方向',
    ],
  },
  {
    icon: '⚖️', title: '官司诉讼',
    yongshen: [
      { symbol: '开门', role: '法官/判决' },
      { symbol: '日干', role: '我方' },
      { symbol: '时干', role: '对方' },
    ],
    points: [
      '日干宫旺于时干宫 → 我方占优',
      '开门（法官）生哪方，哪方有利',
      '日干时干相生比和 → 有和解可能',
      '惊门主官非口舌，临日干主涉诉缠身',
    ],
  },
  {
    icon: '🏠', title: '风水宅运',
    yongshen: [
      { symbol: '值符', role: '宅主/大环境' },
      { symbol: '生门', role: '宅基/阳宅' },
      { symbol: '死门', role: '坟墓/阴宅' },
    ],
    points: [
      '生门旺相 → 宅基兴旺；生门受克门迫 → 宅有问题',
      '值符生日干 → 环境养人',
      '阴宅看死门与九地：旺相安稳，逢击刑冲则坟有动',
      '看宅先看坐向宫位的星门神组合吉凶',
    ],
  },
  {
    icon: '⏰', title: '应期（何时应验）',
    yongshen: [
      { symbol: '用神', role: '所测事的符号' },
      { symbol: '空亡', role: '延迟因素' },
      { symbol: '驿马', role: '加速因素' },
    ],
    points: [
      '用神落宫地支 → 对应年月日时',
      '逢合以冲为应期，逢冲以合为应期',
      '逢空亡以出空/填实之时为应期',
      '用神旺相事应快，休囚事应慢',
    ],
    caution: '时间尺度：远慢之事断年月，近快之事断日时。',
  },
]

// ============================================================================
// 面板组件
// ============================================================================

/** 把要点文本中的术语渲染为可点击 */
function PointText({ text }: { text: string }) {
  // 收集所有可识别术语名（长词优先避免子串误匹配）
  const allTerms = [
    ...Object.keys(XING_DETAIL), ...Object.keys(MEN_DETAIL), ...Object.keys(SHEN_DETAIL),
    ...Object.keys(CONCEPT_DETAIL),
  ].sort((a, b) => b.length - a.length)
  const nodes: React.ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    let earliest = -1
    let matched = ''
    for (const t of allTerms) {
      const idx = rest.indexOf(t)
      if (idx >= 0 && (earliest === -1 || idx < earliest)) {
        earliest = idx
        matched = t
      }
    }
    if (earliest === -1) {
      nodes.push(<span key={key++}>{rest}</span>)
      break
    }
    if (earliest > 0) nodes.push(<span key={key++}>{rest.slice(0, earliest)}</span>)
    nodes.push(<Term key={key++} name={matched} />)
    rest = rest.slice(earliest + matched.length)
  }
  return <>{nodes}</>
}

export default function QueryGuide() {
  const { showDetail } = useDetail()

  function openQuery(q: QueryItem) {
    showDetail(`${q.icon} ${q.title} · 怎么看`, (
      <div className="space-y-3">
        {/* 用神表 */}
        <div>
          <div className="text-[10px] text-dark-500 mb-1">🎯 用神（先找这些符号）</div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {q.yongshen.map((y, i) => (
                <tr key={i} className={i % 2 ? 'bg-dark-800/30' : ''}>
                  <td className="border border-dark-700/60 px-2 py-1 w-20 text-center">
                    <Term name={y.symbol} />
                  </td>
                  <td className="border border-dark-700/60 px-2 py-1 text-dark-400">{y.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 判断要点 */}
        <div>
          <div className="text-[10px] text-dark-500 mb-1">📌 判断要点（紫色词可点开细看）</div>
          <div className="space-y-1">
            {q.points.map((p, i) => (
              <div key={i} className="text-xs text-dark-400 leading-relaxed flex gap-1.5">
                <span className="text-purple-500/70 shrink-0">•</span>
                <span><PointText text={p} /></span>
              </div>
            ))}
          </div>
        </div>
        {q.caution && (
          <div className="border-l-2 border-amber-500/50 bg-amber-900/15 rounded-r px-2.5 py-1.5">
            <span className="text-[11px] text-amber-300/90">⚠️ {q.caution}</span>
          </div>
        )}
        <div className="text-[9px] text-dark-600">
          依据《奇门遁甲内部学习资料》实战分类占 · 完整断法见知识库对应篇目
        </div>
      </div>
    ))
  }

  return (
    <div className="card">
      <h3 className="text-sm text-dark-400 font-medium mb-3">🔮 查什么 — 点击看用神与断法</h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {QUERY_ITEMS.map((q) => (
          <button
            key={q.title}
            onClick={() => openQuery(q)}
            className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg bg-dark-800/40 hover:bg-dark-700/50 border border-dark-700/30 transition-colors"
          >
            <span className="text-base">{q.icon}</span>
            <span className="text-[9px] text-dark-300 whitespace-nowrap">{q.title.slice(0, 4)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
