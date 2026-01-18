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
		let queryLimit = 50 // Default for non-admins

		// 1. Permission & Limit Setup
		if (isAdmin) {
			queryLimit = 100
			// Admin can view all, so no default creator_uid constraint
		} else {
			// Non-admin can ONLY view their own
			match.creator_uid = uid
		}

		// 2. Query Parameters
		const { 
			startDate, 
			endDate, 
			customerName, 
			customerPhone, 
			reporterName, 
			productModel 
		} = params

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
			// Customer Name Filter (Fuzzy)
			if (customerName) {
				match['customerInfo.name'] = new RegExp(customerName)
			}

			// Customer Phone Filter (Fuzzy)
			if (customerPhone) {
				match['customerInfo.phone'] = new RegExp(customerPhone)
			}

			// Product Model Filter (Fuzzy)
			if (productModel) {
				match['productInfo.model'] = new RegExp(productModel)
			}

			// Reporter Name Filter (Requires User Lookup)
			if (reporterName) {
				// Find users matching the name
				const reporterRes = await db.collection('uni-id-users')
					.where(dbCmd.or([
						{ nickname: new RegExp(reporterName) },
						{ username: new RegExp(reporterName) },
						{ mobile: new RegExp(reporterName) }
					]))
					.field({ _id: 1 })
					.get()
				
				const reporterIds = reporterRes.data.map(u => u._id)
				
				if (reporterIds.length > 0) {
					match.creator_uid = dbCmd.in(reporterIds)
				} else {
					return { code: 0, data: [] } // No reporter found
				}
			}
		}
		
		const res = await db.collection('jiushun-work-orders')
			.aggregate() // Use aggregate to lookup reporter info
			.match(match)
			.sort({ create_date: -1 })
			.limit(queryLimit)
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
			delete item.userInfo // Clean up
			return item
		})
			
		return {
			code: 0,
			data: data
		}
	}
	
	// Action: Get Detail
	if (action === 'get') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		// Use aggregate to join with user info
		const res = await db.collection('jiushun-work-orders').aggregate()
			.match({
				_id: id
			})
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

	return {
		code: 404,
		msg: 'Unknown Action'
	}
};