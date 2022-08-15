function MyPromise(executor) {
    // pending fulfilled rejected
    this._status = "pending";
    // value
    this._value;
    // reason
    this._reason;
    
    const resolve = (val) => {
        // 注意 this 指向问题！！！
        if(this._status === "pending") {
            this._status = "fulfilled";
            this._value = val;
        }
    }
    const reject = (reason) => {
        if(this._status === "pending") {
            this._status = "rejected";
            this._reason = reason;
        }
    }
    try {
        executor(resolve, reject);
    } catch(e) {
        reject(e);
    }
}
MyPromise.prototype.then = function(resolveFn, rejectFn) {
    if(this._status === "fulfilled") {
        resolveFn(this._value);
    } else if(this._status === "rejected") {
        rejectFn(this._reason);
    } 
}
MyPromise.prototype.status = function() {
    console.log(this._status, this._value);
}

/**
 * test code
 */
const p1 = new MyPromise((res, rej) => {
    res("success !")
})
p1.then(res => console.log(res))
