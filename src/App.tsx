import { Routes, Route, NavLink } from 'react-router-dom'
import BaziPage from './pages/BaziPage'
import QimenPage from './pages/QimenPage'
import MeihuaPage from './pages/MeihuaPage'
import KnowledgePage from './pages/KnowledgePage'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-dark-100">
            <span className="text-primary-400">术数</span>排盘
          </h1>
          <nav className="flex gap-1">
            <NavLink to="/" end className={({isActive}) => 
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`
            }>八字</NavLink>
            <NavLink to="/qimen" className={({isActive}) => 
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`
            }>奇门遁甲</NavLink>
            <NavLink to="/meihua" className={({isActive}) => 
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`
            }>梅花易数</NavLink>
            <NavLink to="/knowledge" className={({isActive}) => 
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`
            }>知识库</NavLink>
          </nav>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<BaziPage />} />
          <Route path="/qimen" element={<QimenPage />} />
          <Route path="/meihua" element={<MeihuaPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-dark-800 py-3 text-center text-xs text-dark-500">
        仅作传统文化研究与学习工具，请勿过度解读
      </footer>
    </div>
  )
}

export default App
