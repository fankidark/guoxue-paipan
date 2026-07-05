import { useState } from 'react'

// 知识体系目录结构
const KNOWLEDGE_TREE = [
  {
    title: '一、基础知识',
    chapters: [
      { name: '阴阳五行', desc: '阴阳对立统一、五行特性与生克', key: 'wuxing' },
      { name: '十天干', desc: '甲~癸各论、五合/相冲/相克、十二长生', key: 'tiangan' },
      { name: '十二地支', desc: '子~亥各论、六合/三合/三会/六冲/三刑', key: 'dizhi' },
      { name: '八卦', desc: '乾坎艮震巽离坤兑——五行/方位/类象', key: 'bagua' },
    ]
  },
  {
    title: '二、排盘要素',
    chapters: [
      { name: '九星', desc: '天蓬/天任/天冲/天辅/天禽/天英/天芮/天柱/天心', key: 'jiuxing' },
      { name: '八门', desc: '休/生/伤/杜/景/死/惊/开——类象与门干克应', key: 'bamen' },
      { name: '八神', desc: '值符/螣蛇/太阴/六合/白虎/玄武/九地/九天', key: 'bashen' },
    ]
  },
  {
    title: '三、断局基础',
    chapters: [
      { name: '八门克应', desc: '各门加临不同天干时的具体断语', key: 'menke' },
      { name: '神门组合', desc: '八神+八门的组合象意', key: 'shenmen' },
      { name: '十干克应', desc: '72组天地盘干组合断语', key: 'ganke' },
    ]
  },
  {
    title: '四、格局判断',
    chapters: [
      { name: '奇门吉格', desc: '三奇得使/天地人神鬼遁/天三门等25种吉格', key: 'jige' },
      { name: '奇门凶格', desc: '飞干格/庚格/伏吟/反吟/击刑/门迫等14种凶格', key: 'xionge' },
    ]
  },
  {
    title: '五、实战分类占',
    chapters: [
      { name: '工作事业', desc: '找工作/工作变动/官运/应聘成败', key: 'work' },
      { name: '生意财运', desc: '买卖/投资/开店/借贷/合作/企业经营', key: 'money' },
      { name: '恋爱婚姻', desc: '婚恋概要/追求成败/网恋', key: 'love' },
      { name: '疾病身体', desc: '测病概要/八卦人体/八门健康', key: 'health' },
      { name: '阳宅风水', desc: '十干/符星/八门/八神阳宅', key: 'yangzhai' },
      { name: '断应期', desc: '事情何时应验的断法(核心)', key: 'yingqi' },
      { name: '失物失人', desc: '一般失物/车辆丢失/行人走失', key: 'lost' },
      { name: '官司诉讼', desc: '民事官司/官灾刑事', key: 'lawsuit' },
    ]
  },
  {
    title: '六、高级秘断',
    chapters: [
      { name: '断局纲要', desc: '综合断局的方法论', key: 'gangYao' },
      { name: '论旺衰', desc: '旺相休囚死的深入应用', key: 'wangshuai' },
      { name: '十神应用', desc: '八字十神在奇门中的运用', key: 'shishen' },
      { name: '射覆', desc: '猜物断事', key: 'shefu' },
    ]
  },
]

