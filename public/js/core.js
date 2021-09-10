(function(exports) {

        dayjs.extend(window.dayjs_plugin_relativeTime)
        var lan = window.navigator.language
        if (lan.startsWith("zh")) {
            dayjs.locale("zh-cn")
        }

        // fetch with progress
        function fetch(url, opts = {}, onProgress) {
            return new Promise((res, rej) => {
                var xhr = new XMLHttpRequest()
                xhr.open(opts.method || 'get', url)
                for (var k in opts.headers || {})
                    xhr.setRequestHeader(k, opts.headers[k])
                xhr.onload = e => res(JSON.parse(e.target.responseText))
                xhr.onerror = rej
                if (xhr.upload && onProgress)
                    xhr.upload.onprogress = onProgress
                xhr.send(opts.body)
            });
        }

        function getApiUrl(path) {
            if (window.localStorage.getItem('ACCESS_KEY')) {
                return path + '?key=' + window.localStorage.getItem('ACCESS_KEY') + `&v=${parseInt(new Date().getTime() / 1000)}`
            }
            return path
        }

        // return true if is PC
        function isPC() {
            const Agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"]
            for (let v = 0; v < Agents.length; v++) {
                if (window.navigator.userAgent.indexOf(Agents[v]) > 0) {
                    return false
                }
            }
            return true
        }

        function language() {
            return (navigator.language || navigator.browserLanguage)
        }

        // set locale for server
        document.cookie = `locale=${language()};`

        // localization string
        function langString(key) {
            const localStr = {
                'Upload Date: ': {
                    'zh-cn': '更新时间：'
                },
                'Add': {
                    'zh-cn': '添加'
                },
                'Upload Done!': {
                    'zh-cn': '上传成功！'
                },
                'Download and Install': {
                    'zh-cn': '下载安装'
                },
                'Beta': {
                    'zh-cn': '内测版'
                },
                'Current': {
                    'zh-cn': '当前'
                },
                'Channel': {
                    'zh-cn': '渠道'
                },
                'Delete': {
                    'zh-cn': '删除'
                },
                'Back to home?': {
                    'zh-cn': '是否返回首页？'
                },
                'Confirm to Delete?': {
                    'zh-cn': '确认删除？'
                },
                'Delete Success!': {
                    'zh-cn': '删除成功！'
                },
                'Home': {
                    'zh-cn': '首页'
                },
                'Search': {
                    'zh-cn': '搜索'
                },
                'Keyword': {
                    'zh-cn': '关键字'
                },
                'Load more': {
                    'zh-cn': '点击加载更多'
                },
                'No more': {
                    'zh-cn': '已经到底了'
                },
            }
            const lang = (localStr[key] || key)[language().toLowerCase()]
            return lang ? lang : key
        }

        // bytes to Human-readable string
        function sizeStr(size) {
            const K = 1024,
                M = 1024 * K,
                G = 1024 * M
            if (size > G) {
                return `${(size/G).toFixed(2)} GB`
            } else if (size > M) {
                return `${(size / M).toFixed(2)} MB`
            } else {
                return `${(size / K).toFixed(2)} KB`
            }
        }

        window.ipaInstall = function(event, plist) {
            event && event.stopPropagation()
            window.location.href = 'itms-services://?action=download-manifest&url=' + plist
        }

        window.goToLink = function(link) {
            console.log("goToLink", link);
            window.event && window.event.stopPropagation()
            window.location.href = link
        }

        onInstallClick = function(id) {
            console.log("onInstallClick", id);
            row = window.pkgs[id]

            console.log("onInstallClick()", row);
            var needGoAppPage = !!(
                row.type === 0 ?
                    (row.history || []).find(r => r.type === 1) :
                    (row.history || []).find(r => r.type === 0)
            )
            console.log("needGoAppPage", needGoAppPage);
            if (needGoAppPage) {
                return goToLink('/app?id='+row.id)
            }
            console.log("row.type", row.type);
            if (row.type == 0) {
                return ipaInstall(row.plist)
            }
            return goToLink(row.pkg)
        }

        onEditClick = function(id){
            edit_button = document.getElementById("edit_"+id);
            submit_button = document.getElementById("submit_"+id);
            comment = document.getElementById("comment_"+id);
            comment_input = document.getElementById("comment_input_"+id);

            edit_button.style.display="none";
            submit_button.style.display="";
            comment.style.display = "none";
            comment_input.style.display = "";
            comment_input.style.width = "100%";
            comment_input.style.height = "auto";
        }

        onEditSubmitClick = function(id) {

            console.log("onEditSubmitClick", id);
            edit_button = document.getElementById("edit_"+id);
            submit_button = document.getElementById("submit_"+id);
            comment = document.getElementById("comment_"+id);
            comment_input = document.getElementById("comment_input_"+id);

            edit_button.style.display="";
            submit_button.style.display="none";

            comment_input.style.display = "none";
            comment.style.display = "";

            if (comment.innerText == comment_input.value){
                console.log("no change, no request");
                return
            }

            comment.innerText = comment_input.value;
            comment_str = comment_input.value;

            IPA.fetch(IPA.getApiUrl('/api/edit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    comment: comment_str,
                }),
            }).then(json => {
                if (json.err) {
                    alert(json.err)
                    return
                }
            }).catch(err => {
                console.error(err)
            })
        }

        // create a global list to store package data
        window.pkgs = new Object();;

        function createItem(row) {
            window.pkgs[row.id] = row;
            var icons = [row.type === 0 ? 'ios' : 'android'];
            (row.history || []).forEach(r => {
                if (r.type === 0 && icons.indexOf('ios') === -1) {
                    icons.push('ios')
                }
                if (r.type === 1 && icons.indexOf('android') === -1) {
                    icons.push('android')
                }
            });
            icons.sort().reverse()
            return `
      <a class='row'>
        <div style="cursor:pointer" onclick="goToLink('/app?id=${row.id}')">
          <img data-normal="${row.webIcon}" alt="">
        </div>
        <div class="center" style="cursor:pointer" onclick="goToLink('/app?id=${row.id}')">
          <div class="name">
            ${row.name}
            ${icons.map(t => `<img class="icon-tag ${t}" src="/img/${t}.svg">`).join('')}
          </div>
          <div>${row.current ? `<span class="tag">${langString('Current')}</span>` : ''}</div>
          <div class="version">
            <span>${row.version}(Build ${row.build})</span>
            <span>${row.channel && IPA.langString('Channel') + ': '+row.channel || ''}</span>
          </div>
          <div class="date">${IPA.langString('Upload Date: ')}${dayjs(row.date).fromNow()}</div>
        </div>

        <div class="right" id="edit_${row.id}"><div onclick="onEditClick('${row.id}')"><img class="icon-tag-large" src="/img/edit.svg"></div></div>
        <div class="right" id="submit_${row.id}" style="display:none" ><div onclick="onEditSubmitClick('${row.id}')"><img class="icon-tag-large" src="/img/check-circle.svg"></div></div>
        <div class="right">
            <div onclick="onInstallClick('${row.id}')" style="pointer-events:auto;"><img class="icon-tag-large" src="/img/arrow-alt-circle-down.svg"></div>
        </div>
        <br/>
      </a>
      <div class="app-desc">
          <pre class="center_child" id="comment_${row.id}" sytle="height:100%;cursor:pointer" onclick="goToLink('/app?id=${row.id}')">${row.comment}</pre>
          <textarea class="center_child" id="comment_input_${row.id}" style="display:none" rows="10">${row.comment}</textarea>
      </div>
    `
  }

  exports.IPA = {
    fetch: fetch,
    isPC: isPC(),
    langString: langString,
    sizeStr: sizeStr,
    createItem: createItem,
    getApiUrl: getApiUrl,
  }

})(window)