/**
 * 配色导出图片服务
 * 使用Canvas API生成配色方案图片
 */

import { Palette } from '@/data/colors';

/**
 * 导出配色方案为PNG图片
 * @param palette 配色方案数据
 * @param width 图片宽度（默认800）
 * @param height 图片高度（默认400）
 * @returns Promise<Blob> 图片Blob对象
 */
export async function exportPaletteToImage(
  palette: Palette,
  width: number = 800,
  height: number = 400
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // 创建Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 计算每个颜色块的宽度
      const colorWidth = width / palette.colors.length;

      // 绘制颜色块
      palette.colors.forEach((color, index) => {
        const x = index * colorWidth;

        // 主色块
        ctx.fillStyle = color.hex;
        ctx.fillRect(x, 0, colorWidth, height * 0.75);

        // 颜色信息区域（底部25%）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, height * 0.75, colorWidth, height * 0.25);

        // 颜色名称
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(color.name, x + colorWidth / 2, height * 0.82);

        // HEX色值
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText(color.hex, x + colorWidth / 2, height * 0.92);
      });

      // 添加标题区域
      const titleHeight = 60;
      const titleY = 10;

      // 标题背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(20, titleY, width - 40, titleHeight);

      // 配色方案名称
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(palette.name, 30, titleY + 25);

      // 房间和风格信息
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial, sans-serif';
      const roomStyleText = `${palette.room} | ${palette.style}`;
      ctx.fillText(roomStyleText, 30, titleY + 45);

      // 添加水印
      ctx.fillStyle = '#999999';
      ctx.font = '10px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('HomePalette.cc', width - 30, height - 10);

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        'image/png',
        0.95
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 下载配色图片
 * @param palette 配色方案
 * @param filename 文件名（可选）
 */
export async function downloadPaletteImage(
  palette: Palette,
  filename?: string
): Promise<void> {
  try {
    const blob = await exportPaletteToImage(palette);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${palette.name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (err) {
    console.error('Failed to download palette image:', err);
    throw err;
  }
}

/**
 * 复制配色图片到剪贴板
 * @param palette 配色方案
 */
export async function copyPaletteImageToClipboard(palette: Palette): Promise<boolean> {
  try {
    const blob = await exportPaletteToImage(palette);

    // 检查剪贴板API支持
    if (!navigator.clipboard || !navigator.clipboard.write) {
      console.warn('Clipboard API not supported');
      return false;
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);

    return true;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/**
 * 生成配色方案分享链接（包含配色数据）
 * @param palette 配色方案
 * @returns 分享链接
 */
export function generateShareLink(palette: Palette): string {
  const baseUrl = window.location.origin;
  const paletteData = encodeURIComponent(JSON.stringify({
    name: palette.name,
    colors: palette.colors,
    room: palette.room,
    style: palette.style
  }));

  return `${baseUrl}?palette=${paletteData}`;
}

/**
 * 从URL解析分享的配色方案
 * @returns Palette | null
 */
export function parseSharedPalette(): Palette | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paletteStr = urlParams.get('palette');

    if (!paletteStr) return null;

    const data = JSON.parse(decodeURIComponent(paletteStr));

    return {
      id: `shared-${Date.now()}`,
      name: data.name || 'Shared Palette',
      colors: data.colors,
      room: data.room || 'living',
      style: data.style || 'modern',
      region: 'west'
    };
  } catch (err) {
    console.error('Failed to parse shared palette:', err);
    return null;
  }
}