/** Promise A+
 * 
 * MyPromiseClass
 */
class MyPromiseClass {
    pending = Symbol("pending");
    rejected = Symbol("rejected");
    fulfilled = Symbol("fulfilled");

    constructor(executor) {
        // 唯一id
        this._id = Symbol();
        // 结果值
        this._value = "";
        // 错误值
        this._error = "";
        // 状态
        this._status = this.pending;
        this._resolveFuncs = [];
        this._rejectFuncs = [];

        executor(this.resolve.bind(this), this.reject.bind(this));
    }
    resolve(val) { 
        if (this._status === this.pending) {
            this._status = this.fulfilled;
            this._value = val;
            this._resolveFuncs.forEach(func => func());
        }
    }
    reject(val) { 
        if (this._status === this.pending) {
            this._status = this.rejected;
            this._error = val;
            this._rejectFuncs.forEach(func => func());
        }
    }
    solvePromise(promise, x, resolve, reject) {
        if (promise === x) {
            return reject(new TypeError("chaining cycle"));
        }
        let hasChainCycle = false;
        let _this = this;
        if (x != null && (typeof x === 'function' || typeof x === 'object')) {
            try {
                let then = x.then;
                if (typeof then == 'function') {
                    then.call(x, val => {
                        if (hasChainCycle) return;
                        hasChainCycle = true;
                        _this.solvePromise(promise, val, resolve, reject);
                    }, e => {
                        if (hasChainCycle) return;
                        hasChainCycle = true;
                        reject(e);
                    })
                } else {
                    resolve(x);
                }
            } catch (e) {
                if (hasChainCycle) return;
                hasChainCycle = true;
                reject(e);
            }
        } else {
            resolve(x);
        }
    }
    simulateMicroTask(func, reject) {
        setTimeout(() => {
            try {
                func();
            } catch (e) {
                reject(e);
            }
        })
    }
    /**
     * onFulfilled 和 onRejected 都是可选参数，并且如果它们不是函数，则必须忽略它。
     * @param {function} onFulfilled 
     * @param {function} onRejected 
     */
    then(onFulfilled, onRejected) {
        if (!(onFulfilled instanceof Function)) {
            onFulfilled = val => val;
        }
        if (!(onRejected instanceof Function)) {
            onRejected = e => { throw e; };
        }
        let _this = this;
        let promise;
        promise = new MyPromiseClass((resolve, reject) => {
            if (_this._status === _this.pending) {
                _this._resolveFuncs.push(() => {
                    _this.simulateMicroTask(() => {
                        _this.solvePromise(promise, onFulfilled(_this._value), resolve, reject);
                    }, reject);
                })
                _this._rejectFuncs.push(() => {
                    _this.simulateMicroTask(() => {
                        _this.solvePromise(promise, onRejected(_this._error), resolve, reject);
                    }, reject);
                })
            } else if (_this._status == _this.fulfilled) {
                _this.simulateMicroTask(() => {
                    _this.solvePromise(promise, onFulfilled(_this._value), resolve, reject);
                }, reject);
            } else {
                _this.simulateMicroTask(() => {
                    _this.solvePromise(promise, onRejected(_this._error), resolve, reject);
                }, reject);
            }
        })
        return promise;
    }
    catch(onRejected) {
        return this.then(null, onRejected);
    }
    static resolve(val) {
        return new MyPromiseClass((resolve, _) => resolve(val));
    }
    static reject(val) {
        return new MyPromiseClass((_, reject) => reject(val));
    }
    finally(callback) {
        return this.then(
            res => MyPromiseClass.resolve(callback()).then(() => res),
            reason => MyPromiseClass.resolve(callback()).then(() => { throw reason })
        )
    }
    static all(promiseArr) {
        let ans = [];
        return new MyPromiseClass((resolve, reject) => {
            for (let i = 0; i < promiseArr.length; i++) {
                MyPromiseClass.resolve(promiseArr[i]).then(val => {
                    ans.push(val);
                    if (i === promiseArr.length - 1) {
                        resolve(ans);
                    }
                }, e => {
                    reject(e);
                })
            }
        })
    }
    static race(promiseArr) {
        return new MyPromiseClass((resolve, reject) => {
            for (let p of promiseArr) {
                MyPromiseClass.resolve(p).then(resolve, reject);
            }
        })
    }

    static deferred() {
        let res, rej;
        let promise = new MyPromiseClass((resolve, reject) => {
            res = resolve;
            rej = reject;
        })
        return { promise, resolve: res, reject: rej };
    }
}

module.exports = MyPromiseClass;