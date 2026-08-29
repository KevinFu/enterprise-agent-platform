declare module 'snowflake-id' {
  interface SnowflakeIdOptions {
    /** 机器 ID，默认 1，范围 0~1023 */
    mid?: number;
    /** 时间偏移量（毫秒），默认 0 */
    offset?: number;
  }

  class SnowflakeId {
    constructor(options?: SnowflakeIdOptions);
    /** 生成雪花 ID，返回字符串 */
    generate(): string;
  }

  export default SnowflakeId;
}
