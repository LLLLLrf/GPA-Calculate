// ==UserScript==
// @name         scnu教务系统优化
// @version      2.2
// @description  华南师范大学新教务系统优化
// @author       Jkey, LLLLLrf
// @match        https://jwxt.scnu.edu.cn/xtgl/index_initMenu.html
// @match        https://jwxt.scnu.edu.cn/xtgl/index_initMenu.html?jsdm=*
// @match        https://jwxt.scnu.edu.cn/cjcx*
// @match        https://jwxt.scnu.edu.cn/cdjy*
// @grant        none
// @license      GPL
// ==/UserScript==

(function () {
    'use strict';

    const skipWaiting = function(clickFun) {
        $("#badge_text").remove();
        const btn = $("#btn_yd");
        btn.removeAttr("disabled");
        btn.addClass("btn-primary");
        btn.click(clickFun);
    }

    var localAddress = location.href;

    // 登录界面跳过5秒
    if (localAddress.indexOf("initMenu") > -1) {
        if (document.getElementById('btn_yd')) {
            skipWaiting(() => {
                window.location.href = _path + '/xtgl/login_loginIndex.html';
            });
        }
    }

    // 预约教室页面跳过5秒等待
    else if (localAddress.indexOf("cdjy") > -1 && document.getElementById('btn_yd')) {
        skipWaiting(() => {
            let gnmkdmKey = $('input#gnmkdmKey').val();
            //全局文档添加参数
            $(document).data("offDetails", "1");
            //加载功能主页：且添加不再进入提示信息页面的标记字段
            onClickMenu.call(this, '/cdjy/cdjy_cxCdjyIndex.html?doType=details', gnmkdmKey, { "offDetails": "1" });
        });
    }

    // 成绩查询界面加入自动计算绩点
    else if (localAddress.indexOf("cjcx") > -1) {
        // 添加绩点span
        var newTextNode = document.createElement("span");
        var newTextNode2 = document.createElement("span");
        newTextNode.innerText = "平均绩点：加载中";
        newTextNode.id = "avgGPA";
        newTextNode2.innerText="总学分：加载中";
        newTextNode2.id="sumCredit";
        newTextNode2.style.marginLeft='10px';
        $("#yhgnPage").append(newTextNode);
        $("#yhgnPage").append(newTextNode2);
        var pgs=document.getElementsByClassName('ui-pg-selbox')[0];
        pgs[0].selected=false;
        document.getElementsByClassName('ui-pg-selbox')[0].value="1000";
        var event = new Event('change');
        pgs.dispatchEvent(event);
        // 监听函数
        const observeChange = function() {
            let observer = new MutationObserver(function () {
                // console.log("发生了改变");
                if (document.getElementById("load_tabGrid").style.display === "none") {
                    setGPA();
                    observer.disconnect();
                }
            });
            observer.observe(document.getElementById("load_tabGrid"), { attributes: true, attributeFilter: ['style'] });
        }

        // 首次进入
        observeChange();
        // 监听查询按钮
        document.getElementById("search_go").onclick = function () {
            // console.log("点击");
            newTextNode.innerText = '平均绩点：加载中';
            observeChange();
        }
    }

    function setGPA() {
        var page = Number(document.getElementById('sp_1_pager').innerText);

        if (page <= 0) {
            $("span#avgGPA").text('平均绩点：暂无成绩');
            $("span#sumCredit").text('总学分：暂无');
            return;
        } else if (page === 1) {
            var sumCredit = 0, GPA = 0;
            var credits_grades = $("td[aria-describedby='tabGrid_xfjd']");
            var credits = $("td[aria-describedby='tabGrid_xf']");
            var courseList=new Array();
            var cj = $("td[aria-describedby='tabGrid_cj']");
            var course=$("td[aria-describedby='tabGrid_kcmc']");
            for (let i = 0; i < credits.length; i++) {
                if (Number(credits[i].innerText)!==0.00 && Number(credits_grades[i].innerText)!==0.00){
                    if(cj[i].innerText=="缓考"||cj[i].innerText=="通过"||cj[i].innerText=="免修"){
                        continue;
                    }else{
                        sumCredit += Number(credits[i].innerText);
                        GPA += Number(credits_grades[i].innerText);
                        courseList[i]=course[i].innerText;
                    }
                }
            }
            GPA /= sumCredit;
            console.log(courseList);
            $("span#avgGPA").text('平均绩点：' + GPA.toFixed(3));
            $("span#sumCredit").text('总学分：' + sumCredit.toFixed(3));
            return;
        }
        var gnmkdm = $('input#gnmkdmKey').val();
        var user = $('input#sessionUserKey').val();
        var nd = Date.now();
        var xqm = document.getElementById("xqm");
        var xqm_val = xqm[xqm.selectedIndex].value;
        var xnm = document.getElementById("xnm");
        var xnm_val = xnm[xnm.selectedIndex].value;
        // 发送请求
        fetch('https://jwxt.scnu.edu.cn' + ($("#jsxx").val() == "xs"?'/cjcx/cjcx_cxXsgrcj.html':'/cjcx/cjcx_cxDgXscj.html') + '?doType=query&gnmkdm=' + gnmkdm + '&su=' + user, {
            "headers": {
                "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            "body": "xnm=" + xnm_val + "&xqm=" + xqm_val + "&_search=false&nd=" + nd + "&queryModel.showCount=100&queryModel.currentPage=1&queryModel.sortName=&queryModel.sortOrder=asc",
            "method": "POST"
        }).then(response => response.json()).then(data => {
            let sumCredit = 0, GPA = 0;
            // console.log(data)
            for (let item of data.items) {
                if (item.cj=="缓考" || item.cj=="通过"){
                    continue;
                }
                sumCredit += Number(item.xf);
                GPA += Number(item.xfjd);

            }
            GPA /= sumCredit;
            $("span#avgGPA").text('平均绩点：' + GPA.toFixed(2));
            $("span#sumCredit").text('总学分：' + sumCredit.toFixed(2));

        });
    }
})();