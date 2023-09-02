# create-route-map 解析
> vue-router-3.5.3/src/create-route-map.js

## createRouteMap函数
#### 第一步：声明了三张表pathList、pathMap和nameMap，其中有一个list和两个map
- pathList：用存储路由的路径path
- pathMap：用来存储路由路径path到路由对象的映射
- nameMap：用来存储路由name到路由对象的映射
#### 第二步：遍历所有的路由列表（在执行`new Router`的时候，我们传进去的routes）
```
routes.forEach(route => {
	addRouteRecord(pathList, pathMap, nameMap, route, parentRoute)
})
```

#### 第三步：遍历pathList，把路由路径是通配符`*`的放到list的末尾
```
for (let i = 0, l = pathList.length; i < l; i++) {
	if (pathList[i] === '*') {
		pathList.push(pathList.splice(i, 1)[0])
		l--
		i--
	}
}
```

#### 第四步：返回（对外暴露）这个三张表 


----

## addRouteRecord函数
> 入参总共六个参数，我们只考虑前五个，前三个参数就是我们上边声明的三张表，第四个参数就是当前路由对象，第五个参数是当前路由的父级路由
#### 第一步：路由路径的序列化，在子路由序列化的过程中，会把父级路由的path拼接到子路由的path中
```
const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)

function normalizePath (
  path: string,
  parent?: RouteRecord,
  strict?: boolean
): string {
	// 移除路径中最后的反斜杠/
  if (!strict) path = path.replace(/\/$/, '')
	// 如果path是以反斜杠开始的，就是直接返回
  if (path[0] === '/') return path
  if (parent == null) return path
  return cleanPath(`${parent.path}/${path}`)
}
```

#### 第二步：路由的正则匹配，这个可以暂时先忽略，属于路由的高级用法
```
const pathToRegexpOptions: PathToRegexpOptions =
	route.pathToRegexpOptions || {}
	if (typeof route.caseSensitive === 'boolean') {
		pathToRegexpOptions.sensitive = route.caseSensitive
	}
```

#### 第三步：声明一个record对象。其实就是`route`的变化体、标准体。
```
	const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
		// 路由的别名
    alias: route.alias
      ? typeof route.alias === 'string'
        ? [route.alias]
        : route.alias
      : [],
    instances: {},
    enteredCbs: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }
```

#### 第四步：如果有子路由就把子路由也加入到三张表中

```
if (route.children) {
	route.children.forEach(child => {
		const childMatchAs = matchAs
			? cleanPath(`${matchAs}/${child.path}`)
			: undefined
		addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
	})
}
```

### 第五步：把当前路由添加到三张表中。
- 把当前路由的path添加到pathList中
- 以当前路由的path为key，添加到pathMap中
- 以当前路由的name为key，添加到nameMap中
- 如果当前路由有别名，就以路由的别名为作为path，重复上边的三个操作
```
if (!pathMap[record.path]) {
	pathList.push(record.path)
	pathMap[record.path] = record
}

if (name) {
	if (!nameMap[name]) {
		nameMap[name] = record
	} 
}

if (route.alias !== undefined) {
		// 转换成数组存放别名,因为要把别名当做path用
		// 别名不能跟path同名
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      const aliasRoute = {
        path: alias,
        children: route.children
      }
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
    }
  }
```