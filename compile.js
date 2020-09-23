class Compile {
    constructor(el, vm) {
        this.$el = document.querySelector(el)
        this.$vm = vm
        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el)
            this.compile(this.$fragment)
            this.$el.appendChild(this.$fragment)
        }
    }
    node2Fragment (el) {
        this.frag = document.createDocumentFragment()
        let child
        while (child = el.firstChild) {
            this.frag.appendChild(child)
        }
        return this.frag
    }
    compile (el) {
        const childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) { // 元素
                const nodeAttrs = node.attributes
                Array.from(nodeAttrs).forEach(attr => {
                    const attrName = attr.name
                    const exp = attr.value
                    if (this.isDirective(attrName)) {
                        const dir = attrName.slice(2)
                        this[dir] && this[dir](node, this.$vm, exp)
                    }
                    if (this.isEvent(attrName)) {
                        const dir = attrName.slice(1)
                        this.eventHandler(node, this.$vm, exp, dir)
                    }
                })
            } else if (this.isInterpolation(node)) { // 文本
                this.compileText(node)
            }
            if (node.childNodes && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }
    html(node, vm, exp) {
        this.update(node, vm, exp, 'html')
    }
    htmlUpdate(node, value) {
        node.innerHTML = value
    }
    model(node, vm, exp) {
        this.update(node, vm, exp, 'model')
        node.addEventListener('input', e => {
            vm[exp] = e.target.value
        })
    }
    modelUpdate(node, value) {
        node.value = value
    }
    eventHandler (node, vm, exp, dir) {
        let fn = vm.$options.methods && vm.$options.methods[exp]
        if(dir && fn) {
            node.addEventListener(dir, fn.bind(vm))
        }
    }
    text(node, vm, exp) {
        this.update(node, vm, exp, 'text')
    }
    isDirective (attr) {
        return attr.indexOf('k-') === 0
    }
    isEvent (attr) {
        return attr.indexOf('@') === 0
    }
    compileText (node) {
        this.update(node, this.$vm, RegExp.$1, 'text')
    }
    update(node, vm, exp, dir) {
        const updateFn = this[dir+['Update']]
        // 初始化
        updateFn && updateFn(node, vm[exp])
        // 依赖搜集
        new Watcher(vm, exp, function(value) {
            updateFn && updateFn(node, value)
        })
    }
    textUpdate(node, value) {
        node.textContent = value
    }
    isElement (node) {
        return node.nodeType === 1
    }
    isInterpolation(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }
}