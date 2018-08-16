import {nextTick} from '../util/index'

export const MAX_UPDATE_COUNT = 100

const queue = []        // wathers
const activatedChildren = []
let has = {}
let waiting = false
let flushing = false
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
    index = queue.length = activatedChildren.length = 0
    has = {}
    waiting = flushing = false
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
    flushing = true
    let watcher, id

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort((a, b) => a.id - b.id)

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
        watcher = queue[index]
        if (watcher.before) {
            watcher.before()
        }
        id = watcher.id
        has[id] = null
        watcher.run()
    }

    // keep copies of post queues before resetting state
    const activatedQueue = activatedChildren.slice()
    const updatedQueue = queue.slice()

    resetSchedulerState()

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue)
    callUpdatedHooks(updatedQueue)


    // todo: notify flush event
    console.log('flush')

}

function callUpdatedHooks (queue) {
    let i = queue.length
    while (i--) {
        const watcher = queue[i]
        const vm = watcher.vm
        if (vm._watcher === watcher && vm._isMounted) {
            // todo: emit component updated event.
            // callHookcallHook(vm, 'updated')
        }
    }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
export function queueActivatedComponent (vm) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false
  activatedChildren.push(vm)
}

function callActivatedHooks (queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    // todo: activate child component
    // activateChildComponent(queue[i], true /* true */)
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher) {
    const id = watcher.id
    if (has[id] == null) {
        has[id] = true
        if (!flushing) {
            queue.push(watcher)
        } else {
        /*
        在flushSchedulerQueue函数中遍历watcher任务时，
        会首先调用到每个watcher的watcher.before 方法，
        而watcher.before方法中有可能会继续调用queueWatcher (watcher), 
        这个else分支就处理这种case.
        这里的index表示：当前queue运行的位置，
        根据新增watcher的id的数值大小，
        将新增的watcher在剩余队列（不包括当前watcher）中插入正确位置，
        如果新增watcher的id已经错过了，则就在(index+1)的位置插入, 
        当前watcher执行完了，下一个任务立即执行.
        */
            let i = queue.length - 1
            while (i > index && queue[i].id > watcher.id) {
                i--
            }
            queue.splice(i + 1, 0, watcher)
        }
        // queue the flush
        if (!waiting) {
            waiting = true
            nextTick(flushSchedulerQueue)
        }
    }
}
