import { defineSandbox } from "eve/sandbox";
import { microsandbox } from "eve/sandbox/microsandbox";

// coding 场景需要真实的 node/python 等二进制，故用 microsandbox（本机 Apple Silicon 满足，
// `eve dev` 首次会自动安装其 VM runtime）。
// 每个工作空间对应一条独立的 eve session，各自拥有独立的 /workspace（沙箱文件天然隔离）。
// 允许出网以支持 npm install / pip install 等依赖安装。
export default defineSandbox({
  backend: microsandbox(),
  async onSession({ use }) {
    await use({ networkPolicy: "allow-all" });
  },
});
