/**
 * 浏览器控制台的前缀。
 *
 * 单独放一个模块而不是各文件各写一份字面量：排查时靠 `grep` 这个前缀捞日志，
 * 一旦某处抄错一个字符，那条日志就再也捞不到了。
 */
export const LOG = '[dsh-session-title-pattern]';