// 核心速查数据
const QUICK_REFS = {
  jiuxing: {
    title: '九星速查',
    content: [
      { name: '天蓬', wx: '水', nature: '凶', desc: '主盗贼、暗昧、智谋、水灾。利捕鱼、伏击' },
      { name: '天任', wx: '土', nature: '吉', desc: '主忠厚、稳重、土地、农事。利求人办事' },
      { name: '天冲', wx: '木', nature: '吉', desc: '主勇猛、冲动、战斗。利出行、征战' },
      { name: '天辅', wx: '木', nature: '吉', desc: '主文昌、学业、贵人。利求学、拜师' },
      { name: '天禽', wx: '土', nature: '中', desc: '居中宫不动，随值符飞转' },
      { name: '天英', wx: '火', nature: '凶', desc: '主血光、文书、虚诈。主口舌是非' },
      { name: '天芮', wx: '土', nature: '凶', desc: '主疾病、小人、阴私。利就医' },
      { name: '天柱', wx: '金', nature: '凶', desc: '主破坏、惊恐、口舌。利捕猎' },
      { name: '天心', wx: '金', nature: '吉', desc: '主医药、机谋、领导。利求医、谋事' },
    ]
  },
  bamen: {
    title: '八门速查',
    content: [
      { name: '休门', wx: '水', nature: '吉', desc: '主休养、贵人、安逸。利求见贵人、休息' },
      { name: '生门', wx: '土', nature: '大吉', desc: '主生发、财利、营造。利求财、开业' },
      { name: '伤门', wx: '木', nature: '凶', desc: '主伤灾、竞争、打猎。利追债、竞技' },
      { name: '杜门', wx: '木', nature: '中', desc: '主闭塞、隐匿、防守。利躲避、防守' },
      { name: '景门', wx: '火', nature: '中', desc: '主光明、文书、策略。利考试、文书' },
      { name: '死门', wx: '土', nature: '凶', desc: '主死亡、凶险、固执。利丧葬、钓鱼' },
      { name: '惊门', wx: '金', nature: '凶', desc: '主惊恐、官司、口舌。利谈判、诉讼' },
      { name: '开门', wx: '金', nature: '大吉', desc: '主开创、领导、远行。利开业、出行' },
    ]
  },
  bashen: {
    title: '八神速查',
    content: [
      { name: '值符', desc: '主贵人、领导、上级。遇值符万事吉利', nature: '大吉' },
      { name: '螣蛇', desc: '主虚惊、怪异、缠绕。主梦寐不安', nature: '凶' },
      { name: '太阴', desc: '主暗助、阴私、女性。利阴谋暗事', nature: '吉' },
      { name: '六合', desc: '主和合、婚姻、交易。利合作、婚嫁', nature: '吉' },
      { name: '白虎', desc: '主凶险、疾病、血光。主道路、军事', nature: '凶' },
      { name: '玄武', desc: '主盗贼、暗昧、小人。主失物、欺诈', nature: '凶' },
      { name: '九地', desc: '主柔顺、静守、坤母。利藏匿、守成', nature: '中' },
      { name: '九天', desc: '主刚健、远大、乾父。利远行、张扬', nature: '中' },
    ]
  },
  wuxing: {
    title: '五行生克',
    content: [
      { name: '木', desc: '方位东、季节春、颜色绿、数字3/8、脏肝胆' },
      { name: '火', desc: '方位南、季节夏、颜色红、数字2/7、脏心小肠' },
      { name: '土', desc: '方位中、季节四季末、颜色黄、数字5/0、脏脾胃' },
      { name: '金', desc: '方位西、季节秋、颜色白、数字4/9、脏肺大肠' },
      { name: '水', desc: '方位北、季节冬、颜色黑、数字1/6、脏肾膀胱' },
    ]
  }
}

const WX_COLOR: Record<string, string> = {
  '木': 'text-green-400', '火': 'text-red-400', '土': 'text-amber-600',
  '金': 'text-yellow-400', '水': 'text-blue-400',
}

const NATURE_COLOR: Record<string, string> = {
  '大吉': 'bg-green-900/50 text-green-400', '吉': 'bg-green-900/30 text-green-500',
  '中': 'bg-dark-700 text-dark-300', '凶': 'bg-red-900/30 text-red-400',
}

