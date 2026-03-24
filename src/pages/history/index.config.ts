export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '历史对话' })
  : { navigationBarTitleText: '历史对话' }
