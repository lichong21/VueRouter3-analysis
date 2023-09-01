import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
	// 防止在Vue项目中，重复安装router。
	// 双重判断条件，用Vue本身对比和全局的标识变量
  if (install.installed && _Vue === Vue) return
  install.installed = true
  _Vue = Vue


	// 判断一个变量不是undefined
  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

	// export function initMixin (Vue: GlobalAPI) {
	// 	Vue.mixin = function (mixin: Object) {
	// 		this.options = mergeOptions(this.options, mixin)
	// 		return this
	// 	}
	// }
	// 如下所示Vue的源码中，mixin是Vue构造函数身上的静态方法
	
  Vue.mixin({
    beforeCreate () {
			// $options就是我们new Vue时，给构造函数传入的参数。
			// options里面包括，el、router、mode等
      if (isDef(this.$options.router)) {
				// 此时的Vue就是newVue产生的实例

				// 把this存储到_routerRoot中
				// router的root就是vue的实例
        this._routerRoot = this
				// __router就是newRouter创建实例
        this._router = this.$options.router
				// 在Vue中，调用init初始化router
				// init函数就在这个路径文件里面 /src/index.js
        this._router.init(this)
				// 把_router转换为响应性属性
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

	// 把$router和$route挂载到Vue原型上，定义为响应性属性
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

	// 注册全局组件，router-vie、router-link
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
