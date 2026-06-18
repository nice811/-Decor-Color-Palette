/**
 * 收藏服务
 * 提供收藏的增删改查功能
 */

import db from './database.js';

/**
 * 获取用户收藏列表
 * @param {number} userId - 用户ID
 * @returns {array} - 收藏列表
 */
export function getFavorites(userId) {
  const favorites = db.prepare(
    'SELECT id, palette_name, color_data, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);

  // 解析color_data JSON
  return favorites.map(f => ({
    ...f,
    color_data: JSON.parse(f.color_data)
  }));
}

/**
 * 添加收藏
 * @param {number} userId - 用户ID
 * @param {string} paletteName - 配色名称
 * @param {array} colorData - 颜色数据
 * @returns {object} - 添加结果
 */
export function addFavorite(userId, paletteName, colorData) {
  // 验证颜色数据
  if (!colorData || !Array.isArray(colorData) || colorData.length === 0) {
    return {
      success: false,
      error: 'invalid_color_data',
      message: 'Color data must be a non-empty array'
    };
  }

  // 检查是否已收藏（相同配色）
  const colorDataJson = JSON.stringify(colorData);
  const existing = db.prepare(
    'SELECT id FROM favorites WHERE user_id = ? AND color_data = ?'
  ).get(userId, colorDataJson);

  if (existing) {
    return {
      success: false,
      error: 'already_saved',
      message: 'This palette is already saved'
    };
  }

  try {
    const result = db.prepare(
      'INSERT INTO favorites (user_id, palette_name, color_data) VALUES (?, ?, ?)'
    ).run(userId, paletteName || 'Untitled Palette', colorDataJson);

    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        palette_name: paletteName || 'Untitled Palette',
        color_data: colorData
      }
    };
  } catch (err) {
    console.error('Add favorite error:', err);
    return {
      success: false,
      error: 'add_failed',
      message: 'Failed to save palette'
    };
  }
}

/**
 * 删除收藏
 * @param {number} userId - 用户ID
 * @param {number} favoriteId - 收藏ID
 * @returns {object} - 删除结果
 */
export function deleteFavorite(userId, favoriteId) {
  // 验证收藏是否属于该用户
  const favorite = db.prepare(
    'SELECT id FROM favorites WHERE id = ? AND user_id = ?'
  ).get(favoriteId, userId);

  if (!favorite) {
    return {
      success: false,
      error: 'not_found',
      message: 'Favorite not found or not owned by user'
    };
  }

  try {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(favoriteId);

    return {
      success: true,
      message: 'Favorite deleted'
    };
  } catch (err) {
    console.error('Delete favorite error:', err);
    return {
      success: false,
      error: 'delete_failed',
      message: 'Failed to delete favorite'
    };
  }
}

/**
 * 更新收藏名称
 * @param {number} userId - 用户ID
 * @param {number} favoriteId - 收藏ID
 * @param {string} paletteName - 新名称
 * @returns {object} - 更新结果
 */
export function updateFavoriteName(userId, favoriteId, paletteName) {
  // 验证收藏是否属于该用户
  const favorite = db.prepare(
    'SELECT id FROM favorites WHERE id = ? AND user_id = ?'
  ).get(favoriteId, userId);

  if (!favorite) {
    return {
      success: false,
      error: 'not_found',
      message: 'Favorite not found or not owned by user'
    };
  }

  try {
    db.prepare(
      'UPDATE favorites SET palette_name = ? WHERE id = ?'
    ).run(paletteName, favoriteId);

    return {
      success: true,
      data: {
        id: favoriteId,
        palette_name: paletteName
      }
    };
  } catch (err) {
    console.error('Update favorite error:', err);
    return {
      success: false,
      error: 'update_failed',
      message: 'Failed to update favorite'
    };
  }
}

/**
 * 获取收藏数量
 * @param {number} userId - 用户ID
 * @returns {number} - 收藏数量
 */
export function getFavoritesCount(userId) {
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?'
  ).get(userId);
  return result.count;
}