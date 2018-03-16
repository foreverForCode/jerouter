/**
 * JEUI Tools
 */
window.je = {};
var $Q = function (selector,content) {
    content = content || document;
    return selector.nodeType ? selector : content.querySelector(selector);
};
HTMLElement.prototype.find = function() {
    var arg = arguments, agun = arg[1] == undefined;
    return this[agun ? "querySelector":"querySelectorAll"](arg[0]);
};
//原生JS封装Tap事件，解决移动端300ms延迟
HTMLElement.prototype.addTapEvent = function(callback) {
    var startTime = 0, endTime = 0,
        waitTime = 500, //tap等待时间，在此事件下松开可触发方法
        startCX = 0, startCY = 0,
        endCX = 0, endCY = 0,
        removH = 15, //水平或垂直方向移动超过15px测判定为取消（根据chrome浏览器默认的判断取消点击的移动量)
        okTap = false;
    this.addEventListener('touchstart', function() {
        startTime = event.timeStamp;
        var touch = event.changedTouches[0];
        startCX = touch.clientX, startCY = touch.clientY;
        okTap = false;
    })
    this.addEventListener('touchmove', function() {
        var touch = event.changedTouches[0];
        endCX = touch.clientX, endCY = touch.clientY;
        var CXH = Math.abs(endCX - startCX) > removH, CYH = Math.abs(endCY - startCY) > removH
        if (CXH || CYH)  okTap = true;
    })
    this.addEventListener('touchend', function() {
        endTime = event.timeStamp;
        if (!okTap && (endTime - startTime) <= waitTime) callback && callback();
    })
};
je.ready = function(callback){
    if (/complete|loaded|interactive/.test(document.readyState) && document.body){
        callback && callback();
    }else{
        document.addEventListener('DOMContentLoaded', function(){
            callback && callback(); 
        }, false);
    }
};
/* 判断对象是否为空 */
je.isObjEmpty = function (obj) {
    for(var i in obj){return true;}
    return false;
};
je.extend = function () {
    var options, name, src, copy, deep = false, target = arguments[0], i = 1, length = arguments.length;
    if (typeof (target) === "boolean") deep = target, target = arguments[1] || {}, i = 2;
    if (typeof (target) !== "object" && typeof (target) !== "function") target = {};
    if (length === i) target = this, --i;
    for (; i < length; i++) {
        if ((options = arguments[i]) != null) {
            for (name in options) {
                src = target[name], copy = options[name];
                if (target === copy) continue;
                if (copy !== undefined) target[name] = copy;
            }
        }
    }
    return target;
};
/* 判断是否为移动端 */
je.isMobile = function () {
    var navMatch = /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|JUC|WebOS|Windows Phone)/i;
    return navigator.userAgent.match(navMatch) ? true : false;
};
/*
	解析URL地址
	je.parsURL( url ).file;     // = 'index.html'  	
	je.parsURL( url ).hash;     // = 'top'  	
	je.parsURL( url ).host;     // = 'www.abc.com'
	je.parsURL( url ).query;    // = '?id=255&m=hello'  
	je.parsURL( url ).queryURL  // = 'id=255&m=hello' 	
	je.parsURL( url ).params;   // = Object = { id: 255, m: hello }  	
	je.parsURL( url ).prefix;   // = 'www'
	je.parsURL( url ).path;     // = '/dir/index.html'  	
	je.parsURL( url ).segments; // = Array = ['dir', 'index.html']  	
	je.parsURL( url ).port;     // = '8080'  	
	je.parsURL( url ).protocol; // = 'http'  	
	je.parsURL( url ).source;   // = 'http://www.abc.com:8080/dir/index.html?id=255&m=hello#top' 
*/
je.parsURL = function (url) {
    url = arguments[0] == undefined ? window.location.href : url;
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function () {
            var ret = {}, seg = a.search.replace(/\?/, '').split('&'), len = seg.length, i = 0, s;
            for (; i < len; i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                var isw = /\?/.test(s[0]) ? s[0].split("?")[1] : s[0];
                ret[isw] = s[1];
            }
            return ret;
        })(),
        prefix: a.hostname.split('.')[0],
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
        segments: a.pathname.replace(/^\//, '').split('/'),
        queryURL: a.search.replace(/^\?/, '')
    };
};
/* 保留小数点后N位 */
je.toDecimal = function (val, num) {
    num = num == undefined ? 2 : num;
    // 四舍五入
    var vals = Math.round(val * Math.pow(10, num)) / Math.pow(10, num),
        toVal = vals.toString(), len = toVal.indexOf('.');
    // 如果是整数，小数点位置为-1
    if (len < 0) {
        len = toVal.length;
        toVal += '.';
    }
    // 不足位数以零填充
    while (toVal.length <= len + num) {
        toVal += '0';
    }
    return toVal;
};
/* je.each(arr,function(val,i){}) */
je.each = function(obj, callback /*, thisp*/) {
    if (typeof callback != "function") throw new TypeError(callback + ' is not a function');
    var len = obj.length,thisp = arguments[2];
    for (var i = 0; i < len; i++) {
        if (i in obj) callback.call(thisp, obj[i], i, obj);
    }
}; 
je.html = function (elem, html) {
    return typeof html === "undefined" ? elem && elem.nodeType === 1 ? elem.innerHTML : undefined : typeof html !== "undefined" && html == true ? elem && elem.nodeType === 1 ? elem.outerHTML : undefined : elem.innerHTML = html;
};
/* 读取设置节点文本内容 */
je.text = function(elem,value) {
    var innText = document.all ? "innerText" :"textContent";
    return typeof value === "undefined" ? elem && elem.nodeType === 1 ? elem[innText] :undefined : elem[innText] = value;
};
/* 设置值 */
je.val = function (elem,value) {
    if (typeof value === "undefined") {
        return elem && elem.nodeType === 1 && typeof elem.value !== "undefined" ? elem.value :undefined;
    }
    // 将value转化为string
    value = value == null ? "" :value + "";
    elem.value = value;
};
/* 添加样式名 */
je.addClass=function (node,c) {
    if(!node)return;
    node.className = je.hasClass(c,node) ? node.className : node.className + ' ' + c ;
};

