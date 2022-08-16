/**
 * @param { function } executor 
 */
function MyPromise(executor) {
    // pending fulfilled rejected
    this._status = "pending";
    // value
    this._value;
    // reason
    this._reason;

    // resolve fns and reject fns
    this._resolveQueue = [];
    this._rejectQueue = [];
    
    const resolve = (val) => {
        // 注意 this 指向问题！！！
        if(this._status === "pending") {
            this._status = "fulfilled";
            this._value = val;
            this._resolveQueue.forEach(fn => fn())
        }
    }
    const reject = (reason) => {
        if(this._status === "pending") {
            this._status = "rejected";
            this._reason = reason;
            this._rejectQueue.forEach(fn => fn())
        }
    }
    try {
        executor(resolve, reject);
    } catch(e) {
        reject(e);
    }
}
//  promise 解决程序
function ResolveMyPromise(promise,x,resolve,reject){
    if(promise === x){  // promise 和 x 指向同一个对象
        return reject(new TypeError('chaining cycle'));
    }
    let hasCalled = false;
    if(x !== null && (typeof x === 'object' || typeof x === 'function')){
        try{
            let fn = x.then; 
            if(typeof fn === 'function'){
                // 使用 call 保持this指向
                fn.call(x, a => { 
                    if(hasCalled) return; 
                    hasCalled = true;
                    ResolveMyPromise(promise, a, resolve, reject);
                },e => { 
                    if(hasCalled) return;
                    hasCalled = true;
                    reject(e);
                });
            }else{
                resolve(x);
            }
        } catch(e) {
            if(hasCalled) return;
            hasCalled = true;
            reject(e);
        }
    } else { 
        resolve(x);
    }
}
// 加在原型链上的方法 - 实例化的对象都共用
MyPromise.prototype.then = function (resolveFn, rejectFn) {
    resolveFn = typeof resolveFn === 'function' ? resolveFn : val=>val;
    rejectFn = typeof rejectFn === 'function' ? rejectFn : e => { throw e };
    let self = this, promise2;
    promise2 = new MyPromise( (resolve, reject) => {
        if (self._status === 'fulfilled') {
            setTimeout(()=>{
                try {
                    ResolveMyPromise(promise2, resolveFn(self._value) , resolve, reject);
                } catch (e) {
                    reject(e);
                }
            },0)
        }
        if (self._status === 'rejected') {
            setTimeout(()=>{
                try {
                    ResolveMyPromise(promise2, rejectFn(self._reason), resolve, reject);
                } catch (e) {
                    reject(e);
                }
            },0)
        }
        if (self._status === 'pending') {
            self._resolveQueue.push(() => {
                setTimeout(()=>{
                    try {
                        ResolveMyPromise(promise2, resolveFn(self._value), resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },0)
            });
            self._rejectQueue.push(() => {
                setTimeout(()=>{
                    try {
                        ResolveMyPromise(promise2, rejectFn(self._reason), resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },0)
            });
        }
    });
    return promise2;
}
//catch方法其实就是执行一下then的第二个回调
MyPromise.prototype.catch = function (rejectFn) {
    return this.then(null, rejectFn)
} 
// 在promise结束时，无论结果是fulfilled或者是rejected，都会执行指定的回调函数。
// 在finally之后，还可以继续then。并且会将值原封不动的传递给后面的then
MyPromise.prototype.finally = function(callback) {
    return this.then(val => {
        return MyPromise.resolve(callback()).then(() => val)
    }, e => {
        return MyPromise.reject(callback()).then(() => {
            throw e;
        })
    })
}


// 加在属性上的方法 - 实例化的对象没有该方法，相当于OOP的静态方法
MyPromise.resolve = (val) => {
    return new MyPromise((res, rej) => {
        res(val);
    })
}
MyPromise.reject = (reason) => {
    return new MyPromise((res, rej) => {
        rej(reason);
    })
}
MyPromise.catch = function(onRejected) {
    return this.then(null, onRejected);
}
MyPromise.all = function(promises) {
    let i = 0, ans = [];
    return new MyPromise((resolve, reject) => {
        promises.forEach((promise, index) => {
            MyPromise.resolve(promise).then(val => {
                i++;
                ans[index] = val;
                if(i === promises.length) {
                    resolve(ans);
                }
            }, e => {
                reject(e);
            })
        })
    })
}
MyPromise.race = function(promises) {
    return new MyPromise((res, rej) => {
        for(const promise of promises) {
            MyPromise.resolve(promise).then(val => {
                res(val);
            }, e => {
                rej(e);
            })
        }
    })
}

/**
 * promises-tests测试
 */
 MyPromise.defer = MyPromise.deferred = function(){
    let dfd = {};
    dfd.promise = new MyPromise((resolve,reject)=>{
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}
module.exports = MyPromise;