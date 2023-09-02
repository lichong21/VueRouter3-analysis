# install 解析
> vue-router-3.5.3/src/install.js

要理解插件的入口install方法，首先要理解Vue源码中是如何处理插件的。

### Vue源码的use方法
-` Vue.use` 方法内部的`this`都是指向Vue的（谁调用，指向谁）
- 声明`installedPlugins`数组，用来存收手机到的已经被安装到Vue身上的插件，同时把已安装的插件挂载到Vue对象上
- 通过indexif方法，判断插件是都已经安装，如果已经安装，就直接返回Vue
- use方法，可以传递多个参数，
  - 通过`toArray`的方法，把除第一个参数以外的转换为`args`数组，然后把this也就是Vue放置到数组的开头
  - 第一个参数可以使数组或者是函数
- 第一个参数
  - 如果是函数，就通过`apply`直接执行，传入参数`args`
  - 如果是对象，就执行对象身上的install方法，通过`apply`执行，并传入参数`args`	
- 插件安装成功之后，通过`installedPlugins`的push方法，收集到数组中
- 最后一步，返回this也就是Vue对象，方便链式回调。比如：Vue.use(vueRouter).use(vuex)

```
import { toArray } from '../util/index'

export function initUse(Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins =
      this._installedPlugins || (this._installedPlugins = [])
			
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
```
---
## 回到install方法

### 防止重复安装
  - 通过`installed`和全局标识符`_Vue`来判断，防止重复执行`Vue.use(vueRouter)`
  - `_Vue`保存，传递过来的`Vue`对象，同时通过export对外暴露，方便router项目中使用Vue对象
```
Vue.use(vueRouter)

if (install.installed && _Vue === Vue) return
install.installed = true
_Vue = Vue
```

### Router声明周期的混入
- 通过mixin混入，往Vue的beforeCreate和destroyed两个生命周期中，注入公共逻辑
- beforeCreate
  - 此时的this就是我们的Vue实例vm
  - $options，就是我们在new Vue时传入的构造函数的参数
  - $options.router,就是我们new Router创建的实例
  - 调用router的init方法，完成路由的初始化，详情见index文件的解析
  - 把 Vue 身上的_router，设置成响应性对象

```
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
```

### 往Vue的原型上添加`$router`和`$router`,这样就能在任意的Vue组件实例中使用

```
	Object.defineProperty(Vue.prototype, '$router', {
    get() {
      return this._routerRoot._router
    }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get() {
      return this._routerRoot._route
    }
  })
```

### 注册全局组件`router-link`和`router-view`

```
Vue.component('RouterView', View)
Vue.component('RouterLink', Link)
```