/* 移除样式名 */
je.removeClass=function (node,c) {
    var reg = new RegExp("(^|\\s+)" + c + "(\\s+|$)", "g");
    if(!je.hasClass(c,node))return;
    node.className = reg.test(node.className) ? node.className.replace(reg, '') : node.className;
};

/* 是否含有CLASS */
je.hasClass=function (c, node) {
    if(!node || !node.className)return false;
    return node.className.indexOf(c)>-1;
};

/* 阻止冒泡 */
je.stopPropagation=function (event) {
    event = event || window.event;
    event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
};
/* 去除两端空格 */
je.trim=function (str) {
    return str.replace(/^\s+|\s+$/g,'');
};
/* 事件绑定 */
je.on = function (elem, type, callback) {
    if (elem.addEventListener) {
        type == "tap" ? elem.addTapEvent(callback) : elem.addEventListener(type, callback, false);
        return true;
    } else if (elem.attachEvent) {
        return elem.attachEvent("on" + type, callback);//IE5+
    }
}
/* css或js预加载 */
je.require = function (arrSrc, callback) {
    var arrList = (Object.prototype.toString.call(arrSrc)=='[object Array]') ? arrSrc : [arrSrc], 
        arrLen = arrList.length, arrTotal = 0, doc = document,
        head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement,
        baseElement = head.getElementsByTagName("base")[0];
    var baseurl = (function () {
        var tags = document.getElementsByTagName("script"),
            script = tags[tags.length - 1],
            url = script.hasAttribute ? script.src : script.getAttribute('src', 4);
        return url.replace(/\/[^\/]+$/, "");
    })();
    //创建一个标签
    var createTagsNode = function (url) {
        var returi,spath,tmp,srcl, ext = url.split(/\./).pop(),isFull = /^(\w+)(\d)?:.*/.test(url),
            isCSS = (ext.replace(/[\?#].*/, '').toLowerCase() == "css"),
            node = doc.createElement(isCSS ? "link" : "script");
        if (isFull) { //如果本来就是完整路径
            returi = url;
        } else {
            tmp = url.charAt(0);
            spath = url.slice(0,2);
            if(tmp != "." && tmp != "/"){ //当前路径
                returi = baseurl + "/" + url;
            }else if(spath == "./"){ //当前路径
                returi = baseurl + url.slice(1);
            }else if(spath == ".."){ //相对路径
                srcl = baseurl;
                url = url.replace(/\.\.\//g,function(){
                    srcl = srcl.substr(0,srcl.lastIndexOf("/"));
                    return "";
                });
                returi = srcl + "/" + url;
            }
        } 
        //为uri添加一个统一的后缀
        if (!isCSS && !/\.js$/.test(returi)) returi += ".js";

        node.type = isCSS ? "text/css" : "text/javascript";
        if (isCSS) {
            node.href = returi;
            node.rel = "stylesheet";
        } else {
            node.src = returi;
            node.async = true;
        }
        node.charset = "utf-8";
        return node;
    }
    //css或js逐个加载
    for (var i = 0; i < arrLen; i++) {
        var uri = arrList[i], node = createTagsNode(uri);
        (function (node) {
            //检测script 的onload事件
            var supportOnload = "onload" in node;
            if (supportOnload) {
                node.onload = function () {
                    addLoad.call(node, false);
                };
                node.onerror = function () {
                    console.error("Error: " + uri + " \u4E0D\u5B58\u5728\u6216\u65E0\u6CD5\u8BBF\u95EE");
                    addLoad.call(node, true);
                }
            } else {
                node.onreadystatechange = function () {
                    if (/loaded|complete/.test(node.readyState)) addLoad.call(node);
                }
            }

            function addLoad(error) {
                arrTotal++;
                node.onload = node.onerror = node.onreadystatechange = null;
                //head.removeChild(node);
                node = null;
                if (arrTotal == arrLen) {
                    callback && callback(error);
                    arrTotal = 0;
                }
            }
            baseElement ? head.insertBefore(node, baseElement) : head.appendChild(node);
        })(node);
    }
}



//为移动端页面body设置尺寸
je.ready(function () {
    (function docBodySize() {
        var setBodySize = function () {
            var doc = document,
                docWidth = doc.documentElement.clientWidth || doc.body.clientWidth,
                docHeight = doc.documentElement.clientHeight || doc.body.clientHeight;
            if (!je.isMobile() && docWidth > 720) {
                doc.body.style.width = "720px";
                doc.body.style.height = docHeight + "px";
            } else {
                doc.body.style.width = docWidth + "px";
                doc.body.style.height = docHeight + "px";
            }
        };
        setBodySize();
        window.addEventListener("resize",function(){
            setBodySize();
        });
    })()
})
