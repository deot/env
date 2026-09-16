/**
 * @file
 * MODE_*
 */

// 本地开发模式
export const MODE_DEV = import.meta.env.MODE === 'development';

// 是否开启Debug模式; 当前只有正式环境该模式为false
export const MODE_DEBUG = MODE_DEV || __BRANCH__ !== 'prod' || /(^ylb-h5-v2\.ruishan666\.com)/.test(window.location.hostname);
