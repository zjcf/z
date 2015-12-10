/*
 * base on: https://github.com/chemdemo/promiseA
 * */
;(function(root, factory){
    if(typeof module !== "undefined" && module.exports){//Commonjs
        module.exports = factory();
    }else if(typeof define === 'function' && define.amd){//AMD
        define(factory);
    }else{ //no frame
        //root.Promise = root.Promise ||factory.call(root);
        root.Promise = factory.call(root);
    }
})(window, function(){
    'use strict';

    var undefined;

    var isFunction = function(fn){
        return Object.prototype.toString.call(fn) === "[object Function]";
    };
    /*
     * thenable: a object or function has a 'then' method
     * */
    var isThenable = function(obj){
        return obj && obj.then && isFunction(obj.then);
    }

    var once = function(fn){
        var called = false,
            r;

        return function(){
            if(called) return r;
            called = true;
            return r = fn.apply(this, arguments);
        }
    }

    var setImmediate = this.setImmediate || function(fn){ return setTimeout(fn, 0); };

    //Promise
    var zPromise = function(resolve){
        if(!(this instanceof zPromise)) return new zPromise(resolve);

        /*
         * state: pending, fulfilled, rejected
         * */
        this.state = 'pending';
        this.value;
        this.reason;
        this.thenables = [];

        if(isFunction(resolve)) resolve(this.resolve.bind(this), this.reject.bind(this));

        return this;
    };

    //instance methods
    zPromise.prototype.then = function(onFulfilled, onRejected){
        var thenable = {};

        isFunction(onFulfilled) && ( thenable.onFulfilled = onFulfilled );
        isFunction(onRejected)  && ( thenable.onRejected = onRejected );
        thenable.promise = zPromise();
        this.thenables.push( thenable );

        if(this.state !== "pending") this.handleThen();

        return thenable.promise;
    };

    zPromise.prototype.catch = function(reject){
        return this.then(void 0, reject);
    }

    zPromise.prototype.resolve = function(value){
        if(this.state !== "pending") return;

        this.state = "fulfilled";
        this.value = value;
        this.handleThen();

        return this;
    };

    zPromise.prototype.reject = function(reason){
        if(this.state !== "pending") return;

        this.state  = "rejected";
        this.reason = reason;
        this.handleThen();

        return this;
    };

    zPromise.prototype.handleThen = function(){
        var innerHandleThen = function(){
            if(this.state === "pending") return false;

            var then, x;
            while(then = this.thenables.shift()) {
                try{
                    switch(this.state){
                        case "fulfilled":
                            if(then.onFulfilled){
                                x = then.onFulfilled(this.value);
                                resolveX(then.promise, x);
                            }
                            else then.promise.resolve(this.value);
                            break;
                        case "rejected":
                            if(then.onRejected){
                                x = then.onRejected(this.reason);
                                resolveX(then.promise, x);
                            }
                            else then.promise.reject(this.reason);
                            break;
                    }
                }catch(e){
                    then.promise.reject(e);
                }
            }
        };

        //保证每次处理都是异步
        setImmediate(innerHandleThen.bind(this)); 
    }

    var resolveX = function(promise, x){
        if(promise === x) promise.reject(new Error('TypeError'));

        if(x instanceof zPromise) return resolvePromise(promise, x);
        if(isThenable(x)) return resolveThen(promise, x);
        return promise.resolve(x);
    }

    var resolvePromise = function(promise1, promise2){
        var state = promise2.state;

        if(state === "pending") return promise2.then(promise1.resolve.bind(promise1), promise1.reject.bind(promise1));
        if (state === "fulfilled") return promise1.resolve(promise2.value);
        if (state === "rejected") return promise1.reject(promise2.reason);
    }

    var resolveThen = function(promise, thenable){
        var called;
        var resolve = once(function(y){
            if(called) return;
            resolveX(promise, y);
            called = true;
        });

        var reject = once(function(r){
            if(called) return;
            promise.reject(r);
            called = true;
        });

        try{
            thenable.then.call( thenable, resolve, reject );
        }catch(e){
            if(!called) throw e;
            else promise.reject(e);
        }
        return promise;
    }

    //static methods
    zPromise.resolve = function(fn){
        var promise = zPromise();
        if(isThenable(fn)) return resolveThen(promise, fn);
        else return promise.resolve(fn);
    };

    zPromise.reject = function(fn){
        var promise = zPromise();
        return promise.reject(fn);
    };

    zPromise.all = function(promises){
        var promise = zPromise();
        var l = promises.length,
            isReject = false,
            fulfilledCount = 0,
            ret = [];
        for(var i = 0; i < l; i++){
            promises[i].then(function(value){
                ret[i] = value;
                if(++fulfilledCount === l && !isReject) promise.resolve(ret);
            }, function(reason){
                isReject = true;
                promise.reject(reason);
            });
        }
        return promise;
    };

    zPromise.race = zPromise.any = function(promises){
        var promise = zPromise();
        var called;
        for(var i = 0, l = promises.length; i < l; i++){
            promises[i].then(function(value){
                if(!called){
                    called = true;
                    promise.resolve(value);
                }
            }, function(reason){
                called = true;
                promise.reject(reason);
            });
        }
        return promise;
    };

    return zPromise;
});
