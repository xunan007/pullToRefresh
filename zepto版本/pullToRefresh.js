(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], function () {
            return (root.returnExportsGlobal = factory());
        });
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory();
    } else {
        root['pullToRefresh'] = factory();
    }
})(this, function () {
    const _defaults = {

        pullToRefreshText: '下拉刷新',

        releaseRefreshText: '释放刷新',

        refreshingText: '正在刷新中...',

        refreshSuccess: '刷新成功！',

        refreshError: '刷新失败！',

        threshold: 0.4, // 下拉系数、百分比

        refreshMove: 200, // 移动系数

        animationDelay: 300, // 动画延迟

        refreshingDuration: 800, // 刷新状态延迟时间

        beforeRefresh: () => { // 更新前函数
            console.log('更新前...');
        },

        onRefresh: () => { // 正在更新函数
            console.log('正在更新中...');
        },

        refreshCallback: () => { // 更新后回调
            console.log('更新后的回调...');
        }
    };

    let percentage = 0; // 拖动量百分比

    let startY = 0; // 手指触摸位置

    let endY = 0; // 手指释放位置

    let refreshStatus = false; // 刷新时控制页面假死

    let refreshProgress = false; // 处于刷新整个过程中的标识

    let elOffsetHeight = 0; // 下拉刷新内容区的高度

    let changeOneTime = 0; // move中只执行第一次的标识

    let dom = ''; // 滚动区

    let scrollContentEl = ''; // 下拉刷新盒子

    let scrollIconEl = ''; // 刷新icon

    let scrollTextEl = ''; // 刷新提示文本

    let pullToRefresh = {

        init: (_opts) => {

            Object.keys(_defaults).forEach((key) => {
                if (!_opts[key]) {
                    _opts[key] = _defaults[key];
                }
            });

            scrollContentEl = document.querySelector(_opts.scrollContentEl);
            scrollIconEl = document.querySelector(_opts.scrollIconEl);
            scrollTextEl = document.querySelector(_opts.scrollTextEl);
            dom = document.querySelector(_opts.dom);

            elOffsetHeight = scrollContentEl.offsetHeight;

            // 绑定事件
            dom.addEventListener('touchstart', (event) => {

                if (refreshStatus) {
                    event.preventDefault();
                    return false;
                }

                startY = event.touches[0].clientY;
                dom.style['transition'] = 'none';
                scrollIconEl.style['display'] = 'none';
                scrollTextEl.innerText = _opts.pullToRefreshText;

            });

            dom.addEventListener('touchmove', (event) => {

                // 快速触摸可能导致startY为0
                if(startY === 0) {
                    return false;
                } 

                if (refreshStatus) {
                    event.preventDefault();
                    return false;
                }

                endY = event.touches[0].clientY;
                percentage = (startY - endY) / window.screen.height;
                let translateY = -_opts.refreshMove * percentage;

                // 只有scrollTop为且往下滚动时才触发
                // 同时判断是考虑到浏览器兼容性
                if (document.body.scrollTop === 0 && document.documentElement.scrollTop === 0) {

                    if (percentage < 0) {
                        /**
                         * event.preventDefault()是整个程序的精髓。
                         * 从这个位置开始，页面的滚动都是模拟的，并非真正的滚动，
                         * 而是通过touchmove计算出translateY的差值通过translate3d来模拟滚动。
                         * 可以避免奇葩用户下拉之后又上拉的骚操作。
                        **/
                        event.preventDefault();
                        refreshProgress = true;

                        if (!changeOneTime) {
                            _opts.beforeRefresh();
                            changeOneTime = 1;
                        }

                        // 两段判断避免无用的dom节点操作
                        if (Math.abs(percentage) < _opts.threshold) {
                            if (scrollTextEl.innerText !== _opts.pullToRefreshText) {
                                scrollTextEl.innerText = _opts.pullToRefreshText; // 下拉刷新
                            }
                        } else {
                            if (scrollTextEl.innerText !== _opts.releaseRefreshText) {
                                scrollTextEl.innerText = _opts.releaseRefreshText; // 释放刷新
                            }
                        }
                        dom.style['transform'] = `translate3d(0, ${translateY}px, 0)`;
                    }
                }
            });

            dom.addEventListener('touchend', (event) => {
                if (refreshStatus) {
                    event.preventDefault();
                    return false;
                }

                if (Math.abs(percentage) > _opts.threshold && refreshProgress) {

                    dom.style['transition'] = `transform ${_opts.animationDelay}ms`;
                    scrollTextEl.innerText = _opts.refreshingText;
                    scrollIconEl.style['display'] = 'inline-block';
                    dom.style['transform'] = `translate3d(0, ${elOffsetHeight}px, 0)`;

                    // 进入刷新的状态
                    refreshStatus = true;
                    _opts.onRefresh();

                    setTimeout(() => {
                        scrollIconEl.style['display'] = 'none';
                        scrollTextEl.innerText = _opts.refreshSuccess;
                        dom.style['transform'] = 'translate3d(0,0,0)';
                        setTimeout(() => {
                            refreshStatus = false;
                            _opts.refreshCallback();
                        }, _opts.animationDelay);
                    }, _opts.refreshingDuration);

                } else if (refreshProgress) {

                    refreshStatus = true;
                    dom.style['transition'] = `${_opts.animationDelay}ms`;
                    dom.style['transform'] = 'translate3d(0,0,0)';

                    setTimeout(() => {
                        refreshStatus = false;
                    }, _opts.animationDelay);

                }

                refreshProgress = false; // 重置 “处于刷新整个过程中的标识”

                changeOneTime = 0; // 重置 “move中只执行第一次的标识”

                startY = 0; // 重置 “手指触摸位置”

                endY = 0; // 重置 “手指释放位置”

                percentage = 0; // 重置 “拖动量百分比”

            });
        }
    };

    return pullToRefresh;
});