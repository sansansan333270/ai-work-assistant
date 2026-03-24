export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '技能库' })
  : { navigationBarTitleText: '技能库' }
