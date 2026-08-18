import { useEffect } from 'react'
import Navbar from './components/Navbar'
import NoticeBanner from './components/NoticeBanner'
import Hero from './components/Hero'
import Gallery from './components/Gallery'
import QuickLinks from './components/QuickLinks'
import NewsTool from './components/NewsTool'
import TaskBoard from './components/TaskBoard'
import DutyRoster from './components/DutyRoster'
import Footer from './components/Footer'
import FeedbackPage from './components/FeedbackPage'
import PwaUpdateToast from './components/PwaUpdateToast'
import { useHashRoute } from './utils/router'
import { useDataStatus } from './hooks/useDataStatus'
import * as taskService from './services/taskService'

const RECOVERY_INTERVAL_MS = 30000 // 离线时每 30 秒探测一次云端

/**
 * 应用入口
 * 路由约定：hash 以 "#/" 开头为二级页面（如 #/feedback），其余为主页锚点
 */
export default function App() {
  const route = useHashRoute()
  const dataStatus = useDataStatus()

  // 路由切换时回到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  // 离线模式自动恢复：定时探测云端，恢复后广播 cloud-recovered 事件，
  // 各数据模块（任务/值班表/反馈）监听后自动刷新并切回云端共享
  useEffect(() => {
    if (dataStatus !== 'offline') return
    const timer = setInterval(async () => {
      try {
        await taskService.listTasks() // 内部会尝试云端读取并更新状态
        if (taskService.getDataStatus() === 'cloud') {
          window.dispatchEvent(new CustomEvent('cloud-recovered'))
        }
      } catch {
        /* 探测失败，保持离线，下轮再试 */
      }
    }, RECOVERY_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [dataStatus])

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

      {route === '/feedback' ? (
        <FeedbackPage />
      ) : (
        <main id="main">
          <Hero />
          <Gallery />
          <QuickLinks />
          <NewsTool />
          <TaskBoard />
          <DutyRoster />
        </main>
      )}

      <Footer />

      {/* PWA 新版本提示 */}
      <PwaUpdateToast />
    </div>
  )
}
