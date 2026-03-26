'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { action, params } = event
	const uniIdIns = uniID.createInstance({ context })
	
	// Check Token for all actions
	const payload = await uniIdIns.checkToken(event.uniIdToken)
	if (payload.code !== 0) {
		return payload
	}
	const uid = payload.uid
	
	// Action: Create Work Order
	if (action === 'create') {
		const orderData = {
			...params,
			creator_uid: uid,
			create_date: Date.now()
		}
		
		const res = await db.collection('jiushun-work-orders').add(orderData)
		
		return {
			code: 0,
			msg: '提交成功',
			id: res.id
		}
	}
	
	// Action: List Work Orders (My Orders or Query)
	if (action === 'list') {
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const isAdmin = roles.includes('admin')
		
		let match = {}
		const { 
			page = 1,
			pageSize = 10,
			startDate, 
			endDate, 
			customerName, 
			customerPhone, 
			reporterName, 
			productModel 
		} = params

		// 1. Permission Setup
		if (!isAdmin) {
			// Non-admin can ONLY view their own
			match.creator_uid = uid
		}

		// 2. Query Parameters
		// Date Range Filter (Available to ALL)
		if (startDate || endDate) {
			if (startDate && endDate) {
				match.create_date = dbCmd.gte(startDate).and(dbCmd.lte(endDate))
			} else if (startDate) {
				match.create_date = dbCmd.gte(startDate)
			} else if (endDate) {
				match.create_date = dbCmd.lte(endDate)
			}
		}

		// Advanced Filters (ADMIN ONLY)
		if (isAdmin) {
			if (customerName) match['customer.name'] = new RegExp(customerName, 'i')
			if (customerPhone) match['customer.phone'] = new RegExp(customerPhone, 'i')
			if (productModel) match['product.model'] = new RegExp(productModel, 'i')

			if (reporterName) {
				const reporterRes = await db.collection('uni-id-users')
					.where(dbCmd.or([
						{ nickname: new RegExp(reporterName, 'i') },
						{ username: new RegExp(reporterName, 'i') },
						{ mobile: new RegExp(reporterName, 'i') }
					]))
					.field({ _id: 1 })
					.get()
				
				const reporterIds = reporterRes.data.map(u => u._id)
				if (reporterIds.length > 0) {
					match.creator_uid = dbCmd.in(reporterIds)
				} else {
					return { code: 0, data: [], total: 0 }
				}
			}
		}
		
		// 3. Execute Count and Data Query
		const totalRes = await db.collection('jiushun-work-orders').where(match).count()
		const total = totalRes.total

		const res = await db.collection('jiushun-work-orders')
			.aggregate()
			.match(match)
			.sort({ create_date: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.lookup({
				from: 'uni-id-users',
				localField: 'creator_uid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.end()
			
		// Flatten userInfo for list display
		const data = res.data.map(item => {
			if (item.userInfo && item.userInfo.length > 0) {
				item.reporterName = item.userInfo[0].nickname || item.userInfo[0].username || item.userInfo[0].mobile
			}
			delete item.userInfo
			return item
		})
			
		return {
			code: 0,
			data: data,
			total: total
		}
	}
	
	// Action: Get Detail
	if (action === 'get') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		// Permission Check for Detail
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const isAdmin = roles.includes('admin')
		
		let match = { _id: id }
		if (!isAdmin) {
			// Non-admin can ONLY view their own detail
			match.creator_uid = uid
		}
		
		// Use aggregate to join with user info
		const res = await db.collection('jiushun-work-orders').aggregate()
			.match(match)
			.lookup({
				from: 'uni-id-users',
				localField: 'creator_uid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.end()
		
		if (res.data.length === 0) return { code: 404, msg: '工单不存在' }
		
		const order = res.data[0]
		// Flatten userInfo for easier frontend access
		if (order.userInfo && order.userInfo.length > 0) {
			order.userInfo = {
				nickname: order.userInfo[0].nickname || order.userInfo[0].name
			}
		}
		
		return {
			code: 0,
			data: order
		}
	}
	
	// Action: Update Work Order (Admin Only)
	if (action === 'update') {
		const { id, data } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		// Permission Check
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		if (!roles.includes('admin')) {
			return { code: 403, msg: '无权修改' }
		}
		
		// Remove fields that shouldn't be updated via this action if any
		delete data._id
		delete data.create_date
		delete data.creator_uid
		
		await db.collection('jiushun-work-orders').doc(id).update(data)
		
		return {
			code: 0,
			msg: '修改成功'
		}
	}
	
	// Action: Delete Work Order (Admin Only)
	if (action === 'delete') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		// Permission Check
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		if (!roles.includes('admin')) {
			return { code: 403, msg: '无权删除' }
		}
		
		await db.collection('jiushun-work-orders').doc(id).remove()
		
		return {
			code: 0,
			msg: '删除成功'
		}
	}

	return {
		code: 404,
		msg: 'Unknown Action'
	}
};