;(function(root, factory){
    if(typeof module !== "undefined" && module.exports){//Commonjs
        module.exports = factory();
    }else if(typeof define === 'function' && define.amd){//AMD
        define(['z'], factory.bind(root));
    }else{ //no frame
        //root.Promise = root.Promise ||factory.call(root);
        root.Promise = factory.call(root);
    }
})(window, function(z){
    'use strict';

    var _this = this;

    var docElem = document.documentElement;

    var OP = Object.prototype,
        AP = Array.prototype;

    var toString = OP.toString,
        has = OP.hasOwnProperty,
        slice = AP.slice;

    z.dom = function(){ };

    var z_selection = function(objs, parent){
        if(!objs)objs = []; 
        if(z.isArrayLike(objs)) objs = slice.call(objs);

        if('__proto__' in {}){
            //chrome, IE11+, firefox
            if(!z.isArray(objs))objs = [ objs ];
            objs.__proto__ = z_selection_proto;
        }else{
            //IE 9-10
            var obj = {}
            if(z.isArray(objs) || objs.z_version){
                for(var i=0, l=objs.length; i<l; i++){
                    obj[i] = objs[i];
                }   
                obj.length = objs.length
            }else{
                obj[0] = objs;
                obj.length = 1;
            }   
            objs = z.extend(obj, z_selection_proto);
        }   
        objs.parentNode = parent || docElem;
        return objs;
    } 

    z_selection_proto = {
        z_version: '1.0'
    }
    z.fn = z_selection_proto;

    var z_selection_enter = function(objs, parent){
        if(!objs)objs = [];
        if(z.isArrayLike(objs))objs = slice.call(objs);
        if('__proto__' in {}){
            if(!z.isArray(objs))objs = [ objs ];

            objs.__proto__ = z_selection_enter_proto;
        }else{
            var obj = {}
            if(z.isArray(objs) || objs.z_version){
                for(var i=0, l=objs.length; i<l; i++){
                    obj[i] = objs[i];
                }
                obj.length = objs.length
            }else{
                obj[0] = objs;
                obj.length = 1;
            }
            objs = z.extend(obj, z_selection_enter_proto);
        }
        objs.parentNode = parent || docElem;
        return objs;
    }
    z_selection_enter_proto = {};


    //context selector queryselector|queryselectorall
    var z_query = function(c, s, query){
        c = c || document;
        query = query || c.querySelectorAll;
        
        if(c == document) return query.call(document, s);

        /*
         * queryselector 遍历所有子、孙节点，返回所有满足条件的节点集合
         * issue  #a.a>.a.b>.b
         * 在 '#a' 下查找 .a>.b 节点则会返回[.a.b .b]两个节点集合，因为两个节点均满足.a>.b
         * 通过给当前节点添加一个特殊id，从而避免此问题
         * */
        var old=c.id, id = c.id = "_z_query_";
        try{
            s = "#" + id + " " + s;
            return query.call(c,s);
        }catch(e){
            console.log(e);
        }finally{
            old ? c.id = old : c.removeAttribute("id");
        }
    }
    var z_select = function(c, s){
        return z_query(c, s, c.querySelector);
    } 
    var z_selectAll = function(c, s){
        return z_query(c, s, c.querySelectorAll);
    }

    //添加节点查询功能 [select, selectAll, ...]
    z.extend(z.dom, {
        select : function(sel, context){
            context = context || document;
            return typeof sel === "string" ? z_selection( z_select(context, sel) ) : z_selection(sel);
        },

        selectAll : function(sel, context){
            context = context || document;
            return typeof sel === "string" ? z_selection( z_selectAll(context, sel) ) : z_selection(sel);
        },

        call: function(context, fn){
            return fn.call( context, z.select(this).datum() );
        },

        ns : {
            prefix: {
                svg: "http://www.w3.org/2000/svg",
                xhtml: "http://www.w3.org/1999/xhtml",
                xlink: "http://www.w3.org/1999/xlink",
                xml: "http://www.w3.org/XML/1998/namespace",
                xmlns: "http://www.w3.org/2000/xmlns/"
            },
            qualify: function(name) {
                var i = name.indexOf(":"), prefix = name;
                if (i >= 0) {
                    prefix = name.substring(0, i);
                    name = name.substring(i + 1);
                }
                return this.prefix.hasOwnProperty(prefix) ? {
                    space: this.prefix[prefix],
                    local: name
                } : {
                    space : null,
                    local : name 
                };
            }
        },

        create : function(tag, context){
            tag = z.ns.qualify(tag);
            if(!tag.space){
                tag.space = (context && context.namespaceURI ) ? context.namespaceURI : "http://www.w3.org/1999/xhtml";
            }
            return typeof tag === 'function'
                ? z.dom.call(tag, context )
                : document.createElementNS(tag.space, tag.local);
        },

        is: function(obj){
            return obj instanceof HTMLElement
                || obj instanceof SVGElement
                || obj instanceof Text
                || obj instanceof DocumentFragment;    
        },
        
        matchSelector: docElem.matches || docElem.webkitMatchesSelector || docElem.msMatchesSelector || docElem.mozMatchesSelector;
        match: function(context, sel){
            return matchSelector.call( context, sel );
        },

        dir: function(context){
        },

        attr: function(context, k, v){
            function setAttr(k, v){
                k = z.z_ns.qualify(k);
                k.local = k.local.replace(/[A-Z]/g, function(w){return "-" + w.toLowerCase()});
                return k.space ? this.setAttributeNS(k.space, k.local, v) : this.setAttribute(k.local, v);
            }

            if(z.isFunction(k)) k = z.dom.call(context, k);
            if(v){
                if(v.isFunction(v)) v = z.dom.call(context, v);
                setAttr.call(context, k, v);
            }else{
                if(typeof k === "string"){
                    k = z.z_ns.qualify(k);
                    return k.space ? context.getAttributeNS(k.space, k.local) : context.getAttribute(k.local);
                }else{
                    z.each(k, setAttr, context);
                }
            }
        },

        cssNum: {
            "borderImageWidth": true,
            "columnCount": true,
            "flexGrow": true,
            "flexShrink": true,
            "fontWeight": true,
            "fillOpacity": true,
            "floodOpacity": true,
            "lineHeight": true,
            "opacity": true,
            "order": true,
            "orphans": true,
            "shapeImageThreshold": true,
            "stopOpacity": true,
            "strokeMiterlimit": true,
            "strokeOpacity": true,
            "strokeOpacity": true,
            "tabSize": true,
            "widows": true,
            "zIndex": true,
            "zoom": true,
        },
        curCss : function(context, name){
            var ret, defaultView, computedStyle;
            //name = name.replace(/([A-Z]|^ms)/g,function(w){return "-"+w.toLowerCase()});
            //return window.getComputedStyle(context, null).getPropertyValue(name);
            return window.getComputedStyle(context, null)[name];
        },
        css: function(context, k, v){
            function setStyle(k, v){
                k = k.replace(/([A-Z])/g,function(w){return "-"+w.toLowerCase()});
                
                if(!z.dom.cssNum[k] && v !== ""){
                    var csstohook = (""+v).match( z.cssHook );
                    v += !isNaN(v) ? "px" : "";
                }
                //IE9 - v:必须是字符串
                this.style.setProperty(k, "" + v);
            }
            if(z.isFunction(k)) k = z.dom.call(context, k);
            if(v){
                if(v.isFunction(v)) v = z.dom.call(context, v);
                setStyle.call(context, k, v);
            }else{
                if(typeof k === "string"){
                    return z.curCss(context, k); 
                }else{
                    z.each(k, setStyle, context)
                }
            }
        },

        class: function(context, classes, is){
            if(!context )return null;
            if(!obj)return context.className;
            classes = classes.trim().split(" ");
            z.each(classes, function(c){ 
                if(is === false) context.classList.remove(c); 
                else context.classList.add(c); 
            });
        }
    });

    z.extend(z_selection_proto, {
        select : function(sel){
            var parentNode = this.parentNode || docElem,
                ret;
            for(var i = 0, l = this.length; i < l; i++){
                ret = z.dom.select( sel, this[i] );
                if(ret.length) return ret;
            }

            return z_selection([], parentNode);
        },

        selectAll : function(sel){
            var parentNode = this.parentNode || docElem;

            if(this.length == 1){ 
                return z_selection(z_selectAll(this[0], sel) , this[0]);
            }else {
                var res = [];
                this.each(function(){
                    res = res.concat(slice.call( z_selectAll(this, sel) ));
                });    
                return z_selection(z.unique( res ), parentNode);
            }

        },

        parent: function(){
            return this.length ? z.select( this[0].parentNode ) : z_selection([]);
        },

        parents: function(sel){
            if(!this.length) return z_selection([]);

            var _this = this[0],
                arr = [];
            while(_this = _this.parentNode){
                z.dom.match(sel) && arr.push( _this );
            }
            return z_selection( arr );
        },

        child: function(context){
            var _this = this[0];
            return _this && _this.length 
                ? _this.childNodes.length 
                    ? z_selection( _this.childNodes[0] )
                    : z_selection([])
                : z_selection([]);
        },

        children: function(){
            var _this = this[0];
            return _this && _this.length
                ? z_selection(_this.childNodes) 
                : z_selection([]);
        },

        eq: function(i){
            return z_selection( this[i] );
        },

        filter: function(sel){
            var parentNode = this.parentNode ||docElem,
                ret = [];
            this.each(function(d, i){
                if(z.isFunction(sel) && sel.call(this, d)) ret.push( this );
                else if(z.dom.match(sel, this)) ret.push( this );
            });
            return z_selection(ret, parentNode);
        },

        not: function(sel){
            var parentNode = this.parentNode ||docElem,
                ret = [];
            this.each(function(d, i){
                if(z.isFunction(sel) && !sel.call(this, d)) ret.push( this );
                else if(!z.dom.match(sel, this)) ret.push( this );
            });
            return z_selection(ret, parentNode);
        },

        first: function(){
            return this.length ? z_selection(this[0]) : z_selection([]);
        },

        last: function(){
            return this.length ? z_selection(this[this.length - 1]) : z_selection([]);
        },

        prev: function(){
            return this.length ? z_selection(this[0].previousElementSibling) : z_selection([]);
        },

        prevAll: function(sel){
            if(!this.length) return z_selection([]);
            var cur = this[0],
                ret = [];
            while(cur = cur.previousElementSibling){
                if(z.isFunction(sel) && z.dom.call(cur, sel)) ret.push( cur );
                else if( z.dom.match(sel, cur) ) ret.push( cur );
                else ret.push( cur );
            }
            return z_selection(ret);
        },

        next: function(){
            return this.length ? z_selection(this[0].nextSibling) : z_selection([]);
        },

        nextAll: function(sel){
            if(!this.length) return z_selection([]);
            var cur = this[0],
                ret = [];
            while(cur = cur.nextElementSibling){
                if(z.isFunction(sel) && z.dom.call(cur, sel)) ret.push( cur );
                else if( z.dom.match(sel, cur) ) ret.push( cur );
                else ret.push( cur );
            }
            return z_selection(ret);
        },

        siblings: function(sel){
            var _this = z.select(this),
                prevAll = _this.prevAll(sel),
                nextAll = _this.nextAll(sel);
            return z_selection( AP.concat.call(prevAll, nextAll) );
        }
    });

    //添加节点编辑功能 [attr, css, class, ...]
    z.extend(z_selection_proto, {
        datum : function(isextend, data, value){
            if(typeof isextend !== "boolean") {
                value = data;
                data = isextend;
                isextend = true;
            }

            var that = this[0];
            that.__data__ = that.__data__ || z.extend({}, that.dataset);

            if(data){
                var d = that.__data__;
                if(typeof data == "string") return that.__data__[data];
                else{
                    that.__data__ = isextend ? z.extend(true, d, data) : z.extend({}, that.dataset, data);
                }
                return this;
            }else return that.__data__;
        },

        data : function(isextend, data, fn){
            var parentNode = this.parentNode || document.documentElement;
            if(!arguments.length){
                var res = [];
                this.each(function(){
                    res.push(z.select(this).datum());
                });
                return res;
            }

            if(typeof isextend !== "boolean"){
                fn = data;
                data = isextend;
                isextend = true;
            }

            if(z.isFunction(data)){
                return this.data(isextend, z.dom.call(parentNode, data), fn);
            }

            var enterNode = [], updateNode = [], exitNode = [], tmpNode = [],
                datalength = data.length,
                nodelength = this.length,
                l_min = Math.min(datalength, nodelength);
            
            if(z.isFunction(fn)){
                var pos ,
                    peer = function(fn, array, obj){
                        var peerkey = fn(obj);
                        pos = -1;
                        z.each(array, function(v, i){
                            if(fn(v) == peerkey)pos = i;
                        })
                        return pos; 
                    };
                this.each(function(d, i){
                    if(d === undefined) exitNode.push( this );

                    if( (pos = peer(fn, data, d)) != -1){
                        z_selection(this).datum(data[pos]);
                        updateNode.push( this );
                        tmpNode.push( pos);
                    }else {
                        exitNode.push( this );
                    }

                    enterNode = z.filter(data, function(v, i){
                        return !z.contain(tmpNode, i);
                    });
                });
            }else{
                isextend = fn;
                var i=0;
                for(; i<l_min; i++){
                    z_selection(this[i]).datum(data[i], isextend);
                    updateNode.push( this[i] );
                }
                for(i=l_min; i<nodelength; i++){
                    exitNode.push( this[i] );
                }
                for(i=l_min; i<datalength; i++){
                    enterNode.push( data[i] );
                }
            }
            

            this.enter = function(){
                return z_selection_enter(enterNode, parentNode);
            }
            this.exit = function(){
                return z_selection(exitNode, parentNode);
            }
            this.update = function(){
                return z_selection(updateNode, parentNode);
            }

            return this;
        }

        attr: function(k, v){
            return (!v && typeof k === "string")
                ? z.dom.attr(this[0], k)
                : this.each(function(){
                    z.dom.css(this, k, v);
                });
        },

        css: function(k, v){
            return (!v && typeof k === "string")
                ? z.dom.css(this[0], k)
                : this.each(function(){
                    z.dom.css(this, k, v);
                });
        },

        class: function(classes, is){
            return this.each(function(){
                z.dom.class(this, classes, is);
            });
        },

        clone: function(deep){
            return this.length 
                ? this[0].cloneNode(deep !== false)
                : null;
        },

        toggle: function(classes){
            return this.each(function(){
                if(classes === undefined){
                    //toggle
                    var _prevDisplay = this._prevDisplay || "block";
                    this.style.display = this.style.display === "none" ? _prevDisplay : "none";
                }eles{
                    //toggle classes
                    //z.dom.classes(classes, !z.dom.match(this, classes));
                    this.classList.toggle(classes);
                }
            });
        },

        index: function(){
            return this.length ? z.select( this[0] ).prevAll().length : -1;
        },
    });

    //添加DOM结构编辑功能 [append, insert, ...]
    z.extend(z_selection_proto, {
        append: function(){
        },
        
        insert: function(){
        },

        before: function(){
        },

        after: function(){
        },

        html: function(){
        },

        text: function(){
        },

        val: function(v){
            return v === undefined
                ? this.length ? this[0].value : undefined 
                : this.each(function(){
                    this.value = v;
                });
        },

        empty: function(){},

        remove: function(){},
    });

})(window)
