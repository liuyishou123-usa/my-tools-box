/** Tailwind CSS v3 配置 */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // dark 变体跟随系统偏好（与 style.css 中的媒体查询一致）
  darkMode: 'media',
}
