export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '项目' })
  : { navigationBarTitleText: '项目' }
