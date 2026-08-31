import { redirect } from "next/navigation";

/**
 * 需求 1：删除 home 独立落地页，只保留 /chat 作为唯一前端入口
 * 访问根路径 / 时直接 307 跳转到对话页
 */
export default function HomePage() {
  redirect("/chat");
}
