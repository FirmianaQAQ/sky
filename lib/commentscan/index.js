/**
 * author: huweijian
 * Date: 2019/4/11 - 10:13 AM
 * Name: index
 * Desc: 入口
 */
const $ = require('meeko')
const fs = require('fs')
const { resolvePath } = require('../../tools/utils')
let dirPath = require('./config').path
let fileIgnores = []
let keyWordsIgnores = ['if', 'for', 'return']
// 延迟执行读文件内容方法
let pathArr = []
function readAllFiles (name = '') {
  let path = name || dirPath
  let dir = fs.readdirSync(resolvePath(path))
  for (let i = 0; i < dir.length; i++) {
    let item = dir[i]
    // console.log('item', item)
    if (!fileIgnores.includes(item)) {
      if (!~item.indexOf('.')) {
        readAllFiles(`${path}/${item}`)
      } else {
        // console.log(dir.length === i + 1)
        pathArr.push(`${path}/${item}`)
      }
    }
  }
}
// 主函数入口
function scan () {
  console.log(`==============\n  ${$.c.dimb('start scan', 47)}  \n==============`)
  pathArr.forEach((file) => {
    let errFlag = 0
    let str = fs.readFileSync(resolvePath(file), 'utf-8')
    // console.log(str.match(/data/))
    let index = 0
    let strn = str.replace(/(\n)/g, ($1) => {
      index++
      return `_${index}_\n`
    })
    if (/\.vue$/.test(file)) {
      strn = strn.replace(/\/\*\*[\s\S]+?<\/template>/, '').replace(/<style[\s\S]+?<\/style>/, '')
    }
    // console.log(strn.match(/data/))
    // 这里的正则有点复杂
    // \/\*\*[\s\S]+?\*\/\n\s+ 匹配 /** 开头 */结尾的
    // (\/\*\*[\s\S]+?\*\/\n\s+|(\/\/.+?\n\s+)+)?(async)?(\s)*?\(.*?\)(\s)*?=>(\s)*\{ 匹配箭头函数
    // (\/\*\*[\s\S]+?\*\/\n\s+|(\/\/.+?\n\s+)+)?function(\s)*\(.*?\)(\s)*\{ 匹配function关键字函数
    // (\/\/.+?\n\s+)+)?\w+(\s)*\(.*?\)(\s)*\{ 匹配 xxx () {}形式的省略function关键字的函数
    // (\/\*\*[\s\S]+?(\*)+\/\n\s+|(\/\/.+?\n+\s+)+)?(export)\s+?function(\s)*\(.*?\)(\s)*\{
    //  ?(\s+\w+\s+\(.*?\)\s*{_\d+_)
    // (\/\*\*[\s\S]+?(\*)+\/(_\d+_)\n+|(\/\/.*?(_\d+_)\n+))?(async)?(\s)*?\(.*?\)(\s)*?=>(\s)*\{_\d+_| 箭头函数
    // (\/\*\*[\s\S]+?(\*)+\/(_\d+_)\n+|(\/\/.*?(_\d+_)\n+))?(export\s)?(function\s)?\w+\s+\(.*?\)\s+{_\d+_| function函数
    // |(\/\/.*?(_\d+_)\n+)
    let func = strn.match(
      /(\/\*\*[\s\S]+?(\*)+\/(_\d+_)\n+|(\/\/.*?(_\d+_)\n+))?(async)?(\s)*?\(.*?\)(\s)*?=>(\s)*\{.*?_\d+_|(\/\*\*[\s\S]+?(\*)+\/(_\d+_)\n+|(\/\/.*?(_\d+_)\n+))?(export\s|async\s)?(function\s)?\w+\s+\(.*?\)\s+{.*?_\d+_|(\/\*\*[\s\S]+?_\d+_\n\s*\*\/_\d+_\n\s*?|(\/\/.*?(_\d+_)\n+))?\s*\w+\s*\(.*?\)\s+{.*?_\d+_/g
    ) || []
    // console.log('func', func)
    // let arr = str.split('\n')
    func.forEach((item) => {
      item = item.replace(/^\n\s+/, '')
      let match = item.match(/^\w+(?=\s)/g)
      let key = match ? match[0] : ''
      // console.log(key)
      if (key && !keyWordsIgnores.includes(key) && /^(\w+)/.test(item)) {
        let line = item.match(/_(\d+)_/)[0].replace(/_/g, '')
        let name = item.match(/(export\s)?(function\s)?\w+\s+\(.*?\)\s/)[0]
        console.log($.c.r('✘'), `${$.c.r(file)} ${$.c.y(line)} 行 ${$.c.r(name)} 没有注释`)
        errFlag = 1
      }
    })
    if (errFlag === 0) {
      console.log($.c.g('✔'), file)
    }
    // console.log(func)
  })
}

module.exports = (config = {}) => {
  dirPath = config.path || dirPath
  fileIgnores.push(...(config.fileIgnores || []))
  keyWordsIgnores.push(...(config.keyWordsIgnores || []))
  readAllFiles()
  scan()
}