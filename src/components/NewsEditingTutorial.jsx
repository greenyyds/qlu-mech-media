import TutorialReader from './TutorialReader'
import { newsEditingTutorial } from '../data/tutorials'

/** 新闻与图像处理教程（#/tutorials/news-editing）—— 由通用阅读器渲染 */
export default function NewsEditingTutorial() {
  return <TutorialReader tutorial={newsEditingTutorial} />
}