export default function KnowledgePage() {
  const [activeRef, setActiveRef] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-dark-200">奇门遁甲知识体系</h2>
        <p className="text-xs text-dark-500 mt-1">基于侯老师330页内部教材整理 · 6大模块30章节</p>
      </div>

      {/* 快捷速查按钮 */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(QUICK_REFS).map(([key, ref]) => (
          <button
            key={key}
            className={`px-3 py-1 rounded text-xs transition-colors ${activeRef === key ? 'bg-purple-600 text-white' : 'bg-dark-800/60 text-dark-300 hover:bg-dark-700'}`}
            onClick={() => setActiveRef(activeRef === key ? null : key)}
          >{ref.title}</button>
        ))}
      </div>

      {/* 速查展开区 */}
      {activeRef && QUICK_REFS[activeRef as keyof typeof QUICK_REFS] && (
        <div className="card animate-in fade-in">
          <h3 className="text-sm font-medium text-dark-300 mb-3">{QUICK_REFS[activeRef as keyof typeof QUICK_REFS].title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {QUICK_REFS[activeRef as keyof typeof QUICK_REFS].content.map((item: any) => (
              <div key={item.name} className="bg-dark-800/40 rounded-lg p-2.5 border border-dark-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold text-sm ${item.wx ? WX_COLOR[item.wx] || 'text-dark-200' : 'text-dark-200'}`}>{item.name}</span>
                  {item.wx && <span className={`text-[9px] px-1 rounded ${WX_COLOR[item.wx]}`}>{item.wx}</span>}
                  {item.nature && <span className={`text-[9px] px-1.5 py-0.5 rounded ${NATURE_COLOR[item.nature] || ''}`}>{item.nature}</span>}
                </div>
                <p className="text-[11px] text-dark-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 知识目录 */}
      <div className="space-y-4">
        {KNOWLEDGE_TREE.map((section) => (
          <div key={section.title} className="card">
            <h3 className="text-sm font-bold text-purple-400 mb-2">{section.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {section.chapters.map((ch) => (
                <div
                  key={ch.key}
                  className="flex items-start gap-2 px-2.5 py-2 rounded bg-dark-800/30 hover:bg-dark-700/40 transition-colors cursor-pointer"
                  onClick={() => setActiveRef(activeRef === ch.key ? null : ch.key)}
                >
                  <span className="text-xs font-medium text-dark-200 shrink-0">{ch.name}</span>
                  <span className="text-[10px] text-dark-500 leading-relaxed">{ch.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 排盘规则速查 */}
      <div className="card">
        <h3 className="text-sm font-bold text-dark-300 mb-3">排盘核心规则</h3>
        <div className="space-y-2 text-xs text-dark-400">
          <div className="bg-dark-800/40 rounded p-2.5">
            <div className="text-dark-300 font-medium mb-1">定局步骤</div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
              <li>确定节气 → 阳遁(冬至后)/阴遁(夏至后)</li>
              <li>确定符头(甲/己日) → 上/中/下元</li>
              <li>节气 + 三元 → 查局数表</li>
            </ol>
          </div>
          <div className="bg-dark-800/40 rounded p-2.5">
            <div className="text-dark-300 font-medium mb-1">排盘顺序</div>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
              <li>地盘：按局数排三奇六仪(戊己庚辛壬癸丁丙乙)</li>
              <li>天盘：值符星随时干飞转</li>
              <li>八门：值使门从原宫逆/顺数到时干</li>
              <li>八神：值符神随天盘值符星</li>
            </ol>
          </div>
          <div className="bg-dark-800/40 rounded p-2.5">
            <div className="text-dark-300 font-medium mb-1">断局要点</div>
            <div className="text-[11px] space-y-0.5">
              <div>• <span className="text-dark-300">用神</span>：根据所测之事确定主要参考宫位</div>
              <div>• <span className="text-dark-300">旺衰</span>：以月令/落宫判断星门旺衰强弱</div>
              <div>• <span className="text-dark-300">生克</span>：天地盘干关系、门宫关系(迫/义)</div>
              <div>• <span className="text-dark-300">格局</span>：吉格助力、凶格阻碍</div>
              <div>• <span className="text-dark-300">应期</span>：冲/合/值/墓出空等时间节点</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
