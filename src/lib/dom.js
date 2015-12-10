(function(window){
    var z = window.Z = window.Z || function(){},
        docElem = document.documentElement,
        slice = Array.prototype.slice;
    
    var z_selection = function(objs, parent){
        if(!objs)objs = [];
        if(z.isNodeList(objs))objs = Array.prototype.slice.call(objs);
        if('__proto__' in {}){
            //chrome, ID11+, firefox
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
        z_version: 1.0
    };
    z.fn = z.selection_proto = z_selection_proto;
   
    var z_selection_enter = function(objs, parent){
        if(!objs)objs = [];
        if(z.isNodeList(objs))objs = Array.prototype.slice.call(objs);
        if('__proto__' in {} && false){
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

        var old=c.id, id = c.id = "_query_";
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
    
    //扩展 isArray  
    //NodeList 归纳为Array
    z.isNodeList = function(arr){
        return Object.prototype.toString.call(arr) === "[object NodeList]" ;
    }

    //utility function
    z.extend(z_selection_proto, {
        each : function(fn){
            z.each(this, function(obj, i){
                fn.call(obj, obj.__data__ || {}, i);
            });
            return this;
        },
        
        call : function(fn){
            fn.call(this);
            return this;
        }
    });
 
    //dom select
    z.extend(Z,{
        select : function(sel){
            return typeof sel == "string" ? z_selection( z_select(document, sel) ) : z_selection(sel);
        },

        selectAll : function(sel){
            return typeof sel == "string" ? z_selection( z_selectAll(document, sel) ) : z_selection(sel);
        },
        
        z_ns : {
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

        isDom : function(obj){
            return obj instanceof HTMLElement
                || obj instanceof SVGElement
                || obj instanceof Text
                || obj instanceof DocumentFragment;    
        },

        createDom : function(tag, context){
            tag = z.z_ns.qualify(tag);
            if(!tag.space){
                tag.space = (context && context.namespaceURI ) ? context.namespaceURI : "http://www.w3.org/1999/xhtml";
            }
            return typeof tag === 'function'
                ? tag
                : document.createElementNS(tag.space, tag.local);
        },

        attr : function(context, k, v){
            function setAttr(k, v){
                k = z.z_ns.qualify(k);
                v = z.isFunction(v) ? v.call(this, this.__data__) : v;
                k.local = k.local.replace(/[A-Z]/g, function(word){return "-" + word.toLowerCase()});
                return k.space ? this.setAttributeNS(k.space, k.local, v) : this.setAttribute(k.local, v);
            }

            if(v){
                setAttr.call(context, k, v);
            }else{
                if(typeof k == "string"){
                    k = z.z_ns.qualify(k); 
                    return k.space ? context.getAttributeNS(k.local) : context.getAttribute(k.local);
                }else{
                    z.each(k, setAttr, context)
                }
            }
            return context;
        },

        cssHook : /([#]?[+-]?[0-9]*(?:\.[0-9]+)?)([a-zA-Z%]*)?/,
        //cssNum copy by jquery-2.1.1.js
        cssNum : {
            "columnCount": true,
            "fillOpacity": true,
            "flexGrow": true,
            "flexShrink": true,
            "fontWeight": true,
            "lineHeight": true,
            "opacity": true,
            "order": true,
            "orphans": true,
            "widows": true,
            "zIndex": true,
            "zoom": true
        },
        
        //getComputedStyle
        //抛弃IE中currentstyle
        curCss : function(elem, name){
            var ret, defaultView, computedStyle;
            name = name.replace(/([A-Z]|^ms)/g,function(w){return "-"+w.toLowerCase()});
            if((defaultView = elem.ownerDocument.defaultView) && (computedStyle = defaultView.getComputedStyle(elem, null))){
                ret = computedStyle.getPropertyValue( name );
            }
            return ret;
        },

        cssFix : function(style){
            return z.cssNum[style] ? "" : "px";
        },

        css : function(context, k, v){
            //IE9 - v:必须是字符串
            function setStyle(k, v){
                k = k.replace(/([A-Z])/g,function(w){return "-"+w.toLowerCase()});
                v = z.isFunction(v) ? v.call(this, this.__data__) : v;
                
                if(!z.cssNum[k] && v !== ""){
                    var csstohook = (""+v).match( z.cssHook );
                    v += (csstohook[2] == undefined && !isNaN(parseFloat(csstohook[0]))) ? "px" : "" ;
                }
                this.style.setProperty(k, ""+v);
            }
            if(v !== undefined){
                setStyle.call(context, k, v);
            }else{
                if(typeof k == "string"){
                    //return context.style.getPropertyValue(k); 
                    return z.curCss(context, k); 
                }else{
                    z.each(k, setStyle, context)
                }
            }
            return context;
        },

        class : function(context, obj, isadd){
            if(!context )return null;
            if(!obj)return context.className;
            else if(context.classList){
                var classes = obj.trim().split(" ");
                if(isadd === false){
                    z.each(classes, function(c){
                        context.classList.remove(c);
                    }); 
                }else{
                    z.each(classes, function(c){
                        context.classList.add(c);
                    }); 
                }
            } else {
                var orign = z.attr(context, "class");
                orign = orign ? orign.split(" ") : [];
                obj = obj.split(" ");
                isadd = isadd === undefined ? true : isadd;
                obj = z.compact( isadd ? z.merge(true, orign, obj) : z.diff(orign, obj)).join(" ");
                z.attr(context, "class", obj);
            }
        },

        toggle : function(context, c){
            if(!context )return null;
            if(context.classList)context.classList.toggle(c);
            else {
                var orign = z.attr(context, "class");
                orign = orign ? orign.split(" ") : [];
                z.contain(orign, c) ? z.class(context, c, false) : z.class(context, c);
            }
        },
        

        //styles
        width : function(context, v){
            if(v){
                z.css(context, "width", v);
            }else{

            }
        },
        height : function(){
            if(v){
                z.css(context, "width", v);
            }else{

            }
        }
    }); 
    
    //dom select
    z.extend(z_selection_proto, {
        select : function(sel){
            var parentNode = this.parentNode || docElem;
            return z_selection( z_select(this[0], sel), parentNode);
        },

        selectAll : function(sel){
            var parentNode = this.parentNode || docElem;

            if(this.length == 1){ 
                return z_selection( z_selectAll(this[0], sel) , this[0]);
            }else {
                var res = [];
                this.each(function(){
                    res = res.concat( slice.call( z_selectAll(this, sel) ));
                });    
                return z_selection(z.unique( res ), parentNode);
            }

        },
        
        filter : function(fn){
            var parentNode = this.parentNode || docElem;
            var res = [];
            this.each(function(d,i){
                if(fn.call(this, d, i)) res.push(this);
            });
            return z_selection( res , parentNode);
        },
        
        not : function(sel){
            var res = [];
            this.each(function(d, i){
                if(!matchSelector.call(this, sel))res.push( this );
            });
            return z.select( res );
        },
        
        child: function(){
            if(this.length == 0)return z_selection([]);
            if(this[0].childNodes.length == 0)return z_selection([]);
            return z.select( this[0].childNodes[0] );
        },

        children: function(){
            if(this.length == 0)return z_selection([]);
            return z.select( this[0].childNodes)
        },

        parent : function(){
            if(this.length == 0)return z_selection([]);
            return z.select(this[0].parentNode);
        },

        eq : function(i){
            return z.select( this[i] );
        }, 

        index: function(){
            var that = this[0], index = 0;
            z.select(this).parent().children().each(function(i){
                if(this == that)index = arguments[1];
            });
            return index;
        }
    });
    var matchSelector = docElem.matches || docElem.webkitMatchesSelector || docElem.msMatchesSelector || docElem.mozMatchesSelector;
    z_selection_proto.is = z_selection_proto.matches = function(selector){
        if(this.length == 0)return null;
        else return matchSelector.call(this[0], selector);
    } 

    //dom edit
    z.extend(z_selection_enter_proto,{
        append : function(elem){
            var parentNode = this.parentNode,
                enterNode = [];
            z.each(this, function(v, i){
                enterNode.push( z_selection(parentNode).append(elem).datum(v)[0] );
            }); 
            return z_selection( enterNode );
        }    
    });

    z.extend(z_selection_proto,{
        append : function(obj){
            var res = [], ele;
            obj = (z.isArray(obj) || obj.z_version) ? obj[0] : obj;
            this.each(function(){
                ele = typeof obj == "string" 
                ? this.appendChild(z.createDom(obj, this))
                : this.appendChild(obj);

                res.push(ele);
            });
            return z_selection( res );
        },
        
        insert : function(obj){
            var res = [], ele;
            obj = (z.isArray(obj) || obj.z_version) ? obj[0] : obj;
            this.each(function(){
                if(this.firstElementChild == null){
                    ele = typeof obj == "string" 
                    ? this.appendChild(z.createDom(obj, this))
                    : this.appendChild(obj);
                }else{
                    ele = typeof obj == "string" 
                    ? this.insertBefore(z.createDom(obj, this), this.firstElementChild)
                    : this.insertBefore(obj, this.firstElementChild);
                }
                res.push(ele);
            });
            return z_selection( res );
        },

        before : function(obj){
            var res = [], ele;
            obj = (z.isArray(obj) || obj.z_version) ? obj[0] : obj;
            this.each(function(){
                ele = typeof obj == "string" 
                ? this.parentNode.insertBefore(z.createDom(obj, this), this)
                : this.parentNode.insertBefore(obj, this);
                res.push(ele);
            });
            return z_selection( res );
        },

        after : function(obj){
            var res = [], ele;
            obj = (z.isArray(obj) || obj.z_version) ? obj[0] : obj;
            this.each(function(){
                var parent = this.parentNode;
                if(parent.lastElementChild == this){
                    ele = typeof obj == "string" 
                    ? parent.appendChild(z.createDom(obj, this))
                    : parent.appendChild(obj);
                }else{
                    ele = typeof obj == "string" 
                    ? parent.insertBefore(z.createDom(obj, this), this.nextElementSibling)
                    : parent.insertBefore(obj, this.nextElementSibling);
                }
                res.push(ele);
            });
            return z_selection( res );
        },

        clone : function(deep){
            if(deep == undefined)deep = true;
            var res = [];
            this.each(function(){
                res.push(this.cloneNode(deep));
            });
            return res;
        },
        
        val : function(value){
            return value == undefined ? 
                this[0].value : 
                this.each(function(){
                    this.value = value;
                }); 
        },
        html : function(value){
            return value == undefined ?
                this[0].innerHTML  :
                this.each(function(){
                    this.innerHTML = value;
                });
        },
        text : function( value ){
            return value == undefined ?
                this[0].textContent  :
                this.each(function(){
                    this.textContent = value;
                });
        },

        empty : function(){
            this.each(function(){
                while(this.firstChild){
                    this.removeChild(this.firstChild);
                }
            });    
            return this;
        },

        remove : function(){
            this.each(function(){
                var parent = this.parentNode;
                if(parent) parent.removeChild(this);
            });    
        },

    })
    
    //attr, css
    z.extend(z_selection_proto, {
        attr : function(k, v){
            return (!v && typeof k == "string")
            ? z.attr(this[0], k)
            : this.each(function(){
                z.attr(this, k, v);
            });
        },

        css : function(k, v){
            return (v === undefined && typeof k == "string")
            ? z.css(this[0], k)
            : this.each(function(){
                z.css(this, k, v);
            });
        },

        class : function(c, isadd){
            return c 
            ? this.each(function(){
                z.class(this, c, isadd);
            })
            : z.class(this[0]) 
        },
        toggle : function(c){
            return this.each(function(){
                z.toggle(this, c);
            });
        },

        hide: function(){
            return this.each(function(){
                this.style.display = "none";
            });
        },

        show: function(){
            return this.each(function(){
                this.style.display = "";
            });
        }

    })
    
    //datum , data
    z.extend(z_selection_proto, {
        datum : function(data, isextend){
            var that = this[0];
            if(data){
                var d = that.__data__ = that.__data__ || {};
                if(typeof data == "string")return that.__data__[data];
                else{
                    isextend = isextend === undefined ? true : isextend;
                    that.__data__ = isextend ? z.extend(true, d, data) : z.extend({},data);
                }
                return this;
            }else return that.__data__;
        },

        data : function(data, fn, isextend){
            var parentNode = this.parentNode || document.documentElement;
            if(!arguments.length){
                var res = [];
                this.each(function(){
                    res.push(this.__data__ || {});
                });
                return res;
            }

            if(z.isFunction(data)){
                return this.data( data.call(parentNode, parentNode.__data__), fn, isextend);
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
    });
    
    window.z = Z;
})(window)
