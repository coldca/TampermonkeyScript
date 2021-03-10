// ==UserScript==
// @name        虎牙直播功能增强
// @namespace   https://gitee.com/Kaiter-Plus/TampermonkeyScript/tree/master/虎牙直播功能增强
// @author      Kaiter-Plus
// @description 给虎牙直播添加额外功能
// @version     0.9
// @match       *://*.huya.com/\w*
// @icon        https://www.huya.com/favicon.ico
// @noframes
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       GM_notification
// @grant       GM_registerMenuCommand
// @run-at      document-end
// @note        2020/12/10 添加 “同步时间” 功能
// @note        2020/12/28 添加 “画面镜像” 功能
// @note        2021/01/29 代码重构
// @note        2021/03/01 添加 “自动选择最高画质” 功能，并同时提供配置开关，默认关闭
// @note        2021/03/02 添加 “自动选领取百宝箱奖励” 功能，并同时提供配置开关，默认关闭
// @note        2021/03/03 修改 更改配置时为不用重载界面
// @note        2021/03/04 修复了一个小 bug
// @note        2021/03/08 修复了最后两个宝箱不会领取的 bug
// @note        2021/03/10 紧急修复了宝箱不会领取的 bug
// ==/UserScript==
;(function () {
  'use strict'

  // 判断镜像状态
  let isReverse = false

  // 定时器
  const timer = {
    initTimer: null,
    playTimer: null,
    chestTimer: null
  }

  // 控制栏容器
  let controlContainer = null

  // 直播界面容器
  let container = null

  // 最高画质
  let hightestImageQuality = null

  // 所有宝箱
  let chests = null

  // 配置选项
  const config = {
    // 获取是否自动选择最高画质
    isSelectedHightestImageQuality: GM_getValue('isSelectedHightestImageQuality'),
    // 是否自动领取宝箱
    isGetChest: GM_getValue('isGetChest')
    // 获取是否自动网页全屏
    // isFullScreen: GM_getValue('isFullScreen')
  }

  // 创建功能图标
  function createTagIcon(option) {
    const tag = document.createElement(option.tagName)
    tag.id = option.id
    tag.className = option.className
    tag.title = option.title
    tag.innerHTML = option.innerHTML
    tag.style = option.style
    tag.addEventListener('click', () => {
      option.eventListener()
    })
    return tag
  }

  // 初始化
  function init() {
    timer.initTimer = setInterval(() => {
      if (!container || chests.length <= 0) {
        controlContainer = document.querySelector('.duya-header-control')
        container = document.getElementById('player-ctrl-wrap')
        chests = document.querySelectorAll('#player-box .player-box-list li')
      } else {
        hightestImageQuality = document.querySelector('.player-videotype-list').children[0]
        initStyle()
        initTools()
        clearInterval(timer.initTimer)
      }
    }, 1000)
  }

  // 初始化图标样式
  function initStyle() {
    GM_addStyle(`
        #J_global_user_tips{
          display: none;
        }
        .video-tools-icon {
          position: absolute;
          top: 11px;
        }
        .video-tools-icon .icon {
          fill: currentColor;
          color: #b2b4b4;
        }
        .video-tools-icon:hover .icon {
          fill: currentColor;
          color: #ff9600;
        }
        .hy-header-style-normal .hy-nav-title svg {
          position: relative;
          top: -5px;
          left: 4px;
          fill: currentColor;
          color: #555;
        }
        .hy-header-style-normal .hy-nav-title:hover svg {
          fill: currentColor;
          color: #ff9600;
        }
      `)
  }

  // 初始化工具
  function initTools() {
    insertIcon()
    config.isSelectedHightestImageQuality ? selectedHightestImageQuality() : null
    config.isGetChest ? getChest() : null
  }

  // 插入图标
  function insertIcon() {
    // 同步时间图标
    const sync = createTagIcon({
      tagName: 'div',
      id: 'ex-videosync',
      className: 'video-tools-icon',
      title: '同步时间',
      innerHTML: `
    <svg t="1595680402158" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7532" width="22" height="22">
     <path d="M938.1888 534.016h-80.7936c0.4096-7.3728 0.6144-14.6432 0.6144-22.016 0-218.624-176.8448-400.7936-389.12-400.7936C257.024 111.2064 80.6912 293.1712 80.6912 512c0 218.7264 176.4352 400.7936 388.1984 400.7936 74.752 0 149.0944-22.016 208.1792-60.0064l42.7008 68.608c-75.0592 48.9472-161.9968 74.8544-250.7776 74.752C209.8176 996.1472 0 779.264 0 512S209.8176 27.8528 468.8896 27.8528C728.3712 27.8528 938.7008 244.736 938.7008 512c0 7.3728-0.2048 14.6432-0.512 22.016z m-261.12 318.7712z m-26.4192-158.1056L426.7008 556.032V291.9424h64v226.5088L689.5616 635.904l-38.912 58.7776z m245.3504-6.656L768 512h256L896 688.0256z" p-id="7533"></path>
    </svg>
    `,
      style: 'left: 96px;',
      eventListener: setVideoSync
    })

    // 镜像图标
    const rev = createTagIcon({
      tagName: 'div',
      id: 'ex-videoReverse',
      className: 'video-tools-icon',
      title: '镜像画面',
      innerHTML: `
      <svg t="1608364922280" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="977" width="22" height="22" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path d="M99.4 909.8L430.8 792V219.8L99.4 102v807.8z m33.1-740.5l265.1 84.1v504.9l-265.1 84.2V169.3z m37.3 639.5h16.6V203h-16.6v605.8z m335.6-629.4H522v-61h-16.6v61z m0 80.1H522v-61.1h-16.6v61.1z m0 80.4H522v-61h-16.6v61z m0 80.1H522v-61h-16.6v61z m0 84H522v-61h-16.6v61z m0 80.1H522V523h-16.6v61.1z m0 80.4H522v-61.1h-16.6v61.1z m0 80.1H522v-61.1h-16.6v61.1z m0 78.3H522v-61.1h-16.6v61.1z m0 80.3H522v-61.1h-16.6v61.1zM857.5 203h-16.6v605.8h16.6V203z m-261 16.8V792l331.4 117.8V102L596.5 219.8z m298.3 622.7l-265.1-84.1v-505l265.1-84.2v673.3z" p-id="978"></path>
      </svg>
      `,
      style: 'left: 134px;',
      eventListener: setVideoRev
    })

    // 插入配置选项
    const settings = createTagIcon({
      tagName: 'div',
      id: '',
      className: 'hy-nav-right nav-subscribe',
      title: '',
      innerHTML: `
      <a class="hy-nav-title clickstat" href="javascript:void(0)">
        <i class="hy-nav-icon">
          <svg t="1614912323565" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3409" width="28" height="28"><path d="M384 891.306667a95.36 95.36 0 0 1-42.666667-9.813334A93.44 93.44 0 0 1 287.573333 789.333333l2.986667-40.32a52.906667 52.906667 0 0 0-44.373333-55.68l-39.893334-5.973333a94.933333 94.933333 0 0 1-39.253333-172.373333l33.28-22.826667a52.266667 52.266667 0 0 0 15.786667-69.12l-20.053334-35.2a94.933333 94.933333 0 0 1 110.08-138.026667l38.613334 11.733334a52.48 52.48 0 0 0 64-30.72l14.933333-37.546667a94.933333 94.933333 0 0 1 176.64 0l14.933333 37.546667a52.266667 52.266667 0 0 0 64 30.72l38.613334-11.733334a94.933333 94.933333 0 0 1 110.08 138.026667l-20.053334 35.2a52.266667 52.266667 0 0 0 15.786667 69.12l33.28 22.826667a94.933333 94.933333 0 0 1-39.253333 172.373333l-39.893334 5.973333a52.906667 52.906667 0 0 0-44.373333 55.68l2.986667 40.32a94.933333 94.933333 0 0 1-159.146667 76.586667l-29.866667-27.52a52.48 52.48 0 0 0-70.826666 0l-29.866667 27.52A93.44 93.44 0 0 1 384 891.306667zM277.333333 288a52.48 52.48 0 0 0-44.8 78.506667l20.266667 34.986666a95.573333 95.573333 0 0 1-28.8 125.653334L192 549.973333a52.266667 52.266667 0 0 0 21.333333 94.933334l40.106667 6.186666a95.146667 95.146667 0 0 1 80.213333 100.693334l-2.773333 40.32a52.266667 52.266667 0 0 0 87.68 42.666666l29.44-27.733333a95.146667 95.146667 0 0 1 128 0l29.653333 27.306667a52.266667 52.266667 0 0 0 87.68-42.666667l-2.773333-40.32a95.146667 95.146667 0 0 1 80.213333-100.693333l39.893334-5.76a52.266667 52.266667 0 0 0 21.333333-94.933334l-33.28-22.826666a95.573333 95.573333 0 0 1-28.8-125.653334l20.266667-34.986666a52.48 52.48 0 0 0-60.8-76.16l-38.613334 11.946666A95.36 95.36 0 0 1 576 246.186667l-14.933333-37.546667a52.266667 52.266667 0 0 0-97.28 0L448 246.186667a95.36 95.36 0 0 1-116.053333 56.106666l-38.613334-11.946666a53.76 53.76 0 0 0-16-2.346667z" p-id="3410"></path><path d="M512 646.4a134.4 134.4 0 1 1 134.4-134.4 134.613333 134.613333 0 0 1-134.4 134.4z m0-226.133333a91.733333 91.733333 0 1 0 91.733333 91.733333 91.946667 91.946667 0 0 0-91.733333-91.733333z" p-id="3411"></path></svg>
        </i>
        <span class="title">脚本设置</span>
      </a>
      <div class="nav-expand-list nav-expand-follow">
          <i class="arrow"></i>
          <div id="J_hyHdFollowBox">
            <div class="subscribe-hd">
              <div class="subscribe-tit">脚本配置选项</div>
            </div>
            <div class="subscribe-bd">
              <ul class="subscribe-list" style="height: 360px; overflow: hidden; padding: 0px; width: 256px;">
                <div class="jspContainer" style="width: 256px; height: 360px;">
                  <div class="jspPane" style="top: 0px; left: 0px; width: 256px;">
                    <li style="padding: 5px 15px">13213213212</li>
                  </div>
                </div>
              </ul>
              <a class="nav-expand-list-more subscribe-all save-button" title="保存配置选项">保存</a>
            </div>
          </div>
        </div>
      `,
      style: 'padding-left: 5px',
      eventListener: null
    })

    controlContainer.appendChild(settings)
    container.insertBefore(sync, container.childNodes[3])
    container.insertBefore(rev, container.childNodes[4])
  }

  // 同步时间功能
  function setVideoSync() {
    let videoNode = document.getElementById('hy-video')
    const buffered = videoNode.buffered
    if (buffered.length == 0) {
      // 暂停中
      return
    }
    videoNode.currentTime = buffered.end(0)
  }

  // 镜像画面功能
  function setVideoRev() {
    let videoNode = document.getElementById('hy-video')
    videoNode.style.transformOrigin = 'center'
    if (isReverse) {
      videoNode.style.transform = 'rotateY(0deg)'
      isReverse = false
    } else {
      videoNode.style.transform = 'rotateY(180deg)'
      isReverse = true
    }
  }

  // 选择最高画质功能
  function selectedHightestImageQuality() {
    if (hightestImageQuality.className === 'on') return
    hightestImageQuality.click()
    timer.playTimer = setInterval(() => {
      if (document.querySelector('.player-play-btn')) {
        document.querySelector('.player-play-btn').click()
        document.querySelector('#player-tip-pause').remove()
        clearInterval(timer.playTimer)
      }
    }, 500)
  }

  // 自动领取宝箱
  function getChest() {
    timer.chestTimer = setInterval(() => {
      // 全部领取结束定时
      const lastIndex = chests.length - 1
      const lastWait = chests[lastIndex].querySelector('.player-box-stat1').style.visibility
      const lastTimer = chests[lastIndex].querySelector('.player-box-stat2').style.visibility
      const lastGet = chests[lastIndex].querySelector('.player-box-stat3').style.visibility
      if (lastWait === 'hidden' && lastTimer === 'hidden' && lastGet === 'hidden') {
        clearInterval(timer.chestTimer)
        return
      } else {
        // 遍历领取
        for (const item of chests) {
          let get = item.querySelector('.player-box-stat3')
          if (get.style.visibility === 'visible') {
            get.click()
            document.querySelector('.player-chest-btn #player-box').style.display = 'none'
          }
        }
      }
    }, 5000)
  }

  // 功能切换
  function switchSetting(settingConfig) {
    config[settingConfig.key] = !config[settingConfig.key]
    config[settingConfig.key] ? GM_notification(settingConfig.openString) : GM_notification(settingConfig.closeString)
    GM_setValue(settingConfig.key, config[settingConfig.key])
    if (!config[settingConfig.key]) {
      clearInterval(settingConfig.timer)
    } else {
      settingConfig.execute()
    }
  }

  function switchSelectedHIQ() {
    switchSetting({
      key: 'isSelectedHightestImageQuality',
      openString: '已开启自动选择最高画质',
      closeString: '已关闭自动选择最高画质',
      timer: timer.playTimer,
      execute: selectedHightestImageQuality
    })
  }

  function switchGetChest() {
    switchSetting({
      key: 'isGetChest',
      openString: '已开启自动领取百宝箱奖励',
      closeString: '已关闭自动领取百宝箱奖励',
      timer: timer.chestTimer,
      execute: getChest
    })
  }

  // 添加菜单配置项
  GM_registerMenuCommand('自动选择最高画质开关', switchSelectedHIQ)
  GM_registerMenuCommand('自动领取百宝箱奖励开关', switchGetChest)

  // 初始化
  init()
})()
