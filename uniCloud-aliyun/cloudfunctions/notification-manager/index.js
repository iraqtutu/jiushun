'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { action, params } = event
	const uniIdIns = uniID.createInstance({ context })

	// 校验 Token
	const payload = await uniIdIns.checkToken(event.uniIdToken)
	if (payload.code !== 0) {
		return payload
	}
	const uid = payload.uid

	// 获取当前用户信息及角色
	const userRes = await db.collection('uni-id-users').doc(uid).get()
	if (!userRes.data || userRes.data.length === 0) {
		return { code: 404, msg: 'User not found' }
	}
	const user = userRes.data[0]
	const roles = user.role || []
	const isAdmin = roles.includes('admin')

	// 1. 发送通知 (Admin Only)
	if (action === 'create') {
		if (!isAdmin) return { code: 403, msg: '权限不足' }
		const { title, content, targetType, targetRoles, targetUsers } = params
		if (!title || !content) return { code: 400, msg: '标题和内容必填' }

		const res = await db.collection('jiushun-notifications').add({
			title,
			content,
			targetType: targetType || 'all',
			targetRoles: targetRoles || [],
			targetUsers: targetUsers || [],
			sender_uid: uid,
			create_date: Date.now()
		})

		return { code: 0, msg: '发送成功', id: res.id }
	}

	// 定义匹配逻辑：该用户能看到的通知 (排除已隐藏/删除的)
	const getMatchQuery = async () => {
		const baseMatch = dbCmd.or([
			{ targetType: 'all' },
			{ targetType: 'role', targetRoles: dbCmd.in(roles) },
			{ targetType: 'user', targetUsers: dbCmd.in([uid]) }
		])
		
		// 获取该用户已隐藏的 ID
		const hiddenRes = await db.collection('jiushun-notification-deletes').where({ uid }).get()
		const hiddenIds = hiddenRes.data.map(h => h.notification_id)
		
		if (hiddenIds.length > 0) {
			return dbCmd.and([
				baseMatch,
				{ _id: dbCmd.nin(hiddenIds) }
			])
		}
		return baseMatch
	}

	// 2. 获取通知列表 (含已读状态)
	if (action === 'getList') {
		const match = await getMatchQuery()
		const res = await db.collection('jiushun-notifications')
			.where(match)
			.orderBy('create_date', 'desc')
			.limit(100)
			.get()

		const notifications = res.data
		
		// 获取该用户的所有已读记录
		const readRes = await db.collection('jiushun-notification-reads')
			.where({ uid })
			.get()
		const readIds = readRes.data.map(r => r.notification_id)

		const list = notifications.map(item => ({
			...item,
			isRead: readIds.includes(item._id)
		}))

		return { code: 0, data: list }
	}

	// 2.1 获取通知详情 (含权限校验)
	if (action === 'getDetail') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }

		// 联合匹配逻辑校验是否有权查看
		const match = dbCmd.and([
			{ _id: id },
			await getMatchQuery()
		])

		const res = await db.collection('jiushun-notifications')
			.where(match)
			.get()

		if (res.data.length === 0) return { code: 404, msg: '通知不存在或无权查看' }
		return { code: 0, data: res.data[0] }
	}

	// 3. 获取未读通知数量
	if (action === 'getUnreadCount') {
		const match = await getMatchQuery()
		
		// 1. 获取用户有权查看的所有通知 ID
		const allNotifyRes = await db.collection('jiushun-notifications')
			.where(match)
			.field({ _id: 1 })
			.get()
		const allNotifyIds = allNotifyRes.data.map(n => n._id)
		
		if (allNotifyIds.length === 0) return { code: 0, count: 0 }

		// 2. 获取用户已读的通知 ID
		const readRes = await db.collection('jiushun-notification-reads')
			.where({
				uid,
				notification_id: dbCmd.in(allNotifyIds)
			})
			.count()
		
		const unreadCount = allNotifyIds.length - readRes.total
		return { code: 0, count: unreadCount > 0 ? unreadCount : 0 }
	}

	// 4. 标记为已读
	if (action === 'markAsRead') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }

		// 检查是否已读
		const exist = await db.collection('jiushun-notification-reads')
			.where({ notification_id: id, uid })
			.count()
		
		if (exist.total === 0) {
			await db.collection('jiushun-notification-reads').add({
				notification_id: id,
				uid,
				read_date: Date.now()
			})
		}
		return { code: 0, msg: 'success' }
	}

	// 4.1 一键已读
	if (action === 'readAll') {
		const match = await getMatchQuery()
		const allVisible = await db.collection('jiushun-notifications')
			.where(match)
			.field({ _id: 1 })
			.get()
		
		const ids = allVisible.data.map(n => n._id)
		if (ids.length === 0) return { code: 0 }

		// 找出还没读的
		const readRes = await db.collection('jiushun-notification-reads')
			.where({ uid, notification_id: dbCmd.in(ids) })
			.get()
		const readIds = readRes.data.map(r => r.notification_id)
		const unreadIds = ids.filter(id => !readIds.includes(id))

		// 批量插入
		for (const nid of unreadIds) {
			await db.collection('jiushun-notification-reads').add({
				notification_id: nid,
				uid,
				read_date: Date.now()
			})
		}
		return { code: 0, msg: '已全部标记已读' }
	}

	// 4.2 用户隐藏/删除单条通知
	if (action === 'hideItem') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }

		await db.collection('jiushun-notification-deletes').add({
			notification_id: id,
			uid,
			delete_date: Date.now()
		})
		return { code: 0, msg: '已删除' }
	}

	// 4.3 用户清空/删除全部可见通知
	if (action === 'clearAll') {
		const match = await getMatchQuery()
		const allVisible = await db.collection('jiushun-notifications')
			.where(match)
			.field({ _id: 1 })
			.get()
		
		const ids = allVisible.data.map(n => n._id)
		for (const nid of ids) {
			await db.collection('jiushun-notification-deletes').add({
				notification_id: nid,
				uid,
				delete_date: Date.now()
			})
		}
		return { code: 0, msg: '已清空通知' }
	}

	// 5. 删除通知 (Admin Only)
	if (action === 'delete') {
		if (!isAdmin) return { code: 403, msg: '权限不足' }
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }

		await db.collection('jiushun-notifications').doc(id).remove()
		// 清理相关的已读记录
		await db.collection('jiushun-notification-reads').where({ notification_id: id }).remove()

		return { code: 0, msg: '已删除' }
	}

	return { code: 404, msg: 'Action not found' }
}