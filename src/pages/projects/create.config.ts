export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '新建项目' })
  : { navigationBarTitleText: '新建项目' }
