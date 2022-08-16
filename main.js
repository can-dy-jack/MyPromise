/**
 * @param { function } executor 
 */
class NewPromise {
    constructor(executor) {
        this._value;
        this._reason;
        this._state = "pending";
        this._resolveFns = [];
        this._rejectFns = [];
        let _resolve = (val) => {
            if(this._state === "pending") {
                this._value = val;
                this._state = "fulfilled";
                this._resolveFns.forEach(fn => fn());
            }
        }
        let _reject = (reason) => {
            if(this._state === "pending") {
                this._reason = reason;
                this._state = "rejected";
                this._rejectFns.forEach(fn => fn());
            }
        }
        executor(_resolve, _reject);
    }
    then(resolveFn, rejectFn) {
        resolveFn = typeof resolveFn === 'function' ? resolveFn : val => val;
        rejectFn = typeof rejectFn === 'function' ? rejectFn : reason => { throw reason };
        let self = this, promise2;
        promise2 = new NewPromise((resolve, reject) => {
            if(self._state === "pending") {
                self._resolveFns.push(() => {
                    setTimeout(()=>{
                        try {
                            self.resolveMyPromise(promise2, resolveFn(self._value), resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    },0)
                });
                self._rejectFns.push(() => {
                    setTimeout(()=>{
                        try {
                            self.resolveMyPromise(promise2, rejectFn(self._reason), resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    },0)
                });
            }
            if (self._state === 'fulfilled') {
                setTimeout(()=>{
                    try {
                        self.resolveMyPromise(promise2, resolveFn(self._value) , resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },0)
            }
            if (self._state === 'rejected') {
                setTimeout(()=>{
                    try {
                        self.resolveMyPromise(promise2, rejectFn(self._reason), resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },0)
            }
        })
        return promise2;
    }
    resolveMyPromise(promise, x, resolve, reject) {
        if(x === promise) {
            return reject(new TypeError("chaining cycle"));
        }
        let hasCalled = false, self = this;
        if(x != null && (typeof x === 'function' || typeof x === 'object')){
            try {
                let fn = x.then;
                if(typeof fn === 'function') {
                    fn.call(x, val => {
                        if(hasCalled) return;
                        hasCalled = true;

                        self.resolveMyPromise(promise, val, resolve, reject);

                    }, reason => {
                        if(hasCalled) return;
                        hasCalled = true;
                        reject(reason);
                    })
                } else {
                    resolve(x)
                }
            } catch(reason) {
                if(hasCalled) return;
                hasCalled = true;
                reject(reason);
            }
        } else {
            resolve(x);
        }
    }
    // more
    catch(rejectFn) {
        return this.then(null, rejectFn)
    }
    finally(callback) {
        return this.then(
            value => NewPromise.resolve(callback()).then(() => value), 
            reason => NewPromise.resolve(callback()).then(() => { throw reason })
        )
    }
    static resolve(value) {
        return new NewPromise((resolve, reject) => resolve(value))
    }
    static reject(reason) {
        return new NewPromise((resolve, reject) => reject(reason))
    }
    static all(promiseArr) {
        let index = 0
        let result = []
        return new NewPromise((resolve, reject) => {
        promiseArr.forEach((p, i) => {
            NewPromise.resolve(p).then(val => {
                index++
                result[i] = val
                if(index === promiseArr.length) {
                    resolve(result)
                }
            },
            reason => {
                reject(reason)
            })
        })
        })
    }
    static race(promiseArr) {
        return new NewPromise((resolve, reject) => {
          for (let p of promiseArr) {
            NewPromise.resolve(p).then(value => {
                resolve(value)
            },
            reason => {
                reject(reason)
            })
          }
        })
    }
}

/**
 * promises-tests测试
 */
NewPromise.defer = NewPromise.deferred = function(){
    let dfd = {};
    dfd.promise = new NewPromise((resolve,reject)=>{
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}
module.exports = NewPromise;