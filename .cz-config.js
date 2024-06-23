'use strict'

module.exports = {
  types: [
    { value: 'feat', name: 'feat:     新功能' },
    { value: 'fix', name: 'fix:      修复' },
    { value: 'style', name: 'style:    代码格式(不影响代码运行的变动)，注意不是CSS修改' },
    { value: 'refactor', name: 'refactor: 重构(既不是增加feature，也不是修复bug)' },
    { value: 'merge', name: 'merge:    合并代码解决冲突' },
    { value: 'perf', name: 'perf:     性能优化' },
    { value: 'secure', name: 'secure:   安全优化，安全漏洞修复' },
    { value: 'patch', name: 'patch:    补丁包，补丁修复' },
    { value: 'test', name: 'test:     增加或修改测试用例' },
    { value: 'docs', name: 'docs:     文档变更' },
    { value: 'chore', name: 'chore:    构建过程或辅助工具的变动' },
    { value: 'init', name: 'init:     初始化项目' },
    { value: 'revert', name: 'revert:   回退' },
    { value: 'build', name: 'build:    打包' },
    { value: 'release', name: 'release:  发版' }
  ],
  // override the messages, defaults are as follows
  messages: {
    type: '请选择提交类型:',
    customScope: '请输入修改范围(可选):',
    subject: '请简要描述提交:',
    confirmCommit: '确认使用以上信息提交？(y/n/e/h)'
  },
  allowCustomScopes: true,
  skipQuestions: ['scope','body', 'footer'],
  subjectLimit: 100
}
