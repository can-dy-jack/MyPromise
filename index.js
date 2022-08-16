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
    let called;
    if(x !== null && (typeof x === 'object' || typeof x === 'function')){
        try{
            let then = x.then; 
            if(typeof then === 'function'){
                then.call(x,y=>{ 
                    if(called) return; 
                    called = true;
                    ResolveMyPromise(promise, y, resolve, reject);
                },err=>{ 
                    if(called) return;
                    called = true;
                    reject(err);
                });
            }else{
                resolve(x);
            }
        }catch(e){
            if(called) return;
            called = true;
            reject(e);
        }
    }else{ 
        resolve(x);
    }
}
// 加在原型链上的方法 - 实例化的对象都共用
MyPromise.prototype.then = function (resolveFn, rejectFn) {
    resolveFn = typeof resolveFn === 'function'?resolveFn:val=>val;
    rejectFn = typeof rejectFn === 'function'?rejectFn: e => { throw e }
    let self = this;
    let promise;
    promise = new MyPromise( (resolve, reject) => {
        if (self._status === 'fulfilled') {
            setTimeout(()=>{
                try {
                    ResolveMyPromise(promise, resolveFn(self._value) , resolve, reject);
                } catch (e) {
                    reject(e);
                }
            },0)
        }
        if (self._status === 'rejected') {
            setTimeout(()=>{
                try {
                    ResolveMyPromise(promise, rejectFn(self._reason), resolve, reject);
                } catch (e) {
                    reject(e);
                }
            },0)
        }
        if (self._status === 'pending') {
            self._resolveQueue.push(() => {
                setTimeout(()=>{
                    try {
                        ResolveMyPromise(promise, resolveFn(self._value), resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },0)
            });
            self._rejectQueue.push(() => {
                setTimeout(()=>{
                    try {
                        ResolveMyPromise(promise, rejectFn(self._reason), resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },0)
            });
        }
    });
    return promise;
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
    return new Promise((resolve, reject) => {
        let arr = [], i = 0;
        /**
         * @param {number} idx 
         * @param {any} data 
         */
        function resolveData(idx, data) {
            arr[idx] = data;
            i++;
            if(i ==promises.length) {
                resolve(arr);
            }
        }
        for(let j = 0;j<promises.length;j++) {
            promises[i].then(data => {
                resolveData(i, data);
            },reject);
        }
    })
}
MyPromise.race = function(promises) {
    return new MyPromise((res, rej) => {
        for(let i = 0;i<promises.length;i++) {
            promises[i].then(res,rej);
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