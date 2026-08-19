import TutorialReader from './TutorialReader'
import { photographyTutorial } from '../data/tutorials'

/** 摄影技术教程（#/tutorials/photography）—— 由通用阅读器渲染 */
export default function PhotographyTutorial() {
  return <TutorialReader tutorial={photographyTutorial} />
}
