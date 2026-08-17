import Navbar from './components/Navbar'
import NoticeBanner from './components/NoticeBanner'
import Hero from './components/Hero'
import QuickLinks from './components/QuickLinks'
import NewsTool from './components/NewsTool'
import TaskBoard from './components/TaskBoard'
import DutyRoster from './components/DutyRoster'
import Footer from './components/Footer'
import PwaUpdateToast from './components/PwaUpdateToast'

/**
 * 应用入口：单页滚动布局
 * 各模块按需独立成组件，数据层统一走 services/ 下的服务
 */
export default function App() {
  return (
    <div className="min-h-screen bg-page font-sans text-ink">
      {/* 无障碍：跳转主内容 */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        跳到主要内容
      </a>

      <NoticeBanner />
      <Navbar />

      <main id="main">
        <Hero />
        <QuickLinks />
        <NewsTool />
        <TaskBoard />
        <DutyRoster />
      </main>

      <Footer />

      {/* PWA 新版本提示 */}
      <PwaUpdateToast />
    </div>
  )
}
