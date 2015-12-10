;(function(root, factory){
    if(typeof module != 'undefined' && module.exports){//Commonjs
        module.exports = factory();
    }else if(typeof define === 'function' && define.amd){//AMD
        define(factory.bind(root));
    }else{ //no frame
        root.z = factory.call(root);
    }
})(window, function(){
    'use strict';

    var _this = this;

    var z = function(){};

    var OP = Object.prototype,
        AP = Array.prototype;

    var toString = OP.toString,
        has = OP.hasOwnProperty,
        slice = AP.slice;

    var class2type = {};

    z.each = function(obj, fn, context){
        if(!obj) return;
        context = context || _this;

        if(obj.length === +obj.length){
            for(var i = 0, l = obj.length; i < l; i++){
                fn.call( context, obj[i], i, obj );
            }
        }else{
            for(var k in obj){
                fn.call( context, obj[k], k, obj );
            }
        }
    };

    z.map = function(obj, fn, context){
        if(!obj) return [];
        context = context || _this;

        var ret = [];
        z.each(obj, function(){
            ret.push( fn.apply(context, arguments) );
        });
    };

    //copy from jquery
    z.extend = function(){
        var target, src, option, length, i, clone, copy;
            length = arguments.length;
            target = arguments[0] || {};
            i = 1,
            deep = false;
        
        if(typeof target === "boolean"){
            deep = target;
            target = arguments[1] || {};
            i = 2;
        }
        if(length == i){
            target = this;
            --i;
        }
        
        for(; i<length; i++){
            if((option = arguments[i]) != null){ 
                for(var k in option){
                    src = target[ k ];
                    copy = option[ k ];
        
                    if(target === copy)continue;
        
                    if(deep && copy && (z.isPlainObject(copy) || z.isArray(copy))){
                        if(z.isArray(copy)){
                            clone = src && z.isArray(src) ? src : [];
                        }else{
                            clone = src && z.isPlainObject(src) ? src : {};
                        }
                        target[ k ] = z.extend(deep, clone, copy)
                    }else if(copy !== undefined){
                        target[ k ] = copy;
                    }
                }
            }
        }
        return target;
    };

    //follow functions write after reading jquery, underscore, d3 etc
    z.each(['Arguments', 'Function', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'Array', 'Object'], function(name){
        z['is' + name] = function(obj){
            return toString.call(obj) === "[object " + name + "]"; 
        };

        class2type[ "[object " + name + "]" ] = name.toLowerCase();
    });

    z.type = function(obj){
        return class2type[ toString.call(obj) ];
    };

    z.isWindow = function(obj){
        return obj != null && obj.window === obj;
    };

    z.isEmpty = function(obj){
        if(obj == null) return true;
        if(z.isArrayLike(obj) || z.isArray(obj) || z.isString(obj)) return obj.length == 0;
        for(var key in obj) return false;
        return true;
    }; 

    z.isBoolean = function(obj){
        return obj === true || obj === false || toString(obj) == "[object Boolean]";
    };

    z.isNaN = this.isNaN || function(obj){
        return z.isNumber(obj) && obj !== +obj;
    }; 

    //Object
    z.isPlainObject = function(obj){
        if(!obj || !z.isObject(obj) || obj.nodeType || z.isWindow(obj) ) return false;
        if(obj.constructor && !has.call(obj.constructor.prototype, 'isPrototypeOf')) return false;
        return true;
    };

    z.has = function(obj, key){
        return obj !== null && has.call(obj, key);
    };

    z.invert = function(obj){
        var ret = {};
        z.each(obj, function(k, v){
            ret[v] = k;
        });
        return ret;
    };

    //Array
    z.isArray = AP.isArray || z.isArray;
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    z.isArrayLike = function(collection){
        var length = collection != null && collection.length;
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    z.filter = AP.filter || function(arr, fn){
        var ret = [];
        z.each(arr, function(v, i){
            if( fn.call(arr, v, i) ) ret.push(v);
        });
        return ret;
    };

    z.reject = AP.reject || function(arr, fn){
        var ret = [];
        z.each(arr, function(v, i){
            if( !fn.call(arr, v, i) ) ret.push(v);
        });
        return ret;
    };

    z.contain = function(arr, v){
        return AP.indexOf.call( arr, v ) != -1; 
    }

    z.unique = function(arr, fn){
        var ret = [],
            isFunction = z.isFunction(fn),
            flag = false;
        z.each(arr, function(v, i){
            if(isFunction){
                flag = false;
                for(var i, l = ret.length; i < l; ){
                    if(fn(v, ret[i])){
                        flag = true;
                        break;
                    }
                }
                if(!flag) ret.push(v);
            }else{
                if( !z.contain(v) ) ret.push(v);
            }
        });
        return ret;
    }

    z.compact = function(arr){
        return z.filter(arr, function(v){
            return v;
        });
    };

    z.flatten = function(arr, deep){
        if(!z.isArray(arr)) return [ arr ];

        var ret = [];
        z.each(arr, function(v){
            if(deep){
                ret = ret.concat( z.flatten(v, deep) );
            }else{
                ret = ret.concat( z.inArray(v) ? v : [ v ] );
            }
        });
        return ret;
    };

    z.some = z.any = function(arr, fn){
        if(z.isEmpty(arr)) return false;

        if(AP.some){
            return Ap.some.call( arr, fn );
        }else{
            for(var i = 0, l = arr.length; i < l; i++){
                if(fn.call(arr, arr[i], i)) return true;
            }
        }
    };

    z.all = z.every = function(arr, fn){
        if(z.isEmpty(arr)) return false;
        var all = AP.all || AP.every;

        if(all){
            return all.call( arr, fn );
        }else{
            for(var i = 0, l = arr.length; i < l; i++){
                if(!fn.call(arr, arr[i], i)) return false;
            }
        }
    };

    z.diff = function(){
        var src , target = arguments[0];
        for(var i = 1, l = arguments.length; i < l; i++){
            src = arguments[i];
            target = z.filter(target, function(v){
                return !z.contain(src, v);
            });
        }
        return target;
    };

    z.intersection = function(){
        var src , target = arguments[0];
        for(var i = 1, l = arguments.length; i < l; i++){
            src = arguments[i];
            target = z.filter(target, function(v){
                return z.contain(src, v);
            });
        }
        return target;
    };

    z.merge = function(){
        var ret = [],
            i = 0,
            l = arguments.length,
            isUnique = false;

        if(z.isBoolean(arguments[0])){
            i++;
            isUnique = true;
        }

        for(; i < l; i++){
            ret = ret.concat( arguments[i] );
        }
        return isUnique ? z.unique(ret) : ret;
    };

    z.adapt = function(srcArr, tarArr, adapter){
        var adaptArr = []; 
        if(!z.isArray(srcArr) || !z.isArray(tarArr)) return [];

        var src = AP.slice.call(srcArr), tar = AP.slice.call(tarArr);
        if(typeof adapter == "undefined"){
            var srclength = src.length, tarlength = tar.length, minlength = Math.min(srclength, tarlength);
            var i = 0;
            for(; i<minlength; i++){
                adaptArr.push( {src: src[i], tar: tar[i]} );
            }   
            for(; i < srclength; i++){
                adaptArr.push( {src: src[i]} );
            }   
            for(; i < tarlength; i++){
                adaptArr.push( {tar: tar[i]} );
            } 
            return adaptArr;
        }else if(z.isFunction(adapter)){
            for(var i=0, srclength = src.length; i<srclength; i++){
                var srcitem = src[i],
                    j = 0,
                    tarlength = tar.length;
                for(; j<tarlength; j++){
                    var taritem = tar[j];
                    if(adapter(srcitem, taritem))break;
                }
                if(j == tarlength){
                    adaptArr.push({ src: src[i] });
                }else{
                    adaptArr.push({ src: src[i], tar: tar[j] });
                    tar.splice(j, 1);
                }
            } 
            for(var j=0; j<tar.length; j++){
                adaptArr.push({tar: tar[j]});
            }
            return adaptArr;
        }else if(z.isString(adapter)){
            return z.adapt(src, tar, function(srcitem, taritem){
                if(!srcitem[adapter] || !taritem[adapter])return false;
                else return srcitem[adapter] == taritem[adapter];
            });
        }
        return [];
    };

    return window.z = window.Z = z;
})
