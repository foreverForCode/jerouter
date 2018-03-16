/**
 * SPA，是Single Page Web Application的缩写
 */
;
!(function (window, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    } else {
        window.jeRoute = factory();
    }
})(this, function () {
    var st = {},
        navMatch = /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|JUC|WebOS|Windows Phone)/i;
    var isTap = navigator.userAgent.match(navMatch) ? "tap" : "click";
    je.extend(st, {
        /** ajax request **/
        request: function (options) {
            options = options || {};
            options.type = (options.type || "GET").toUpperCase();
            options.dataType = options.dataType || "json";
            options.contentType = options.contentType || "application/x-www-form-urlencoded;charset=UTF-8";
            options.async = options.async || true;
            var optsdata = options.data,
                reqTimeout, requestDone = false;
            var xhr = (function () {
                    if (window.XMLHttpRequest) {
                        return new XMLHttpRequest();
                    } else {
                        //遍历IE中不同版本的ActiveX对象
                        var versions = ["Microsoft", "msxm3", "msxml2", "msxml1"];
                        for (var i = 0; i < versions.length; i++) {
                            try {
                                return new ActiveXObject(versions[i] + ".XMLHTTP");
                            } catch (e) {}
                        }
                    }
                })(),
                getParam = function (param) {
                    var randomStr = "_ajaxjeroute=" + (new Date().getTime() + "" + Math.round(Math.random() * 1000)),
                        str = "";
                    if (param == null || param == "") return randomStr;
                    if (typeof (param) == "object") {
                        for (var key in param) str += key + "=" + param[key] + "&";
                        str = (str.length > 0 ? str.substring(0, str.length - 1) : str);
                    } else {
                        str = param;
                    }
                    return str + "&" + randomStr;
                },
                sendCallback = function (reXML, params) {
                    if (reXML.readyState == 4 && !requestDone) {
                        var status = reXML.status;
                        if (status >= 200 && status < 300 || reXML.status === 304) {
                            var result = reXML.responseText,
                                error = false;
                            try {
                                if (options.dataType == 'html') result;
                                else if (options.dataType == 'json') result = /^\s*$/.test(result) ? null : JSON.parse(result);
                            } catch (e) {
                                error = e
                            }
                            error ? params.error && params.error(reXML) : params.success && params.success(result, status);
                        } else {
                            params.error && params.error(reXML);
                        }
                        xhr = null;
                        clearTimeout(reqTimeout);
                    } else if (!requestDone) {
                        //设置超时
                        if (!reqTimeout) {
                            reqTimeout = setTimeout(function () {
                                requestDone = true;
                                !!reXML && reXML.abort();
                                clearTimeout(reqTimeout);
                            }, !params.timeout ? 5000 : params.timeout);
                        }
                    }
                }
            // 执行发送前事件
            options.beforeSend && options.beforeSend(xhr);
            if (options.type == "GET") {
                options.url += options.url.indexOf("?") != -1 ? "&" : "?";
                xhr.open("GET", options.url + getParam(optsdata), options.async);
            } else if (options.type == "POST") {
                xhr.open("POST", options.url, options.async);
                xhr.setRequestHeader("Content-Type", options.contentType);
            }
            if (options.async === true) {
                xhr.onreadystatechange = function () {
                    sendCallback(xhr, options);
                };
            }
            xhr.send(options.type == "GET" ? null : optsdata);
            if (options.async === false) sendCallback(xhr, options);
        },
        /** 翻页动画 **/
        viewAnimation: function (opt) {
            var staticel = opt.staticView,
                animel = opt.animView,
                initcls = opt.animInitClass,
                beforecls = opt.animBeforeClass,
                endcls = opt.animEndClass,
                animtype = opt.animType || 'in'; //动画是进入 还是  出  ;  in  or out
            //animel.classList.add(initcls);
            je.addClass(animel,initcls)
            //进入 动画节点 显示， 出， 对上一个页面显示
            //(animtype == 'in') ? animel.style.display = "block": staticel.style.display = "block";
            animel.style.display = "-webkit-box"
            setTimeout(function () {
                //animel.classList.add(beforecls);
                je.addClass(animel,beforecls)
                je.on(animel, 'webkitTransitionEnd', function () {
                    //进入 对上一个页面隐藏；  出 动画节点 隐藏，
                    //(animtype == 'in') ? staticel.style.display = "none": animel.style.display = "none";
                    //animel.style.display = "none"
                    //animel.classList.remove(endcls);
                    je.removeClass(animel,endcls)
                    animel.removeEventListener('webkitTransitionEnd',null,false);
                });
            }, 2);
        }
    });

    var dataParam = function (param) {
        var arr = [];
        if (je.isObjEmpty(param)) {
            for (var key in param) arr.push(key + "=" + encodeURI(param[key]));
            return arr.join("&");
        } else {
            return ""
        }
    }
    var jeRoute = function (params) {
            return new Routes(params);
        },
        cacheRoute = [];

    function Routes(params) {
        var config = {

            errorTpl: "", //发生错误时的错误模板
            data: {}, //点击当前url的参数 
            beforeenter: null, //视图进入前，如果视图尚未就绪。触发时，活动视图的切换和视图布局动作尚未执行
            doenter: null, //视图进入时触发
            afterenter: null, //视图进入后触发
            methods: {} //自定义的函数方法
        }
        this.opts = je.extend(config, jeRoute.config(), params || {});
        this.elem = $Q(this.opts.cell);
        this.nextTick = (function () {
            return function (fun) {
                setTimeout(fun, 3);
            };
        })()
        je.extend(this, this.opts.methods);
        this.init(this.opts);
    }
    var SPA = Routes.prototype;
    SPA.init = function (params) {
        var that = this,
            spaCell = that.spaCell(),
            opts = that.opts,
            domain = opts.fullDomain;
        if (je.isObjEmpty(opts.data)) opts.viewUrl += opts.viewUrl.indexOf("?") != -1 ? "&" : "?" + dataParam(opts.data);
        var exists = that.contains(cacheRoute, domain + opts.viewUrl);

        if (!exists[0]) {
            history.pushState({}, null, domain + opts.viewUrl);
            cacheRoute.push({
                path: domain + opts.viewUrl,
                cell: spaCell
            });
        }
        je.each(that.elem.find("view", false), function (cls, i) {
            if (cls.getAttribute("id") == null) {
                cls.setAttribute("id", spaCell)
                that.bindEventNode(that.elem);
            }
        })

    };
    SPA.spaCell = function () {
        return "jespa" + parseInt(100000 * Math.random());
    };
    SPA.getHtmlView = function (str, elem) {
        var that = this,
            tmpel = document.createElement("div"),
            viewCell = that.opts.viewCell;
        je.html(tmpel, str);
        var viewHtml = je.html($Q("view", tmpel));
        var viewTitle = $Q("view", tmpel).getAttribute("je-title");
        if (viewTitle != null) {
            document.title = viewTitle;
            elem.setAttribute("je-title", viewTitle);
        }
        je.html(elem, viewHtml);
        var script = $Q("script[jsurl]", elem),
            urls = (script.getAttribute("jsurl")).split(",");
        script.remove();
        je.require(urls);
        that.bindEventNode(elem);
        that.opts.afterenter && that.opts.afterenter();
    };
    SPA.createView = function (cell) {
        var divView = document.createElement("view");
        divView.classList.add(this.opts.viewCell);
        //divView.classList.add("view-in");
        // divView.className = this.opts.viewCell;
        divView.id = cell
        this.elem.appendChild(divView);
        return divView;
    };
    SPA.bindEventNode = function (dom) {
        var that = this;
        var acquireAttr = function (atVal) {
            var args = /\(.*\)/.exec(atVal);
            if (args) { //如果函数带参数,将参数字符串转换为参数数组
                args = args[0];
                atVal = atVal.replace(args, "");
                args = args.replace(/[\(\)\'\"]/g, '').split(",");
            } else args = [];
            return [atVal, args];
        };
        je.each(dom.childNodes, function (node, i) {
            if (node.nodeType === 1) {
                var getback = node.getAttribute("je-back");
                var geton = node.getAttribute("je-tap");
                that.bindEventNode(node);
                if (geton != null || getback != null) {
                    var onarr = acquireAttr(geton);
                    je.on(node, isTap, function () {
                        if (getback != null) {
                            console.log(cacheRoute)
                            getback != "" ? window.location.href = getback : history.back();
                            setTimeout(function () {
                                that.getCurrView()
                            }, 10);
                        } else {
                            if (typeof (geton) == "string" && /^@/.test(geton)) {
                                that.goLink(geton);
                            } else {
                                that[onarr[0]] && that[onarr[0]].apply(node, onarr[1]);
                            }
                        }
                    });
                    //node.removeAttribute(jeon);
                }
            }
        })
    };
    SPA.hideViewCell = function () {
        je.each(document.querySelectorAll("view"), function (cls) {
            cls.style.display = "none";
            cls.classList.remove('view-in');
        })
    };
    //判断数组中是否存在某一项
    SPA.contains = function (arr, obj) {
        var i = arr.length,
            state = [false];
        while (i--) {
            if (arr[i].path === obj) state = [true, arr[i].cell];
        };
        return state;
    };
    SPA.getCurrView = function () {
        var that = this,
            exists = that.contains(cacheRoute, location.href);
        that.hideViewCell();
        if ($Q('#' + exists[1])) {
            // $Q('#' + exists[1]).style.display = "-webkit-box";

            st.viewAnimation({
                animView: $Q("#" + exists[1]),
                animType: 'out',
                animInitClass: 'view-page-center view-transition',
                animBeforeClass: 'view-page-right-i',
                animEndClass: 'view-page-right-i view-transition view-page-center'
            });

        }



    };
    SPA.loadView = function (urls, cell) {
        var that = this,
            opts = that.opts;
        //判断url路径是否存在 
        var exists = that.contains(cacheRoute, urls);
        if (exists[0]) {
            $Q("#" + exists[1]).style.display = "-webkit-box";
            $Q("#" + exists[1]).classList.add('view-in');
            return;
        }
        that.createView(cell);
        st.viewAnimation({
            // staticView: $Q("#" + cell),
            animView: $Q("#" + cell),
            animType: 'in',
            animInitClass: 'view-page-right view-transition',
            animBeforeClass: 'view-page-center-i',
            animEndClass: 'view-page-right view-transition view-page-center-i'
        });
        opts.doenter && opts.doenter();
        st.request({
            url: urls,
            dataType: "html",
            success: function (data) {
                that.nextTick(function () {
                    that.getHtmlView(data, $Q("#" + cell));
                })
            },
            error: function () {
                var errtpl = typeof (opts.errorTpl) == "string" ? opts.errorTpl : opts.errorTpl && opts.errorTpl();
                that.nextTick(function () {
                    that.getHtmlView(errtpl, $Q("#" + cell));
                });
            }
        });
    };
    SPA.goLink = function (url) {
        var that = this,
            reUrl = url.replace(/^@/, ""),
            opts = that.opts,
            spaCell = that.spaCell();
        reUrl = opts.fullDomain + reUrl;
        opts.beforeenter && opts.beforeenter();
        if (je.isObjEmpty(opts.data)) reUrl += reUrl.indexOf("?") != -1 ? "&" : "?" + dataParam(opts.data);
        var exists = that.contains(cacheRoute, reUrl);
        that.hideViewCell();
        that.loadView(reUrl, spaCell);
        history.pushState({}, null, reUrl);
        if (!exists[0]) cacheRoute.push({
            path: reUrl,
            cell: spaCell
        });
    };
    jeRoute.config = function (opts) {
        var set = {
            cell: document.body, //最外层的元素，例如“body” 
            viewUrl: "", //当前url
            viewCell: "viewwrap", //新创建视图的元素
            fullDomain: location.protocol + "//" + location.host + "/", //当前完整域名
            maxSize: 720, //视图在PC端的最大尺寸
        }
        return je.extend(set, opts || {});
    }
    jeRoute.nextTick = (function () {
        return function (fn) {
            setTimeout(fn, 3);
        };
    })();
    je.ready(function () {
        var elem = $Q("script[jsurl]", $Q("view"));
        var urls = (elem.getAttribute("jsurl")).split(",");
        je.require(urls);
        elem.remove();
    })
    return jeRoute;
});