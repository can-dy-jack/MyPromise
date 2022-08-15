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
            while(this._resolveQueue.length) {
                const callback = this._resolveQueue.shift();
                callback(this._value);
            }
        }
    }
    const reject = (reason) => {
        if(this._status === "pending") {
            this._status = "rejected";
            this._reason = reason;
            while(this._rejectQueue.length) {
                const callback = this._rejectQueue.shift();
                callback(this._reason);
            }
        }
    }
    try {
        executor(resolve, reject);
    } catch(e) {
        reject(e);
    }
}
MyPromise.prototype.then = function(resolveFn, rejectFn) {
    return new MyPromise((resolve, reject) => {
        const fulfilledFn = val => {
            try {
                let x = resolveFn(val);
                x instanceof MyPromise ? x.then(resolve, reject) : resolve(x);
            } catch(e) {
                reject(e);
            }
        }
        this._resolveQueue.push(fulfilledFn);

        const rejectedFn = e => {
            try {
                let x = rejectFn(e);
                x instanceof MyPromise ? x.then(resolve, reject) : resolve(x);
            } catch(e) {
                reject(e);
            }
        }
        this._rejectQueue.push(rejectedFn);
    })
}
MyPromise.prototype.status = function() {
    console.log(this._status, this._value);
}

/**
 * test code
 */
const p1 = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve("look at me")
    }, 1000);
})

p1.then(str => {
    // console.log(str)
    return str.split(" ")
})
.then(arr => {
    // console.log(arr)
    return arr.map(i => i[0].toUpperCase())
})
.then(res => {
    // console.log(res)
    return res.join("")
})
.then(e => console.log(e))


/**
 * promises-tests测试
 */
MyPromise.deferred = function () {
    let def = {};
    def.promise = new MyPromise(function (resolve, reject) {
        def.resolve = resolve;
        def.reject = reject;
    });
    return def;
}
module.exports = MyPromise